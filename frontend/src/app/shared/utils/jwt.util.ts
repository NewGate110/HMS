export interface JwtPayload {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = (4 - (base64.length % 4)) % 4;
    const json = atob(base64 + '='.repeat(pad));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function jwtExpiresAt(token: string): Date | null {
  const p = decodeJwtPayload(token);
  if (!p?.exp) return null;
  return new Date(p.exp * 1000);
}
