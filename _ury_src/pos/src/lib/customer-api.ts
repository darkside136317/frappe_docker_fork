import { DOCTYPES } from '../data/doctypes';
import { db, call } from './frappe-sdk';

export interface Customer {
  name: string;
  owner: string;
  creation: string;
  modified: string;
  modified_by: string;
  docstatus: number;
  idx: number;
  naming_series: string;
  customer_name: string;
  customer_type: string;
  mobile_number: string;
  customer_group: string;
  territory: string;
  is_internal_customer: number;
  language: string;
  default_commission_rate: number;
  so_required: number;
  dn_required: number;
  is_frozen: number;
  disabled: number;
  doctype: string;
  companies: any[];
  credit_limits: any[];
  accounts: any[];
  sales_team: any[];
  portal_users: any[];
}

export interface CustomerSearchResult {
  /** Customer document name (ID for transactions) */
  name: string;
  customer_name: string;
  mobile_number: string;
}

export interface CreateCustomerData {
  customer_name: string;
  mobile_number: string;
  customer_group?: string;
  territory?: string;
}

export interface CreateCustomerResponse {
  data: CreateCustomerData & { name?: string };
  _server_messages?: string;
}

export async function getCustomerGroups() {
  const groups = await db.getDocList(DOCTYPES.CUSTOMER_GROUP, {
    fields: ['name'],
    limit: '*' as unknown as number,
    orderBy: {
      field: 'name',
      order: 'asc',
    },
  });
  return groups;
}

export async function getCustomerTerritories() {
  const territories = await db.getDocList(DOCTYPES.CUSTOMER_TERRITORY, {
    fields: ['name'],
    limit: '*' as unknown as number,
    orderBy: {
      field: 'name',
      order: 'asc',
    },
  });
  return territories;
}

export async function addCustomer(
  customerData: CreateCustomerData
): Promise<CreateCustomerResponse> {
  try {
    const response = await call.post('ury.ury_pos.api.create_customer', customerData);
    const msg = response.message;
    if (!msg || msg.status !== 'success') {
      throw new Error(msg?.message || 'Failed to create Customer');
    }

    let customerId: string | undefined;
    try {
      const found = await searchCustomers(msg.mobile_number || customerData.mobile_number, 3);
      const exact = found.find(
        (c) =>
          c.mobile_number?.replace(/\D/g, '') ===
          (msg.mobile_number || customerData.mobile_number).replace(/\D/g, '')
      );
      customerId = exact?.name ?? found[0]?.name;
    } catch {
      /* lookup optional */
    }

    return {
      data: {
        name: customerId,
        customer_name: msg.customer_name,
        mobile_number: msg.mobile_number,
        customer_group: msg.customer_group,
        territory: msg.territory,
      },
    };
  } catch (error) {
    console.error('Error creating customer:', error);
    throw error;
  }
}

/** Strip characters unsafe / meaningless for SQL LIKE. */
function sanitizeLikeTerm(term: string): string {
  return term.replace(/[%_\\]/g, '').trim();
}

/** Digits only — used for phone matching. */
export function extractPhoneDigits(term: string): string {
  return term.replace(/\D/g, '');
}

/** True when the query is mostly a phone number (≥3 digits). */
export function isPrimarilyPhoneQuery(term: string): boolean {
  const digits = extractPhoneDigits(term);
  if (digits.length < 3) return false;
  const compact = term.replace(/[\s\-().+]/g, '');
  if (!compact) return false;
  return digits.length >= compact.length * 0.7;
}

export function minCustomerSearchLength(term: string): number {
  return isPrimarilyPhoneQuery(term) ? 3 : 2;
}

function buildCustomerOrFilters(raw: string): Array<[string, string, string]> {
  const safe = sanitizeLikeTerm(raw);
  const likeName = `%${safe}%`;
  const orFilters: Array<[string, string, string]> = [['customer_name', 'like', likeName]];

  const digits = extractPhoneDigits(raw);
  if (digits.length >= 3) {
    orFilters.push(['mobile_number', 'like', `%${digits}%`]);
    if (digits.startsWith('0') && digits.length > 1) {
      orFilters.push(['mobile_number', 'like', `%${digits.slice(1)}%`]);
    } else if (digits.length >= 9 && !digits.startsWith('0')) {
      orFilters.push(['mobile_number', 'like', `%0${digits}%`]);
    }
  } else if (!isPrimarilyPhoneQuery(raw)) {
    orFilters.push(['mobile_number', 'like', likeName]);
    orFilters.push(['name', 'like', likeName]);
  }

  return orFilters;
}

export async function searchCustomers(
  search: string,
  limit = 10
): Promise<CustomerSearchResult[]> {
  const raw = search.trim();
  if (!raw) return [];

  const minLen = minCustomerSearchLength(raw);
  const effectiveLen = isPrimarilyPhoneQuery(raw)
    ? extractPhoneDigits(raw).length
    : raw.length;
  if (effectiveLen < minLen) return [];

  const orFilters = buildCustomerOrFilters(raw);

  try {
    const res = await db.getDocList(DOCTYPES.CUSTOMER, {
      fields: ['name', 'customer_name', 'mobile_number'],
      orFilters,
      filters: [['disabled', '=', 0]],
      limit,
      limit_start: 0,
      orderBy: { field: 'modified', order: 'desc' },
    });

    const seen = new Set<string>();
    const results: CustomerSearchResult[] = [];
    for (const doc of res) {
      if (seen.has(doc.name)) continue;
      seen.add(doc.name);
      results.push({
        name: doc.name,
        customer_name: doc.customer_name ?? '',
        mobile_number: doc.mobile_number ?? '',
      });
    }
    return results;
  } catch (error) {
    console.error('Customer search error:', error);
    throw error;
  }
}
