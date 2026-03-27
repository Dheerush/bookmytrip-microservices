import { getAuthHeaders, parseApiResponse } from "@/lib/http";

export type InventoryEntity = "flights" | "trains" | "hotels" | "cabs" | "tours";

export interface InventoryListResult<T = unknown> {
  items: T[];
  total: number;
  totalPages: number;
  page: number;
}

const LIST_ENDPOINTS: Record<InventoryEntity, string> = {
  flights: "/api/flights",
  trains: "/api/trains",
  hotels: "/api/hotels/all-hotels",
  cabs: "/api/cabs/all-cabs",
  tours: "/api/tours/search",
};

const CREATE_ENDPOINTS: Record<InventoryEntity, string> = {
  flights: "/api/flights",
  trains: "/api/trains",
  hotels: "/api/hotels/create-hotel",
  cabs: "/api/cabs/create-cab",
  tours: "/api/tours",
};

const UPDATE_ENDPOINTS: Record<InventoryEntity, (id: string) => string> = {
  flights: (id) => `/api/flights/${id}`,
  trains: (id) => `/api/trains/${id}`,
  hotels: (id) => `/api/hotels/update-hotel/${id}`,
  cabs: (id) => `/api/cabs/update-cab/${id}`,
  tours: (id) => `/api/tours/${id}`,
};

const DELETE_ENDPOINTS: Record<InventoryEntity, (id: string) => string> = {
  flights: (id) => `/api/flights/${id}`,
  trains: (id) => `/api/trains/${id}`,
  hotels: (id) => `/api/hotels/delete-hotel/${id}`,
  cabs: (id) => `/api/cabs/delete-cab/${id}`,
  tours: (id) => `/api/tours/${id}`,
};

const normalizeList = <T = unknown>(entity: InventoryEntity, data: unknown): InventoryListResult<T> => {
  if (entity === "tours") {
    const tourData = data as { items?: T[]; total?: number; page?: number; totalPages?: number };
    return {
      items: tourData?.items || [],
      total: tourData?.total || 0,
      page: tourData?.page || 1,
      totalPages: tourData?.totalPages || 1,
    };
  }

  const genericData = data as {
    results?: Array<{ flight?: T; train?: T; hotel?: T; cab?: T }>;
    total?: number;
    page?: number;
    totalPages?: number;
  };

  const items = (genericData?.results || []).map((entry) => {
    if (entity === "flights") return entry.flight as T;
    if (entity === "trains") return entry.train as T;
    if (entity === "hotels") return entry.hotel as T;
    return entry.cab as T;
  });

  return {
    items,
    total: genericData?.total || 0,
    page: genericData?.page || 1,
    totalPages: genericData?.totalPages || 1,
  };
};

export const listInventory = async <T = unknown>(
  entity: InventoryEntity,
  opts?: { page?: number; limit?: number; city?: string },
): Promise<InventoryListResult<T>> => {
  const params = new URLSearchParams();
  params.set("page", String(opts?.page || 1));
  params.set("limit", String(opts?.limit || 20));

  if (entity === "tours") {
    params.set("city", opts?.city || "goa");
  }

  const response = await fetch(`${LIST_ENDPOINTS[entity]}?${params.toString()}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const parsed = await parseApiResponse<unknown>(response, `Unable to list ${entity}.`);
  if (!parsed.ok || !parsed.payload?.data) {
    throw new Error(parsed.payload?.message || `Unable to list ${entity}.`);
  }

  return normalizeList<T>(entity, parsed.payload.data);
};

export const createInventory = async (entity: InventoryEntity, payload: unknown): Promise<unknown> => {
  const response = await fetch(CREATE_ENDPOINTS[entity], {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const parsed = await parseApiResponse<unknown>(response, `Unable to create ${entity}.`);
  if (!parsed.ok) {
    throw new Error(parsed.payload?.message || `Unable to create ${entity}.`);
  }
  return parsed.payload?.data;
};

export const updateInventory = async (entity: InventoryEntity, id: string, payload: unknown): Promise<unknown> => {
  const response = await fetch(UPDATE_ENDPOINTS[entity](id), {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const parsed = await parseApiResponse<unknown>(response, `Unable to update ${entity}.`);
  if (!parsed.ok) {
    throw new Error(parsed.payload?.message || `Unable to update ${entity}.`);
  }
  return parsed.payload?.data;
};

export const deactivateInventory = async (entity: InventoryEntity, id: string): Promise<void> => {
  const response = await fetch(DELETE_ENDPOINTS[entity](id), {
    method: "DELETE",
    headers: getAuthHeaders(),
  });

  const parsed = await parseApiResponse<unknown>(response, `Unable to deactivate ${entity}.`);
  if (!parsed.ok) {
    throw new Error(parsed.payload?.message || `Unable to deactivate ${entity}.`);
  }
};
