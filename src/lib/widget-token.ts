import crypto from "crypto";

// 위젯 전용 장기 토큰 (앱 최초 로그인 시 발급, 90일 만료, refresh 없이 재로그인 시 재발급)
// 형식: base64url(payload).base64url(hmacSHA256(payload, secret))
//   payload = { uid, exp }  (exp = epoch seconds)
//
// 위젯은 백그라운드에서 조용히 /api/widget/summary 를 호출하므로
// 매번 로그인 세션 대신 이 서명 토큰으로 인증한다.

const TOKEN_TTL_SECONDS = 90 * 24 * 60 * 60; // 90일

function getSecret(): string {
  const s = process.env.WIDGET_TOKEN_SECRET;
  if (!s) {
    throw new Error(
      "WIDGET_TOKEN_SECRET not configured (set in .env.local / Vercel 환경변수)"
    );
  }
  return s;
}

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(payloadB64: string): string {
  return b64url(
    crypto.createHmac("sha256", getSecret()).update(payloadB64).digest()
  );
}

/** 로그인 성공 시 호출해 위젯 토큰을 발급 */
export function signWidgetToken(uid: string): string {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payloadB64 = b64url(Buffer.from(JSON.stringify({ uid, exp }), "utf8"));
  return `${payloadB64}.${sign(payloadB64)}`;
}

/** 토큰 검증 → 유효하면 uid 반환, 아니면 null */
export function verifyWidgetToken(token: string | null | undefined): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sig] = parts;

  // 서명 검증 (타이밍 안전 비교)
  const expected = sign(payloadB64);
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return null;
  }

  try {
    const json = Buffer.from(
      payloadB64.replace(/-/g, "+").replace(/_/g, "/"),
      "base64"
    ).toString("utf8");
    const payload = JSON.parse(json) as { uid?: string; exp?: number };
    if (!payload.uid || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // 만료
    return payload.uid;
  } catch {
    return null;
  }
}
