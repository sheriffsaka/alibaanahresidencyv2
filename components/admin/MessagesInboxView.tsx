import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../../hooks/useApp';
import { ConversationItem, MessageItem, Booking } from '../../types';
import { supabase } from '../../lib/supabaseClient';
import { 
  IconMessage, 
  IconSearch, 
  IconSend, 
  IconPlus, 
  IconCheckCircle, 
  IconRefreshCw,
  IconUser,
  IconBuilding
} from '../Icon';

interface MessagesInboxViewProps {
  bookings?: Booking[];
}

export const MessagesInboxView: React.FC<MessagesInboxViewProps> = ({ bookings = [] }) => {
  const { 
    user: adminUser, 
    conversations = [], 
    students = [], 
    rooms = [],
    fetchConversationMessages, 
    sendMessage, 
    markConversationAsRead,
    refreshConversations 
  } = useApp();

  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'support' | 'maintenance' | 'billing'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  
  // Compose new message modal state
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [composeStudentId, setComposeStudentId] = useState('');
  const [composeChannel, setComposeChannel] = useState<'support' | 'maintenance' | 'billing'>('support');
  const [composeText, setComposeText] = useState('');
  const [isComposing, setIsComposing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set initial selected conversation when list loads
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  // Find active conversation object
  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === selectedConversationId) || conversations[0] || null;
  }, [conversations, selectedConversationId]);

  // Find student booking info for active conversation
  const studentBooking = useMemo(() => {
    if (!activeConversation) return null;
    const sEmail = activeConversation.student_email || activeConversation.student?.email;
    return bookings.find(
      b => b.student_id === activeConversation.student_id || 
           (sEmail && b.email.toLowerCase() === sEmail.toLowerCase())
    );
  }, [activeConversation, bookings]);

  // Find student room label
  const studentRoomInfo = useMemo(() => {
    if (!studentBooking) return 'No Active Room';
    const room = rooms.find(r => r.id === studentBooking.room_id);
    const cat = room?.apartment_name || room?.category || studentBooking.rooms?.apartment_name || studentBooking.rooms?.category || 'Residency';
    const roomNum = room?.room_number || studentBooking.rooms?.room_number || '';
    return roomNum ? `${cat} • Room ${roomNum}` : cat;
  }, [studentBooking, rooms]);

  // Load messages for the selected conversation
  const loadMessages = async (convId: string) => {
    setLoadingMessages(true);
    try {
      const msgs = await fetchConversationMessages(convId);
      setMessages(msgs);
      // Mark as read in DB & update local context count
      await markConversationAsRead(convId);
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConversation?.id) {
      loadMessages(activeConversation.id);
    }
  }, [activeConversation?.id]);

  // Real-time subscription to messages for the active conversation
  useEffect(() => {
    if (!activeConversation?.id) return;

    const channel = supabase
      .channel(`admin_chat_${activeConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversation.id}`
        },
        (payload) => {
          const newMsg = payload.new as MessageItem;
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_role === 'student') {
            markConversationAsRead(activeConversation.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation?.id]);

  // Auto-scroll when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingMessages]);

  // Handle sending reply
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || isSending || !activeConversation) return;

    const trimmed = replyText.trim();
    setIsSending(true);

    try {
      const res = await sendMessage({
        conversationId: activeConversation.id,
        recipientId: activeConversation.student_id,
        channel: activeConversation.channel || 'support',
        message: trimmed,
        subject: activeConversation.subject || 'Residency Support'
      });

      if (res && res.success && res.message) {
        const created = res.message;
        setMessages(prev => {
          if (prev.some(m => m.id === created.id)) return prev;
          return [...prev, created];
        });
        setReplyText('');
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle composing new message to a student
  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!composeStudentId || !composeText.trim() || isComposing) return;

    setIsComposing(true);
    try {
      const res = await sendMessage({
        recipientId: composeStudentId,
        channel: composeChannel,
        message: composeText.trim(),
        subject: composeChannel === 'support' ? 'Residency Desk Inquiry' : composeChannel === 'maintenance' ? 'Maintenance Update' : 'Payment Notification'
      });

      if (res && res.success && res.conversation) {
        setIsComposeOpen(false);
        setComposeText('');
        setComposeStudentId('');
        await refreshConversations();
        setSelectedConversationId(res.conversation.id);
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
    } finally {
      setIsComposing(false);
    }
  };

  // Filtered conversation list
  const filteredConversations = useMemo(() => {
    return conversations.filter(c => {
      // Channel filter
      if (channelFilter !== 'all' && c.channel && c.channel !== channelFilter) {
        return false;
      }
      // Unread only
      const unreadCount = c.admin_unread_count ?? c.unread_count ?? 0;
      if (unreadOnly && unreadCount === 0) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const studentName = (c.student_name || c.student?.full_name || '').toLowerCase();
        const studentEmail = (c.student_email || c.student?.email || '').toLowerCase();
        const lastMsg = (c.last_message_preview || '').toLowerCase();
        const subj = (c.subject || '').toLowerCase();
        return studentName.includes(q) || studentEmail.includes(q) || lastMsg.includes(q) || subj.includes(q);
      }
      return true;
    });
  }, [conversations, channelFilter, unreadOnly, searchQuery]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden h-[720px] flex flex-col md:flex-row animate-fade-in">
      {/* Threads Sidebar */}
      <div className="w-full md:w-88 border-r border-gray-100 dark:border-gray-700 flex flex-col bg-gray-50/40 dark:bg-gray-900/30">
        {/* Header & Controls */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 space-y-3 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💬</span>
              <div>
                <h2 className="text-sm font-black text-gray-900 dark:text-white">Student In-App Messages</h2>
                <p className="text-[10px] text-gray-400 font-medium">Real-time residency communication</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => refreshConversations()}
                className="p-2 rounded-xl text-gray-500 hover:text-brand-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Sync conversations"
              >
                <IconRefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsComposeOpen(true)}
                className="bg-brand-600 hover:bg-brand-700 text-white p-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                title="Start new thread with a student"
              >
                <IconPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Compose</span>
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search student or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
            />
            <IconSearch className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between text-[11px] pt-1">
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              <button
                type="button"
                onClick={() => setChannelFilter('all')}
                className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                  channelFilter === 'all'
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('support')}
                className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                  channelFilter === 'support'
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Support
              </button>
              <button
                type="button"
                onClick={() => setChannelFilter('maintenance')}
                className={`px-2 py-1 rounded-lg font-bold transition-colors ${
                  channelFilter === 'maintenance'
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Maintenance
              </button>
            </div>

            <button
              type="button"
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-2 py-1 rounded-lg font-bold transition-colors whitespace-nowrap ${
                unreadOnly
                  ? 'bg-red-500 text-white'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-750'
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700/50">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 space-y-3">
              <p className="text-2xl">📭</p>
              <p className="font-bold text-gray-600 dark:text-gray-300">No conversations found</p>
              <p className="text-[11px]">No active threads match your search filter.</p>
              <button
                onClick={() => setIsComposeOpen(true)}
                className="text-brand-600 dark:text-brand-400 font-bold underline text-xs"
              >
                Start message to student
              </button>
            </div>
          ) : (
            filteredConversations.map(conv => {
              const isSelected = conv.id === activeConversation?.id;
              const unreadCount = conv.admin_unread_count ?? conv.unread_count ?? 0;
              const studentName = conv.student_name || conv.student?.full_name || conv.student_email || conv.student?.email || 'Student';
              const lastTimestamp = conv.last_message_at ? new Date(conv.last_message_at) : new Date(conv.created_at);

              return (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => {
                    setSelectedConversationId(conv.id);
                  }}
                  className={`w-full text-left p-4 transition-all flex gap-3 items-start border-l-4 ${
                    isSelected
                      ? 'bg-white dark:bg-gray-800 border-brand-600 shadow-2xs'
                      : unreadCount > 0
                      ? 'bg-brand-50/50 dark:bg-brand-950/20 border-red-500 hover:bg-gray-100/60 dark:hover:bg-gray-750'
                      : 'border-transparent hover:bg-gray-100/50 dark:hover:bg-gray-750'
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 font-black text-xs flex items-center justify-center flex-shrink-0">
                    {studentName.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline gap-1">
                      <p className={`text-xs truncate ${unreadCount > 0 ? 'font-black text-gray-950 dark:text-white' : 'font-bold text-gray-800 dark:text-gray-200'}`}>
                        {studentName}
                      </p>
                      <span className="text-[9px] text-gray-400 font-mono flex-shrink-0">
                        {lastTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold capitalize">
                        {conv.channel || 'support'}
                      </span>
                      {conv.subject && (
                        <span className="text-[10px] text-gray-400 truncate">
                          • {conv.subject}
                        </span>
                      )}
                    </div>

                    <p className={`text-xs truncate mt-1 ${unreadCount > 0 ? 'font-bold text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>
                      {conv.last_message_preview || 'No messages yet'}
                    </p>
                  </div>

                  {unreadCount > 0 && (
                    <span className="min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation Pane */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col bg-gray-50/20 dark:bg-gray-900/10 min-w-0">
          {/* Active Conversation Header */}
          <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-brand-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs">
                {(activeConversation.student_name || activeConversation.student?.full_name || activeConversation.student_email || activeConversation.student?.email || 'ST').slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-gray-900 dark:text-white truncate">
                    {activeConversation.student_name || activeConversation.student?.full_name || 'Student'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300 uppercase">
                    {activeConversation.channel || 'support'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                  {activeConversation.student_email || activeConversation.student?.email} • <span className="font-semibold text-brand-600 dark:text-brand-400">{studentRoomInfo}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {studentBooking?.phone_number && (
                <a
                  href={`https://wa.me/${studentBooking.phone_number.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-2xs"
                  title="Open direct WhatsApp message with student"
                >
                  <span>💬 WhatsApp</span>
                </a>
              )}
              <button
                onClick={() => loadMessages(activeConversation.id)}
                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 text-xs"
                title="Reload thread"
              >
                <IconRefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {loadingMessages ? (
              <div className="py-16 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Loading messages...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center text-xs text-gray-400 space-y-2">
                <p className="text-3xl">✉️</p>
                <p className="font-bold text-gray-600 dark:text-gray-300">No messages in this conversation yet</p>
                <p className="text-[11px]">Send a reply below to reach the student directly.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isAdmin = msg.sender_role !== 'student';
                const formattedTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const formattedDate = new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                  >
                    <div className="flex items-center gap-1.5 mb-1 px-1">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        {isAdmin ? (msg.sender_profile?.full_name || msg.sender_name || 'Admin Team') : (activeConversation.student_name || activeConversation.student?.full_name || 'Student')}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono">
                        {formattedDate} • {formattedTime}
                      </span>
                    </div>

                    <div
                      className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                        isAdmin
                          ? 'bg-brand-600 text-white rounded-tr-xs'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-150 dark:border-gray-700 rounded-tl-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Reply Box */}
          <form onSubmit={handleSendReply} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${activeConversation.student_name || activeConversation.student?.full_name || 'Student'}...`}
              disabled={isSending}
              className="flex-1 text-xs p-3.5 border rounded-xl dark:bg-gray-700 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
            />
            <button
              type="submit"
              disabled={!replyText.trim() || isSending}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-3.5 rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              {isSending ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <IconSend className="w-3.5 h-3.5" />
                  <span>Send Reply</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400 space-y-3 bg-gray-50/20 dark:bg-gray-900/10">
          <span className="text-4xl">💬</span>
          <p className="text-sm font-bold text-gray-600 dark:text-gray-300">Select a Student Conversation</p>
          <p className="text-xs max-w-sm">Choose a thread from the sidebar or click compose to start a new discussion.</p>
          <button
            onClick={() => setIsComposeOpen(true)}
            className="mt-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
          >
            <IconPlus className="w-3.5 h-3.5" /> Start New Conversation
          </button>
        </div>
      )}

      {/* Compose Message Modal */}
      {isComposeOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-700 space-y-4 animate-scale-up">
            <div className="flex justify-between items-center pb-2 border-b dark:border-gray-700">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <IconPlus className="w-4 h-4 text-brand-600" /> Start Message to Student
              </h3>
              <button 
                onClick={() => setIsComposeOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartConversation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Select Student *
                </label>
                <select
                  value={composeStudentId}
                  onChange={(e) => setComposeStudentId(e.target.value)}
                  required
                  className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                >
                  <option value="">-- Choose student recipient --</option>
                  {students.map(st => {
                    const stBooking = bookings.find(b => b.student_id === st.id);
                    return (
                      <option key={st.id} value={st.id}>
                        {st.full_name || st.email} {stBooking ? `(${stBooking.rooms?.apartment_name || stBooking.rooms?.category || 'Resident'})` : ''} - {st.email}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Desk / Topic Channel
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['support', 'maintenance', 'billing'] as const).map(ch => (
                    <button
                      key={ch}
                      type="button"
                      onClick={() => setComposeChannel(ch)}
                      className={`p-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                        composeChannel === ch
                          ? 'bg-brand-50 dark:bg-brand-900/40 border-brand-500 text-brand-700 dark:text-brand-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {ch}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Message Content *
                </label>
                <textarea
                  value={composeText}
                  onChange={(e) => setComposeText(e.target.value)}
                  rows={4}
                  required
                  placeholder="Type your message to the student..."
                  className="w-full text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600 font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!composeStudentId || !composeText.trim() || isComposing}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition-all flex items-center gap-1.5"
                >
                  {isComposing ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <IconSend className="w-3.5 h-3.5" />
                      <span>Send Initial Message</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesInboxView;
