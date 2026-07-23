import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * 서버 전용 Supabase 클라이언트 (service_role 키, RLS 우회).
 *
 * [보안] service_role 키는 모든 RLS를 우회하므로 절대 클라이언트 번들에
 * 포함되면 안 된다. 이 모듈은 오직 서버(API 라우트)에서만 import 한다.
 * (클라이언트에서 import 하면 SUPABASE_SERVICE_ROLE_KEY 가 없어 throw 된다.)
 */
let _admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY 와 NEXT_PUBLIC_SUPABASE_URL 가 .env.local 에 설정되어야 합니다. " +
        "(Supabase 대시보드 → Project Settings → API → service_role 키)"
    );
  }
  _admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}
