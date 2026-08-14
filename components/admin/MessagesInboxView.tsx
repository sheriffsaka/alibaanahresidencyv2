import React, { useState } from 'react';
import { Booking } from '../../types';

interface Message {
  id: number;
  sender: 'student' | 'admin';
  sender_name: string;
  text: string;
  timestamp: string;
}

interface Thread {
  student_id: number;
  student_name: string;
  email: string;
  room_info: string;
  unread_count: number;
  last_message: string;
  last_timestamp: string;
  messages: Message[];
}

const INITIAL_THREADS: Thread[] = [
  {
    student_id: 101,
    student_name: 'Zayd Al-Otaibi',
    email: 'zayd.otaibi@example.com',
    room_info: 'Room 101 (Premium 1)',
    unread_count: 1,
    last_message: 'As-salamu alaykum. Could you confirm the check-in time for tomorrow?',
    last_timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
    messages: [
      {
        id: 1,
        sender: 'student',
        sender_name: 'Zayd Al-Otaibi',
        text: 'As-salamu alaykum. I have uploaded my payment proof and signed agreement.',
        timestamp: new Date(Date.now() - 24 * 3600000).toISOString()
      },
      {
        id: 2,
        sender: 'admin',
        sender_name: 'Admin Team',
        text: 'Wa alaykumu s-salam. Payment received and verified! Welcome to Al-Ibaanah Residency.',
        timestamp: new Date(Date.now() - 20 * 3600000).toISOString()
      },
      {
        id: 3,
        sender: 'student',
        sender_name: 'Zayd Al-Otaibi',
        text: 'As-salamu alaykum. Could you confirm the check-in time for tomorrow?',
        timestamp: new Date(Date.now() - 30 * 60000).toISOString()
      }
    ]
  },
  {
    student_id: 104,
    student_name: 'Bilal Khan',
    email: 'bilal.khan@example.com',
    room_info: 'Room 102 (Standard Shared)',
    unread_count: 0,
    last_message: 'Thank you for updating my emergency contact details.',
    last_timestamp: new Date(Date.now() - 2 * 86400000).toISOString(),
    messages: [
      {
        id: 1,
        sender: 'student',
        sender_name: 'Bilal Khan',
        text: 'Thank you for updating my emergency contact details.',
        timestamp: new Date(Date.now() - 2 * 86400000).toISOString()
      }
    ]
  }
];

interface MessagesInboxViewProps {
  bookings?: Booking[];
}

export const MessagesInboxView: React.FC<MessagesInboxViewProps> = () => {
  const [threads, setThreads] = useState<Thread[]>(INITIAL_THREADS);
  const [selectedStudentId, setSelectedStudentId] = useState<number>(INITIAL_THREADS[0].student_id);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const activeThread = threads.find(t => t.student_id === selectedStudentId) || threads[0];

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !activeThread) return;

    const newMessage: Message = {
      id: Date.now(),
      sender: 'admin',
      sender_name: 'Administrator',
      text: replyText.trim(),
      timestamp: new Date().toISOString()
    };

    setThreads(prev =>
      prev.map(t =>
        t.student_id === activeThread.student_id
          ? {
              ...t,
              unread_count: 0,
              last_message: newMessage.text,
              last_timestamp: newMessage.timestamp,
              messages: [...t.messages, newMessage]
            }
          : t
      )
    );

    setReplyText('');
  };

  const filteredThreads = threads.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.student_name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q) || t.room_info.toLowerCase().includes(q);
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden h-[680px] flex flex-col md:flex-row animate-fade-in">
      {/* Threads Sidebar */}
      <div className="w-full md:w-80 border-r border-gray-100 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            💬 Student Messages
          </h2>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full mt-3 px-3 py-2 text-xs border rounded-xl dark:bg-gray-700 dark:border-gray-600"
          />
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
          {filteredThreads.map(thread => {
            const isSelected = thread.student_id === activeThread?.student_id;
            return (
              <button
                key={thread.student_id}
                onClick={() => {
                  setSelectedStudentId(thread.student_id);
                  setThreads(prev =>
                    prev.map(t => (t.student_id === thread.student_id ? { ...t, unread_count: 0 } : t))
                  );
                }}
                className={`w-full text-left p-4 transition-colors flex gap-3 items-start ${
                  isSelected
                    ? 'bg-brand-50/70 dark:bg-brand-950/40 border-l-4 border-brand-600'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                }`}
              >
                <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-600 dark:text-brand-300 font-black text-xs flex items-center justify-center flex-shrink-0">
                  {thread.student_name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-baseline">
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{thread.student_name}</p>
                    <span className="text-[9px] text-gray-400 font-mono">
                      {new Date(thread.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[10px] text-brand-600 font-mono mt-0.5 truncate">{thread.room_info}</p>
                  <p className="text-xs text-gray-500 truncate mt-1">{thread.last_message}</p>
                </div>
                {thread.unread_count > 0 && (
                  <span className="w-2 h-2 rounded-full bg-brand-600 flex-shrink-0 mt-2" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Conversation Pane */}
      {activeThread ? (
        <div className="flex-1 flex flex-col bg-gray-50/30 dark:bg-gray-900/20">
          {/* Header */}
          <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{activeThread.student_name}</h3>
              <p className="text-xs text-gray-500 font-mono">{activeThread.email} • {activeThread.room_info}</p>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              Active Student
            </span>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeThread.messages.map(msg => {
              const isAdmin = msg.sender === 'admin';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-md px-4 py-3 rounded-2xl text-xs leading-relaxed ${
                      isAdmin
                        ? 'bg-brand-600 text-white rounded-br-none shadow-sm'
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-gray-700 rounded-bl-none shadow-xs'
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1 font-mono px-1">
                    {msg.sender_name} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Reply Box */}
          <form onSubmit={handleSendReply} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${activeThread.student_name}...`}
              className="flex-1 text-xs p-3 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
            />
            <button
              type="submit"
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-5 py-3 rounded-xl transition-all shadow-sm"
            >
              Send Reply
            </button>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400">
          Select a student conversation to start messaging
        </div>
      )}
    </div>
  );
};

export default MessagesInboxView;
