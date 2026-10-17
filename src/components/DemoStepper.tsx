import React from 'react';
import { Upload, Cpu, Eye, UserCheck, Award, ArrowRight, Play, RotateCcw } from 'lucide-react';

interface DemoStepperProps {
  currentStep: number; // 1 to 5
  onSelectStep: (step: number) => void;
  onAutoPlay: () => void;
  onReset: () => void;
  isAutoPlaying: boolean;
}

export const DemoStepper: React.FC<DemoStepperProps> = ({
  currentStep,
  onSelectStep,
  onAutoPlay,
  onReset,
  isAutoPlaying,
}) => {
  const steps = [
    {
      num: 1,
      title: 'Applicant Submits',
      desc: 'Wallet sends synthetic ID & selfie',
      icon: Upload,
      accent: 'blue',
    },
    {
      num: 2,
      title: 'Gemini Analyses',
      desc: 'Fields extracted, checks run',
      icon: Cpu,
      accent: 'indigo',
    },
    {
      num: 3,
      title: 'Reviewer Sees',
      desc: 'Flags, evidence & risk summary',
      icon: Eye,
      accent: 'amber',
    },
    {
      num: 4,
      title: 'Reviewer Decides',
      desc: 'Approve, reject or flag (escalate)',
      icon: UserCheck,
      accent: 'purple',
    },
    {
      num: 5,
      title: 'Credential Issued',
      desc: 'Bound to DID & Upgrade Trust Level',
      icon: Award,
      accent: 'emerald',
    },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-blue-400">
            Slide 5 Architecture
          </span>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <span>Prototype: 3-Minute Interactive Demo Walkthrough</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAutoPlay}
            disabled={isAutoPlaying}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
              isAutoPlaying
                ? 'bg-blue-600/40 text-blue-200 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-500/20'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${isAutoPlaying ? 'animate-spin' : ''}`} />
            <span>{isAutoPlaying ? 'Simulating Demo Flow...' : 'Play 3-Min Flow'}</span>
          </button>

          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset demo flow"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
        {steps.map((step) => {
          const Icon = step.icon;
          const isActive = currentStep === step.num;
          const isDone = currentStep > step.num;

          return (
            <button
              key={step.num}
              onClick={() => onSelectStep(step.num)}
              className={`flex sm:flex-col items-center sm:items-start text-left p-2.5 rounded-xl border cursor-pointer transition-all text-xs relative ${
                isActive
                  ? 'bg-blue-950/70 border-blue-500/80 ring-1 ring-blue-500/40 text-white shadow-md'
                  : isDone
                  ? 'bg-slate-900/90 border-emerald-500/30 text-slate-300 hover:border-slate-700'
                  : 'bg-slate-950/50 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 w-full mb-1">
                <span
                  className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isActive
                      ? 'bg-blue-500 text-white shadow-sm'
                      : isDone
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isDone ? '✓' : step.num}
                </span>
                <span className={`font-semibold text-xs truncate ${isActive ? 'text-white' : ''}`}>
                  {step.title}
                </span>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 line-clamp-1 ml-8 sm:ml-0">
                {step.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
