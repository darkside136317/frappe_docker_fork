/** Menu fields used for POS stock checks (aligned with getRestaurantMenu). */
export interface StockMenuFields {
  item?: string;
  id?: string;
  stock_qty?: number | null;
  /** Physical Bin qty minus qty on other draft POS Invoices (same warehouse); prefer for limits */
  available_qty?: number | null;
  is_stock_item?: number | null;
  item_name?: string;
  name?: string;
}

export interface CartLineForStock {
  item?: string;
  id?: string;
  name?: string;
  item_name?: string;
  quantity: number;
}

export type CartStockResult =
  | { ok: true }
  | { ok: false; name: string; available: number; ordered: number };

export const itemCodeForStock = (it: { item?: string; id?: string }): string =>
  it.item || it.id || '';

/** True when cart qty must stay within warehouse on-hand. */
export function shouldEnforceStockFromMenuLine(
  menuLine: StockMenuFields | null | undefined
): boolean {
  if (!menuLine) return false;
  const hasAvailable =
    menuLine.available_qty !== undefined &&
    menuLine.available_qty !== null &&
    !Number.isNaN(Number(menuLine.available_qty));
  const hasNumericQty =
    menuLine.stock_qty !== undefined &&
    menuLine.stock_qty !== null &&
    !Number.isNaN(Number(menuLine.stock_qty));
  if (hasAvailable || hasNumericQty) return true;
  return Boolean(Number(menuLine.is_stock_item));
}

export function stockAvailable(menuLine: StockMenuFields | null | undefined): number {
  if (!menuLine) return Number.POSITIVE_INFINITY;
  if (!shouldEnforceStockFromMenuLine(menuLine)) return Number.POSITIVE_INFINITY;
  const a = menuLine.available_qty;
  if (a !== undefined && a !== null && !Number.isNaN(Number(a))) {
    return Number(a);
  }
  if (menuLine.stock_qty === undefined || menuLine.stock_qty === null) {
    return 0;
  }
  return Number(menuLine.stock_qty);
}

export function validateActiveOrdersAgainstMenu(
  menuItems: StockMenuFields[],
  activeOrders: CartLineForStock[]
): CartStockResult {
  const totals = new Map<string, { qty: number; label: string }>();
  for (const o of activeOrders) {
    const code = itemCodeForStock(o);
    if (!code) continue;
    const prev = totals.get(code);
    const qty = (prev?.qty || 0) + o.quantity;
    totals.set(code, {
      qty,
      label: prev?.label || o.item_name || o.name || code,
    });
  }
  for (const [code, { qty, label }] of totals) {
    const menuLine = menuItems.find((m) => (m.item || m.id) === code);
    if (!shouldEnforceStockFromMenuLine(menuLine)) continue;
    const avail = stockAvailable(menuLine);
    if (qty > avail) {
      return {
        ok: false,
        name: label,
        available: avail,
        ordered: qty,
      };
    }
  }
  return { ok: true };
}
