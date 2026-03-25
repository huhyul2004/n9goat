import { supabase } from "./supabase";
import type { Post, Comment, Mail, ChatMessage, ChatRoom, CalendarEvent, Poll } from "./types";

// ===================== POSTS =====================

export async function fetchPosts(category?: string): Promise<Post[]> {
  let q = supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) console.error("[fetchPosts]", error.message);
  return (data as Post[]) || [];
}

// DB에 존재하지 않을 수 있는 컬럼 목록
const OPTIONAL_COLUMNS = ["is_anonymous", "pinned"];

export async function createPost(post: Omit<Post, "id" | "created_at">): Promise<{ ok: boolean; error?: string }> {
  // undefined 값 제거
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(post)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }

  console.log("[createPost] 전송 데이터:", Object.keys(cleaned));
  const { error } = await supabase.from("posts").insert(cleaned);
  if (error) {
    // schema cache 에러 시 optional 컬럼 제거 후 재시도
    if (error.message.includes("schema cache")) {
      for (const col of OPTIONAL_COLUMNS) delete cleaned[col];
      const { error: retryError } = await supabase.from("posts").insert(cleaned);
      if (retryError) {
        console.error("[createPost] 재시도 에러:", retryError.message);
        return { ok: false, error: retryError.message };
      }
      return { ok: true };
    }
    console.error("[createPost] 에러:", error.message, error.details, error.hint, error.code);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export async function togglePinPost(id: string, pinned: boolean): Promise<boolean> {
  const { error } = await supabase.from("posts").update({ pinned }).eq("id", id);
  if (error) console.error("[togglePinPost]", error.message);
  return !error;
}

export async function updatePost(id: string, updates: { title?: string; content?: string }): Promise<boolean> {
  const { error } = await supabase.from("posts").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) console.error("[updatePost]", error.message);
  return !error;
}

export async function deletePost(id: string): Promise<boolean> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  if (error) console.error("[deletePost]", error.message);
  return !error;
}

// ===================== COMMENTS =====================

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
  if (error) console.error("[fetchComments]", error.message);
  return (data as Comment[]) || [];
}

export async function createComment(comment: Omit<Comment, "id" | "created_at">): Promise<boolean> {
  const { error } = await supabase.from("comments").insert(comment);
  if (error) console.error("[createComment]", error.message);
  return !error;
}

