import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  ShieldCheck,
  Key,
  QrCode,
  Award,
  Upload,
  Camera,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
  Fingerprint,
  RefreshCw,
  Eye,
  FileCheck,
  Sparkles,
  ArrowRight,
  Clock,
  Landmark,
} from 'lucide-react';
import { ApplicantProfile, VerifiableCredential } from '../types';
import { NeuralkeyLogo } from './NeuralkeyLogo';
import { INITIAL_PRESETS } from '../data/mockScenarios';
import { IdentityVerifyFlutterSimulator } from './IdentityVerifyFlutterSimulator';
import { generateSyntheticCardSvg } from '../utils/cardSvgGenerator';

interface ApplicantWalletProps {
  applicant: ApplicantProfile;
  applicants?: ApplicantProfile[];
  issuedCredential: VerifiableCredential | null;
  decisionStatus?: 'APPROVED' | 'REJECTED' | 'ESCALATED' | null;
  onSelectApplicant: (id: string) => void;
  onCustomSubmit: (data: {
    fullName: string;
    documentNumber: string;
    dateOfBirth: string;
    nationality: string;
    documentType: string;
    docImageBase64: string;
    selfieImageBase64: string;
  }) => void;
  onVerifyIdentitySubmission?: (data: {
    profileData: {
      fullName: string;
      dateOfBirth: string;
      documentNumber: string;
      documentType: any;
      country: string;
      stateProvince: string;
      city: string;
      gender: string;
      email: string;
      documentExpiry: string;
    };
    docImageBase64: string;
    selfieImageBase64: string;
    livenessScores: {
      lookLeft: number;
      lookRight: number;
      smile: number;
      blink: number;
      meanScore: number;
    };
  }) => Promise<void> | void;
  isSubmittingCustom: boolean;
  onOpenSpecModal?: (did?: string) => void;
  onNavigateToBank?: () => void;
}

// Generate realistic synthetic ID card SVG data URL (UI-08: real synthetic ID images, not a selfie of a face!)
const createSyntheticCardSvg = (
  countryCode: string,
  countryName: string,
  docName: string,
  name: string,
  num: string,
  dob: string,
  avatarUrl: string,
  _countryCodeBadge: string
) => {
  return generateSyntheticCardSvg({
    countryCode,
    countryName,
    docType: docName,
    fullName: name,
    documentNumber: num,
    dateOfBirth: dob,
    avatarUrl,
  });
};

