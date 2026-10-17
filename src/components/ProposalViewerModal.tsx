import React, { useState } from 'react';
import {
  FileText,
  ChevronRight,
  CheckCircle2,
  Shield,
  Sparkles,
  Cpu,
  Award,
  ExternalLink,
  ArrowRight,
  Layers,
  Zap,
  Image,
  Download,
  Eye,
  Check,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { NeuralkeyLogo } from './NeuralkeyLogo';

interface ProposalViewerModalProps {
  onGoToConsole: () => void;
  onGoToWallet: () => void;
  onGoToBank: () => void;
  onLaunchDemoFlow?: () => void;
}

export const ProposalViewerModal: React.FC<ProposalViewerModalProps> = ({
  onGoToConsole,
  onGoToWallet,
  onGoToBank,
  onLaunchDemoFlow,
}) => {
  const [activeMainSection, setActiveMainSection] = useState<'slides' | 'workflow_captures'>('slides');
  const [activeSlide, setActiveSlide] = useState<number>(1);
  const [selectedWorkflowStage, setSelectedWorkflowStage] = useState<number>(1);

  const slides = [
    {
      num: 1,
      title: 'Title & Theme',
      subtitle: 'Neuralkey Verification Assistant',
      content: {
        heading: 'Neuralkey Verification Assistant',
        subheading:
          'Gemini-assisted identity proofing that helps human reviewers catch fraud faster, so verified identities become reusable and portable',
        theme: 'Theme: BFSI: Intelligent Risk, Fraud & Financial Experiences',
        footer: 'AI Builder Cup 2026 | Team Neuralkey | neuralkey.neuralsh.com',
        highlights: [
          'BFSI domain: Banking, Financial Services & Insurance',
          'Human-in-the-loop AI assistance, not blind automation',
          'Decentralized W3C Verifiable Credentials with Trust Level upgrade',
        ],
      },
    },
    {
      num: 2,
      title: 'The Problem',
      subtitle: 'Proving who someone is costs too much',
      content: {
        heading: 'The problem: proving who someone is costs too much',
        subheading:
          'Identity checks sit at the centre of banking and financial services, and they are slow, costly and easy to fool.',
        columns: [
          {
            title: 'KYC cost and friction',
            desc: '70% of financial institutions lost clients to slow onboarding in the past year, up from 48% in 2023. Firms spend about $72.9M a year on AML/KYC operations, and abandonment averages around 10%. [1]',
            sourcePill: 'Fenergo 2025',
          },
          {
            title: 'Synthetic identity fraud',
            desc: 'The US regulator FinCEN warns that criminals use generative AI to create fake ID documents, photos and videos that get past customer verification, and reports a rise in suspicious-activity filings describing it. [2]',
            sourcePill: 'FinCEN Alert FIN-2024-Alert004',
          },
          {
            title: 'Penalties & data breaches',
            desc: 'A data breach in the financial sector costs $5.56M on average, the second highest of any industry. Highly regulated sectors also pay more in fines and litigation. [3]',
            sourcePill: 'IBM Cost of Data Breach 2025',
          },
        ],
        sources: [
          '[1] Fenergo, Financial Crime Industry Trends 2025 (600 executives, Aug 2025): resources.fenergo.com/reports/financial-crime-industry-trends-2025',
          '[2] FinCEN Alert FIN-2024-Alert004, Nov 2024: fincen.gov/.../FinCEN-Alert-DeepFakes-Alert508FINAL.pdf',
          '[3] IBM, Cost of a Data Breach Report 2025: ibm.com/reports/data-breach',
        ],
      },
    },
    {
      num: 3,
      title: 'Our Solution',
      subtitle: 'An identity platform with AI built in',
      content: {
        heading: 'Our solution: an identity platform with AI built in',
        subheading:
          'Neuralkey pairs a self-sovereign identity wallet with a Gemini-assisted reviewer console, designed together from the ground up.',
        identityFoundation: [
          'did:neuralkey method: asymmetric role-based DIDs (offline Ed25519 z6Mk... for Users, HTTPS .well-known for Issuers), W3C Member Submission: neuralkey.neuralsh.com/neuralkey-spec-page',
          'Mobile wallet: keys generated in Secure Enclave / Keystore, biometric-gated QR login',
          'Encrypted document + liveness submission, protected end-to-end',
          'Verification issues a W3C Verifiable Credential bound to the DID',
        ],
        aiVerificationLayer: [
          'Reviewer console on Google Cloud Run',
          'Gemini reads the ID image and extracts fields',
          'Automated consistency checks and fraud-signal flags, each with an explanation',
          'Risk summary and suggested action: approve, reject or escalate',
          'Reviewer stays the final decision-maker',
        ],
      },
    },
    {
      num: 4,
      title: 'AI Tools',
      subtitle: 'What we use and why it matters',
      content: {
        heading: 'AI tools: what we use and why it matters',
        subheading:
          'Each Google AI component does work that rules and templates cannot, and each one is visible in the demo.',
        quadrants: [
          {
            number: '1',
            tag: 'Gemini multimodal: read',
            text: 'Gemini reads ID images of any layout and returns name, dates, numbers and MRZ as schema-constrained JSON, with no per-country OCR templates to maintain.',
          },
          {
            number: '2',
            tag: 'Agents (Google ADK): reason',
            text: 'Specialist agents run extraction, cross-checks (MRZ, expiry, applicant input) and fraud-signal analysis in parallel, using tool calls for deterministic rules.',
          },
          {
            number: '3',
            tag: 'Explainable flags: trust',
            text: 'Every flag names the field or image region behind it, in plain language, so a reviewer verifies in seconds instead of trusting an opaque score.',
          },
          {
            number: '4',
            tag: 'Cloud Run: scale, human decides',
            text: 'Gemini Flash triages every case and Gemini Pro handles escalations to control cost. The reviewer approves, and approval issues the Verifiable Credential.',
          },
        ],
      },
    },
    {
      num: 5,
      title: 'Prototype Demo Flow',
      subtitle: 'What the 3-minute demo shows',
      content: {
        heading: 'Prototype: what the 3-minute demo shows',
        subheading:
          'A working reviewer console deployed on Google Cloud Run, using synthetic test documents only.',
        flow: [
          { num: '1', title: 'Applicant submits', desc: 'Wallet sends a synthetic ID and selfie' },
          { num: '2', title: 'Gemini analyses', desc: 'Fields extracted, checks run' },
          { num: '3', title: 'Reviewer sees', desc: 'Flags, evidence and risk summary' },
          { num: '4', title: 'Reviewer decides', desc: 'Approve, reject or flag' },
          {
            num: '5',
            title: 'Credential issued',
            desc: 'Verifiable Credential bound to the DID & Upgrade Trust Level',
          },
        ],
        stack:
          'Built with: Google AI Studio (prototyping and prompt design), Gemini (Flash and Pro) on Vertex AI, Google Agent Development Kit (ADK), Google Cloud Run, and Neuralkey\'s own credential issuer. Synthetic data only',
      },
    },
    {
      num: 6,
      title: 'Impact & Feasibility',
      subtitle: 'Scalability & Responsible AI',
      content: {
        heading: 'Impact, feasibility and scalability',
        columns: [
          {
            title: 'Impact',
            desc: 'Faster reviewer decisions, lower KYC cost, and less onboarding drop-off once deployed. Verify once, then reuse a portable credential instead of repeating KYC at every service.',
          },
          {
            title: 'Feasibility',
            desc: 'Built on open, proven standards (W3C digital IDs and credentials, OpenID Connect login) and on Google\'s Gemini and Cloud Run. The hard security and infrastructure problems are already solved; our job is putting them together well, not inventing them.',
          },
          {
            title: 'Scalability',
            desc: 'Cloud Run automatically adds capacity as demand grows. A regional network of trained, certified reviewers is built in from day one, so verification can expand one market at a time.',
          },
        ],
        responsibleAi:
          'Responsible AI: Gemini assists and explains but never approves alone. Real deployments would need a data-processing review for ID images, and Gemini does not replace liveness or deepfake detection.',
      },
    },
    {
      num: 7,
      title: 'After the Cup',
      subtitle: 'From prototype to pilot',
      content: {
        heading: 'After the Cup: from prototype to pilot',
        subheading:
          'This hackathon lays the full foundation: digital identity, one-login access and AI-assisted verification, built together as one system.',
        roadmap: [
          {
            stage: 'Now',
            text: 'A working Gemini-assisted reviewer console on Cloud Run, tested with synthetic documents and shown in the 3-minute demo.',
          },
          {
            stage: 'Next',
            text: 'Register did:neuralkey with the W3C standards body, improve the checks using reviewer feedback, and strengthen privacy protections.',
          },
          {
            stage: 'Then',
            text: 'Pilot with a relying party in banking or financial services, measuring review time and fraud caught.',
          },
        ],
      },
    },
  ];

  const workflowStages = [
    {
      num: 1,
      title: 'Applicant Submits an ID and Selfie',
      stageName: 'Stage 1: Mobile KYC Onboarding',
      filename: '/1_applicant_submits_id_and_selfie.png',
      badge: 'Applicant Wallet View',
      desc: 'Mobile-first biometric wallet where users hold their private keys in Secure Enclave, scan their physical ID card (National ID or Passport), and complete a live 3D facial depth check. Documents and biometric vectors are end-to-end encrypted before upload to Google Cloud Run.',
      features: [
        'Decentralized Ed25519 user keys generated directly on client',
        'Direct live camera preview with 3D liveness boundary detection',
        '20 authentic ASEAN identity formats with native scripts and chip attributes',
      ],
      actionLabel: 'Open Applicant Wallet',
      actionFn: onGoToWallet,
    },
    {
      num: 2,
      title: 'Gemini Analyzes the ID Document',
      stageName: 'Stage 2: Gemini Multi-Modal Analysis / Agentic Pipeline',
      filename: '/2_gemini_analyzes_the_id.png',
      badge: 'Multimodal + Google ADK',
      desc: 'Gemini 3.8 Flash reads unstructured document visual zones without rigid OCR templates. Three parallel Google ADK specialist agents execute deterministic MRZ checksums, micro-kerning raster inspection, and cross-checks against applicant self-reported data.',
      features: [
        'Schema-constrained JSON field extraction directly from high-resolution image',
        'Parallel execution: Document Specialist + Forensics Specialist + Consistency Specialist',
        'Deterministic tool-call validation for ICAO 9303 MRZ 7-3-1 check digit algorithms',
      ],
      actionLabel: 'View ADK Agent Pipeline',
      actionFn: onGoToConsole,
    },
    {
      num: 3,
      title: 'Reviewer Sees Flag and Risk Summary',
      stageName: 'Stage 3: Reviewer Forensics Console',
      filename: '/3_reviewer_sees_flag_and_risk_summary.png',
      badge: 'Explainable AI & Human Decision',
      desc: 'Human-in-the-loop reviewer interface highlighting explainable fraud signals in plain language (e.g. font substitution, micro-kerning artifacts, synthetic face seam boundaries). Reviewers can Approve, Reject, or Escalate to Tier-2 with Gemini Pro.',
      features: [
        'Plain-language risk breakdown eliminating opaque black-box AI scores',
        'Visual zone ROI inspector with tamper heatmaps and zoom forensics',
        'One-click human reviewer decision with automated immutable audit record',
      ],
      actionLabel: 'Launch Reviewer Console',
      actionFn: onGoToConsole,
    },
    {
      num: 4,
      title: 'Credential Issued After Approval',
      stageName: 'Stage 4: Verifiable Credential & Audit Trail',
      filename: '/4_credential_issued_after_approval.png',
      badge: 'W3C Verifiable Credential',
      desc: 'Upon human reviewer approval, the Neuralkey Issuer signs a W3C-compliant Verifiable Credential cryptographically bound to the applicant\'s did:neuralkey. The mobile wallet upgrades to Tier 3 Verified Identity, enabling 1-click passwordless biometric banking KYC.',
      features: [
        'W3C Verifiable Credential signed with Ed25519Signature2020 suite',
        'Trust Level upgrade from Tier 0 Unverified to Tier 3 Biometric Identity',
        'Tamper-evident SHA-256 hash-chained ledger for regulatory compliance',
      ],
      actionLabel: 'Test Relying Party Bank',
      actionFn: onGoToBank,
    },
  ];

  const current = slides[activeSlide - 1];
  const currentStage = workflowStages[selectedWorkflowStage - 1];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Banner Navigation: Pitch Deck vs Workflow Prototype Captures */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-md">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                OFFICIAL DOCUMENTATION
              </span>
              <span className="text-xs text-slate-400 font-mono">AI Builder Cup 2026</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold text-white flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-cyan-400" />
              <span>Neuralkey Proposal Document & Architecture Guide</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Complete pitch deck, technical specifications, and high-resolution workflow screenshots
              defining the prototype architecture.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onLaunchDemoFlow && (
              <button
                onClick={onLaunchDemoFlow}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Play 3-Min Interactive Demo</span>
              </button>
            )}

            <a
              href="/workflow_prototype_images.html"
              target="_blank"
              rel="noreferrer"
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
              title="Open standalone HTML capture gallery"
            >
              <span>Raw Document HTML</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Section Switcher Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-800 pt-3">
          <button
            onClick={() => setActiveMainSection('slides')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeMainSection === 'slides'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-300" />
            <span>Official Pitch Deck (7 Slides)</span>
          </button>

          <button
            onClick={() => setActiveMainSection('workflow_captures')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeMainSection === 'workflow_captures'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Image className="w-4 h-4 text-emerald-300" />
            <span>Workflow Prototype Captures (4 Retina Stages)</span>
          </button>
        </div>
      </div>

      {/* SECTION 1: PITCH DECK SLIDES (7 SLIDES) */}
      {activeMainSection === 'slides' && (
        <div className="space-y-4">
          {/* Slide Selector Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-xs">
            {slides.map((s) => (
              <button
                key={s.num}
                onClick={() => setActiveSlide(s.num)}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                  activeSlide === s.num
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span className="font-mono text-[10px] block opacity-80">Slide {s.num}</span>
                <span className="font-semibold text-[11px] truncate block">{s.title}</span>
              </button>
            ))}
          </div>

          {/* Slide Canvas Display */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/70 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl min-h-[480px] flex flex-col justify-between relative overflow-hidden">
            {/* Accent watermark */}
            <div className="absolute top-6 right-8 text-8xl font-black text-slate-800/20 pointer-events-none select-none font-mono">
              0{current.num}
            </div>

            {/* Slide Content */}
            <div className="space-y-6 relative z-10">
              <div>
                <span className="text-xs uppercase tracking-widest text-blue-400 font-bold font-mono">
                  AI BUILDER CUP 2026 · BFSI THEME
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 tracking-tight">
                  {current.content.heading}
                </h1>
                <p className="text-slate-300 text-sm sm:text-base mt-2 max-w-3xl leading-relaxed">
                  {current.content.subheading}
                </p>
              </div>

              {/* Slide 1 Specific */}
              {current.num === 1 && (
                <div className="space-y-4 pt-4">
                  <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-blue-200 text-sm font-semibold flex items-center justify-between">
                    <span>{current.content.theme}</span>
                    <span className="text-xs font-mono text-cyan-400">Team Neuralkey</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {current.content.highlights?.map((h, i) => (
                      <div
                        key={i}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Slide 2 Specific (Columns + Rigorous FinCEN/IBM Sources) */}
              {current.num === 2 && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {current.content.columns?.map((col, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-bold text-white text-sm text-cyan-300">{col.title}</h3>
                            {'sourcePill' in col && (col as any).sourcePill && (
                              <span className="text-[9px] font-mono bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800">
                                {(col as any).sourcePill}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">{col.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sources footer box */}
                  {current.content.sources && (
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
                      <div className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">
                        Official Regulatory & Industry Sources:
                      </div>
                      {current.content.sources.map((s, idx) => (
                        <div key={idx} className="leading-relaxed">
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Slide 3 Specific (Identity & SSO foundation vs AI-assisted verification layer) */}
              {current.num === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3">
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                    <h3 className="text-sm font-bold text-cyan-400 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-cyan-400" />
                      <span>Identity & SSO foundation</span>
                    </h3>
                    <ul className="space-y-2.5 text-xs text-slate-300">
                      {current.content.identityFoundation?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-cyan-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-blue-950/50 border border-blue-500/50 space-y-3 shadow-lg shadow-blue-950/50">
                    <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>AI-assisted verification layer</span>
                    </h3>
                    <ul className="space-y-2.5 text-xs text-slate-200">
                      {current.content.aiVerificationLayer?.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Slide 4 Specific (4 Quadrants with Google ADK Agents and Gemini Flash/Pro) */}
              {current.num === 4 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                  {current.content.quadrants?.map((quad, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-500/20 text-cyan-400 font-mono font-bold text-xs flex items-center justify-center border border-blue-500/30">
                          {quad.number}
                        </span>
                        <div className="font-bold text-sm text-cyan-300">{quad.tag}</div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans">{quad.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Slide 5 Specific (5-step demo flow + Trust Level Upgrade) */}
              {current.num === 5 && (
                <div className="space-y-4 pt-3">
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    {current.content.flow?.map((item, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-1 relative"
                      >
                        <span className="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center mx-auto mb-2">
                          {item.num}
                        </span>
                        <div className="font-bold text-xs text-white">{item.title}</div>
                        <p className="text-[11px] text-slate-400 leading-tight">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 text-center font-mono flex items-center justify-between">
                    <span>{current.content.stack}</span>
                    {onLaunchDemoFlow && (
                      <button
                        onClick={onLaunchDemoFlow}
                        className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs ml-4 shrink-0 cursor-pointer"
                      >
                        Play Demo Flow
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Slide 6 Specific (Impact, Feasibility, Scalability) */}
              {current.num === 6 && (
                <div className="space-y-4 pt-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {current.content.columns?.map((col, i) => (
                      <div
                        key={i}
                        className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2"
                      >
                        <h3 className="font-bold text-sm text-cyan-300">{col.title}</h3>
                        <p className="text-xs text-slate-300 leading-relaxed">{col.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs leading-relaxed">
                    <strong>{current.content.responsibleAi}</strong>
                  </div>
                </div>
              )}

              {/* Slide 7 Specific (Roadmap) */}
              {current.num === 7 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3">
                  {current.content.roadmap?.map((r, i) => (
                    <div key={i} className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {r.stage}
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed pt-1">{r.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Meta & Controls */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-6 mt-6 border-t border-slate-800/80 text-xs text-slate-500 font-mono">
              <span>AI Builder Cup 2026 | Team Neuralkey | neuralkey.neuralsh.com</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveSlide((prev) => Math.max(prev - 1, 1))}
                  disabled={activeSlide === 1}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800"
                >
                  Previous
                </button>
                <span className="font-semibold text-white px-2">
                  {activeSlide} / {slides.length}
                </span>
                <button
                  onClick={() => setActiveSlide((prev) => Math.min(prev + 1, slides.length))}
                  disabled={activeSlide === slides.length}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border border-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: WORKFLOW PROTOTYPE CAPTURES (4 STAGES FROM DOCUMENT) */}
      {activeMainSection === 'workflow_captures' && (
        <div className="space-y-6">
          {/* Stage Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {workflowStages.map((stage) => {
              const isSelected = selectedWorkflowStage === stage.num;
              return (
                <button
                  key={stage.num}
                  onClick={() => setSelectedWorkflowStage(stage.num)}
                  className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-950/80 border-blue-500 ring-1 ring-blue-500/40 text-white shadow-lg shadow-blue-950/50'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {stage.num}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                      {stage.badge}
                    </span>
                  </div>
                  <div className="font-bold text-xs sm:text-sm text-white mb-1 line-clamp-1">
                    {stage.title}
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2">
                    {stage.stageName}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Stage Hero & High-Resolution Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-5 h-5 rounded-md bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                    {currentStage.num}
                  </span>
                  <span className="text-xs font-bold text-blue-400 font-mono">
                    {currentStage.stageName}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {currentStage.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                  {currentStage.desc}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={currentStage.actionFn}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                >
                  <span>{currentStage.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <a
                  href={currentStage.filename}
                  download={currentStage.filename.replace('/', '')}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
                  title="Download Retina PNG screenshot"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download Retina PNG</span>
                </a>
              </div>
            </div>

            {/* High-Resolution Capture Display */}
            <div className="p-4 sm:p-6 bg-slate-950/70 flex flex-col items-center justify-center">
              <div className="w-full max-w-5xl rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
                <img
                  src={currentStage.filename}
                  alt={currentStage.title}
                  className="w-full h-auto object-contain block hover:opacity-95 transition-opacity"
                  loading="lazy"
                />
              </div>

              {/* Bullet Features directly from documentation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full max-w-5xl mt-6">
                {currentStage.features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
