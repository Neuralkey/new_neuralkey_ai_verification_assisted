import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  XCircle,
  Lock,
  ChevronRight,
  History,
  Clock,
} from 'lucide-react';
import { ForensicAnalysis, ApplicantProfile, AuditRecord } from '../types';

interface GeminiRiskPanelProps {
  analysis: ForensicAnalysis;
  applicant: ApplicantProfile;
  onApprove: (notes: string) => void;
  onReject: (notes: string) => void;
  onEscalate: (notes: string) => void;
  isProcessing: boolean;
  decisionMade: 'APPROVED' | 'REJECTED' | 'ESCALATED' | null;
  hoveredFlagIndex?: number | null;
  onHoverFlag?: (index: number | null) => void;
  onNavigateToWallet?: () => void;
  latestAuditRecord?: AuditRecord | null;
  onViewAuditLog?: () => void;
}

export const GeminiRiskPanel: React.FC<GeminiRiskPanelProps> = ({
  analysis,
  applicant,
  onApprove,
  onReject,
  onEscalate,
  isProcessing,
  decisionMade,
  hoveredFlagIndex,
  onHoverFlag,
  onNavigateToWallet,
  latestAuditRecord,
  onViewAuditLog,
}) => {
  const { riskAssessment, fraudSignals } = analysis;
  const [reviewerNotes, setReviewerNotes] = useState<string>('');

  useEffect(() => {
    setReviewerNotes('');
  }, [applicant.id]);

  const getRiskColor = (score: number) => {
    if (score <= 30) {
      return {
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        badge: 'bg-emerald-500/15 text-emerald-300',
      };
    }
    if (score <= 70) {
      return {
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        badge: 'bg-amber-500/15 text-amber-300',
      };
    }
    return {
      text: 'text-rose-400',
      border: 'border-rose-500/30',
      badge: 'bg-rose-500/15 text-rose-300',
    };
  };

  const riskStyle = getRiskColor(riskAssessment.overallRiskScore);

  const handleAction = (type: 'approve' | 'reject' | 'escalate') => {
    const cleanNotes = reviewerNotes.trim();
    if (type === 'approve') {
      onApprove(
        cleanNotes ||
          'Approved after reviewer verification. Identity upgraded from Level 1 to Level 2.'
      );
    } else if (type === 'reject') {
      onReject(
        cleanNotes ||
          'Rejected by reviewer due to document or biometric discrepancies.'
      );
    } else {
      onEscalate(
        cleanNotes ||
          'Escalated by reviewer for secondary verification.'
      );
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-slate-100">
      {/* 1. Risk Assessment */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col gap-1.5 pb-2.5 border-b border-slate-800/80 text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-white text-sm">Risk Summary</span>
            </div>
            <span
              className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${riskStyle.badge} ${riskStyle.border}`}
            >
              {riskAssessment.riskLevel} Risk
            </span>
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 w-fit max-w-full">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
            <span className="truncate">Risk Scoring &amp; Triage Engine</span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-3 items-stretch">
          {/* Score Box */}
          <div className="col-span-5 bg-slate-950 p-3 rounded-xl border border-slate-800/80 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] text-slate-400 font-medium mb-0.5">
              Risk Score
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-extrabold font-mono ${riskStyle.text}`}>
                {riskAssessment.overallRiskScore}
              </span>
              <span className="text-xs text-slate-500 font-mono">/100</span>
            </div>
            <span className="text-[9px] font-mono text-cyan-400/90 mt-1">
              Risk Scorer
            </span>
          </div>

          {/* Recommendation */}
          <div className="col-span-7 bg-slate-950 p-3 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] text-slate-400 font-medium">
                Recommendation
              </span>
              <span className="text-[9px] font-mono text-cyan-400/90">
                Triage Engine
              </span>
            </div>
            <span
              className={`inline-block font-semibold px-2 py-0.5 rounded-md text-xs ${
                riskAssessment.suggestedAction === 'APPROVE'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  : riskAssessment.suggestedAction === 'ESCALATE'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
              }`}
            >
              {riskAssessment.suggestedAction === 'APPROVE'
                ? 'Approve'
                : riskAssessment.suggestedAction === 'ESCALATE'
                ? 'Escalate'
                : 'Reject'}
            </span>
            <p className="text-[11.5px] text-slate-300 leading-snug line-clamp-2 pt-0.5">
              {riskAssessment.recommendationReason}
            </p>
          </div>
        </div>

        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/70 space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-mono text-cyan-300">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
            <span className="truncate">Executive Forensic Summary</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            {riskAssessment.executiveSummary}
          </p>
        </div>
      </div>

      {/* 2. Issues Found */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 flex-1 flex flex-col">
        <div className="flex flex-col gap-1.5 pb-2.5 mb-2.5 border-b border-slate-800/80 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-white text-sm">
                Issues Found ({fraudSignals.length})
              </span>
            </div>
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 w-fit max-w-full">
            <Sparkles className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
            <span className="truncate">Tamper &amp; Fraud Signal Detector</span>
          </div>
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[240px] pr-1">
          {fraudSignals.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/30 text-center space-y-1">
              <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
              <div className="text-xs font-bold text-emerald-300">No Issues Detected</div>
              <p className="text-xs text-slate-300">
                All ID details match and no signs of editing were found.
              </p>
              <div className="text-[9.5px] font-mono text-cyan-400/90 pt-0.5">
                Anomaly &amp; Tamper Scanner
              </div>
            </div>
          ) : (
            fraudSignals.map((signal, idx) => {
              const isHovered = hoveredFlagIndex === idx;
              const isCrit = signal.severity === 'CRITICAL';
              const isHigh = signal.severity === 'HIGH';

              return (
                <div
                  key={signal.code}
                  onMouseEnter={() => onHoverFlag && onHoverFlag(idx)}
                  onMouseLeave={() => onHoverFlag && onHoverFlag(null)}
                  className={`rounded-xl border p-3 transition-all text-xs cursor-pointer ${
                    isHovered
                      ? 'ring-1 ring-rose-400 bg-rose-950/50 border-rose-400'
                      : isCrit
                      ? 'bg-rose-950/30 border-rose-500/40 hover:bg-rose-950/40'
                      : isHigh
                      ? 'bg-amber-950/25 border-amber-500/40 hover:bg-amber-950/35'
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-white text-xs truncate">
                          {signal.title}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                            isCrit
                              ? 'bg-rose-500/25 text-rose-200'
                              : isHigh
                              ? 'bg-amber-500/25 text-amber-200'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isCrit ? 'High' : isHigh ? 'Warning' : 'Notice'}
                        </span>
                      </div>
                      <div className="text-[9.5px] font-mono text-cyan-300/90 flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                        <span className="truncate">Forensic Signal #{idx + 1}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {signal.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. Reviewer Final Decision + Audit Log Record */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-white text-sm">Reviewer Decision</span>
          </div>
          {onViewAuditLog && (
            <button
              type="button"
              onClick={onViewAuditLog}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
            >
              <History className="w-3 h-3" />
              <span>Audit Log</span>
            </button>
          )}
        </div>

        {decisionMade ? (
          <div className="space-y-2.5">
            <div
              className={`p-3.5 rounded-xl border text-center space-y-2 ${
                decisionMade === 'APPROVED'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : decisionMade === 'ESCALATED'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="text-sm font-bold flex items-center justify-center gap-1.5">
                {decisionMade === 'APPROVED' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                {decisionMade === 'ESCALATED' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                {decisionMade === 'REJECTED' && <XCircle className="w-4 h-4 text-rose-400" />}
                <span>
                  {decisionMade === 'APPROVED'
                    ? 'Approved'
                    : decisionMade === 'ESCALATED'
                    ? 'Escalated'
                    : 'Rejected'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {decisionMade === 'APPROVED'
                  ? 'Identity verified and upgraded from Level 1 to Level 2.'
                  : decisionMade === 'ESCALATED'
                  ? 'Flagged for secondary verification. Remains at Level 1.'
                  : 'Verification declined. Remains at Level 1.'}
              </p>

              {decisionMade === 'APPROVED' && onNavigateToWallet && (
                <button
                  type="button"
                  onClick={onNavigateToWallet}
                  className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>Open Mobile App</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Recorded Audit Log Entry Confirmation */}
            {latestAuditRecord && (
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/90 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <History className="w-3 h-3" />
                    <span>Recorded in Audit Log</span>
                  </span>
                  <span className="font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(latestAuditRecord.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-slate-300 text-[11.5px] leading-snug">
                  {latestAuditRecord.notes}
                </p>
                {onViewAuditLog && (
                  <button
                    type="button"
                    onClick={onViewAuditLog}
                    className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] font-semibold text-cyan-300 cursor-pointer flex items-center justify-center gap-1 transition-colors"
                  >
                    <History className="w-3 h-3" />
                    <span>View Full Audit Log</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-slate-300 text-xs font-medium block mb-1.5">
                Review Notes <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Add a note for the audit log..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 min-h-[56px]"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleAction('approve')}
                disabled={isProcessing}
                className="py-2.5 px-2 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction('escalate')}
                disabled={isProcessing}
                className="py-2.5 px-2 rounded-xl font-semibold bg-amber-600 hover:bg-amber-500 text-white text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Escalate</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction('reject')}
                disabled={isProcessing}
                className="py-2.5 px-2 rounded-xl font-semibold bg-rose-600 hover:bg-rose-500 text-white text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Reject</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

