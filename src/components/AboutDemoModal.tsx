import React from 'react';
import { X, Sparkles, Cpu, ShieldCheck, CheckCircle2, RotateCcw } from 'lucide-react';
import { NeuralkeyLogo } from './NeuralkeyLogo';

interface AboutDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSpecModal?: () => void;
  onResetDemo?: () => void;
}

export const AboutDemoModal: React.FC<AboutDemoModalProps> = ({
  isOpen,
  onClose,
  onOpenSpecModal,
  onResetDemo,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative text-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
            <NeuralkeyLogo className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">About NeuralKey</h3>
            <p className="text-xs text-slate-400">
              AI Builder Cup 2026 · BFSI Intelligent Risk & Fraud Theme
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="font-semibold text-white block flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Multimodal AI Proofing Architecture
            </span>
            <p>
              NeuralKey assists human reviewers by reading identity documents without rigid per-country
              OCR templates. It performs deterministic cross-checks (printed details vs MRZ checksums)
              and flags visual anomalies with explainable, numbered bounding boxes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Primary Triage</span>
              <span className="font-bold text-white font-mono block">Gemini 3.8 Flash</span>
              <span className="text-[11px] text-slate-400">Fast multimodal extraction</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-0.5">Suspicious Case Deep Check</span>
              <span className="font-bold text-white font-mono block">Gemini 3.1 Pro</span>
              <span className="text-[11px] text-slate-400">Forensic anomaly analysis</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="font-semibold text-white block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Portable W3C Verifiable Credentials
            </span>
            <p className="text-slate-400">
              Approved applicants receive a cryptographic credential bound to their Ed25519 decentralized
              identifier (<code className="text-cyan-400 font-mono">did:neuralkey</code>) that can be reused
              across relying-party banks with zero repetitive document uploads.
            </p>
            {onOpenSpecModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSpecModal();
                }}
                className="mt-2 text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                Inspect did:neuralkey W3C Specification &rarr;
              </button>
            )}
          </div>

          {onResetDemo && (
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Reset all test data:</span>
              <button
                onClick={() => {
                  onResetDemo();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset 40 Demo Cases</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
