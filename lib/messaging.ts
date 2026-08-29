import { supabase } from './supabaseClient';
import { ConversationItem, MessageItem, User } from '../types';

/**
 * Ensures a conversation exists for a student. If none exists, creates one.
 */
export async function getOrCreateStudentConversation(
  studentId: string,
  channel: string = 'support',
  subject: string = 'Residency Support'
): Promise<{ success: boolean; data?: ConversationItem; error?: string }> {
  try {
    // 1. Check existing conversation
    const { data: existing, error: findError } = await supabase
      .from('conversations')
      .select(`
        id,
        student_id,
        subject,
        channel,
        status,
        last_message_preview,
        last_message_at,
        created_at,
        updated_at,
        student:profiles!conversations_student_id_fkey(id, full_name, role, gender, phone_number, nationality)
      `)
      .eq('student_id', studentId)
      .maybeSingle();

    if (findError) {
      console.warn('[Messaging] Error finding existing conversation:', findError.message);
    }

    if (existing) {
      return { success: true, data: existing as unknown as ConversationItem };
    }

    // 2. Insert new conversation
    const { data: created, error: createError } = await supabase
      .from('conversations')
      .insert({
        student_id: studentId,
        subject,
        channel,
        status: 'active'
      })
      .select(`
        id,
        student_id,
        subject,
        channel,
        status,
        last_message_preview,
        last_message_at,
        created_at,
        updated_at,
        student:profiles!conversations_student_id_fkey(id, full_name, role, gender, phone_number, nationality)
      `)
      .single();

    if (createError) {
      // If concurrent insert occurred, attempt query again
      const { data: retry } = await supabase
        .from('conversations')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();

      if (retry) {
        return { success: true, data: retry as unknown as ConversationItem };
      }
      return { success: false, error: createError.message };
    }

    return { success: true, data: created as unknown as ConversationItem };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to initialize conversation.' };
  }
}

/**
 * Fetches conversations list based on user role (student vs admin).
 */
export async function fetchConversationsList(user: User): Promise<ConversationItem[]> {
  try {
    let query = supabase
      .from('conversations')
      .select(`
        id,
        student_id,
        subject,
        channel,
        status,
        last_message_preview,
        last_message_at,
        created_at,
        updated_at,
        student:profiles!conversations_student_id_fkey(id, full_name, role, gender, phone_number, nationality)
      `)
      .order('last_message_at', { ascending: false });

    // Students only fetch their own conversation
    if (user.role === 'student') {
      query = query.eq('student_id', user.id);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[Messaging] Error fetching conversations:', error.message);
      return [];
    }

    if (!data) return [];

    // Fetch unread counts for conversations in parallel
    const conversationIds = data.map(c => c.id);
    if (conversationIds.length === 0) return [];

    const { data: unreadData, error: unreadError } = await supabase
      .from('messages')
      .select('conversation_id, sender_id')
      .in('conversation_id', conversationIds)
      .eq('is_read', false)
      .neq('sender_id', user.id);

    const unreadMap = new Map<string, number>();
    if (!unreadError && unreadData) {
      unreadData.forEach(msg => {
        const count = unreadMap.get(msg.conversation_id) || 0;
        unreadMap.set(msg.conversation_id, count + 1);
      });
    }

    return data.map(conv => ({
      ...conv,
      unread_count: unreadMap.get(conv.id) || 0,
      student: conv.student as any
    })) as unknown as ConversationItem[];
  } catch (err) {
    console.error('[Messaging] Unexpected error fetching conversations:', err);
    return [];
  }
}

/**
 * Fetches all messages for a specific conversation ID.
 */
export async function fetchMessages(conversationId: string): Promise<MessageItem[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        sender_role,
        recipient_id,
        channel,
        message,
        is_read,
        read_at,
        created_at,
        sender_profile:profiles!messages_sender_id_fkey(full_name, role)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Messaging] Error fetching messages for conversation:', conversationId, error.message);
      return [];
    }

    return (data || []) as unknown as MessageItem[];
  } catch (err) {
    console.error('[Messaging] Unexpected error in fetchMessages:', err);
    return [];
  }
}

/**
 * Sends a message in a conversation.
 */
export async function postMessage({
  conversationId,
  studentId,
  senderId,
  senderRole,
  message,
  channel = 'support',
  recipientId
}: {
  conversationId?: string;
  studentId?: string;
  senderId: string;
  senderRole: 'student' | 'staff' | 'proprietor' | 'admin';
  message: string;
  channel?: string;
  recipientId?: string;
}): Promise<{ success: boolean; data?: MessageItem; error?: string }> {
  const trimmed = message.trim();
  if (!trimmed) {
    return { success: false, error: 'Message cannot be empty.' };
  }

  try {
    let resolvedConversationId = conversationId;

    // If conversationId not provided, resolve or create it using studentId
    if (!resolvedConversationId) {
      const targetStudentId = studentId || senderId;
      const convRes = await getOrCreateStudentConversation(targetStudentId, channel);
      if (!convRes.success || !convRes.data) {
        return { success: false, error: convRes.error || 'Could not resolve conversation.' };
      }
      resolvedConversationId = convRes.data.id;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: resolvedConversationId,
        sender_id: senderId,
        sender_role: senderRole,
        recipient_id: recipientId || null,
        channel,
        message: trimmed,
        is_read: false
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        sender_role,
        recipient_id,
        channel,
        message,
        is_read,
        read_at,
        created_at,
        sender_profile:profiles!messages_sender_id_fkey(full_name, role)
      `)
      .single();

    if (error) {
      console.error('[Messaging] Error posting message:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true, data: data as unknown as MessageItem };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to send message.' };
  }
}

/**
 * Marks messages in a conversation as read for the current user.
 */
export async function markConversationAsRead(
  conversationId: string,
  currentUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false);

    if (error) {
      console.warn('[Messaging] Error marking messages as read:', error.message);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}