export async function updateComment(id: string, content: string): Promise<boolean> {
  const { error } = await supabase.from("comments").update({ content, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) console.error("[updateComment]", error.message);
  return !error;
}

export async function deleteComment(id: string): Promise<boolean> {
  const { error } = await supabase.from("comments").delete().eq("id", id);
  if (error) console.error("[deleteComment]", error.message);
  return !error;
}

export async function getCommentCounts(postIds: string[]): Promise<Record<string, number>> {
  const { data } = await supabase.from("comments").select("post_id").in("post_id", postIds);
  const counts: Record<string, number> = {};
  postIds.forEach((id) => (counts[id] = 0));
  (data || []).forEach((c: { post_id: string }) => { counts[c.post_id] = (counts[c.post_id] || 0) + 1; });
  return counts;
}

// ===================== NOTIFICATIONS =====================

export async function getUnreadMailCount(userId: string): Promise<number> {
  const { count } = await supabase.from("mails").select("*", { count: "exact", head: true }).eq("to_id", userId).eq("is_read", false);
  return count || 0;
}

export async function getNewCommentCountOnMyPosts(userId: string): Promise<number> {
  const lastSeen = typeof window !== "undefined" ? localStorage.getItem(`n9_comments_seen_${userId}`) : null;
  const lastSeenTime = lastSeen ? new Date(lastSeen).getTime() : 0;
  const { data: myPosts } = await supabase.from("posts").select("id").eq("author_id", userId);
  if (!myPosts || myPosts.length === 0) return 0;
  const { data: comments } = await supabase.from("comments").select("*").in("post_id", myPosts.map((p: { id: string }) => p.id)).neq("author_id", userId);
  return (comments || []).filter((c: { created_at: string }) => new Date(c.created_at).getTime() > lastSeenTime).length;
}

export function markCommentsSeen(userId: string) {
  localStorage.setItem(`n9_comments_seen_${userId}`, new Date().toISOString());
}

// ===================== MAILS =====================

export async function fetchMails(userId: string, type: "inbox" | "sent"): Promise<Mail[]> {
  const column = type === "inbox" ? "to_id" : "from_id";
  const { data } = await supabase.from("mails").select("*").eq(column, userId).order("created_at", { ascending: false });
  return (data as Mail[]) || [];
}

export async function createMail(mail: Omit<Mail, "id" | "is_read" | "created_at">): Promise<boolean> {
  const { error } = await supabase.from("mails").insert(mail);
  if (error) console.error("[createMail]", error.message);
  return !error;
}

export async function markMailRead(mailId: string): Promise<void> {
  await supabase.from("mails").update({ is_read: true }).eq("id", mailId);
}

export async function deleteMail(id: string): Promise<boolean> {
  const { error } = await supabase.from("mails").delete().eq("id", id);
  if (error) console.error("[deleteMail]", error.message);
  return !error;
}

// ===================== CHAT =====================

export async function fetchChatMessages(room: string): Promise<ChatMessage[]> {
  const { data } = await supabase.from("chat_messages").select("*").eq("room", room).order("created_at", { ascending: true }).limit(100);
  return (data as ChatMessage[]) || [];
}

export async function sendChatMessage(msg: Omit<ChatMessage, "id" | "created_at">): Promise<boolean> {
  const { error } = await supabase.from("chat_messages").insert(msg);
  if (error) console.error("[sendChatMessage]", error.message);
  return !error;
}

export async function deleteChatMessage(id: string): Promise<boolean> {
  const { error } = await supabase.from("chat_messages").delete().eq("id", id);
  if (error) console.error("[deleteChatMessage]", error.message);
  return !error;
}

// ===================== CHAT ROOMS (단톡방) =====================

export async function fetchChatRooms(userId: string): Promise<ChatRoom[]> {
  const { data, error } = await supabase.from("chat_rooms").select("*").contains("members", JSON.stringify([userId])).order("created_at", { ascending: false });
  if (error) {
    // contains 실패 시 전체 가져와서 필터
    const { data: all } = await supabase.from("chat_rooms").select("*").order("created_at", { ascending: false });
    return ((all as ChatRoom[]) || []).filter((r) => r.members.includes(userId));
  }
  return (data as ChatRoom[]) || [];
}

export async function createChatRoom(room: Omit<ChatRoom, "id" | "created_at">): Promise<boolean> {
  const payload = { ...room, members: JSON.parse(JSON.stringify(room.members)) };
  const { error } = await supabase.from("chat_rooms").insert(payload);
  if (error) {
    console.error("[createChatRoom]", error.message, error.details, error.hint);
    alert(`단톡방 생성 실패: ${error.message}`);
  }
  return !error;
}

export async function updateChatRoomMembers(roomId: string, members: string[]): Promise<boolean> {
  const { error } = await supabase.from("chat_rooms").update({ members }).eq("id", roomId);
  if (error) console.error("[updateChatRoomMembers]", error.message);
  return !error;
}

export async function deleteChatRoom(id: string): Promise<boolean> {
  // 방 삭제 시 해당 방의 메시지도 삭제
  await supabase.from("chat_messages").delete().eq("room", `group_${id}`);
  const { error } = await supabase.from("chat_rooms").delete().eq("id", id);
  if (error) console.error("[deleteChatRoom]", error.message);
  return !error;
}

// ===================== CALENDAR =====================

export async function fetchEvents(month?: string): Promise<CalendarEvent[]> {
  let q = supabase.from("calendar_events").select("*").order("date", { ascending: true });
  if (month) {
    q = q.gte("date", `${month}-01`).lte("date", `${month}-31`);
  }
  const { data } = await q;
  return (data as CalendarEvent[]) || [];
}

export async function createEvent(event: Omit<CalendarEvent, "id" | "created_at">): Promise<boolean> {
  const { error } = await supabase.from("calendar_events").insert(event);
  if (error) console.error("[createEvent]", error.message);
  return !error;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) console.error("[deleteEvent]", error.message);
  return !error;
}

// ===================== POLLS =====================

