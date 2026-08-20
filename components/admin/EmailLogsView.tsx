import React, { useState, useMemo } from 'react';
import { useApp } from '../../hooks/useApp';
import { EmailLogEntry } from '../../types';
import { sendEmail } from '../../lib/email';
import { 
  IconMail, 
  IconCheckCircle, 
  IconAlertCircle, 
  IconRefreshCw, 
  IconSearch, 
  IconSend, 
  IconExternalLink,
  IconShield,
  IconClock
} from '../Icon';

export const EmailLogsView: React.FC = () => {
  const { emailLogs, refreshEmailLogs, retryEmailLog, user } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'sent' | 'failed' | 'simulated'>('all');
  const [retryingId, setRetryingId] = useState<number | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);
  
  // Test email modal/drawer state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testEmail, setTestEmail] = useState('sheriffdeenalade@gmail.com');
  const [testSubject, setTestSubject] = useState('Test Email - Al-Ibaanah Student Residency');
  const [testBody, setTestBody] = useState('This is a live test email dispatched via the Supabase Edge Function & Resend API integration.');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testFeedback, setTestFeedback] = useState<{ success?: boolean; message?: string } | null>(null);

  const filteredLogs = useMemo(() => {
    return (emailLogs || []).filter(log => {
      const matchesSearch = 
        log.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.template_name && log.template_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.error_message && log.error_message.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [emailLogs, searchTerm, statusFilter]);

  const stats = useMemo(() => {
    const total = (emailLogs || []).length;
    const sent = (emailLogs || []).filter(l => l.status === 'sent').length;
    const failed = (emailLogs || []).filter(l => l.status === 'failed').length;
    const simulated = (emailLogs || []).filter(l => l.status === 'simulated').length;
    return { total, sent, failed, simulated };
  }, [emailLogs]);

  const handleRetry = async (log: EmailLogEntry) => {
    setRetryingId(log.id);
    try {
      const res = await retryEmailLog(log.id);
      if (res.success) {
        alert(`Email successfully re-dispatched to ${log.recipient}!`);
      } else {
        alert(`Re-dispatch failed: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error during re-dispatch: ${err.message}`);
    } finally {
      setRetryingId(null);
    }
  };

  const handleSendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setIsSendingTest(true);
    setTestFeedback(null);
    try {
      const res = await sendEmail({
        to: testEmail.trim(),
        subject: testSubject.trim(),
        body: testBody.trim(),
        templateName: 'live_test_dispatch',
        metadata: { dispatched_by: user?.email || 'admin', type: 'manual_diagnostic' }
      });

      if (res.success) {
        setTestFeedback({
          success: true,
          message: `Live test email successfully transmitted! Resend ID: ${res.id || 'Confirmed'}. Check recipient inbox.`
        });
      } else {
        setTestFeedback({
          success: false,
          message: res.error || (res.simulated ? 'Service running in simulated mode' : 'Failed to send test email')
        });
      }
      refreshEmailLogs();
    } catch (err: any) {
      setTestFeedback({
        success: false,
        message: err.message || 'Exception during test email dispatch'
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
              <IconMail className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Email Delivery Audit Logs</h2>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time audit log of all system and staff-dispatched emails, retry tracking, and delivery reliability status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshEmailLogs()}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            title="Refresh Logs"
          >
            <IconRefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={() => setShowTestModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition shadow-sm"
          >
            <IconSend className="w-4 h-4" />
            <span>Send Test Email</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Dispatches</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Delivered / Sent</p>
            <IconCheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">{stats.sent}</p>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-200 dark:border-rose-800/40 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-rose-700 dark:text-rose-400 uppercase tracking-wider">Failed Dispatches</p>
            <IconAlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <p className="text-2xl font-bold text-rose-900 dark:text-rose-200 mt-1">{stats.failed}</p>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200 dark:border-amber-800/40 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-wider">Simulated / Key Missing</p>
            <IconClock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1">{stats.simulated}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="relative flex-1">
          <IconSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by recipient email, subject, or error reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'sent', 'failed', 'simulated'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {status === 'all' ? 'All Logs' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="text-center py-12 px-4">
            <IconMail className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-base font-semibold text-gray-800 dark:text-gray-200">No Email Logs Found</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {searchTerm || statusFilter !== 'all' 
                ? "No email logs match your active filters. Try adjusting your search query." 
                : "No email transmissions have been executed yet. Send a test email to verify your backend setup."}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={() => setShowTestModal(true)}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700"
              >
                <IconSend className="w-4 h-4" />
                <span>Send First Test Email</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Recipient</th>
                  <th className="py-3.5 px-4">Subject & Template</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Attempts</th>
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                {filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const isRetrying = retryingId === log.id;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-gray-50/75 dark:hover:bg-gray-750 transition">
                        <td className="py-3.5 px-4 font-medium text-gray-900 dark:text-white">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-brand-100 dark:bg-brand-900/50 text-brand-700 dark:text-brand-300 flex items-center justify-center font-bold text-xs shrink-0">
                              {log.recipient.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[200px]" title={log.recipient}>{log.recipient}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200 line-clamp-1" title={log.subject}>
                              {log.subject}
                            </p>
                            {log.template_name && (
                              <span className="inline-block mt-0.5 text-[11px] font-mono px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                                {log.template_name}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {log.status === 'sent' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                              <IconCheckCircle className="w-3.5 h-3.5" />
                              Delivered
                            </span>
                          )}
                          {log.status === 'failed' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300">
                              <IconAlertCircle className="w-3.5 h-3.5" />
                              Failed
                            </span>
                          )}
                          {log.status === 'simulated' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                              <IconClock className="w-3.5 h-3.5" />
                              Simulated / Unconfigured
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-gray-600 dark:text-gray-300">
                          <span className="inline-flex items-center gap-1 text-xs font-mono bg-gray-100 dark:bg-gray-700/60 px-2 py-0.5 rounded">
                            {log.delivery_attempts || 1} {log.delivery_attempts === 1 ? 'attempt' : 'attempts'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(log.created_at).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {log.error_message && (
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="text-xs text-brand-600 dark:text-brand-400 hover:underline font-medium"
                              >
                                {isExpanded ? 'Hide Error' : 'View Error'}
                              </button>
                            )}

                            {(log.status === 'failed' || log.status === 'simulated') && (
                              <button
                                onClick={() => handleRetry(log)}
                                disabled={isRetrying}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 rounded-lg transition disabled:opacity-50"
                                title="Retry sending this email"
                              >
                                <IconRefreshCw className={`w-3 h-3 ${isRetrying ? 'animate-spin' : ''}`} />
                                <span>{isRetrying ? 'Sending...' : 'Retry'}</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && log.error_message && (
                        <tr className="bg-rose-50/50 dark:bg-rose-950/10 border-b border-rose-100 dark:border-rose-900/30">
                          <td colSpan={6} className="py-3 px-6 text-xs font-mono text-rose-800 dark:text-rose-300">
                            <div className="flex items-start gap-2">
                              <IconAlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="font-bold">Error Diagnostics:</p>
                                <p className="bg-white dark:bg-gray-900 p-2.5 rounded border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 whitespace-pre-wrap break-all">
                                  {log.error_message}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Send Test Email Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
                  <IconSend className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Send Live Diagnostic Email</h3>
              </div>
              <button
                onClick={() => { setShowTestModal(false); setTestFeedback(null); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendTestEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  required
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="e.g. sheriffdeenalade@gmail.com"
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-750 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={testSubject}
                  onChange={(e) => setTestSubject(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-750 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Message Body
                </label>
                <textarea
                  rows={4}
                  required
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-750 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                />
              </div>

              {testFeedback && (
                <div className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${
                  testFeedback.success 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {testFeedback.success ? (
                    <IconCheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <IconAlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  )}
                  <span>{testFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => { setShowTestModal(false); setTestFeedback(null); }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isSendingTest}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition disabled:opacity-50 shadow-sm"
                >
                  <IconSend className={`w-4 h-4 ${isSendingTest ? 'animate-spin' : ''}`} />
                  <span>{isSendingTest ? 'Sending via Resend...' : 'Send Live Test'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
