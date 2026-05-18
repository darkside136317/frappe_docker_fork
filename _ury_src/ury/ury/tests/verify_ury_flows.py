# Copyright (c) 2025, URY and contributors
# SPDX-License-Identifier: MIT
"""
Verify URY revenue-report preconditions and stock alignment (read-only).

Run::

    bench --site ury.local execute ury.ury.tests.verify_ury_flows.run_all_checks

Returns a JSON-serializable dict for each section.
"""

from __future__ import annotations

import frappe


def _report_settings():
    """1) URY Report Settings per Branch: extended_hours, hours."""
    if not frappe.db.exists("DocType", "URY Report Settings"):
        return {"ok": False, "error": "DocType URY Report Settings not installed"}
    rows = frappe.db.sql(
        """
        SELECT name, branch, extended_hours, hours
        FROM `tabURY Report Settings`
        ORDER BY branch
        """,
        as_dict=True,
    )
    branches = frappe.get_all("Branch", pluck="name")
    missing = [b for b in branches if b not in {r["branch"] for r in rows}]
    return {
        "ok": True,
        "rows": rows,
        "branches_in_erp": branches,
        "branches_missing_report_settings": missing,
        "note": "If extended_hours=1, set hours to business-day cutoff. If missing settings, date-bound reports may use fallback branch IS NULL in SQL.",
    }


def _pos_invoice_status():
    """2) Sample POS Invoices vs report filters (docstatus=1, status Paid|Consolidated)."""
    included = frappe.db.sql(
        """
        SELECT name, branch, status, docstatus, posting_date, grand_total
        FROM `tabPOS Invoice`
        WHERE docstatus = 1 AND status IN ('Consolidated', 'Paid')
        ORDER BY modified DESC
        LIMIT 8
        """,
        as_dict=True,
    )
    excluded_draft = frappe.db.count(
        "POS Invoice", {"docstatus": 0, "status": ("in", ("Draft", "Unpaid"))}
    )
    excluded_other = frappe.db.sql(
        """
        SELECT status, COUNT(*) c FROM `tabPOS Invoice`
        WHERE docstatus = 1 AND status NOT IN ('Consolidated', 'Paid')
        GROUP BY status
        """
    )
    return {
        "ok": True,
        "sample_included_in_revenue_reports": included,
        "count_draft_unpaid": excluded_draft,
        "submitted_by_non_report_status": excluded_other,
    }


def _stock_path():
    """3) POS Profile warehouse vs Bin rows; optional stock_qty source."""
    profiles = frappe.db.sql(
        """
        SELECT pp.name, pp.branch, pp.warehouse, pp.company
        FROM `tabPOS Profile` pp
        WHERE IFNULL(pp.disabled, 0) = 0
        LIMIT 10
        """,
        as_dict=True,
    )
    out = []
    for p in profiles:
        wh = p.get("warehouse")
        if not wh:
            out.append({**p, "bin_rows": 0, "items_with_qty": 0})
            continue
        bin_rows = frappe.db.count("Bin", {"warehouse": wh})
        items_with_qty = frappe.db.sql(
            """
            SELECT COUNT(*) FROM `tabBin`
            WHERE warehouse = %s AND actual_qty > 0
            """,
            (wh,),
        )[0][0]
        out.append({**p, "bin_rows": bin_rows, "bins_with_positive_qty": items_with_qty})
    return {"ok": True, "pos_profiles_and_bins": out, "note": "POS menu stock_qty (if deployed) reads tabBin.actual_qty for POS Profile warehouse."}


def _report_vs_invoice_counts():
    """4) Light consistency: count POS Invoices matching simplified revenue filter."""
    branch = frappe.db.get_value("POS Profile", {"disabled": 0}, "branch")
    if not branch:
        return {"ok": False, "skipped": "No active POS Profile with branch"}
    hours = {}
    rs = frappe.db.sql(
        "SELECT hours, extended_hours FROM `tabURY Report Settings` WHERE branch=%s",
        (branch,),
        as_dict=True,
    )
    if rs:
        hours = rs[0]
    cnt = frappe.db.sql(
        """
        SELECT COUNT(*) FROM `tabPOS Invoice` b
        WHERE b.branch = %s AND b.docstatus = 1
          AND b.status IN ('Consolidated', 'Paid')
          AND b.posting_date = CURDATE()
        """,
        (branch,),
    )[0][0]
    return {
        "ok": True,
        "branch": branch,
        "has_ury_report_settings": bool(rs),
        "report_settings_hours": hours,
        "count_pos_invoices_today_simple": int(cnt),
        "note": "When URY Report Settings exists, Today's Sales SQL also filters by posting_time window if extended_hours=1.",
    }


def run_all_checks():
    frappe.set_user("Administrator")
    return {
        "report_settings": _report_settings(),
        "pos_invoice_status": _pos_invoice_status(),
        "stock_path": _stock_path(),
        "report_count_smoke": _report_vs_invoice_counts(),
    }
