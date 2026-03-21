import { supabase } from "./supabase";
import type { Post, Comment, Mail, ChatMessage, CalendarEvent, Poll } from "./types";

// ===================== POSTS =====================

export async function fetchPosts(category?: string): Promise<Post[]> {
  let q = supabase.from("posts").select("*").order("created_at", { ascending: false });
  if (category) q = q.eq("category", category);
  const { data } = await q;
  return (data as Post[]) || [];
}

export async function createPost(post: Omit<Post, "id" | "created_at">): Promise<boolean> {
  const { error } = await supabase.from("posts").insert(post);
  return !error;
}

export async function togglePinPost(id: string, pinned: boolean): Promise<boolean> {
  const { error } = await supabase.from("posts").update({ pinned }).eq("id", id);
  return !error;
}

export async function updatePost(id: string, updates: { title?: string; content?: string }): Promise<boolean> {
  const { error } = await supabase.from("posts").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  return !error;
}

export async function deletePost(id: string): Promise<boolean> {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  return !error;
}

// ===================== COMMENTS =====================

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data } = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at", { ascending: true });
  return (data as Comment[]) || [];
}

export async function createComment(comment: Omit<Comment, "id" | "created_at">): Promise<boolean> {
  const { error } = await supabase.from("comments").insert(comment);
  return !error;
}

export async function updateComment(id: string, content: string): Promise<boolean> {
  const { error } = await supabase.from("comments").update({ content, updated_at: new Date().toISOString() }).eq("id", id);
  return !error;
}

export async function deleteComment(id: string): Promise<boolean> {
  const { error } = await supabase.from("comments").delete().eq("id", id);
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
  return !error;
}

export async function markMailRead(mailId: string): Promise<void> {
  await supabase.from("mails").update({ is_read: true }).eq("id", mailId);
}

// ===================== CHAT =====================

export async function fetchChatMessages(room: string): Promise<ChatMessage[]> {
  const { data } = await supabase.from("chat_messages").select("*").eq("room", room).order("created_at", { ascending: true }).limit(100);
  return (data as ChatMessage[]) || [];
}

export async function sendChatMessage(msg: Omit<ChatMessage, "id" | "created_at">): Promise<boolean> {
  const { error } = await supabase.from("chat_messages").insert(msg);
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
  return !error;
}

export async function deleteEvent(id: string): Promise<boolean> {
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  return !error;
}

// ===================== POLLS =====================

export async function fetchPolls(): Promise<Poll[]> {
  const { data } = await supabase.from("polls").select("*").order("created_at", { ascending: false });
  return (data as Poll[]) || [];
}

export async function createPoll(poll: Omit<Poll, "id" | "created_at" | "votes">): Promise<boolean> {
  const { error } = await supabase.from("polls").insert({ ...poll, votes: {} });
  return !error;
}

export async function votePoll(pollId: string, userId: string, option: string): Promise<boolean> {
  const { data } = await supabase.from("polls").select("votes").eq("id", pollId).single();
  if (!data) return false;
  const votes = { ...(data.votes || {}), [userId]: option };
  const { error } = await supabase.from("polls").update({ votes }).eq("id", pollId);
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