export async function fetchPolls(): Promise<Poll[]> {
  const { data } = await supabase.from("polls").select("*").order("created_at", { ascending: false });
  return (data as Poll[]) || [];
}

export async function createPoll(poll: Omit<Poll, "id" | "created_at" | "votes">): Promise<boolean> {
  const { error } = await supabase.from("polls").insert({ ...poll, votes: {} });
  if (error) console.error("[createPoll]", error.message);
  return !error;
}

export async function deletePoll(id: string): Promise<boolean> {
  const { error } = await supabase.from("polls").delete().eq("id", id);
  if (error) console.error("[deletePoll]", error.message);
  return !error;
}

export async function votePoll(pollId: string, userId: string, option: string): Promise<boolean> {
  const { data } = await supabase.from("polls").select("votes").eq("id", pollId).single();
  if (!data) return false;
  const currentVotes = data.votes || {};
  const votes = { ...currentVotes, [userId]: option };
  const { error } = await supabase.from("polls").update({ votes }).eq("id", pollId);
  if (error) console.error("[votePoll]", error.message);
  return !error;
}

// ===================== PROFILE HELPERS =====================

export async function getMyPosts(userId: string): Promise<Post[]> {
  const { data } = await supabase.from("posts").select("*").eq("author_id", userId).order("created_at", { ascending: false });
  return (data as Post[]) || [];
}

export async function getMyComments(userId: string): Promise<Comment[]> {
  const { data } = await supabase.from("comments").select("*").eq("author_id", userId).order("created_at", { ascending: false });
  return (data as Comment[]) || [];
}

// ===================== ACTIVITY LOG =====================

export async function logActivity(
  userId: string,
  action: string,
  targetTable?: string,
  targetId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  await supabase.from("activity_logs").insert({
    user_id: userId,
    action,
    target_table: targetTable,
    target_id: targetId,
    details: details || {},
  });
}

// ===================== PROFILES =====================

export async function fetchAllProfiles() {
  const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  return data || [];
}

export async function fetchProfileById(userId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}

// ===================== USER ID MIGRATION =====================
// 기존 소속_직책 ID → 소속_직책_이름 ID로 마이그레이션
export async function migrateUserId(oldId: string, newId: string): Promise<void> {
  if (oldId === newId) return;

  // 이미 새 ID로 데이터가 있으면 마이그레이션 불필요
  const { count } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", newId);
  if (count && count > 0) return;

  // 기존 ID로 데이터가 있는지 확인
  const { count: oldCount } = await supabase.from("posts").select("*", { count: "exact", head: true }).eq("author_id", oldId);
  if (!oldCount || oldCount === 0) return;

  console.log(`[migrateUserId] ${oldId} → ${newId} (${oldCount} posts found)`);

  // 모든 테이블의 author_id 업데이트
  await Promise.all([
    supabase.from("posts").update({ author_id: newId }).eq("author_id", oldId),
    supabase.from("comments").update({ author_id: newId }).eq("author_id", oldId),
    supabase.from("chat_messages").update({ author_id: newId }).eq("author_id", oldId),
    supabase.from("calendar_events").update({ author_id: newId }).eq("author_id", oldId),
    supabase.from("polls").update({ author_id: newId }).eq("author_id", oldId),
  ]);

  // 메일: from_id, to_id 둘 다
  await Promise.all([
    supabase.from("mails").update({ from_id: newId }).eq("from_id", oldId),
    supabase.from("mails").update({ to_id: newId }).eq("to_id", oldId),
  ]);

  // 채팅방: owner_id + members 배열
  const { data: rooms } = await supabase.from("chat_rooms").select("*").eq("owner_id", oldId);
  if (rooms) {
    for (const room of rooms) {
      await supabase.from("chat_rooms").update({ owner_id: newId }).eq("id", room.id);
    }
  }
  // members 배열에 포함된 경우
  const { data: memberRooms } = await supabase.from("chat_rooms").select("*");
  if (memberRooms) {
    for (const room of memberRooms) {
      const members = room.members as string[];
      if (members.includes(oldId)) {
        const updated = members.map((m: string) => m === oldId ? newId : m);
        await supabase.from("chat_rooms").update({ members: updated }).eq("id", room.id);
      }
    }
  }

  console.log(`[migrateUserId] Migration complete: ${oldId} → ${newId}`);
}

