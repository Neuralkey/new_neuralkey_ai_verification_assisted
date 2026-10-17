import React, { useEffect, useState } from 'react';
import { History, ShieldCheck, Link2, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Search, ExternalLink } from 'lucide-react';
import { AuditRecord } from '../types';

interface AuditLedgerModalProps {
  onClose?: () => void;
}

export const AuditLedgerModal: React.FC<AuditLedgerModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [filterText, setFilterText] = useState<string>('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/audit-log');
      const data = await res.json();
      if (data.success && data.log) {
        setLogs(data.log);
      }
    } catch (e) {
      console.error('Failed to fetch audit log', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(
    (l) =>
      l.applicantName.toLowerCase().includes(filterText.toLowerCase()) ||
      l.applicantDid.toLowerCase().includes(filterText.toLowerCase()) ||
      l.action.toLowerCase().includes(filterText.toLowerCase()) ||
      l.notes.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <span>Review History</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
            Record of completed identity verification reviews and decisions.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-medium"
          title="Refresh history"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter and Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs min-w-0">
        <div className="relative flex-1 min-w-[200px] w-full sm:max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search by applicant name, status, or notes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-slate-400 text-xs">
          <span>Total Reviews: <strong className="text-white">{logs.length}</strong></span>
        </div>
      </div>

      {/* Review Entries */}
      <div className="space-y-2.5 min-w-0">
        {filteredLogs.map((entry) => {
          const isApprove = entry.action === 'APPROVED';
          const isReject = entry.action === 'REJECTED';

          return (
            <div
              key={entry.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm text-xs relative overflow-hidden min-w-0 space-y-2.5"
            >
              {/* Top Row: Applicant Name, Decision Status, and Time */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/80 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-slate-100 text-sm truncate">
                    {entry.applicantName.split('(')[0].trim()}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span
                    className={`font-semibold px-2.5 py-0.5 rounded-md text-xs ${
                      isApprove
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : isReject
                        ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {isApprove ? 'Approved' : isReject ? 'Rejected' : 'Escalated'}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Notes and Risk Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-center min-w-0">
                <div className="md:col-span-3 space-y-1 min-w-0">
                  <span className="text-[11px] text-slate-400 block font-medium">Review Notes</span>
                  <p className="text-slate-200 text-xs leading-relaxed bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 break-words">
                    {entry.notes}
                  </p>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 flex md:flex-col justify-between gap-1 text-xs min-w-0">
                  <span className="text-slate-400 text-[11px]">Risk Score</span>
                  <span
                    className={`font-bold font-mono text-sm ${
                      entry.riskScore <= 30
                        ? 'text-emerald-400'
                        : entry.riskScore <= 70
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {entry.riskScore} / 100
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
