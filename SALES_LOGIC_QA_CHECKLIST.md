# Sales Logic QA Checklist

## State Transition Matrix

| Scenario | Action | Expected Result |
|---|---|---|
| New draft order | Call `sync_order` with new cart | `POS Invoice.docstatus=0`, `status=Draft`, items saved, table occupied when dine-in |
| Edit existing draft | Call `sync_order` with `invoice/last_invoice` | Existing draft updated, no duplicate reservation for same invoice |
| Stale edit protection | Submit outdated `last_modified_time` | API returns failure and UI shows reload message |
| Stock enforcement (draft) | Two users reserve same stock item concurrently | Second user fails with clear insufficient-stock message |
| Menu availability refresh | Save draft successfully | `available_qty` decreases after menu refresh |
| Print then submit | Print invoice then call `make_invoice` | Submit succeeds, `docstatus=1`, invoice paid/posted |
| Submit without stock | Force cart quantity > available before submit | `make_invoice` throws insufficient-stock error |
| Cancel draft | Call `cancel_order` on draft invoice with reason | Invoice status set cancelled, table released, KOT cancel attempted |
| Cancel submitted | Call `cancel_order` on submitted invoice with reason | Canonical `cancel()` path used, no manual status forcing |
| Cancel reason required | Call `cancel_order` with empty reason | Backend throws validation error |

## API Contract Checks (Frontend)

| Endpoint | Contract Check | Expected |
|---|---|---|
| `sync_order` | Handles thrown error and `message.status == "Failure"` payload | React + Vue both show user-friendly error |
| `getRestaurantMenu` | `available_qty` preferred, fallback to `stock_qty` | Stock checks remain stable across old/new payloads |
| `getAggregatorItem` | Same stock contract as restaurant menu | Aggregator flow obeys stock limits |
| `searchPosInvoice` | Status filter capitalization | `Unbilled` query returns draft unprinted table invoices consistently |

## High-Priority Fix Sequence

1. Backend safety invariants (cancel guardrails, canonical submit/cancel transitions).
2. Frontend contract alignment (`sync_order` failure payload handling, consistent error parsing).
3. Status/filter consistency cleanup (`Draft`/`Unbilled` semantics).
4. Regression smoke test in both React POS and Vue urypos.

## Smoke Test Commands

- Backend syntax:
  - `python -m py_compile _ury_src/ury/ury/doctype/ury_order/ury_order.py _ury_src/ury/ury_pos/api.py`
- React POS build:
  - `cd _ury_src/pos && npm run build`
- Vue urypos build:
  - `cd _ury_src/urypos && npm run build`