// ===================== CREDENTIALS (계정 비밀번호) =====================

export async function getCredential(accountId: string): Promise<{ password: string } | null> {
  const { data } = await supabase.from("credentials").select("password").eq("account_id", accountId).single();
  return data as { password: string } | null;
}

export async function createCredential(accountId: string, password: string): Promise<boolean> {
  const { error } = await supabase.from("credentials").insert({ account_id: accountId, password });
  if (error) console.error("[createCredential]", error.message);
  return !error;
}

// ===================== DASHBOARD =====================

export async function fetchDashboardStats() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  const weekStart = monday.toISOString();

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const [
    allPosts, weekPosts, todayPosts,
    allComments, weekComments,
    allPolls, allEvents, allChats,
  ] = await Promise.all([
    supabase.from("posts").select("id, category, author_school, author_role, author_id, title, created_at", { count: "exact" }),
    supabase.from("posts").select("id, category, author_school, author_id, title, created_at").gte("created_at", weekStart),
    supabase.from("posts").select("id, category, author_school, created_at").gte("created_at", todayISO),
    supabase.from("comments").select("id, post_id, author_id, created_at", { count: "exact" }),
    supabase.from("comments").select("id, post_id, author_id, created_at").gte("created_at", weekStart),
    supabase.from("polls").select("*"),
    supabase.from("calendar_events").select("id, title, date, author_school, created_at"),
    supabase.from("chat_messages").select("id, room, author_school, created_at").gte("created_at", weekStart),
  ]);

  const posts = allPosts.data || [];
  const comments = allComments.data || [];
  const polls = (allPolls.data || []) as Poll[];
  const events = allEvents.data || [];
  const weekPostsData = weekPosts.data || [];
  const todayPostsData = todayPosts.data || [];
  const weekCommentsData = weekComments.data || [];
  const weekChatsData = allChats.data || [];

  // Comment counts per post (for popular posts)
  const commentCountMap: Record<string, number> = {};
  comments.forEach((c: { post_id: string }) => {
    commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1;
  });

  // Popular posts (top 5 by comments)
  const popularPosts = posts
    .map((p: { id: string; title: string; author_school: string; author_id: string; category: string; created_at: string }) => ({
      ...p,
      comment_count: commentCountMap[p.id] || 0,
    }))
    .sort((a: { comment_count: number }, b: { comment_count: number }) => b.comment_count - a.comment_count)
    .slice(0, 5);

  // School activity (posts per school)
  const schoolActivity: Record<string, { posts: number; comments: number; chats: number }> = {};
  weekPostsData.forEach((p: { author_school: string }) => {
    if (!schoolActivity[p.author_school]) schoolActivity[p.author_school] = { posts: 0, comments: 0, chats: 0 };
    schoolActivity[p.author_school].posts++;
  });
  weekCommentsData.forEach((c: { author_id: string }) => {
    const school = c.author_id?.split("_")[0] || "기타";
    if (!schoolActivity[school]) schoolActivity[school] = { posts: 0, comments: 0, chats: 0 };
    schoolActivity[school].comments++;
  });
  weekChatsData.forEach((m: { author_school: string }) => {
    if (!schoolActivity[m.author_school]) schoolActivity[m.author_school] = { posts: 0, comments: 0, chats: 0 };
    schoolActivity[m.author_school].chats++;
  });

  // Unique users this week
  const weeklyUsers = new Set([
    ...weekPostsData.map((p: { author_id: string }) => p.author_id),
    ...weekCommentsData.map((c: { author_id: string }) => c.author_id),
    ...weekChatsData.map((m: { author_school: string }) => m.author_school),
  ]);

  return {
    totalPosts: posts.length,
    totalComments: comments.length,
    totalPolls: polls.length,
    totalEvents: events.length,
    todayPosts: todayPostsData.length,
    weekPosts: weekPostsData.length,
    weekComments: weekCommentsData.length,
    weekChats: weekChatsData.length,
    weeklyActiveUsers: weeklyUsers.size,
    popularPosts,
    schoolActivity,
    polls,
  };
}