export const ApplicantWallet: React.FC<ApplicantWalletProps> = ({
  applicant,
  applicants = INITIAL_PRESETS,
  issuedCredential,
  decisionStatus,
  onSelectApplicant,
  onCustomSubmit,
  onVerifyIdentitySubmission,
  isSubmittingCustom,
  onOpenSpecModal,
  onNavigateToBank,
}) => {
  const isLevel3Approved =
    decisionStatus === 'APPROVED' ||
    issuedCredential !== null ||
    applicant.trustLevel === 'TIER_3_IAL3_VERIFIED';

  // View mode switcher: Identity Verify prototype
  const [walletViewMode, setWalletViewMode] = useState<'flutter_verify' | 'standard'>('flutter_verify');

  // Simplified wallet views (UI-16: Credentials, Submit ID)
  const [activeTab, setActiveTab] = useState<'credentials' | 'submit' | 'keys'>('credentials');
  const [copiedDid, setCopiedDid] = useState<boolean>(false);
  const [showJsonVc, setShowJsonVc] = useState<boolean>(false);

  // Live progress simulation state for Gemini (UI-07)
  const [submitProgressStep, setSubmitProgressStep] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [lastModelUsed, setLastModelUsed] = useState<string | null>(null);

  // Custom upload form state with initial realistic synthetic ID and separate selfie
  const initialDocSvg = createSyntheticCardSvg(
    'KHM',
    'Kingdom of Cambodia',
    'National Identity Card',
    'Sok Chandara',
    '010892746',
    '1995-09-12',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    'KH'
  );

  const [customName, setCustomName] = useState<string>('Sok Chandara (សុខ ចាន់ដារ៉ា)');
  const [customDob, setCustomDob] = useState<string>('1995-09-12');
  const [customDocNum, setCustomDocNum] = useState<string>('010892746');
  const [customNation, setCustomNation] = useState<string>('KHM');
  const [customDocType, setCustomDocType] = useState<string>('National Identity Card');
  const [docImagePreview, setDocImagePreview] = useState<string | null>(initialDocSvg);
  const [selfieImagePreview, setSelfieImagePreview] = useState<string | null>(
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
  );

  const [formError, setFormError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);

  // Quick load presets with distinct ID card and separate matching selfie portrait (UI-08)
  const loadPresetIntoForm = (presetKey: string) => {
    switch (presetKey) {
      case 'khm_nid':
        setCustomName('Sok Chandara (សុខ ចាន់ដារ៉ា)');
        setCustomDob('1995-09-12');
        setCustomDocNum('010892746');
        setCustomNation('KHM');
        setCustomDocType('National Identity Card');
        setDocImagePreview(
          createSyntheticCardSvg('KHM', 'Kingdom of Cambodia', 'National Identity Card', 'Sok Chandara', '010892746', '1995-09-12', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80', 'KH')
        );
        setSelfieImagePreview('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80');
        break;
      case 'khm_passport':
        setCustomName('Pich Sovann (ពេជ្រ សុវណ្ណ)');
        setCustomDob('1993-07-04');
        setCustomDocNum('N02194857');
        setCustomNation('KHM');
        setCustomDocType('Standard e-Passport');
        setDocImagePreview(
          createSyntheticCardSvg('KHM', 'Kingdom of Cambodia', 'e-Passport', 'Pich Sovann', 'N02194857', '1993-07-04', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', 'KH')
        );
        setSelfieImagePreview('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80');
        break;
      case 'sgp_nric':
        setCustomName('Amira Chen Wei (陈美华)');
        setCustomDob('1998-11-04');
        setCustomDocNum('S8839201F');
        setCustomNation('SGP');
        setCustomDocType('National Identity Card (Pink NRIC)');
        setDocImagePreview(
          createSyntheticCardSvg('SGP', 'Republic of Singapore', 'National Registration Identity Card', 'Amira Chen Wei', 'S8839201F', '1998-11-04', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', 'SG')
        );
        setSelfieImagePreview('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');
        break;
      case 'mys_mykad':
        setCustomName('Nurul Aisyah binti Rahman');
        setCustomDob('1996-05-14');
        setCustomDocNum('960514-10-5432');
        setCustomNation('MYS');
        setCustomDocType('Malaysia MyKad Identity Card');
        setDocImagePreview(
          createSyntheticCardSvg('MYS', 'Malaysia', 'MyKad Identity Card', 'Nurul Aisyah', '960514-10-5432', '1996-05-14', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80', 'MY')
        );
        setSelfieImagePreview('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80');
        break;
      case 'tha_id':
        setCustomName('Somchai Prasert (สมชาย ประเสริฐ)');
        setCustomDob('1990-11-28');
        setCustomDocNum('1-1037-02948-12-3');
        setCustomNation('THA');
        setCustomDocType('Thai National ID Card');
        setDocImagePreview(
          createSyntheticCardSvg('THA', 'Kingdom of Thailand', 'National ID Card', 'Somchai Prasert', '1-1037-02948-12-3', '1990-11-28', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', 'TH')
        );
        setSelfieImagePreview('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80');
        break;
      case 'idn_ektp':
        setCustomName('Siti Rahmawati');
        setCustomDob('1993-09-12');
        setCustomDocNum('3174055209930002');
        setCustomNation('IDN');
        setCustomDocType('Indonesia e-KTP');
        setDocImagePreview(
          createSyntheticCardSvg('IDN', 'Republik Indonesia', 'Kartu Tanda Penduduk (e-KTP)', 'Siti Rahmawati', '3174055209930002', '1993-09-12', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80', 'ID')
        );
        setSelfieImagePreview('https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80');
        break;
    }
  };

  const handleCopyDid = () => {
    navigator.clipboard.writeText(applicant.did);
    setCopiedDid(true);
    setTimeout(() => setCopiedDid(false), 2000);
  };

  const handleDocImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [isCapturingLiveSelfie, setIsCapturingLiveSelfie] = useState(false);

  // Immediate live camera capture for biometric liveness (file upload prohibited)
  const handleImmediateLiveSelfieCapture = () => {
    setIsCapturingLiveSelfie(true);
    setTimeout(() => {
      setSelfieImagePreview(applicant.selfieUrl || applicant.avatarUrl);
      setIsCapturingLiveSelfie(false);
    }, 450);
  };

  // Submit with live progress strip (UI-07)
  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docImagePreview) {
      setFormError('Please select or upload an ID document image.');
      return;
    }
    setFormError(null);
    setSubmitProgressStep(1);
    setLastModelUsed('Gemini 3.8 Flash (triage)');

    const startTime = Date.now();
    const interval = setInterval(() => {
      setElapsedTime(Math.round((Date.now() - startTime) / 100) / 10);
    }, 100);

    // Step 1: Reading ID
    setTimeout(() => {
      setSubmitProgressStep(2);
    }, 600);

    // Step 2: Cross-checking
    setTimeout(() => {
      setSubmitProgressStep(3);
    }, 1200);

    // Step 3: Complete & Dispatch
    setTimeout(() => {
      clearInterval(interval);
      setSubmitProgressStep(4);
      setSubmissionSuccess('Document analyzed by Gemini and dispatched to Reviewer Console!');
      onCustomSubmit({
        fullName: customName,
        dateOfBirth: customDob,
        documentNumber: customDocNum,
        nationality: customNation,
        documentType: customDocType,
        docImageBase64: docImagePreview,
        selfieImageBase64: selfieImagePreview || applicant.selfieUrl,
      });
      setTimeout(() => {
        setSubmissionSuccess(null);
        setSubmitProgressStep(0);
      }, 3500);
    }, 1800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 min-w-0 w-full">
      {/* Profile Selector Dropdown */}
      <div className="flex items-center justify-center w-full">
        <div className="flex items-center gap-2 bg-slate-900 px-3.5 py-1.5 rounded-xl border border-slate-800 text-xs shadow-sm">
          <span className="text-slate-400 text-xs font-medium shrink-0">Applicant:</span>
          <select
            value={applicant.id}
            onChange={(e) => onSelectApplicant(e.target.value)}
            className="bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 text-xs cursor-pointer focus:outline-none focus:border-blue-500 max-w-[220px] truncate"
          >
            {applicants.map((app) => (
              <option key={app.id} value={app.id}>
                {app.fullName.split('(')[0].trim()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Conditional: Identity Verify Prototype vs Standard Wallet */}
      {walletViewMode === 'flutter_verify' ? (
        <IdentityVerifyFlutterSimulator
          applicant={applicant}
          decisionStatus={decisionStatus}
          onNavigateHome={() => setWalletViewMode('standard')}
          onSubmitToReviewer={onVerifyIdentitySubmission}
        />
      ) : (
        /* Main Layout: Phone Frame on Left, Actions on Right */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start min-w-0">
        {/* Mobile Shell Simulation */}
        <div className="md:col-span-5 flex justify-center min-w-0 w-full">
          <div className="w-full max-w-[360px] bg-slate-950 border-[5px] border-slate-800 rounded-[32px] p-3 shadow-2xl relative overflow-hidden ring-1 ring-slate-700/50 min-w-0">
            {/* Speaker & Camera */}
            <div className="w-24 h-3.5 bg-slate-800 rounded-full mx-auto mb-2.5 flex items-center justify-center">
              <div className="w-8 h-1 bg-slate-900 rounded-full"></div>
            </div>

            {/* Wallet Header inside Phone */}
            <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 mb-2.5 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm p-1 shrink-0">
                    <NeuralkeyLogo className="w-4 h-4 text-white" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white block truncate">NeuralKey ID</span>
                    <span className="text-[10px] text-emerald-400 font-mono block truncate">● Keystore Locked</span>
                  </div>
                </div>
                <Fingerprint className="w-5 h-5 text-cyan-400 shrink-0" />
              </div>

              {/* Applicant Government ID */}
              <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-1 text-xs min-w-0 overflow-hidden">
                <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 min-w-0">
                  <span className="font-semibold text-cyan-300 truncate">GOVERNMENT ID DID</span>
                  <button
                    type="button"
                    onClick={handleCopyDid}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 text-[10px] cursor-pointer shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedDid ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <div className="font-mono text-[10px] text-slate-300 truncate font-semibold w-full">
                  {applicant.did}
                </div>
              </div>
            </div>

            {/* Simplified Tabs: Credentials vs Submit ID (UI-16) */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 mb-2.5 text-xs font-semibold min-w-0">
              <button
                type="button"
                onClick={() => setActiveTab('credentials')}
                className={`flex-1 py-1.5 px-2 rounded-lg cursor-pointer transition-colors text-center truncate ${
                  activeTab === 'credentials'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Credentials
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('submit')}
                className={`flex-1 py-1.5 px-2 rounded-lg cursor-pointer transition-colors text-center truncate ${
                  activeTab === 'submit'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Submit ID
              </button>
            </div>

            {/* In-Phone View: One Credential Card and Sign In Button (UI-16) */}
            <div className="min-h-[260px] text-xs min-w-0">
              {activeTab === 'credentials' && (
                <div className="space-y-3 min-w-0">
                  {isLevel3Approved ? (
                    /* The Credential Card (Upgraded to Level 3 after approval) */
                    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 border border-blue-500/40 rounded-2xl p-3.5 sm:p-4 shadow-lg space-y-3 relative overflow-hidden min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5 min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Award className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span className="font-bold text-white text-xs truncate">Level 3 Identity Credential</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                          LEVEL 3 (IAL3)
                        </span>
                      </div>

                      <div className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-1 text-xs min-w-0">
                        <div className="flex justify-between gap-2 min-w-0">
                          <span className="text-slate-400 shrink-0">Subject:</span>
                          <span className="font-bold text-white truncate">{applicant.fullName}</span>
                        </div>
                        <div className="flex justify-between gap-2 min-w-0">
                          <span className="text-slate-400 shrink-0">Document No:</span>
                          <span className="font-mono text-cyan-300 truncate">{applicant.documentNumber}</span>
                        </div>
                        <div className="flex justify-between gap-2 min-w-0">
                          <span className="text-slate-400 shrink-0">Assurance Tier:</span>
                          <span className="text-emerald-400 font-bold truncate">Level 3 (Upgraded)</span>
                        </div>
                        <div className="flex justify-between gap-2 min-w-0">
                          <span className="text-slate-400 shrink-0">Issuer:</span>
                          <span className="text-slate-300 font-mono text-[10px] truncate">did:neuralkey</span>
                        </div>
                      </div>

                      {/* Primary Action Button: Sign In to Bank (UI-16) */}
                      {onNavigateToBank && (
                        <button
                          type="button"
                          onClick={onNavigateToBank}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-2 shadow-md transition-all"
                        >
                          <Landmark className="w-4 h-4 text-amber-300 shrink-0" />
                          <span className="truncate">Sign In to Bank KYC &rarr;</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setWalletViewMode('flutter_verify')}
                        className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="truncate">Identity Verify Simulator &rarr;</span>
                      </button>
                    </div>
                  ) : (
                    /* Level 1 State Before Reviewer Approval */
                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2.5">
                      <FileCheck className="w-8 h-8 text-amber-400 mx-auto" />
                      <div className="font-bold text-slate-200 text-xs">
                        Level 1 Basic Identity
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Submit your ID and approve it in the Reviewer Console to upgrade to Level 3.
                      </p>
                      <button
                        type="button"
                        onClick={() => setWalletViewMode('flutter_verify')}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md transition-all"
                      >
                        <Smartphone className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                        <span className="truncate">Start Identity Verification &rarr;</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'submit' && (
                <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
                  <Upload className="w-6 h-6 text-cyan-400 mx-auto" />
                  <div className="font-bold text-slate-200 text-xs">Submit New Document</div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Use the test submission form to select an ASEAN prototype or upload your custom
                    document and live selfie.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Test Submission & Progress Strip (UI-07, UI-08) */}
        <div className="md:col-span-7 space-y-4 min-w-0 w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm min-w-0 overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Upload className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="font-bold text-slate-200 text-sm">
                  Test Submission Form
                </span>
              </div>
              <span className="text-xs text-slate-400">Live Gemini multimodal check</span>
            </div>

            {/* Quick Presets (UI-08: distinct synthetic card + distinct selfie portrait) */}
            <div className="mb-3 pb-2.5 border-b border-slate-800">
              <span className="text-xs text-slate-300 block mb-1.5 font-semibold">
                Quick-Load Synthetic ID Preset:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: 'khm_nid', code: 'KH', label: 'Cambodia ID' },
                  { key: 'khm_passport', code: 'KH', label: 'Cambodia Passport' },
                  { key: 'sgp_nric', code: 'SG', label: 'Singapore NRIC' },
                  { key: 'mys_mykad', code: 'MY', label: 'Malaysia MyKad' },
                  { key: 'tha_id', code: 'TH', label: 'Thai ID' },
                  { key: 'idn_ektp', code: 'ID', label: 'Indonesia e-KTP' },
                ].map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => loadPresetIntoForm(preset.key)}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-900 text-sky-400 border border-slate-700/60">{preset.code}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmitCustom} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block text-xs mb-1 font-medium">Full Name</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 block text-xs mb-1 font-medium">Document Number</label>
                  <input
                    type="text"
                    value={customDocNum}
                    onChange={(e) => setCustomDocNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-100 font-mono focus:outline-none focus:border-blue-500 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-slate-300 block text-xs mb-1 font-medium">Date of Birth</label>
                  <input
                    type="date"
                    value={customDob}
                    onChange={(e) => setCustomDob(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 block text-xs mb-1 font-medium">Nationality</label>
                  <input
                    type="text"
                    value={customNation}
                    onChange={(e) => setCustomNation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-300 block text-xs mb-1 font-medium">Doc Type</label>
                  <input
                    type="text"
                    value={customDocType}
                    onChange={(e) => setCustomDocType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 text-xs"
                    required
                  />
                </div>
              </div>

              {/* Upload Pickers: ID Card & Matching Selfie (UI-08) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="text-slate-300 block text-xs mb-1 font-semibold">
                    1. ID Document Image
                  </label>
                  <div className="border border-dashed border-slate-700 rounded-xl p-2.5 text-center bg-slate-950 hover:border-blue-500 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDocImageUpload}
                      id="doc-upload"
                      className="hidden"
                    />
                    <label htmlFor="doc-upload" className="cursor-pointer block space-y-1">
                      {docImagePreview ? (
                        <div className="h-16 rounded overflow-hidden bg-slate-900 border border-slate-800">
                          <img
                            src={docImagePreview}
                            alt="Document"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-blue-400 block font-semibold py-4">
                          Upload Document Image
                        </span>
                      )}
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 block text-xs font-semibold">
                      2. Biometric Liveness (Live Camera Only)
                    </label>
                    <span className="text-[10px] text-amber-400 font-mono font-bold bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                      Upload Prohibited
                    </span>
                  </div>
                  <div className="border border-slate-700 rounded-xl p-2.5 text-center bg-slate-950">
                    {selfieImagePreview ? (
                      <div className="space-y-1.5">
                        <div className="h-16 rounded overflow-hidden bg-slate-900 border border-slate-800 relative mx-auto w-20">
                          <img
                            src={selfieImagePreview}
                            alt="Live Selfie"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        </div>
                        <div className="flex items-center justify-center gap-1 text-[10.5px] text-emerald-400 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Live Sensor Captured</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleImmediateLiveSelfieCapture}
                          disabled={isCapturingLiveSelfie}
                          className="px-2.5 py-0.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[10px] text-cyan-300 font-semibold cursor-pointer transition-all flex items-center justify-center gap-1 mx-auto"
                        >
                          <Camera className="w-3 h-3" />
                          <span>{isCapturingLiveSelfie ? 'Capturing...' : 'Retake Live Selfie'}</span>
                        </button>
                      </div>
                    ) : (
                      <div className="py-2 space-y-1.5">
                        <button
                          type="button"
                          onClick={handleImmediateLiveSelfieCapture}
                          disabled={isCapturingLiveSelfie}
                          className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-md transition-all"
                        >
                          <Camera className="w-4 h-4 text-cyan-200" />
                          <span>{isCapturingLiveSelfie ? 'Capturing Face Sensor...' : 'Capture Live Selfie Immediately'}</span>
                        </button>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Immediate live camera capture only. File uploads are disabled for NIST IAL2 liveness.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Live Gemini Progress Strip (UI-07) */}
              {submitProgressStep > 0 && (
                <div className="p-3 rounded-xl bg-slate-950 border border-blue-500/40 space-y-2 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs font-bold text-white">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                      <span>Gemini Live Reasoning Pipeline</span>
                    </span>
                    <span className="text-cyan-300 font-mono text-[11px]">
                      Elapsed: {elapsedTime}s
                    </span>
                  </div>

                  {/* 3 Step Indicator */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px] font-mono">
                    <div
                      className={`p-1.5 rounded text-center border truncate ${
                        submitProgressStep >= 1
                          ? 'bg-blue-600/30 text-cyan-300 border-blue-500/50 font-bold'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      1. Reading ID
                    </div>
                    <div
                      className={`p-1.5 rounded text-center border truncate ${
                        submitProgressStep >= 2
                          ? 'bg-blue-600/30 text-cyan-300 border-blue-500/50 font-bold'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      2. Cross-Checking
                    </div>
                    <div
                      className={`p-1.5 rounded text-center border truncate ${
                        submitProgressStep >= 3
                          ? 'bg-blue-600/30 text-cyan-300 border-blue-500/50 font-bold'
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      3. Explaining Flags
                    </div>
                  </div>

                  {lastModelUsed && (
                    <div className="text-[10px] text-slate-400 text-right truncate">
                      Model: <span className="text-slate-200 font-mono">{lastModelUsed}</span>
                    </div>
                  )}
                </div>
              )}

              {formError && (
                <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-500/50 text-red-200 text-xs">
                  {formError}
                </div>
              )}

              {submissionSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs text-center font-bold">
                  {submissionSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmittingCustom || submitProgressStep > 0}
                className="w-full py-2.5 px-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white cursor-pointer transition-all text-xs flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {submitProgressStep > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gemini Multimodal Reasoning in Progress...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Dispatch to Reviewer Console</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    )}

      {/* End of Applicant Wallet */}
    </div>
  );
};
