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
  tours: "/api/tours/admin/list",
};

const CREATE_ENDPOINTS: Record<InventoryEntity, string> = {
  flights: "/api/flights",
  trains: "/api/trains/create-train",
  hotels: "/api/hotels/create-hotel",
  cabs: "/api/cabs/create-cab",
  tours: "/api/tours/create-tour",
};

const UPDATE_ENDPOINTS: Record<InventoryEntity, (id: string) => string> = {
  flights: (id) => `/api/flights/${id}`,
  trains: (id) => `/api/trains/${id}`,
  hotels: (id) => `/api/hotels/update-hotel/${id}`,
  cabs: (id) => `/api/cabs/update-cab/${id}`,
  tours: (id) => `/api/tours/update-tour/${id}`,
};

const DELETE_ENDPOINTS: Record<InventoryEntity, (id: string) => string> = {
  flights: (id) => `/api/flights/${id}`,
  trains: (id) => `/api/trains/delete-train/${id}`,
  hotels: (id) => `/api/hotels/delete-hotel/${id}`,
  cabs: (id) => `/api/cabs/delete-cab/${id}`,
  tours: (id) => `/api/tours/delete-tour/${id}`,
};

const normalizeList = <T = unknown>(entity: InventoryEntity, data: unknown): InventoryListResult<T> => {
  if (entity === "flights") {
    const flightData = data as { flights?: T[]; total?: number; page?: number; totalPages?: number };
    return {
      items: flightData?.flights || [],
      total: flightData?.total || 0,
      page: flightData?.page || 1,
      totalPages: flightData?.totalPages || 1,
    };
  }

  if (entity === "trains") {
    const trainData = data as { trains?: T[]; total?: number; page?: number; totalPages?: number };
    return {
      items: trainData?.trains || [],
      total: trainData?.total || 0,
      page: trainData?.page || 1,
      totalPages: trainData?.totalPages || 1,
    };
  }

  if (entity === "hotels") {
    const hotelData = data as { hotels?: T[]; total?: number; page?: number; totalPages?: number };
    return {
      items: hotelData?.hotels || [],
      total: hotelData?.total || 0,
      page: hotelData?.page || 1,
      totalPages: hotelData?.totalPages || 1,
    };
  }

  if (entity === "cabs") {
    const cabData = data as { cabs?: T[]; total?: number; page?: number; totalPages?: number };
    return {
      items: cabData?.cabs || [],
      total: cabData?.total || 0,
      page: cabData?.page || 1,
      totalPages: cabData?.totalPages || 1,
    };
  }

  const tourData = data as {
    items?: T[];
    total?: number;
    page?: number;
    totalPages?: number;
  };

  return {
    items: tourData?.items || [],
    total: tourData?.total || 0,
    page: tourData?.page || 1,
    totalPages: tourData?.totalPages || 1,
  };
};

export const listInventory = async <T = unknown>(
  entity: InventoryEntity,
  opts?: { page?: number; limit?: number; city?: string; includeInactive?: boolean },
): Promise<InventoryListResult<T>> => {
  const params = new URLSearchParams();
  params.set("page", String(opts?.page || 1));
  params.set("limit", String(opts?.limit || 20));

  if (entity === "tours" && opts?.city) {
    params.set("city", opts.city);
  }

  if (opts?.includeInactive) {
    params.set("includeInactive", "true");
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

export const reactivateInventory = async (entity: InventoryEntity, id: string): Promise<unknown> => {
  const response = await fetch(UPDATE_ENDPOINTS[entity](id), {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ isActive: true }),
  });

  const parsed = await parseApiResponse<unknown>(response, `Unable to reactivate ${entity}.`);
  if (!parsed.ok) {
    throw new Error(parsed.payload?.message || `Unable to reactivate ${entity}.`);
  }
  return parsed.payload?.data;
};

export const getFlightByIdentifier = async (value: string): Promise<unknown> => {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Please provide a flight ID or flight code.");

  const endpoint = trimmed.includes("-")
    ? `/api/flights/code/${encodeURIComponent(trimmed.toUpperCase())}`
    : `/api/flights/${encodeURIComponent(trimmed)}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const parsed = await parseApiResponse<unknown>(response, "Unable to fetch flight details.");
  if (!parsed.ok || !parsed.payload?.data) {
    throw new Error(parsed.payload?.message || "Unable to fetch flight details.");
  }
  return parsed.payload.data;
};

export const getTrainByIdentifier = async (value: string): Promise<unknown> => {
  const trimmed = value.trim();
  if (!trimmed) throw new Error("Please provide a train ID or train number.");

  const isTrainNumber = /^\d{4,}$/.test(trimmed);
  const endpoint = isTrainNumber
    ? `/api/trains/number/${encodeURIComponent(trimmed)}`
    : `/api/trains/${encodeURIComponent(trimmed)}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const parsed = await parseApiResponse<unknown>(response, "Unable to fetch train details.");
  if (!parsed.ok || !parsed.payload?.data) {
    throw new Error(parsed.payload?.message || "Unable to fetch train details.");
  }
  return parsed.payload.data;
};
