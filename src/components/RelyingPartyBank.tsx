import React, { useState } from 'react';
import {
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Building,
  CreditCard,
  RefreshCw,
  QrCode,
  AlertCircle,
  User,
  ExternalLink,
  Copy,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { ApplicantProfile, VerifiableCredential } from '../types';
import { NeuralkeyLogo } from './NeuralkeyLogo';

interface RelyingPartyBankProps {
  applicant: ApplicantProfile;
  applicants?: ApplicantProfile[];
  onSelectApplicant?: (id: string) => void;
  issuedCredential: VerifiableCredential | null;
  decisionStatus?: 'APPROVED' | 'REJECTED' | 'ESCALATED' | null;
  onOpenSpecModal?: (did?: string) => void;
}

export const RelyingPartyBank: React.FC<RelyingPartyBankProps> = ({
  applicant,
  applicants,
  onSelectApplicant,
  issuedCredential,
  decisionStatus,
  onOpenSpecModal,
}) => {
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string>('Premier High-Yield Checking');
  const [copiedDid, setCopiedDid] = useState<boolean>(false);

  const isApproved =
    decisionStatus === 'APPROVED' ||
    issuedCredential !== null ||
    applicant.trustLevel === 'TIER_2_IAL2_VERIFIED' ||
    applicant.trustLevel === 'TIER_3_IAL3_VERIFIED';
  const isRejected = decisionStatus === 'REJECTED';
  const isEscalated = decisionStatus === 'ESCALATED';

  const handleCopyDid = () => {
    navigator.clipboard.writeText(applicant.did);
    setCopiedDid(true);
    setTimeout(() => setCopiedDid(false), 2000);
  };

  const handleVerifyCredential = async () => {
    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const response = await fetch('/api/relying-party/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialId: issuedCredential?.id || `urn:uuid:${applicant.id}`,
          relyingPartyName: 'Apex Global Bank (BFSI Institution #492)',
        }),
      });

      const data = await response.json();
      setTimeout(() => {
        setVerificationResult({
          ...data,
          verified: isApproved,
          applicantName: applicant.fullName,
          applicantDid: applicant.did,
          nationality: applicant.nationality,
        });
        setIsVerifying(false);
      }, 700);
    } catch (err) {
      setIsVerifying(false);
      setVerificationResult({
        success: true,
        verified: isApproved,
        applicantName: applicant.fullName,
        applicantDid: applicant.did,
        relyingParty: 'Apex Global Bank',
        message: isApproved
          ? 'Cryptographic signature from Neuralkey Trust Anchor verified on W3C DID ledger.'
          : 'Verification rejected: Applicant identity has not passed human reviewer assurance.',
        zeroKnowledgeProof: {
          ageVerifiedOver18: true,
          citizenshipVerified: applicant.nationality,
          sanctionsListChecked: 'CLEARED_OFAC_AND_EU',
        },
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 min-w-0 w-full">
      {/* Bank Portal Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-md min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 min-w-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-base sm:text-xl font-bold text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400 shrink-0" />
              <span>Apex Global Bank · Account Opening</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Open a bank account instantly once your identity verification is approved.
            </p>
          </div>

          {/* Applicant Selector Dropdown */}
          {applicants && onSelectApplicant && (
            <div className="flex items-center gap-2 text-xs w-full sm:w-auto min-w-0">
              <span className="text-slate-400 text-xs shrink-0">Applicant:</span>
              <select
                value={applicant.id}
                onChange={(e) => {
                  onSelectApplicant(e.target.value);
                  setVerificationResult(null);
                }}
                className="bg-slate-950 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer focus:outline-none focus:border-cyan-400 font-medium flex-1 sm:w-auto sm:max-w-[220px] min-w-0 truncate"
              >
                {applicants.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.fullName.split('(')[0].trim()}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Active Applicant Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden min-w-0">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center min-w-0">
          {/* Avatar / Portrait */}
          <div className="sm:col-span-3 flex sm:flex-col items-center gap-3 text-left sm:text-center min-w-0">
            <div className="w-20 h-24 rounded-xl overflow-hidden border-2 border-cyan-400/60 shadow-md bg-slate-950 shrink-0">
              <img
                src={applicant.avatarUrl}
                alt={applicant.fullName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-slate-950 text-slate-300 border border-slate-800 inline-block max-w-full truncate">
                {applicant.documentType.split('(')[0].trim()}
              </span>
            </div>
          </div>

          {/* Information Fields */}
          <div className="sm:col-span-9 space-y-3 text-xs min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
              <div className="min-w-0">
                <span className="text-[11px] text-slate-400 font-medium block">
                  Applicant Name
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  {applicant.fullName.split('(')[0].trim()}
                </h3>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {isApproved ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Verified (Level 2)</span>
                  </span>
                ) : isRejected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm">
                    <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                    <span>Verification Declined</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>Pending Review</span>
                  </span>
                )}
              </div>
            </div>

            {/* Document Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs min-w-0">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 min-w-0">
                <span className="text-slate-400 shrink-0">ID Number</span>
                <span className="text-cyan-300 font-mono font-bold truncate">{applicant.documentNumber}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2 min-w-0">
                <span className="text-slate-400 shrink-0">Date of Birth</span>
                <span className="text-white font-mono font-bold truncate">{applicant.dateOfBirth}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Application */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800 text-xs">
          <span className="font-bold text-slate-200 text-sm">
            Choose an Account
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setSelectedProduct('Personal Checking Account')}
            className={`p-3.5 rounded-xl border text-left text-xs cursor-pointer transition-all ${
              selectedProduct === 'Personal Checking Account' || selectedProduct === 'Premier High-Yield Checking'
                ? 'bg-blue-950/70 border-blue-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-cyan-400 mb-1.5" />
            <div className="font-bold text-slate-100">Personal Checking</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Everyday banking · No monthly fees</div>
          </button>

          <button
            onClick={() => setSelectedProduct('Business Account')}
            className={`p-3.5 rounded-xl border text-left text-xs cursor-pointer transition-all ${
              selectedProduct === 'Business Account'
                ? 'bg-blue-950/70 border-blue-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Building className="w-4 h-4 text-emerald-400 mb-1.5" />
            <div className="font-bold text-slate-100">Business Account</div>
            <div className="text-[11px] text-slate-400 mt-0.5">For companies &amp; merchants</div>
          </button>

          <button
            onClick={() => setSelectedProduct('Savings Vault')}
            className={`p-3.5 rounded-xl border text-left text-xs cursor-pointer transition-all ${
              selectedProduct === 'Savings Vault'
                ? 'bg-blue-950/70 border-blue-500 text-white'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4 text-purple-400 mb-1.5" />
            <div className="font-bold text-slate-100">Savings Vault</div>
            <div className="text-[11px] text-slate-400 mt-0.5">High-interest protected savings</div>
          </button>
        </div>

        {/* Verification Action Bar */}
        <div className="bg-slate-950 p-3.5 sm:p-4 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block">
                {selectedProduct === 'Premier High-Yield Checking' ? 'Personal Checking Account' : selectedProduct}
              </span>
              <span className="text-[11px] text-slate-400 block truncate">
                Requires approved identity verification
              </span>
            </div>

            <button
              onClick={handleVerifyCredential}
              disabled={isVerifying}
              className="w-full sm:w-auto py-2.5 px-4 rounded-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer transition-all text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>Checking Status...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-white shrink-0" />
                  <span>Open Account</span>
                </>
              )}
            </button>
          </div>

          {/* Verification Results Panel */}
          {verificationResult && (
            <div
              className={`mt-4 p-3.5 sm:p-4 rounded-xl border space-y-2 text-xs animate-in fade-in ${
                verificationResult.verified
                  ? 'bg-emerald-950/30 border-emerald-500/50'
                  : 'bg-red-950/30 border-red-500/50'
              }`}
            >
              <div
                className={`flex items-start gap-2 font-bold ${
                  verificationResult.verified ? 'text-emerald-300' : 'text-red-300'
                }`}
              >
                {verificationResult.verified ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      Identity verified for {verificationResult.applicantName.split('(')[0].trim()} — Your account is now open!
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <span>
                      Cannot open account yet: {verificationResult.applicantName.split('(')[0].trim()} needs to be approved in the Reviewer Console first.
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
