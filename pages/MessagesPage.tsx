import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../hooks/useApp';
import { IconMessage, IconBuilding, IconCheckCircle, IconSend, IconRefreshCw } from '../components/Icon';
import { MessageItem, ConversationItem } from '../types';
import { supabase } from '../lib/supabaseClient';

const CHANNEL_CONFIG = {
  support: {
    title: 'General Residency Desk',
    subtitle: 'Arrivals, extensions & key management',
    icon: '🏢',
    description: 'Residency coordinator desk for general inquiries, room assignments, and key collection.'
  },
  maintenance: {
    title: 'Maintenance Requests',
    subtitle: 'AC, plumbing & appliances',
    icon: '🛠️',
    description: 'Technical and facility maintenance team for rapid response to room repairs.'
  },
  billing: {
    title: 'Payment & Accounts',
    subtitle: 'Transfers, invoices & receipts',
    icon: '💳',
    description: 'Accounts office for rent payments, deposit returns, and ledger questions.'
  }
} as const;

type ChannelType = keyof typeof CHANNEL_CONFIG;

const MessagesPage: React.FC = () => {
  const { 
    user, 
    landlordDetails, 
    conversations, 
    fetchConversationMessages, 
    sendMessage, 
    markConversationAsRead,
    refreshConversations 
  } = useApp();

  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('support');
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Find the conversation for the current student and selected channel
  const activeConversation = useMemo(() => {
    if (!user?.id || !conversations) return null;
    return conversations.find(
      c => (c.student_id === user.id || (c.student && c.student.email === user.email) || c.student_email === user.email) && 
           (c.channel === selectedChannel || (!c.channel && selectedChannel === 'support'))
    ) || conversations.find(
      c => c.student_id === user.id || (c.student && c.student.email === user.email) || c.student_email === user.email
    ) || null;
  }, [user, conversations, selectedChannel]);

  // Fetch messages when active conversation or channel changes
  const loadMessages = async (convId: string) => {
    setLoadingMessages(true);
    try {
      const msgs = await fetchConversationMessages(convId);
      setMessages(msgs);
      // Mark messages as read
      await markConversationAsRead(convId);
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (activeConversation?.id) {
      loadMessages(activeConversation.id);
    } else {
      setMessages([]);
    }
  }, [activeConversation?.id, selectedChannel]);

  // Real-time subscription to active conversation messages
  useEffect(() => {
    if (!activeConversation?.id) return;

    const channel = supabase
      .channel(`student_chat_${activeConversation.id}`)
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
          if (newMsg.sender_role !== 'student') {
            markConversationAsRead(activeConversation.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConversation?.id]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || isSending) return;

    const trimmedText = messageText.trim();
    setIsSending(true);

    try {
      const res = await sendMessage({
        conversationId: activeConversation?.id,
        channel: selectedChannel,
        message: trimmedText,
        subject: CHANNEL_CONFIG[selectedChannel].title
      });

      if (res && res.success && res.message) {
        const created = res.message;
        setMessages(prev => {
          if (prev.some(m => m.id === created.id)) return prev;
          return [...prev, created];
        });
        setMessageText('');
        setFeedback('Message sent to the residency management team.');
        setTimeout(() => setFeedback(null), 5000);
      } else if (res && !res.success) {
        setFeedback(res.error || 'Failed to deliver message.');
        setTimeout(() => setFeedback(null), 5000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setFeedback('Failed to deliver message. Please try again.');
      setTimeout(() => setFeedback(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const whatsappPhone = (landlordDetails?.phone || '201030062440').replace(/[^0-9]/g, '');

  return (
    <div className="animate-fade-in space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest mb-1">
            <IconMessage className="w-4 h-4" /> Residency Support & Communications
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Messages & In-App Helpdesk</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Official two-way communication channel with Al-Ibaanah Housing administration and maintenance staff.
          </p>
        </div>
        <button
          onClick={() => {
            refreshConversations();
            if (activeConversation?.id) loadMessages(activeConversation.id);
          }}
          className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
          title="Refresh Messages"
        >
          <IconRefreshCw className="w-4 h-4" />
          <span>Sync</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Channels & Direct Hotlines */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400">Communication Desks</h2>
            
            {(Object.keys(CHANNEL_CONFIG) as ChannelType[]).map(key => {
              const ch = CHANNEL_CONFIG[key];
              const isSelected = selectedChannel === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedChannel(key)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl text-left rtl:text-right transition-all ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold shadow-2xs'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl flex-shrink-0">{ch.icon}</span>
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate">{ch.title}</div>
                      <div className="text-[10px] text-gray-400 truncate">{ch.subtitle}</div>
                    </div>
                  </div>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-brand-600 dark:bg-brand-400 flex-shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {/* Instant WhatsApp Quick Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs">
              <span className="text-base">💬</span> Instant WhatsApp Support
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Need instant assistance on arrival day in Cairo or have an urgent query? Reach our residency coordinator directly on WhatsApp.
            </p>
            <a
              href={`https://wa.me/${whatsappPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full py-2.5 bg-white text-emerald-800 rounded-xl text-xs font-black shadow hover:bg-emerald-50 transition-colors"
            >
              Open WhatsApp Chat
            </a>
          </div>
        </div>

        {/* Right Column: Message Feed & Sender */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-[540px]">
            {/* Thread Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/40 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{CHANNEL_CONFIG[selectedChannel].icon}</span>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">
                    {CHANNEL_CONFIG[selectedChannel].title}
                  </h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {CHANNEL_CONFIG[selectedChannel].description}
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Desk</span>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-gray-50/20 dark:bg-gray-900/10">
              {/* Default Welcome Greetings Banner */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-blue-800 dark:text-blue-200 text-xs">
                <span className="text-lg">ℹ️</span>
                <div className="leading-relaxed">
                  <strong>Assalamu alaikum!</strong> This thread connects directly to the Al-Ibaanah Housing administration team. Messages sent here are stored securely and received by residency supervisors in real-time.
                </div>
              </div>

              {loadingMessages ? (
                <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading message history...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-12 text-center text-xs text-gray-400 space-y-2">
                  <p className="text-2xl">💬</p>
                  <p className="font-bold text-gray-600 dark:text-gray-300">No messages in this channel yet.</p>
                  <p className="text-[11px]">Type below to send an inquiry directly to the Al-Ibaanah administration team.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isStudent = msg.sender_role === 'student' || msg.sender_id === user?.id;
                  const formattedTime = new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const formattedDate = new Date(msg.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isStudent ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                          {isStudent ? (user?.full_name || 'You') : (msg.sender_profile?.full_name || msg.sender_name || 'Al-Ibaanah Admin Team')}
                        </span>
                        <span className="text-[9px] text-gray-400 font-mono">
                          {formattedDate} • {formattedTime}
                        </span>
                      </div>
                      
                      <div
                        className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed break-words shadow-2xs ${
                          isStudent
                            ? 'bg-brand-600 text-white rounded-tr-xs'
                            : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-150 dark:border-gray-600 rounded-tl-xs'
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

            {/* Feedback Alert if any */}
            {feedback && (
              <div className="px-4 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 border-t border-emerald-200/50">
                <IconCheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{feedback}</span>
              </div>
            )}

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2 bg-white dark:bg-gray-800 rounded-b-2xl">
              <input
                type="text"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder={`Write message to ${CHANNEL_CONFIG[selectedChannel].title}...`}
                disabled={isSending}
                className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700/60 rounded-xl text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
              />
              <button
                type="submit"
                disabled={!messageText.trim() || isSending}
                className="px-5 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 shrink-0"
              >
                {isSending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <IconSend className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
