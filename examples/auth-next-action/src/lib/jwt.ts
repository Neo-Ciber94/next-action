import * as jose from "jose";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function encodeJwt<T extends Record<string, unknown>>(payload: T) {
  const jwt = await new jose.SignJWT(payload)
    .setExpirationTime("1 day")
    .setProtectedHeader({ alg: "HS256" })
    .sign(secret);

  return jwt;
}

export async function decodeJwt(jwt: string) {
  try {
    const { payload } = await jose.jwtVerify(jwt, secret);
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
