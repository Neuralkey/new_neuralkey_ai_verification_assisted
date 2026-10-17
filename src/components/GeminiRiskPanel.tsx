import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  CheckCircle,
  XCircle,
  Send,
  Lock,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { ForensicAnalysis, ApplicantProfile } from '../types';

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
}) => {
  const { riskAssessment, fraudSignals } = analysis;
  const [reviewerNotes, setReviewerNotes] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Color mapping based on risk score (WCAG AA compliant contrast)
  const getRiskColor = (score: number) => {
    if (score <= 30) {
      return {
        text: 'text-emerald-400',
        bg: 'bg-emerald-500',
        border: 'border-emerald-500/40',
        badge: 'bg-emerald-500/20 text-emerald-300',
      };
    }
    if (score <= 70) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500',
        border: 'border-amber-500/40',
        badge: 'bg-amber-500/20 text-amber-300',
      };
    }
    return {
      text: 'text-red-400',
      bg: 'bg-red-500',
      border: 'border-red-500/40',
      badge: 'bg-red-500/20 text-red-300',
    };
  };

  const riskStyle = getRiskColor(riskAssessment.overallRiskScore);

  const handleAction = (type: 'approve' | 'reject' | 'escalate') => {
    if (!reviewerNotes.trim()) {
      setValidationError('Please provide mandatory reviewer rationale before submitting.');
      return;
    }
    setValidationError(null);
    if (type === 'approve') onApprove(reviewerNotes);
    else if (type === 'reject') onReject(reviewerNotes);
    else onEscalate(reviewerNotes);
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-slate-100">
      {/* 1. Risk Score Gauge & AI Suggested Action (UI-05: at top of right panel) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200 text-sm">Risk Assessment</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch mb-3">
          {/* Score Box */}
          <div className="sm:col-span-5 bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-center">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-medium mb-0.5">
              Risk Score
            </span>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${riskStyle.text}`}>
                {riskAssessment.overallRiskScore}
              </span>
              <span className="text-xs text-slate-400 font-mono">/ 100</span>
            </div>
            <div
              className={`mt-1.5 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${riskStyle.badge} ${riskStyle.border}`}
            >
              {riskAssessment.riskLevel}
            </div>
          </div>

          {/* Suggested Action Box */}
          <div className="sm:col-span-7 bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
            <span className="text-xs text-slate-400 block font-medium">Suggested Action:</span>
            <span
              className={`inline-block font-bold font-mono px-2.5 py-0.5 rounded text-xs ${
                riskAssessment.suggestedAction === 'APPROVE'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : riskAssessment.suggestedAction === 'ESCALATE'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
              }`}
            >
              {riskAssessment.suggestedAction === 'APPROVE'
                ? 'Approve'
                : riskAssessment.suggestedAction === 'ESCALATE'
                ? 'Deep Check Needed'
                : 'Reject'}
            </span>
            <p className="text-xs text-slate-300 leading-snug line-clamp-3 pt-1">
              {riskAssessment.recommendationReason}
            </p>
          </div>
        </div>

        {/* Executive Forensic Summary */}
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 text-xs">
          <span className="text-xs font-bold text-slate-300 block mb-0.5">Summary:</span>
          <p className="text-slate-300 text-xs leading-relaxed">
            {riskAssessment.executiveSummary}
          </p>
        </div>
      </div>

      {/* 2. Numbered Plain-Language Fraud Flags (UI-02, UI-05, UI-06) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex-1 flex flex-col">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200 text-sm">
              Issues Found ({fraudSignals.length})
            </span>
          </div>
          {fraudSignals.length > 0 && (
            <span className="text-xs text-slate-400">Hover to highlight on ID</span>
          )}
        </div>

        <div className="space-y-2 overflow-y-auto max-h-[260px] pr-1">
          {fraudSignals.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-center space-y-1">
              <CheckCircle className="w-5 h-5 text-emerald-400 mx-auto" />
              <div className="text-xs font-bold text-emerald-300">No Issues Detected</div>
              <p className="text-xs text-slate-300">
                All ID details match and no signs of editing or tampering were found.
              </p>
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
                  className={`rounded-xl border p-2.5 transition-all text-xs cursor-pointer ${
                    isHovered
                      ? 'ring-2 ring-red-400 shadow-md bg-red-950/60 border-red-400'
                      : isCrit
                      ? 'bg-red-950/40 border-red-500/50 hover:bg-red-950/50'
                      : isHigh
                      ? 'bg-amber-950/30 border-amber-500/50 hover:bg-amber-950/40'
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-2 mb-1.5">
                    {/* Flag Number Badge (Numbered matching red box on ID image) */}
                    <span className="w-5 h-5 rounded-full bg-red-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-slate-200 text-xs truncate">
                          {signal.title}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded shrink-0 ${
                            isCrit
                              ? 'bg-red-500/30 text-red-200'
                              : isHigh
                              ? 'bg-amber-500/30 text-amber-200'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isCrit ? 'High Risk' : isHigh ? 'Warning' : 'Notice'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">
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

      {/* 3. Reviewer Final Decision */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm sticky bottom-0 z-10 backdrop-blur-md">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-slate-200 text-sm">Final Decision</span>
          </div>
        </div>

        {decisionMade ? (
          /* Decision Completed Banner */
          <div
            className={`p-3.5 rounded-xl border text-center space-y-2.5 ${
              decisionMade === 'APPROVED'
                ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                : decisionMade === 'ESCALATED'
                ? 'bg-amber-950/60 border-amber-500/60 text-amber-200'
                : 'bg-red-950/60 border-red-500/60 text-red-200'
            }`}
          >
            <div className="text-sm font-bold flex items-center justify-center gap-2">
              {decisionMade === 'APPROVED' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
              {decisionMade === 'ESCALATED' && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {decisionMade === 'REJECTED' && <XCircle className="w-5 h-5 text-red-400" />}
              <span>
                {decisionMade === 'APPROVED'
                  ? 'Approved'
                  : decisionMade === 'ESCALATED'
                  ? 'Sent for Further Review'
                  : 'Rejected'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              {decisionMade === 'APPROVED'
                ? 'Identity verified and upgraded to Level 3.'
                : decisionMade === 'ESCALATED'
                ? 'Application flagged for additional check. Remains at Level 1.'
                : 'Verification declined. Remains at Level 1.'}
            </p>

            {decisionMade === 'APPROVED' && onNavigateToWallet && (
              <button
                onClick={onNavigateToWallet}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition-colors"
              >
                <span>Open Mobile App</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          /* Decision Input Form */
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <label className="text-slate-300 font-medium">
                  Review Notes <span className="text-red-400">*</span>
                </label>
              </div>
              <textarea
                value={reviewerNotes}
                onChange={(e) => {
                  setReviewerNotes(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                placeholder="Add a brief note explaining your decision..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[60px]"
              />
              {validationError && (
                <span className="text-red-400 text-[11px] block mt-0.5">{validationError}</span>
              )}
            </div>

            {/* 3 Clear Buttons: Approve, Escalate, Reject */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleAction('approve')}
                disabled={isProcessing}
                className="py-2 px-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 text-white text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Approve</span>
              </button>

              <button
                onClick={() => handleAction('escalate')}
                disabled={isProcessing}
                className="py-2 px-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-500 text-white text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
                title="Send for additional review"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Escalate</span>
              </button>

              <button
                onClick={() => handleAction('reject')}
                disabled={isProcessing}
                className="py-2 px-2 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white text-xs cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
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
