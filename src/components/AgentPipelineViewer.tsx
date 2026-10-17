import React, { useState } from 'react';
import {
  Cpu,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Terminal,
  ArrowRight,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ForensicAnalysis, ApplicantProfile, SpecialistAgentExecution } from '../types';

interface AgentPipelineViewerProps {
  analysis: ForensicAnalysis;
  applicant: ApplicantProfile;
}

export const AgentPipelineViewer: React.FC<AgentPipelineViewerProps> = ({
  analysis,
  applicant,
}) => {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(
    analysis.adkAgents?.[0]?.agentId || 'adk-agent-extractor-v1'
  );

  const isSuspicious = applicant.expectedOutcome === 'REJECT' || applicant.expectedOutcome === 'ESCALATE';

  const agents: SpecialistAgentExecution[] = analysis.adkAgents || [
    {
      agentName: 'Multimodal Extraction Agent',
      agentId: 'adk-agent-extractor-v1',
      role: 'Reads ID visual & MRZ data as schema-constrained JSON without per-country OCR templates',
      status: 'COMPLETED',
      durationMs: 412,
      toolCalls: [
        {
          toolName: 'schema_constrained_multimodal_ocr',
          input: 'document_image_buffer, mime: image/jpeg',
          output: '9 visual fields + 2 MRZ lines extracted',
          status: 'SUCCESS',
        },
      ],
      summary: 'Schema-constrained multimodal extraction completed with zero per-country templates.',
    },
    {
      agentName: 'Deterministic Cross-Check Agent',
      agentId: 'adk-agent-crosscheck-v1',
      role: 'Executes mathematical ICAO Doc 9303 checksum tools and field comparison arithmetic in parallel',
      status: applicant.expectedOutcome === 'REJECT' ? 'ESCALATED' : 'COMPLETED',
      durationMs: 180,
      toolCalls: [
        {
          toolName: 'validate_icao_9303_checksum',
          input: 'raw_mrz_lines',
          output: applicant.expectedOutcome === 'REJECT' ? 'Checksum mismatch: expected 8, found 4' : 'Checksum verified: 06',
          status: applicant.expectedOutcome === 'REJECT' ? 'FLAG_RAISED' : 'SUCCESS',
        },
        {
          toolName: 'check_expiration_validity',
          input: 'expiry_date vs current_timestamp',
          output: 'Document valid and unexpired',
          status: 'SUCCESS',
        },
      ],
      summary: applicant.expectedOutcome === 'REJECT'
        ? 'Flagged checksum failure in MRZ line 2.'
        : 'All 7 deterministic check-digit rules passed.',
    },
    {
      agentName: 'Fraud Signal & Anomaly Agent',
      agentId: 'adk-agent-fraud-v1',
      role: 'Scans for altered text fonts, layout splices, and photo boundary irregularities',
      status: isSuspicious ? 'ESCALATED' : 'COMPLETED',
      durationMs: 310,
      toolCalls: [
        {
          toolName: 'scan_micro_kerning_artifacts',
          input: 'visual_zone_rois',
          output: applicant.expectedOutcome === 'REJECT'
            ? 'Secondary raster modification / checksum anomaly detected in security zone'
            : 'Kerning baseline and micro-lettering uniform',
          status: applicant.expectedOutcome === 'REJECT' ? 'FLAG_RAISED' : 'SUCCESS',
        },
        {
          toolName: 'scan_photo_boundary_discontinuities',
          input: 'portrait_roi vs selfie_frame',
          output: isSuspicious
            ? 'Photo boundary seam anomaly flagged for secondary forensic analysis'
            : 'Natural portrait texture confirmed',
          status: isSuspicious ? 'FLAG_RAISED' : 'SUCCESS',
        },
      ],
      summary: isSuspicious
        ? 'Flag raised for secondary forensic verification.'
        : 'Zero tampering indicators found across ASEAN document features.',
    },
  ];

  return (
    <div className="space-y-4">
      {/* ADK Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-200 text-sm">
              Parallel Specialist Pipeline
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-500/30 font-mono">
              3 Agents Active
            </span>
            {isSuspicious && (
              <span className="text-xs px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-500/30 font-mono">
                Deep check (Gemini 3.1 Pro)
              </span>
            )}
          </div>
        </div>

        {/* 3 Step Visual Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {agents.map((agent, index) => {
            const isDeepCheck = agent.status === 'ESCALATED';

            return (
              <div
                key={agent.agentId}
                className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                  isDeepCheck
                    ? 'bg-purple-950/20 border-purple-500/40'
                    : 'bg-slate-950/80 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-400 font-bold">
                    STEP 0{index + 1}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                      isDeepCheck
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {isDeepCheck ? 'DEEP CHECK' : 'COMPLETED'}
                  </span>
                </div>

                <div className="font-bold text-white text-xs truncate">{agent.agentName}</div>
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-2">
                  {agent.role}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
                  <span>LATENCY: {agent.durationMs}ms</span>
                  <span>{agent.toolCalls.length} Tool Calls</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deep-Dive Agent Tool Execution Trace */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Terminal className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-bold text-slate-200 text-sm">
              Deterministic Tool Invocations & Reasoning Output
            </span>
          </div>
          <span className="text-xs text-slate-400">Click agent to inspect raw payload</span>
        </div>

        <div className="space-y-2.5 min-w-0">
          {agents.map((agent) => {
            const isExpanded = expandedAgent === agent.agentId;
            const isDeepCheck = agent.status === 'ESCALATED';

            return (
              <div
                key={agent.agentId}
                className={`rounded-xl border transition-all text-xs overflow-hidden min-w-0 ${
                  isExpanded
                    ? 'border-blue-500/60 bg-slate-950'
                    : isDeepCheck
                    ? 'bg-purple-950/20 border-purple-500/30'
                    : 'bg-slate-950/70 border-slate-800'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedAgent(isExpanded ? null : agent.agentId)}
                  className="w-full p-3 flex flex-wrap items-center justify-between gap-2 text-left hover:bg-white/5 cursor-pointer transition-colors min-w-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        isDeepCheck
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                          : 'bg-blue-500/20 text-cyan-300 border border-blue-500/30'
                      }`}
                    >
                      ADK
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                        <span className="font-bold text-white text-xs">{agent.agentName}</span>
                        <span className="text-[10px] font-mono text-slate-400 truncate">({agent.agentId})</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{agent.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      {agent.durationMs}ms
                    </span>
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                        isDeepCheck
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isDeepCheck ? 'DEEP CHECK' : 'COMPLETED'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-3 sm:p-3.5 border-t border-slate-800/80 bg-slate-950/90 space-y-3 min-w-0">
                    <div className="text-xs text-slate-200 font-sans leading-relaxed break-words">
                      <strong>Agent Summary:</strong> {agent.summary}
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-cyan-400 shrink-0" />
                        Tool Invocations:
                      </span>
                      <div className="space-y-2 min-w-0">
                        {agent.toolCalls.map((call, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1 font-mono text-xs min-w-0"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2 text-cyan-300 font-bold">
                              <span className="break-all">tool: {call.toolName}</span>
                              <span
                                className={`text-[10px] px-1.5 py-0.2 rounded shrink-0 ${
                                  call.status === 'SUCCESS'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-red-500/20 text-red-300'
                                }`}
                              >
                                {call.status}
                              </span>
                            </div>
                            <div className="text-slate-400 text-xs break-words">
                              <span className="text-slate-500">input:</span> {call.input}
                            </div>
                            <div className="text-slate-200 text-xs break-words">
                              <span className="text-slate-500">output:</span> {call.output}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
