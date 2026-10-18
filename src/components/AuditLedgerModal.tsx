import React, { useEffect, useState } from 'react';
import {
  History,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Search,
  Clock,
  UserCheck,
} from 'lucide-react';
import { AuditRecord } from '../types';

interface AuditLedgerModalProps {
  onClose?: () => void;
  externalLogs?: AuditRecord[];
  onRefresh?: () => void;
}

const DEFAULT_AUDIT_LOGS: AuditRecord[] = [
  {
    id: 'aud-init-001',
    timestamp: '2026-10-18T04:12:19.000Z',
    applicantDid: 'did:neuralkey:z6MkkhmCHANDARAz8P9yKhmerNatID010892746zk7Q',
    applicantName: 'Sok Chandara (សុខ ចាន់ដារ៉ា)',
    reviewerId: 'rev-ad-042',
    action: 'APPROVED',
    riskScore: 4,
    riskLevel: 'LOW',
    notes: 'Authentic Khmer National ID photo matches live camera frame. Upgraded to Trust Level 2.',
    flagsCount: 0,
    geminiModel: 'gemini-3.8-flash',
    prevHash: '0000000000000000000000000000000000000000000000000000000000000000',
    recordHash: '9e2f8a1c4d7b3e6a0f5c8d2e1b4a7c9f3e6d0a2b5c8e1f4a7d0b3c6e9f2a5d8b',
  },
  {
    id: 'aud-init-002',
    timestamp: '2026-10-18T04:08:45.000Z',
    applicantDid: 'did:neuralkey:z6MksgpAMIRAchenPassE91028471tamperFace99x',
    applicantName: 'Amira Chen',
    reviewerId: 'rev-ad-042',
    action: 'REJECTED',
    riskScore: 96,
    riskLevel: 'CRITICAL',
    notes: 'Rejected due to digital portrait splice seam and biometric face mismatch.',
    flagsCount: 2,
    geminiModel: 'gemini-3.8-flash',
    prevHash: '9e2f8a1c4d7b3e6a0f5c8d2e1b4a7c9f3e6d0a2b5c8e1f4a7d0b3c6e9f2a5d8b',
    recordHash: '4b7e1c9a2f5d8e0b3a6c9f2d5e8a1b4c7f0d3e6a9b2c5f8e1a4d7b0c3f6e9a2c',
  },
];

export const AuditLedgerModal: React.FC<AuditLedgerModalProps> = ({
  externalLogs,
  onRefresh,
}) => {
  const [internalLogs, setInternalLogs] = useState<AuditRecord[]>(() => {
    try {
      const saved = localStorage.getItem('neuralkey_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_AUDIT_LOGS;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filterText, setFilterText] = useState<string>('');
  const [actionFilter, setActionFilter] = useState<'ALL' | 'APPROVED' | 'ESCALATED' | 'REJECTED'>('ALL');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/audit-log');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.log) && data.log.length > 0) {
          setInternalLogs(data.log);
          try {
            localStorage.setItem('neuralkey_audit_logs', JSON.stringify(data.log));
          } catch {}
        }
      }
    } catch {
      // Fallback to local / external logs silently when offline or restarting
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (externalLogs && externalLogs.length > 0) {
      setInternalLogs(externalLogs);
    } else {
      fetchLogs();
    }
  }, [externalLogs]);

  const logs = externalLogs && externalLogs.length > 0 ? externalLogs : internalLogs;

  const filteredLogs = logs.filter((l) => {
    if (actionFilter !== 'ALL' && l.action !== actionFilter) return false;
    if (!filterText.trim()) return true;
    const q = filterText.toLowerCase();
    return (
      l.applicantName.toLowerCase().includes(q) ||
      l.action.toLowerCase().includes(q) ||
      l.notes.toLowerCase().includes(q) ||
      l.reviewerId.toLowerCase().includes(q)
    );
  });

  const handleRefreshClick = () => {
    fetchLogs();
    if (onRefresh) onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <span>Audit Log</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Every Approve, Escalate, and Reject decision in the Reviewer Console is recorded here.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefreshClick}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer transition-colors flex items-center gap-1.5 text-xs font-semibold"
          title="Refresh audit log"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search & Action Filter Bar */}
      <div className="bg-slate-900/70 p-3 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 text-xs">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Search by applicant name, action, or notes..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          {(['ALL', 'APPROVED', 'ESCALATED', 'REJECTED'] as const).map((act) => (
            <button
              key={act}
              type="button"
              onClick={() => setActionFilter(act)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                actionFilter === act
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {act === 'ALL'
                ? `All (${logs.length})`
                : act === 'APPROVED'
                ? 'Approved'
                : act === 'ESCALATED'
                ? 'Escalated'
                : 'Rejected'}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Entries */}
      <div className="space-y-2.5">
        {filteredLogs.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
            No matching audit log records found.
          </div>
        ) : (
          filteredLogs.map((entry) => {
            const isApprove = entry.action === 'APPROVED';
            const isReject = entry.action === 'REJECTED';

            return (
              <div
                key={entry.id}
                className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 text-xs space-y-2.5 transition-colors hover:border-slate-700"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800/70">
                  <div className="flex items-center gap-2 min-w-0">
                    {isApprove ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : isReject ? (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="font-bold text-white text-sm truncate">
                      {entry.applicantName.split('(')[0].trim()}
                    </span>
                    <span
                      className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                        isApprove
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : isReject
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isApprove ? 'Approved' : isReject ? 'Rejected' : 'Escalated'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px] shrink-0">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-slate-500" />
                      <span>Reviewer {entry.reviewerId}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>
                        {new Date(entry.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <p className="text-slate-200 text-xs leading-relaxed flex-1">
                    {entry.notes}
                  </p>
                  <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/80">
                    <span>Risk Score:</span>
                    <span
                      className={`font-bold font-mono ${
                        entry.riskScore <= 30
                          ? 'text-emerald-400'
                          : entry.riskScore <= 70
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {entry.riskScore}/100
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

