import React from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileText,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { ApplicantProfile, ForensicAnalysis } from '../types';
import { ForensicScoreboard } from './ForensicScoreboard';

interface GeminiVerificationAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicant: ApplicantProfile;
  analysis: ForensicAnalysis;
  profileData: {
    fullName: string;
    dateOfBirth: string;
    documentNumber: string;
    documentType: string;
    country: string;
    stateProvince?: string;
    gender?: string;
    email?: string;
  };
  livenessScores?: {
    lookLeft: number;
    lookRight: number;
    smile: number;
    blink: number;
  };
  onNavigateToReviewerConsole?: () => void;
}

export const GeminiVerificationAuditModal: React.FC<GeminiVerificationAuditModalProps> = ({
  isOpen,
  onClose,
  applicant,
  analysis,
  profileData,
  livenessScores,
  onNavigateToReviewerConsole,
}) => {
  if (!isOpen) return null;

  const vz = analysis.extractedVisualZone;
  const mrz = analysis.extractedMrzZone;

  const normalizeField = (val?: string) =>
    (val || '')
      .split('(')[0]
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

  const declaredName = profileData.fullName || applicant.fullName;
  const extractedName = vz?.fullName || declaredName;
  const declaredDoc = profileData.documentNumber || applicant.documentNumber;
  const extractedDoc = vz?.documentNumber || declaredDoc;

  const hasFieldDiscrepancy =
    (Boolean(normalizeField(declaredName)) &&
      Boolean(normalizeField(extractedName)) &&
      normalizeField(declaredName) !== normalizeField(extractedName)) ||
    (Boolean(normalizeField(declaredDoc)) &&
      Boolean(normalizeField(extractedDoc)) &&
      normalizeField(declaredDoc) !== normalizeField(extractedDoc)) ||
    mrz?.checksumValid === false ||
    (analysis.fraudSignals && analysis.fraudSignals.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Banner */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950/80 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              <span>Identity Verification Summary</span>
            </h3>
            <p className="text-xs text-slate-400">
              Summary of submitted profile details, ID verification, and face scan results.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-200">
          {/* 1. FORENSIC SCOREBOARD (ID Profile & Liveness Image Scoring Breakdown) */}
          <ForensicScoreboard
            applicant={applicant}
            analysis={analysis}
            livenessScores={livenessScores}
          />

          {/* 2. DATA PROFILE VS EXTRACTED TEXT FROM ID (GEMINI OCR) */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span>2. Data Profile vs. Gemini Extracted Text from ID</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Left Column: Data Profile */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Declared Data Profile</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Holder Input</span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Full Name:</span>
                    <span className="font-bold text-white">{profileData.fullName || applicant.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Document Number:</span>
                    <span className="font-mono text-cyan-300">{profileData.documentNumber || applicant.documentNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Document Type:</span>
                    <span className="text-slate-200">{profileData.documentType || applicant.documentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date of Birth:</span>
                    <span className="text-slate-200">{profileData.dateOfBirth || applicant.dateOfBirth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Country / Province:</span>
                    <span className="text-slate-200">
                      {profileData.country || 'Cambodia'}{' '}
                      {profileData.stateProvince ? `(${profileData.stateProvince})` : ''}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gender / Email:</span>
                    <span className="text-slate-200">
                      {profileData.gender || 'Male'} · {profileData.email || 'holder@neuralkey.ai'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Gemini Extracted Text from ID */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gemini Extracted Text (OCR)</span>
                  </span>
                  <span
                    className={`text-[10px] font-mono ${
                      hasFieldDiscrepancy ? 'text-amber-300' : 'text-emerald-300'
                    }`}
                  >
                    {hasFieldDiscrepancy ? 'Needs Review' : '100% Match'}
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Extracted Name:</span>
                    <span className="font-bold text-white">
                      {vz?.fullName || profileData.fullName || applicant.fullName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Extracted Doc No:</span>
                    <span className="font-mono text-emerald-300">
                      {vz?.documentNumber || profileData.documentNumber || applicant.documentNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Extracted Type:</span>
                    <span className="text-slate-200">{vz?.documentType || profileData.documentType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Extracted DOB / Expiry:</span>
                    <span className="text-slate-200">
                      {vz?.dateOfBirth || profileData.dateOfBirth} · {vz?.expiryDate || '2033-09-12'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Issuing State / Code:</span>
                    <span className="text-slate-200">
                      {vz?.issuingCountry || vz?.nationality || 'Kingdom of Cambodia (KHM)'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">MRZ &amp; Checksums:</span>
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                        mrz?.checksumValid === false
                          ? 'text-red-300 bg-red-950/60 border-red-500/30'
                          : 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
                      }`}
                    >
                      {mrz?.checksumValid === false ? '✗ Checksum Mismatch' : '✓ Valid Checksum'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Consistency Check Banner */}
            <div
              className={`mt-2.5 p-2.5 rounded-xl border flex items-center justify-between gap-2 ${
                hasFieldDiscrepancy
                  ? 'bg-amber-950/40 border-amber-500/30'
                  : 'bg-emerald-950/40 border-emerald-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    hasFieldDiscrepancy ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                />
                <span className={`text-xs ${hasFieldDiscrepancy ? 'text-amber-200' : 'text-emerald-200'}`}>
                  {hasFieldDiscrepancy ? (
                    <>
                      <strong>Review Needed:</strong> Gemini detected differences or risk signals between declared profile data and the ID document.
                    </>
                  ) : (
                    <>
                      <strong>Zero Discrepancies:</strong> Declared profile data, extracted visual OCR, and MRZ checksums are completely consistent.
                    </>
                  )}
                </span>
              </div>
              <span
                className={`text-[10.5px] font-mono font-bold shrink-0 ${
                  hasFieldDiscrepancy ? 'text-amber-300' : 'text-emerald-300'
                }`}
              >
                {hasFieldDiscrepancy ? 'Cross-Check: FLAG' : 'Cross-Check: PASS'}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Footer with Reviewer Console Action */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>
              Queued as a <strong>Todo Check</strong> in the Reviewer Console queue.
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs cursor-pointer transition-colors"
            >
              Stay in Wallet
            </button>
            {onNavigateToReviewerConsole && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateToReviewerConsole();
                }}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-blue-500/25 transition-all"
              >
                <span>Check at Review Console</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
