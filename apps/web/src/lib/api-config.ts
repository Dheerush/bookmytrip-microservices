export const GATEWAY_API_BASE = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:5000";

export const AUTH_API_BASE = `${GATEWAY_API_BASE}/api/auth`;
