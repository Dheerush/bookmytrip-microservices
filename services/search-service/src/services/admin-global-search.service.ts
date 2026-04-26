import { env } from '../config/env';
import { AdminGlobalSearchQuery } from '../validators/search.validators';

interface AdminSearchResult {
  id: string;
  kind: string;
  label: string;
  meta: string;
  href: string;
}

const withTimeout = async (url: string, authorization: string): Promise<Response> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), env.REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: {
        authorization,
        'content-type': 'application/json',
      },
    });
  } finally {
    clearTimeout(timer);
  }
};

const buildUrl = (baseUrl: string, path: string, params: Record<string, string | number | boolean | undefined>): string => {
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const extractItems = async (responsePromise: Promise<Response>, dataPath: string[]): Promise<unknown[]> => {
  try {
    const response = await responsePromise;
    if (!response.ok) return [];
    const json = await response.json() as Record<string, unknown>;
    let cursor: unknown = json;
    dataPath.forEach((segment) => {
      if (cursor && typeof cursor === 'object') {
        cursor = (cursor as Record<string, unknown>)[segment];
      }
    });
    return Array.isArray(cursor) ? cursor : [];
  } catch {
    return [];
  }
};

const includesNeedle = (value: string, needle: string): boolean => value.toLowerCase().includes(needle);

const takeMatches = <T>(items: T[], predicate: (item: T) => boolean, limit: number): T[] => {
  return items.filter(predicate).slice(0, limit);
};

export const adminGlobalSearch = async (
  query: AdminGlobalSearchQuery,
  authorization?: string,
): Promise<{ items: AdminSearchResult[] }> => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const needle = query.q.trim().toLowerCase();
  const fetchLimit = 1000;

  const [bookings, issues, coupons, flights, trains, hotels, cabs, tours] = await Promise.all([
    extractItems(withTimeout(buildUrl(env.BOOKING_SERVICE_URL, '/api/bookings/admin', { page: 1, limit: fetchLimit }), authorization), ['data', 'bookings']),
    extractItems(withTimeout(buildUrl(env.USER_SERVICE_URL, '/api/users/issues/admin', {}), authorization), ['data', 'items']),
    extractItems(withTimeout(buildUrl(env.ADMIN_SERVICE_URL, '/api/admin/coupons', {}), authorization), ['data', 'items']),
    extractItems(withTimeout(buildUrl(env.FLIGHT_SERVICE_URL, '/api/flights', { page: 1, limit: fetchLimit, includeInactive: true }), authorization), ['data', 'flights']),
    extractItems(withTimeout(buildUrl(env.TRAIN_SERVICE_URL, '/api/trains', { page: 1, limit: fetchLimit, includeInactive: true }), authorization), ['data', 'trains']),
    extractItems(withTimeout(buildUrl(env.HOTEL_SERVICE_URL, '/api/hotels', { page: 1, limit: fetchLimit, includeInactive: true }), authorization), ['data', 'hotels']),
    extractItems(withTimeout(buildUrl(env.CAB_SERVICE_URL, '/api/cabs', { page: 1, limit: fetchLimit, includeInactive: true }), authorization), ['data', 'cabs']),
    extractItems(withTimeout(buildUrl(env.TOUR_SERVICE_URL, '/api/tours/admin/list', { page: 1, limit: fetchLimit, includeInactive: true }), authorization), ['data', 'items']),
  ]);

  const results: AdminSearchResult[] = [];
  const pushResult = (result: AdminSearchResult) => {
    if (results.length >= query.limit) return;
    results.push(result);
  };

  takeMatches(bookings, (item) => {
    const booking = item as Record<string, unknown>;
    return includesNeedle(`${booking.bookingRef || ''} ${booking.title || ''} ${booking.type || ''} ${booking.status || ''}`, needle);
  }, query.limit).forEach((item) => {
    const booking = item as Record<string, unknown>;
    pushResult({
      id: `booking-${String(booking._id || booking.bookingRef || '')}`,
      kind: 'booking',
      label: `${String(booking.bookingRef || '')} • ${String(booking.type || '').toUpperCase()} • ${String(booking.status || '')}`,
      meta: String(booking.title || 'Booking'),
      href: '/dashboard/bookings',
    });
  });

  takeMatches(issues, (item) => {
    const issue = item as Record<string, unknown>;
    return includesNeedle(`${issue.issueRef || ''} ${issue.subject || ''} ${issue.status || ''} ${issue.userName || ''}`, needle);
  }, query.limit).forEach((item) => {
    const issue = item as Record<string, unknown>;
    pushResult({
      id: `issue-${String(issue._id || issue.issueRef || '')}`,
      kind: 'issue',
      label: `${String(issue.issueRef || '')} • ${String(issue.status || '')}`,
      meta: String(issue.subject || issue.userName || 'Support ticket'),
      href: '/dashboard/issues',
    });
  });

  takeMatches(coupons, (item) => {
    const coupon = item as Record<string, unknown>;
    return includesNeedle(`${coupon.code || ''} ${coupon.discountType || ''} ${coupon.active ? 'active' : 'inactive'}`, needle);
  }, query.limit).forEach((item) => {
    const coupon = item as Record<string, unknown>;
    const discountType = String(coupon.discountType || '');
    const discountValue = Number(coupon.discountValue || 0);
    pushResult({
      id: `coupon-${String(coupon._id || coupon.code || '')}`,
      kind: 'coupon',
      label: `${String(coupon.code || '')} • ${Boolean(coupon.active) ? 'active' : 'inactive'}`,
      meta: discountType === 'percent' ? `${discountValue}% off` : `INR ${discountValue.toLocaleString('en-IN')} off`,
      href: '/dashboard/admin/coupons',
    });
  });

  const inventoryDefs = [
    { kind: 'flight', items: flights, href: '/dashboard/admin/inventory?entity=flights', fields: ['flightCode', 'airline', 'fromCode', 'toCode'] },
    { kind: 'train', items: trains, href: '/dashboard/admin/inventory?entity=trains', fields: ['trainNumber', 'name', 'fromCode', 'toCode'] },
    { kind: 'hotel', items: hotels, href: '/dashboard/admin/inventory?entity=hotels', fields: ['name', 'city', 'address'] },
    { kind: 'cab', items: cabs, href: '/dashboard/admin/inventory?entity=cabs', fields: ['name', 'city', 'vehicleType'] },
    { kind: 'tour', items: tours, href: '/dashboard/admin/inventory?entity=tours', fields: ['title', 'name', 'city', 'country'] },
  ];

  inventoryDefs.forEach((definition) => {
    takeMatches(definition.items, (item) => {
      const entity = item as Record<string, unknown>;
      const haystack = definition.fields.map((field) => String(entity[field] || '')).join(' ');
      return includesNeedle(haystack, needle);
    }, query.limit).forEach((item) => {
      const entity = item as Record<string, unknown>;
      pushResult({
        id: `${definition.kind}-${String(entity._id || entity.id || entity.name || entity.title || entity.flightCode || entity.trainNumber || '')}`,
        kind: definition.kind,
        label: String(entity.title || entity.name || entity.flightCode || entity.trainNumber || 'Inventory item'),
        meta: definition.fields.map((field) => String(entity[field] || '')).filter(Boolean).slice(0, 3).join(' • '),
        href: definition.href,
      });
    });
  });

  return { items: results.slice(0, query.limit) };
};
