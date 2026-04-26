import { parseApiResponse } from "@/lib/http";

export interface AggregateCategoryResult<T = unknown> {
  ok: boolean;
  items: T[];
  total: number;
  error?: string;
}

export interface AggregateSearchResult {
  flights: AggregateCategoryResult<{ flight: Record<string, unknown> }>;
  trains: AggregateCategoryResult<{ train: Record<string, unknown> }>;
  hotels: AggregateCategoryResult<{ hotel: Record<string, unknown> }>;
  cabs: AggregateCategoryResult<{ cab: Record<string, unknown> }>;
}

export interface AggregateSearchQuery {
  categories?: string;
  from?: string;
  to?: string;
  date?: string;
  city?: string;
  checkIn?: string;
  checkOut?: string;
  cabCity?: string;
  distanceKm?: number;
  passengers?: number;
  guests?: number;
  rooms?: number;
}

export interface AdminGlobalSearchItem {
  id: string;
  kind: string;
  label: string;
  meta: string;
  href: string;
}

export const aggregateSearch = async (query: AggregateSearchQuery): Promise<AggregateSearchResult> => {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });

  const response = await fetch(`/api/search/aggregate?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  const parsed = await parseApiResponse<AggregateSearchResult>(response, "Unable to aggregate search right now.");
  if (!parsed.ok || !parsed.payload?.data) {
    throw new Error(parsed.payload?.message || "Unable to aggregate search right now.");
  }

  return parsed.payload.data;
};

export const adminGlobalSearch = async (query: { q: string; limit?: number }): Promise<AdminGlobalSearchItem[]> => {
  const params = new URLSearchParams();
  params.set('q', query.q);
  if (query.limit) {
    params.set('limit', String(query.limit));
  }

  const response = await fetch(`/api/search/admin-global?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json', ...((typeof window !== 'undefined') ? {} : {}) },
  });

  const parsed = await parseApiResponse<{ items: AdminGlobalSearchItem[] }>(response, 'Unable to search admin data right now.');
  if (!parsed.ok || !parsed.payload?.data?.items) {
    throw new Error(parsed.payload?.message || 'Unable to search admin data right now.');
  }

  return parsed.payload.data.items;
};
