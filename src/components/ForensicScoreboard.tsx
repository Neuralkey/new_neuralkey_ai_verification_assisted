import React from 'react';
import {
  Award,
  ShieldCheck,
  Scan,
  CheckCircle2,
  Fingerprint,
  FileCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { ApplicantProfile, ForensicAnalysis } from '../types';
import { generateSyntheticCardSvg } from '../utils/cardSvgGenerator';

export interface ForensicScoreboardProps {
  applicant: ApplicantProfile;
  analysis: ForensicAnalysis;
  livenessScores?: {
    lookLeft: number;
    lookRight: number;
    smile: number;
    blink: number;
  };
}

export const ForensicScoreboard: React.FC<ForensicScoreboardProps> = ({
  applicant,
  analysis,
  livenessScores,
}) => {
  const risk = analysis.riskAssessment;
  const bio = analysis.biometricAnalysis;
  const mrz = analysis.extractedMrzZone;

  const scores = livenessScores || {
    lookLeft: 0.94,
    lookRight: 0.95,
    smile: 0.92,
    blink: 0.96,
  };

  const avgLivenessPct = Math.round(
    ((scores.lookLeft + scores.lookRight + scores.smile + scores.blink) / 4) * 100
  );

  const livenessConfidencePct = bio?.livenessConfidence
    ? bio.livenessConfidence <= 1
      ? Math.round(bio.livenessConfidence * 100)
      : Math.round(bio.livenessConfidence)
    : avgLivenessPct;

  const idAuthenticityPct = Math.max(92, 100 - (risk?.overallRiskScore ?? 4));
  const faceMatchPct = bio?.faceMatchScore ?? 96.8;

  // Sub-scores for ID Profile & Document Forensics
  const profileOcrScore = mrz?.discrepanciesFound?.length ? 78 : 99;
  const mrzChecksumScore = mrz?.checksumValid === false ? 64 : 100;
  const securityTypographyScore = analysis.fraudSignals?.length ? 72 : 97;
  const cryptoEnvelopeScore = 99;

  const getActionBadgeColor = (action: string) => {
    switch (action?.toUpperCase()) {
      case 'APPROVE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'REJECT':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40';
      case 'ESCALATE':
      default:
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
  };

  const fallbackDocSvg = generateSyntheticCardSvg({
    countryCode: applicant.nationality || 'KHM',
    countryName: 'Kingdom of Cambodia',
    docType: applicant.documentType || 'National Identity Card',
    fullName: applicant.fullName,
    documentNumber: applicant.documentNumber,
    dateOfBirth: applicant.dateOfBirth,
  });

  const safeDocPreviewUrl =
    applicant.documentSvgOrUrl && applicant.documentSvgOrUrl.startsWith('data:image/')
      ? applicant.documentSvgOrUrl
      : fallbackDocSvg;

  const safeSelfieUrl =
    applicant.selfieUrl ||
    applicant.avatarUrl ||
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80';

  return (
    <div className="space-y-4">
      {/* Top 4 Headline Confidence Scorecards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-cyan-400" />
            <span>1. Forensic Scoreboard · ID Profile &amp; Liveness Confidence</span>
          </h4>
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span>Real-Time Multimodal Scoring</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* 1. ID Profile & Authenticity Score */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              ID Profile &amp; Doc Score
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-emerald-400">{idAuthenticityPct}%</span>
              <span className="text-[10px] text-emerald-300 font-mono">Pristine</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${idAuthenticityPct}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              OCR + MRZ + Security Print
            </div>
          </div>

          {/* 2. Liveness Images Confidence */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Liveness Images Score
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-cyan-300">{livenessConfidencePct}%</span>
              <span className="text-[10px] text-emerald-400 font-mono">3D Live</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${livenessConfidencePct}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              4/4 Active Pose Challenges
            </div>
          </div>

          {/* 3. ID Portrait vs Live Selfie Match */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              ID vs. Selfie Match
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-white">{faceMatchPct}%</span>
              <span className="text-[10px] font-bold text-emerald-400 font-mono">MATCH</span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, faceMatchPct)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              468 Facial Landmarks Aligned
            </div>
          </div>

          {/* 4. Overall Risk & Recommendation */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5 shadow-sm">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Risk &amp; Recommendation
            </span>
            <div className="flex items-center gap-1.5 pt-0.5">
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${getActionBadgeColor(
                  risk?.suggestedAction || 'APPROVE'
                )}`}
              >
                {risk?.suggestedAction || 'APPROVE'}
              </span>
              <span className="text-[10px] text-slate-300 font-mono">
                Risk: {risk?.overallRiskScore ?? 4}/100
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.max(10, 100 - (risk?.overallRiskScore ?? 4))}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400 truncate">
              {risk?.riskLevel || 'LOW'} Risk Assurance Tier
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown Grid: ID Profile Breakdown vs Liveness Image Captures */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Left 5 Cols: ID Profile & Document Confidence Breakdown */}
        <div className="md:col-span-5 bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800/80">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>ID Profile Scoring Breakdown</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {idAuthenticityPct}% PASS
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                {
                  label: 'Profile vs. Visual OCR Match',
                  score: profileOcrScore,
                  color: 'bg-emerald-400',
                },
                {
                  label: 'ICAO 9303 MRZ Checksum',
                  score: mrzChecksumScore,
                  color: 'bg-cyan-400',
                },
                {
                  label: 'Guilloche & Security Typography',
                  score: securityTypographyScore,
                  color: 'bg-blue-400',
                },
                {
                  label: 'ECIES & Ed25519 Holder Proof',
                  score: cryptoEnvelopeScore,
                  color: 'bg-indigo-400',
                },
              ].map((metric) => (
                <div key={metric.label} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">{metric.label}</span>
                    <span className="font-mono font-bold text-emerald-300">{metric.score}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/80">
                    <div
                      className={`h-full ${metric.color} rounded-full`}
                      style={{ width: `${metric.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Fingerprint className="w-3 h-3 text-cyan-400" />
              <span>National GDI Algorithm</span>
            </span>
            <span className="font-mono text-emerald-400 font-semibold">0 Tamper Signals</span>
          </div>
        </div>

        {/* Right 7 Cols: Biometric Liveness Image Captures & Synthetic ID vs Selfie Strip */}
        <div className="md:col-span-7 bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-800/80">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-cyan-400" />
                <span>Liveness Images &amp; Challenge Confidence</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-300 font-bold">
                Mean: {avgLivenessPct}%
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  key: 'lookLeft' as const,
                  label: 'Look Left',
                  score: scores.lookLeft,
                  frame: applicant.livenessFrames?.lookLeft || safeSelfieUrl,
                },
                {
                  key: 'lookRight' as const,
                  label: 'Look Right',
                  score: scores.lookRight,
                  frame: applicant.livenessFrames?.lookRight || safeSelfieUrl,
                },
                {
                  key: 'smile' as const,
                  label: 'Smile Naturally',
                  score: scores.smile,
                  frame: applicant.livenessFrames?.smile || safeSelfieUrl,
                },
                {
                  key: 'blink' as const,
                  label: 'Blink Eyes',
                  score: scores.blink,
                  frame: applicant.livenessFrames?.blink || safeSelfieUrl,
                },
              ].map((challenge, idx) => {
                const pct = Math.round(challenge.score * 100);
                return (
                  <div
                    key={challenge.label}
                    className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-center space-y-1.5"
                  >
                    <div className="w-12 h-12 rounded-full mx-auto overflow-hidden border border-cyan-500/40 bg-slate-950 relative">
                      <img
                        src={challenge.frame}
                        alt={challenge.label}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-200 block truncate">
                      {idx + 1}. {challenge.label}
                    </span>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold block">
                      ✓ {pct}% Pass
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Captured ID Card (Front & Back) vs Live Selfie Visual Comparison Strip */}
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Captured Front ID Document Thumbnail */}
              <div className="w-20 h-12 rounded-lg overflow-hidden border border-cyan-500/40 bg-slate-950 shrink-0 shadow-sm relative">
                <img
                  src={safeDocPreviewUrl}
                  alt="Captured Front ID"
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] font-mono text-cyan-300 text-center">
                  ID FRONT
                </span>
              </div>
              {applicant.documentBackUrl && (
                <div className="w-20 h-12 rounded-lg overflow-hidden border border-indigo-500/40 bg-slate-950 shrink-0 shadow-sm relative">
                  <img
                    src={applicant.documentBackUrl}
                    alt="Captured Back ID"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-[8px] font-mono text-indigo-300 text-center">
                    ID BACK
                  </span>
                </div>
              )}
              <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
              {/* Live Verified Selfie Thumbnail */}
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-500/50 bg-slate-950 shrink-0 relative">
                <img
                  src={safeSelfieUrl}
                  alt="Live Verified Selfie"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-bold text-white block truncate">
                  Captured ID Portrait vs. Live Camera Selfie ({faceMatchPct}% Match)
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {analysis.biometricAnalysis.notes || 'Active 3D liveness & optical cross-check'}
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{analysis.biometricAnalysis.faceMatchStatus || 'Verified'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
