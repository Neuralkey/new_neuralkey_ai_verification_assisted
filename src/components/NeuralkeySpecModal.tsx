import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  Zap,
  Lock,
  Globe,
  Copy,
  Check,
  Cpu,
  Key,
  Layers,
  Sparkles,
  ArrowRight,
  Code2,
} from 'lucide-react';
import { resolveNeuralkeyDid } from '../utils/didResolver';
import { DidResolutionResult } from '../types';
import { NeuralkeyLogo } from './NeuralkeyLogo';

interface NeuralkeySpecModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDid?: string;
}

export const NeuralkeySpecModal: React.FC<NeuralkeySpecModalProps> = ({
  isOpen,
  onClose,
  initialDid = 'did:neuralkey:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK',
}) => {
  const [selectedDid, setSelectedDid] = useState<string>(initialDid);
  const [customInput, setCustomInput] = useState<string>(initialDid);
  const [resolutionResult, setResolutionResult] = useState<DidResolutionResult>(() =>
    resolveNeuralkeyDid(initialDid)
  );
  const [resolveError, setResolveError] = useState<string | null>(null);
  const [copiedDoc, setCopiedDoc] = useState<boolean>(false);
  const [activeSpecTab, setActiveSpecTab] = useState<'resolver' | 'architecture' | 'crud' | 'security'>('resolver');

  if (!isOpen) return null;

  const handleResolve = (targetDid: string) => {
    setSelectedDid(targetDid);
    setCustomInput(targetDid);
    setResolveError(null);
    try {
      const res = resolveNeuralkeyDid(targetDid);
      setResolutionResult(res);
    } catch (e: any) {
      setResolveError(e.message || 'Invalid did:neuralkey identifier');
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(resolutionResult.didDocument, null, 2));
    setCopiedDoc(true);
    setTimeout(() => setCopiedDoc(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center p-1.5">
                <NeuralkeyLogo className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  The Neuralkey DID Method (<code className="text-cyan-400 font-mono">did:neuralkey</code>)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  W3C SUBMISSION
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official W3C Member Submission • Asymmetric Role-Based Decentralized Identifier Architecture
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://neuralkey.neuralsh.com/neuralkey-spec-page"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 cursor-pointer transition-colors"
            >
              <span>Official Spec Page</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 sm:px-5 pt-3 border-b border-slate-800 bg-slate-950/40 text-xs overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveSpecTab('resolver')}
            className={`px-3 py-2 border-b-2 font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeSpecTab === 'resolver'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Interactive Resolver Sandbox</span>
          </button>
          <button
            onClick={() => setActiveSpecTab('architecture')}
            className={`px-3 py-2 border-b-2 font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeSpecTab === 'architecture'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Asymmetric Architecture & ABNF</span>
          </button>
          <button
            onClick={() => setActiveSpecTab('crud')}
            className={`px-3 py-2 border-b-2 font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeSpecTab === 'crud'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>CRUD & Key Rotation</span>
          </button>
          <button
            onClick={() => setActiveSpecTab('security')}
            className={`px-3 py-2 border-b-2 font-semibold cursor-pointer transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
              activeSpecTab === 'security'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Privacy & Zero Tracking</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 p-5 overflow-y-auto space-y-5 text-slate-300 text-xs">
          {activeSpecTab === 'resolver' && (
            <div className="space-y-4">
              {/* Presets bar */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Select Specification Test Identifiers:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() =>
                      handleResolve('did:neuralkey:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK')
                    }
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      selectedDid === 'did:neuralkey:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
                        ? 'bg-blue-600/20 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-white">
                      <span>Elena Rostova (Applicant)</span>
                      <span className="font-mono text-[10px] text-cyan-400">Branch A: User Profile</span>
                    </div>
                    <code className="text-[10px] font-mono text-slate-400 truncate block mt-0.5">
                      did:neuralkey:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
                    </code>
                  </button>

                  <button
                    onClick={() =>
                      handleResolve('did:neuralkey:z6MkwAkLNUmKBRha3s2NzRWFFsDSXJ2QF44w9AT4CmSBuU41')
                    }
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      selectedDid === 'did:neuralkey:z6MkwAkLNUmKBRha3s2NzRWFFsDSXJ2QF44w9AT4CmSBuU41'
                        ? 'bg-blue-600/20 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-white">
                      <span>Marcus Vance / Spec Example</span>
                      <span className="font-mono text-[10px] text-cyan-400">Branch A: User Profile</span>
                    </div>
                    <code className="text-[10px] font-mono text-slate-400 truncate block mt-0.5">
                      did:neuralkey:z6MkwAkLNUmKBRha3s2NzRWFFsDSXJ2QF44w9AT4CmSBuU41
                    </code>
                  </button>

                  <button
                    onClick={() => handleResolve('did:neuralkey:neuralkey.neuralsh.com')}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      selectedDid === 'did:neuralkey:neuralkey.neuralsh.com'
                        ? 'bg-blue-600/20 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-white">
                      <span className="flex items-center gap-1.5">
                        <NeuralkeyLogo className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Neuralkey Trust Anchor (Official)</span>
                      </span>
                      <span className="font-mono text-[10px] text-emerald-400">Branch B: Issuer FQDN</span>
                    </div>
                    <code className="text-[10px] font-mono text-slate-400 truncate block mt-0.5">
                      did:neuralkey:neuralkey.neuralsh.com
                    </code>
                  </button>

                  <button
                    onClick={() => handleResolve('did:neuralkey:bank.apexcorp.com')}
                    className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                      selectedDid === 'did:neuralkey:bank.apexcorp.com'
                        ? 'bg-blue-600/20 border-cyan-500 text-cyan-200 ring-1 ring-cyan-500/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-white">
                      <span>Apex Global Bank (Relying Party)</span>
                      <span className="font-mono text-[10px] text-emerald-400">Branch B: Issuer FQDN</span>
                    </div>
                    <code className="text-[10px] font-mono text-slate-400 truncate block mt-0.5">
                      did:neuralkey:bank.apexcorp.com
                    </code>
                  </button>
                </div>
              </div>

              {/* Input Bar */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Enter did:neuralkey:..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleResolve(customInput)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold cursor-pointer transition-colors shadow-sm text-xs flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Resolve</span>
                </button>
              </div>

              {resolveError && (
                <div className="p-2.5 rounded-xl bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-center justify-between">
                  <span>{resolveError}</span>
                  <button
                    onClick={() => setResolveError(null)}
                    className="text-red-400 hover:text-white text-[11px] cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Branch Decision Banner */}
              <div
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  resolutionResult.branch === 'BRANCH_A_USER_OFFLINE'
                    ? 'bg-cyan-950/40 border-cyan-500/40'
                    : 'bg-indigo-950/40 border-indigo-500/40'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        resolutionResult.branch === 'BRANCH_A_USER_OFFLINE'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                      }`}
                    >
                      {resolutionResult.branch === 'BRANCH_A_USER_OFFLINE'
                        ? 'BRANCH A: USER PROFILE'
                        : 'BRANCH B: ISSUER PROFILE'}
                    </span>
                    <span className="font-semibold text-white text-xs">
                      {resolutionResult.branch === 'BRANCH_A_USER_OFFLINE'
                        ? 'Offline Deterministic Derivation'
                        : 'Domain-Anchored HTTPS Resolution'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    {resolutionResult.metadata.trackingRisk}
                  </p>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-mono shrink-0">
                  <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-slate-400 block text-[9px]">RESOLUTION LATENCY</span>
                    <span className="font-bold text-emerald-400">
                      {resolutionResult.branch === 'BRANCH_A_USER_OFFLINE'
                        ? '0.00 ms (Zero-Network)'
                        : `${resolutionResult.latencyMs} ms`}
                    </span>
                  </div>
                  <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-center">
                    <span className="text-slate-400 block text-[9px]">NETWORK CALLS</span>
                    <span className="font-bold text-cyan-400">
                      {resolutionResult.networkRequestsRequired}
                    </span>
                  </div>
                </div>
              </div>

              {/* Resolved DID Document (JSON-LD) */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-slate-300 font-bold flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>W3C Standard DID Document (JSON-LD)</span>
                  </span>
                  <button
                    onClick={handleCopyJson}
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium cursor-pointer"
                  >
                    {copiedDoc ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 bg-slate-900/90 rounded-lg border border-slate-800/80 font-mono text-[10.5px] text-slate-200 overflow-x-auto max-h-72 leading-relaxed">
                  {JSON.stringify(resolutionResult.didDocument, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {activeSpecTab === 'architecture' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <span>The Asymmetric Dual-Role Architecture</span>
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  In decentralized trust networks, Regular Users (Holders) and Issuers (Organizations) require fundamentally contradictory identity properties. Forcing both into a single model creates severe privacy and scalability flaws:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-800/50 space-y-1">
                    <span className="font-bold text-cyan-300 block text-xs">1. Regular Users (Holders)</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                      <li>Require zero-latency, offline verification</li>
                      <li>Require absolute privacy (zero "phone home" tracking)</li>
                      <li>No public discoverability or routing required</li>
                      <li>Derived cryptographically via <code className="text-cyan-400 font-mono">did:key</code> model</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/50 space-y-1">
                    <span className="font-bold text-indigo-300 block text-xs">2. Issuers (Financial Institutions)</span>
                    <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                      <li>Require high public trust and real-world domain anchoring</li>
                      <li>Must support key rotation without invalidating past proofs</li>
                      <li>Strict organizational revocation capabilities</li>
                      <li>Anchored via <code className="text-indigo-400 font-mono">did:web</code> HTTPS model</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* ABNF Grammar */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white text-xs block font-mono">ABNF Method Grammar:</span>
                <pre className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-[11px] text-cyan-300 leading-relaxed">
{`neuralkey-did  = "did:neuralkey:" (user-profile / issuer-profile)
user-profile    = multibase-base58-btc-encoded-value  ; Begins with 'z6Mk' (Ed25519 multicodec 0xed01)
issuer-profile  = fully-qualified-domain-name *(":" path-segment)`}
                </pre>
              </div>

              {/* Identifier Generation Rules */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="font-bold text-white text-xs block">Identifier Generation Rules:</span>
                <div className="space-y-2 text-[11px]">
                  <p>
                    <strong className="text-white">1.1 User Profile:</strong> If the identifier begins with <code className="text-cyan-400 font-mono">z6Mk</code> and conforms to Base58BTC encoded Ed25519 multicodec payload, it <strong>MUST</strong> be treated as a User Profile.
                  </p>
                  <code className="block p-2 bg-slate-900 rounded border border-slate-800 font-mono text-cyan-300">
                    did:neuralkey:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK
                  </code>
                  <p className="pt-2">
                    <strong className="text-white">1.2 Issuer Profile:</strong> If the identifier consists of a valid Fully Qualified Domain Name (FQDN), optionally followed by path segments, it <strong>MUST</strong> be treated as an Issuer Profile.
                  </p>
                  <code className="block p-2 bg-slate-900 rounded border border-slate-800 font-mono text-emerald-300">
                    did:neuralkey:neuralkey.neuralsh.com
                  </code>
                </div>
              </div>
            </div>
          )}

          {activeSpecTab === 'crud' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>CRUD Operations Overview</span>
                </h4>

                <div className="space-y-3 text-[11px]">
                  <div className="border-b border-slate-800 pb-2.5">
                    <span className="font-bold text-cyan-300 text-xs block">1. CREATE (Register)</span>
                    <p className="text-slate-300 mt-1">
                      <strong>User:</strong> Purely cryptographic and localized. The User generates an Ed25519 keypair inside their Secure Enclave, prefixes the public key with 0xed01 multicodec, encodes it via Base58BTC, and appends it to <code className="font-mono text-cyan-400">did:neuralkey:</code>. No network registration required.
                    </p>
                    <p className="text-slate-300 mt-1">
                      <strong>Issuer:</strong> Generates keypair, creates JSON-LD DID document, provisions it at <code className="font-mono text-emerald-400">https://domain/.well-known/did.json</code> via HTTPS.
                    </p>
                  </div>

                  <div className="border-b border-slate-800 pb-2.5">
                    <span className="font-bold text-cyan-300 text-xs block">2. READ (Resolve)</span>
                    <p className="text-slate-300 mt-1">
                      <strong>Branch A (User):</strong> Starts with <code className="font-mono text-cyan-400">z6Mk</code> &rarr; Constructs W3C document directly in memory. <strong>0ms latency, zero network traffic.</strong>
                    </p>
                    <p className="text-slate-300 mt-1">
                      <strong>Branch B (Issuer):</strong> Does not start with z6Mk &rarr; HTTPS fetch to <code className="font-mono text-emerald-400">.well-known/did.json</code>.
                    </p>
                  </div>

                  <div className="border-b border-slate-800 pb-2.5">
                    <span className="font-bold text-cyan-300 text-xs block">3. UPDATE & KEY ROTATION</span>
                    <p className="text-slate-300 mt-1">
                      <strong>User:</strong> Updates are not supported (DID is deterministically bound to the private key). If compromised, user creates a new DID.
                    </p>
                    <p className="text-slate-300 mt-1">
                      <strong>Issuer (Three-Stage Key Rotation):</strong>
                    </p>
                    <ol className="list-decimal list-inside pl-2 space-y-1 mt-1 text-slate-300">
                      <li><strong>Stage A (Overlap):</strong> Add Key 2 alongside Key 1 in <code className="font-mono">verificationMethod</code>.</li>
                      <li><strong>Stage B (Switch):</strong> Deploy updated <code className="font-mono">did.json</code> and begin signing new VCs with Key 2 after transition window.</li>
                      <li><strong>Stage C (Cleanup):</strong> Remove Key 1 once all old sessions expire.</li>
                    </ol>
                  </div>

                  <div>
                    <span className="font-bold text-cyan-300 text-xs block">4. DEACTIVATE</span>
                    <p className="text-slate-300 mt-1">
                      <strong>User:</strong> Deletes private key material from hardware enclave.
                    </p>
                    <p className="text-slate-300 mt-1">
                      <strong>Issuer:</strong> Sets <code className="font-mono text-red-400">"deactivated": true</code> at the root level of <code className="font-mono">did.json</code>.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSpecTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Security & Privacy Architecture</span>
                </h4>

                <div className="grid grid-cols-1 gap-3 text-[11px]">
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                    <span className="font-bold text-emerald-300 text-xs flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Zero "Phone-Home" Identity Tracking</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      Conventional <code className="text-cyan-400 font-mono">did:web</code> implementations force a verifier to contact the holder's hosting server every time an identity is verified. This allows rogue issuers to surveil users, recording their IP address, location, and the frequency of bank logins. Because <code className="text-cyan-400 font-mono">did:neuralkey</code> User Profiles resolve 100% offline, <strong>no central server is ever contacted during verification</strong>.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-blue-950/20 border border-blue-500/30 space-y-1">
                    <span className="font-bold text-blue-300 text-xs flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-blue-400" />
                      <span>Hardware Security Enclave Binding</span>
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      User private keys are generated inside device hardware security modules (Apple Secure Enclave, Android StrongBox/Keystore). The private key never leaves the device, preventing remote credential theft.
                    </p>
                  </div>
                </div>
              </div>

              {/* Attribution */}
              <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 text-[10.5px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                <span>
                  © 2026 NeuralKey / PRESTIGE ALLIANCE CO., LTD. • Decentralized Identity (DID) Platform
                </span>
                <span className="text-slate-500 font-mono">Last Updated: June 3, 2026</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Active Spec Method: <strong className="text-cyan-400 font-mono">did:neuralkey</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
