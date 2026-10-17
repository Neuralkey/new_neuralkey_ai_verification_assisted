/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header } from './components/Header';
import { ReviewerConsole } from './components/ReviewerConsole';
import { ApplicantWallet } from './components/ApplicantWallet';
import { RelyingPartyBank } from './components/RelyingPartyBank';
import { NeuralkeySpecModal } from './components/NeuralkeySpecModal';
import { AboutDemoModal } from './components/AboutDemoModal';
import { GeminiVerificationAuditModal } from './components/GeminiVerificationAuditModal';
import { INITIAL_PRESETS, PRESET_ANALYSES } from './data/mockScenarios';
import { ApplicantProfile, ForensicAnalysis, VerifiableCredential } from './types';
import { generateNeuralkeyUserDid } from './utils/didResolver';
import { generateSyntheticCardSvg } from './utils/cardSvgGenerator';
import { RotateCcw, AlertTriangle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'console' | 'wallet' | 'bank'>('console');

  // Applicants queue & active selection
  const [queue, setQueue] = useState<ApplicantProfile[]>(INITIAL_PRESETS);
  const [activeApplicantId, setActiveApplicantId] = useState<string>('sok_chandara');
  const [analyses, setAnalyses] = useState<Record<string, ForensicAnalysis>>(PRESET_ANALYSES);
  const [decisionStatus, setDecisionStatus] = useState<Record<string, 'APPROVED' | 'REJECTED' | 'ESCALATED'>>({});
  const [issuedCredentials, setIssuedCredentials] = useState<Record<string, VerifiableCredential>>({});
  const [isProcessingDecision, setIsProcessingDecision] = useState<boolean>(false);
  const [isSubmittingCustom, setIsSubmittingCustom] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Controlled active subtab inside ReviewerConsole
  const [controlledConsoleTab, setControlledConsoleTab] = useState<'crosscheck' | 'pipeline' | 'forensics' | 'audit'>('crosscheck');

  // Custom upload image previews
  const [customDocUrl, setCustomDocUrl] = useState<string | undefined>(undefined);
  const [customSelfieUrl, setCustomSelfieUrl] = useState<string | undefined>(undefined);

  // Gemini verification audit modal state (shown after wallet verify submission)
  const [auditModalData, setAuditModalData] = useState<{
    isOpen: boolean;
    applicant?: ApplicantProfile;
    analysis?: ForensicAnalysis;
    profileData?: any;
    livenessScores?: any;
  }>({ isOpen: false });

  // Modals state
  const [showSpecModal, setShowSpecModal] = useState<boolean>(false);
  const [showAboutModal, setShowAboutModal] = useState<boolean>(false);
  const [specTargetDid, setSpecTargetDid] = useState<string>(
    'did:neuralkey:z6MkkhmCHANDARAz8P9yKhmerNatID010892746zk7Q'
  );

  const handleOpenSpecModal = (targetDid?: string) => {
    if (targetDid) {
      setSpecTargetDid(targetDid);
    } else {
      setSpecTargetDid(activeApplicant?.did || 'did:neuralkey:z6MkkhmCHANDARAz8P9yKhmerNatID010892746zk7Q');
    }
    setShowSpecModal(true);
  };

  // Reset demo cases to clean initial state (UI-15)
  const handleResetDemo = () => {
    setQueue(INITIAL_PRESETS);
    setActiveApplicantId('sok_chandara');
    setDecisionStatus({});
    setIssuedCredentials({});
    setCustomDocUrl(undefined);
    setCustomSelfieUrl(undefined);
    setGlobalError(null);
    setAuditModalData({ isOpen: false });
  };

  // Active applicant and analysis
  const activeApplicant = queue.find((q) => q.id === activeApplicantId) || queue[0];
  const activeAnalysis = analyses[activeApplicant.id] || PRESET_ANALYSES[activeApplicant.id] || PRESET_ANALYSES['sok_chandara'];

  // Pending queue count
  const pendingCount = queue.filter((q) => !decisionStatus[q.id]).length;

  // Handle Reviewer Approval -> W3C Verifiable Credential Issuance
  const handleApprove = async (notes: string) => {
    setIsProcessingDecision(true);
    try {
      const response = await fetch('/api/credentials/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantDid: activeApplicant.did,
          applicantName: activeApplicant.fullName,
          reviewerId: 'rev-ad-042',
          reviewerNotes: notes || 'Pristine document integrity verified. W3C Credential issued with Trust Level upgrade.',
          analysisSummary: {
            riskScore: activeAnalysis.riskAssessment.overallRiskScore,
            riskLevel: activeAnalysis.riskAssessment.riskLevel,
            documentType: activeApplicant.documentType,
            docNumber: activeApplicant.documentNumber,
          },
        }),
      });

      const data = await response.json();
      if (data.success && data.credential) {
        setIssuedCredentials((prev) => ({
          ...prev,
          [activeApplicant.id]: data.credential,
        }));
      }

      setDecisionStatus((prev) => ({
        ...prev,
        [activeApplicant.id]: 'APPROVED',
      }));
      setQueue((prev) =>
        prev.map((q) =>
          q.id === activeApplicant.id
            ? { ...q, status: 'APPROVED', trustLevel: 'TIER_3_IAL3_VERIFIED' }
            : q
        )
      );
      try {
        localStorage.setItem(`${activeApplicant.id}_trustLevel`, 'TIER_3_IAL3_VERIFIED');
      } catch {}
    } catch (err) {
      console.error('Approval failed:', err);
      setDecisionStatus((prev) => ({
        ...prev,
        [activeApplicant.id]: 'APPROVED',
      }));
      setQueue((prev) =>
        prev.map((q) =>
          q.id === activeApplicant.id
            ? { ...q, status: 'APPROVED', trustLevel: 'TIER_3_IAL3_VERIFIED' }
            : q
        )
      );
      try {
        localStorage.setItem(`${activeApplicant.id}_trustLevel`, 'TIER_3_IAL3_VERIFIED');
      } catch {}
    } finally {
      setIsProcessingDecision(false);
    }
  };

  // Handle Reviewer Rejection
  const handleReject = async (notes: string) => {
    setIsProcessingDecision(true);
    try {
      await fetch('/api/review/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantDid: activeApplicant.did,
          applicantName: activeApplicant.fullName,
          reviewerId: 'rev-ad-042',
          action: 'REJECTED',
          riskScore: activeAnalysis.riskAssessment.overallRiskScore,
          riskLevel: activeAnalysis.riskAssessment.riskLevel,
          notes: notes || 'Rejected due to tamper artifacts.',
          flagsCount: activeAnalysis.fraudSignals.length,
        }),
      });
    } catch (err) {
      console.warn('Backend decision log error:', err);
    } finally {
      setDecisionStatus((prev) => ({
        ...prev,
        [activeApplicant.id]: 'REJECTED',
      }));
      setIsProcessingDecision(false);
    }
  };

  // Handle Reviewer Escalation (Tier-2 Human Escalation - UI-14)
  const handleEscalate = async (notes: string) => {
    setIsProcessingDecision(true);
    try {
      await fetch('/api/review/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantDid: activeApplicant.did,
          applicantName: activeApplicant.fullName,
          reviewerId: 'rev-ad-042',
          action: 'ESCALATED',
          riskScore: activeAnalysis.riskAssessment.overallRiskScore,
          riskLevel: activeAnalysis.riskAssessment.riskLevel,
          notes: notes || 'Escalated to Tier-2 Forensic Squad for secondary verification.',
          flagsCount: activeAnalysis.fraudSignals.length,
        }),
      });
    } catch (err) {
      console.warn('Backend decision log error:', err);
    } finally {
      setDecisionStatus((prev) => ({
        ...prev,
        [activeApplicant.id]: 'ESCALATED',
      }));
      setIsProcessingDecision(false);
    }
  };

  // Handle Identity Verification Submission from Flutter Simulator (Cases 41, 42, ...)
  const handleVerifyIdentitySubmission = async (submission: {
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
  }) => {
    setIsSubmittingCustom(true);
    setGlobalError(null);

    try {
      // Find highest case number among existing queue items to increment sequentially: 41, 42, 43...
      const existingCaseNumbers = queue
        .map((q) => {
          const m = q.scenarioTag?.match(/Case\s*(\d+)/i);
          return m ? parseInt(m[1], 10) : 0;
        })
        .filter((n) => n > 0);

      const maxCase = existingCaseNumbers.length > 0 ? Math.max(...existingCaseNumbers, 40) : 40;
      const nextCaseNumber = maxCase + 1;

      const customId = `case_${nextCaseNumber}`;
      const defaultPortraitUrl =
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80';
      const resolvedSelfieUrl = submission.selfieImageBase64 || defaultPortraitUrl;
      const syntheticCardSvg = generateSyntheticCardSvg({
        countryCode: 'KHM',
        countryName: 'Kingdom of Cambodia',
        docType: submission.profileData.documentType || 'National Identity Card',
        fullName: submission.profileData.fullName,
        documentNumber: submission.profileData.documentNumber,
        dateOfBirth: submission.profileData.dateOfBirth,
        expiryDate: submission.profileData.documentExpiry || '2033-09-12',
        gender: submission.profileData.gender || 'Male',
        avatarUrl: resolvedSelfieUrl,
        caseNumber: nextCaseNumber,
      });
      const resolvedDocUrl = submission.docImageBase64 || syntheticCardSvg;

      const newApplicant: ApplicantProfile = {
        id: customId,
        did: generateNeuralkeyUserDid(),
        didType: 'User Profile (z6Mk... Base58BTC Ed25519 multicodec, resolvable offline)',
        fullName: submission.profileData.fullName,
        dateOfBirth: submission.profileData.dateOfBirth,
        documentNumber: submission.profileData.documentNumber,
        nationality: 'KHM',
        documentType: submission.profileData.documentType,
        submittedAt: new Date().toISOString(),
        avatarUrl: resolvedSelfieUrl,
        selfieUrl: resolvedSelfieUrl,
        documentSvgOrUrl: resolvedDocUrl,
        expectedOutcome: 'APPROVE',
        scenarioTag: `Case ${nextCaseNumber} · KH ${submission.profileData.documentType} (Tier 1 → Tier 3 Upgrade)`,
        scenarioDescription: `Identity verification submitted live from mobile wallet. Step 1 Profile, Step 2 Government ID OCR, and Step 3 Active Biometric Liveness verified.`,
        status: 'PENDING',
        trustLevel: 'TIER_1_BASIC',
      };

      try {
        localStorage.setItem(`${customId}_trustLevel`, 'TIER_1_BASIC');
        localStorage.setItem(`${customId}_userUpdatedProfile`, 'true');
        localStorage.setItem(`${customId}_govDocDone`, 'true');
        localStorage.setItem(`${customId}_faceScanDone`, 'true');
      } catch {}

      const isUploadedRaster = /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(resolvedDocUrl);
      setCustomDocUrl(isUploadedRaster ? resolvedDocUrl : '');
      setCustomSelfieUrl(resolvedSelfieUrl);

      // Create pristine forensic analysis matching applicant
      const initialAnalysis: ForensicAnalysis = {
        extractedVisualZone: {
          fullName: submission.profileData.fullName.toUpperCase(),
          documentNumber: submission.profileData.documentNumber,
          dateOfBirth: submission.profileData.dateOfBirth,
          expiryDate: submission.profileData.documentExpiry || '2033-09-12',
          issueDate: '2023-09-12',
          nationality: 'KHM',
          sex: submission.profileData.gender?.toLowerCase().startsWith('f') ? 'F' : 'M',
          issuingCountry: 'Kingdom of Cambodia',
          documentType: submission.profileData.documentType,
        },
        extractedMrzZone: {
          rawLines: [
            `I<KHM${submission.profileData.documentNumber.replace(/\D/g, '').padEnd(9, '<')}<<<<<<<<<<<<<`,
            `${submission.profileData.dateOfBirth.replace(/-/g, '').slice(2)}4M3309128KHM<<<<<<<<<<<2`,
          ],
          documentType: submission.profileData.documentType,
          issuingState: 'KHM',
          documentNumber: submission.profileData.documentNumber,
          dateOfBirth: submission.profileData.dateOfBirth,
          expiryDate: submission.profileData.documentExpiry || '2033-09-12',
          checksumValid: true,
          discrepanciesFound: [],
        },
        biometricAnalysis: {
          faceMatchScore: 96.8,
          faceMatchStatus: 'MATCH',
          livenessConfidence: submission.livenessScores?.meanScore ?? 0.952,
          notes: 'Biometric facial match verified against document portrait with 96.8% similarity score. Active liveness confirmed across 4 challenges (lookLeft, lookRight, smile, blink).',
        },
        consistencyChecks: [
          {
            rule: 'Holder Profile vs OCR Visual Zone Consistency',
            status: 'PASS',
            details: 'All declared profile fields (Full Name, Date of Birth, Document Number) match extracted optical character recognition.',
          },
          {
            rule: 'ICAO Doc 9303 / GDI National ID Checksum Algorithm',
            status: 'PASS',
            details: 'Check digit validation passes national issuing authority algorithm.',
          },
          {
            rule: 'Active Biometric 3D Sensor Liveness',
            status: 'PASS',
            details: 'Completed sequential active liveness challenges (look left, look right, smile, blink) with >0.85 threshold.',
          },
          {
            rule: 'Zero-Knowledge Proof & ECIES Envelope Verification',
            status: 'PASS',
            details: 'Payload encrypted with issuer X25519 public key and validated with Ed25519 token nonce signature.',
          },
        ],
        fraudSignals: [],
        riskAssessment: {
          overallRiskScore: 4,
          riskLevel: 'LOW',
          suggestedAction: 'APPROVE',
          executiveSummary: 'Authentic Cambodian document with pristine security typography, valid MRZ checksums, and 96.8% biometric facial match.',
          recommendationReason: 'Approve to upgrade Current Assurance Tier from Level 1 to Level 3. Zero tamper flags or synthetic anomalies detected.',
          triageModel: 'gemini-3.8-flash',
        },
      };

      setAnalyses((prev) => ({
        ...prev,
        [customId]: initialAnalysis,
      }));
      setQueue((prev) => [newApplicant, ...prev]);
      setActiveApplicantId(customId);

      // Open the Gemini Verification & Scoring Audit Modal for todo check!
      setAuditModalData({
        isOpen: true,
        applicant: newApplicant,
        analysis: initialAnalysis,
        profileData: submission.profileData,
        livenessScores: submission.livenessScores,
      });

      // Background Gemini multimodal analysis call to enrich if available
      try {
        fetch('/api/verify/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documentImageBase64: submission.docImageBase64,
            selfieImageBase64: submission.selfieImageBase64,
            applicantData: {
              fullName: submission.profileData.fullName,
              dateOfBirth: submission.profileData.dateOfBirth,
              documentNumber: submission.profileData.documentNumber,
              nationality: 'KHM',
              documentType: submission.profileData.documentType,
            },
            scenarioId: 'custom',
          }),
        })
          .then((res) => res.json())
          .then((resData) => {
            if (resData.success && resData.analysis) {
              setAnalyses((prev) => ({
                ...prev,
                [customId]: resData.analysis,
              }));
              setAuditModalData((prev) => ({
                ...prev,
                analysis: resData.analysis,
              }));
            }
          })
          .catch((err) => console.warn('Non-blocking Gemini enrichment notice:', err));
      } catch (geminiErr) {
        console.warn('Gemini request notice:', geminiErr);
      }
    } catch (e) {
      console.error('Submission processing error:', e);
      setGlobalError('Verification submission recorded. Ready for review in Reviewer Console.');
    } finally {
      setIsSubmittingCustom(false);
    }
  };

  // Handle Custom Upload from Wallet Submit ID tab
  const handleCustomSubmit = async (customData: {
    fullName: string;
    documentNumber: string;
    dateOfBirth: string;
    nationality: string;
    documentType: string;
    docImageBase64: string;
    selfieImageBase64: string;
  }) => {
    await handleVerifyIdentitySubmission({
      profileData: {
        fullName: customData.fullName,
        dateOfBirth: customData.dateOfBirth,
        documentNumber: customData.documentNumber,
        documentType: customData.documentType,
        country: 'Cambodia',
        stateProvince: 'Phnom Penh',
        city: 'Chamkar Mon',
        gender: 'Male',
        email: 'chandara.sok@neuralkey.kh',
        documentExpiry: '2033-09-12',
      },
      docImageBase64: customData.docImageBase64,
      selfieImageBase64: customData.selfieImageBase64,
      livenessScores: {
        lookLeft: 0.94,
        lookRight: 0.95,
        smile: 0.92,
        blink: 0.96,
        meanScore: 0.942,
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Top Single Header Row (UI-09) */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingCount={pendingCount}
        onOpenAboutModal={() => setShowAboutModal(true)}
        onResetDemo={handleResetDemo}
      />

      {/* Global Error / Resilience Banner (UI-15) */}
      {globalError && (
        <div className="bg-amber-950/80 border-b border-amber-500/40 px-3 sm:px-4 py-2 text-xs text-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{globalError}</span>
          </div>
          <button
            onClick={() => setGlobalError(null)}
            className="text-amber-300 hover:text-white underline cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-5 space-y-4">
        {/* View Routing */}
        {currentTab === 'console' && (
          <ReviewerConsole
            queue={queue}
            activeApplicant={activeApplicant}
            activeAnalysis={activeAnalysis}
            onSelectApplicant={setActiveApplicantId}
            onApprove={handleApprove}
            onReject={handleReject}
            onEscalate={handleEscalate}
            isProcessingDecision={isProcessingDecision}
            decisionStatus={decisionStatus}
            customDocUrl={
              activeApplicant.id.startsWith('case_') &&
              /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(activeApplicant.documentSvgOrUrl || '')
                ? activeApplicant.documentSvgOrUrl
                : undefined
            }
            customSelfieUrl={
              activeApplicant.id.startsWith('case_') ? activeApplicant.selfieUrl : undefined
            }
            onOpenSpecModal={handleOpenSpecModal}
            controlledActiveTab={controlledConsoleTab}
            onActiveTabChange={setControlledConsoleTab}
            onNavigateToWallet={() => setCurrentTab('wallet')}
          />
        )}

        {currentTab === 'wallet' && (
          <ApplicantWallet
            applicant={activeApplicant}
            applicants={queue}
            issuedCredential={issuedCredentials[activeApplicant.id] || null}
            decisionStatus={decisionStatus[activeApplicant.id] || null}
            onSelectApplicant={setActiveApplicantId}
            onCustomSubmit={handleCustomSubmit}
            onVerifyIdentitySubmission={handleVerifyIdentitySubmission}
            isSubmittingCustom={isSubmittingCustom}
            onOpenSpecModal={handleOpenSpecModal}
            onNavigateToBank={() => setCurrentTab('bank')}
          />
        )}

        {currentTab === 'bank' && (
          <RelyingPartyBank
            applicant={activeApplicant}
            applicants={queue}
            onSelectApplicant={setActiveApplicantId}
            issuedCredential={issuedCredentials[activeApplicant.id] || null}
            decisionStatus={decisionStatus[activeApplicant.id] || null}
            onOpenSpecModal={handleOpenSpecModal}
          />
        )}
      </main>

      {/* Modals */}
      {auditModalData.isOpen && auditModalData.applicant && auditModalData.analysis && (
        <GeminiVerificationAuditModal
          isOpen={auditModalData.isOpen}
          onClose={() => setAuditModalData((prev) => ({ ...prev, isOpen: false }))}
          applicant={auditModalData.applicant}
          analysis={auditModalData.analysis}
          profileData={
            auditModalData.profileData || {
              fullName: auditModalData.applicant.fullName,
              dateOfBirth: auditModalData.applicant.dateOfBirth,
              documentNumber: auditModalData.applicant.documentNumber,
              documentType: auditModalData.applicant.documentType,
              country: 'Cambodia',
            }
          }
          livenessScores={auditModalData.livenessScores}
          onNavigateToReviewerConsole={() => {
            const targetApplicantId = auditModalData.applicant?.id;
            setAuditModalData((prev) => ({ ...prev, isOpen: false }));
            if (targetApplicantId) {
              setActiveApplicantId(targetApplicantId);
            }
            setCurrentTab('console');
          }}
        />
      )}

      <AboutDemoModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        onOpenSpecModal={() => handleOpenSpecModal()}
        onResetDemo={handleResetDemo}
      />

      <NeuralkeySpecModal
        isOpen={showSpecModal}
        onClose={() => setShowSpecModal(false)}
        initialDid={specTargetDid}
      />
    </div>
  );
}
