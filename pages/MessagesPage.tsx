import React, { useState } from 'react';
import { useApp } from '../hooks/useApp';
import { IconMessage, IconBuilding, IconCheckCircle } from '../components/Icon';

const MessagesPage: React.FC = () => {
  const { user, landlordDetails } = useApp();
  const [selectedChannel, setSelectedChannel] = useState<'support' | 'maintenance' | 'billing'>('support');
  const [messageText, setMessageText] = useState('');
  const [sentMessages, setSentMessages] = useState<Array<{ id: number; channel: string; text: string; time: string }>>([
    {
      id: 1,
      channel: 'support',
      text: 'Assalamu alaikum, welcome to Al-Ibaanah Student Residences! Please feel free to reach out here or via WhatsApp with any inquiries about your stay.',
      time: 'Residency Office'
    }
  ]);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const newMsg = {
      id: Date.now(),
      channel: selectedChannel,
      text: messageText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setSentMessages(prev => [...prev, newMsg]);
    setMessageText('');
    setFeedback('Inquiry submitted to residency coordinators. We typically respond within a few hours during office hours.');
    setTimeout(() => setFeedback(null), 6000);
  };

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-xs font-black uppercase tracking-widest mb-1">
          <IconMessage className="w-4 h-4" /> Residency Communication
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">Messages & Support Desk</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Direct communication channels with the Al-Ibaanah Housing office, superintendent, and maintenance team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Channels & Direct Hotlines */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
            <h2 className="text-xs font-black uppercase tracking-wider text-gray-400">Communication Channels</h2>
            
            <button
              onClick={() => setSelectedChannel('support')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left rtl:text-right transition-all ${
                selectedChannel === 'support'
                  ? 'bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🏢</span>
                <div>
                  <div className="text-xs font-bold">General Residency Desk</div>
                  <div className="text-[10px] text-gray-400">Arrivals, extensions & keys</div>
                </div>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </button>

            <button
              onClick={() => setSelectedChannel('maintenance')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left rtl:text-right transition-all ${
                selectedChannel === 'maintenance'
                  ? 'bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">🛠️</span>
                <div>
                  <div className="text-xs font-bold">Maintenance Requests</div>
                  <div className="text-[10px] text-gray-400">AC, plumbing & appliances</div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setSelectedChannel('billing')}
              className={`w-full flex items-center justify-between p-3 rounded-xl text-left rtl:text-right transition-all ${
                selectedChannel === 'billing'
                  ? 'bg-brand-50 dark:bg-brand-900/30 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 font-bold'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">💳</span>
                <div>
                  <div className="text-xs font-bold">Payment & Accounts</div>
                  <div className="text-[10px] text-gray-400">Transfers, invoices & receipts</div>
                </div>
              </div>
            </button>
          </div>

          {/* Instant WhatsApp Quick Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-xs">
              <span className="text-base">💬</span> Instant WhatsApp Support
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed">
              Need immediate assistance on arrival day in Cairo? Reach our residency coordinator directly on WhatsApp.
            </p>
            <a
              href={`https://wa.me/${(landlordDetails?.phone || '201030062440').replace(/[^0-9]/g, '')}`}
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-[520px]">
            {/* Thread Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white capitalize">
                  {selectedChannel === 'support' ? 'General Residency Desk' : selectedChannel === 'maintenance' ? 'Maintenance Requests' : 'Payment & Accounts'}
                </h3>
              </div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Office Hours: 9 AM – 9 PM</span>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {sentMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.time === 'Residency Office' ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-md p-4 rounded-2xl text-xs leading-relaxed ${
                      msg.time === 'Residency Office'
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                        : 'bg-brand-600 text-white rounded-tr-sm shadow-sm'
                    }`}
                  >
                    <p>{msg.text}</p>
                  </div>
                  <span className="text-[10px] text-gray-400 mt-1 px-1">{msg.time}</span>
                </div>
              ))}

              {feedback && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 border border-emerald-200/50">
                  <IconCheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{feedback}</span>
                </div>
              )}
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                placeholder={`Write your message for ${selectedChannel}...`}
                className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="submit"
                disabled={!messageText.trim()}
                className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow transition-all"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
