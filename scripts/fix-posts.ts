/**
 * 공지 줄이기 + 지난주 게시글 카테고리 수정
 * 실행: npx tsx scripts/fix-posts.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
if (!url || !key) { console.error("❌ env 설정 필요"); process.exit(1); }

const supabase = createClient(url, key, {
  global: { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  auth: { autoRefreshToken: false, persistSession: false },
});

async function fix() {
  console.log("🔧 게시글 수정 시작...\n");

  // 1. 이번 주 공지 10개 → 5개 삭제 (가장 최근 5개만 유지)
  const { data: announcements } = await supabase
    .from("posts")
    .select("id, title, created_at")
    .eq("category", "announcement")
    .not("title", "like", "%지난주%")
    .order("created_at", { ascending: true });

  if (announcements && announcements.length > 5) {
    const toDelete = announcements.slice(0, announcements.length - 5);
    for (const a of toDelete) {
      await supabase.from("comments").delete().eq("post_id", a.id);
      await supabase.from("posts").delete().eq("id", a.id);
    }
    console.log(`✅ 이번 주 공지 ${toDelete.length}개 삭제 (${5}개 유지)`);
  } else {
    console.log("✅ 공지 수 이미 적절함");
  }

  // 2. 지난주 게시글: 제목에 맞게 카테고리 수정
  const { data: oldPosts } = await supabase
    .from("posts")
    .select("id, title, category")
    .like("title", "%지난주%");

  if (oldPosts) {
    let fixed = 0;
    for (const p of oldPosts) {
      const shouldBeAnnouncement = p.title.includes("[지난주 공지]");
      const correctCategory = shouldBeAnnouncement ? "announcement" : "question";
      if (p.category !== correctCategory) {
        await supabase.from("posts").update({ category: correctCategory }).eq("id", p.id);
        fixed++;
        console.log(`  수정: "${p.title}" → ${correctCategory}`);
      }
    }
    console.log(`✅ 지난주 게시글 카테고리 ${fixed}개 수정`);
  }

  console.log("\n✨ 완료!");
}

fix().catch(console.error);
