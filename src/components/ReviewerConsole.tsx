import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  Search,
  Filter,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Globe,
  Cpu,
  History,
  Check,
} from 'lucide-react';
import { ApplicantProfile, ForensicAnalysis, AuditRecord } from '../types';
import { DocumentInspectionViewer } from './DocumentInspectionViewer';
import { DocumentForensicsViewer } from './DocumentForensicsViewer';
import { ExtractionCrossCheck } from './ExtractionCrossCheck';
import { AgentPipelineViewer } from './AgentPipelineViewer';
import { GeminiRiskPanel } from './GeminiRiskPanel';
import { AuditLedgerModal } from './AuditLedgerModal';

interface ReviewerConsoleProps {
  queue: ApplicantProfile[];
  activeApplicant: ApplicantProfile;
  activeAnalysis: ForensicAnalysis;
  onSelectApplicant: (applicantId: string) => void;
  onApprove: (notes: string) => void;
  onReject: (notes: string) => void;
  onEscalate: (notes: string) => void;
  isProcessingDecision: boolean;
  decisionStatus: Record<string, 'APPROVED' | 'REJECTED' | 'ESCALATED'>;
  customDocUrl?: string;
  customSelfieUrl?: string;
  onOpenSpecModal?: (did?: string) => void;
  controlledActiveTab?: 'crosscheck' | 'pipeline' | 'forensics' | 'audit';
  onActiveTabChange?: (tab: 'crosscheck' | 'pipeline' | 'forensics' | 'audit') => void;
  onNavigateToWallet?: () => void;
  isAnalyzingWithGemini?: boolean;
  onRunGeminiAnalysis?: () => void;
  onOpenBenchmarkModal?: () => void;
  analysisLatencyMs?: number;
  auditLogs?: AuditRecord[];
}

export const ReviewerConsole: React.FC<ReviewerConsoleProps> = ({
  queue,
  activeApplicant,
  activeAnalysis,
  onSelectApplicant,
  onApprove,
  onReject,
  onEscalate,
  isProcessingDecision,
  decisionStatus,
  customDocUrl,
  customSelfieUrl,
  onOpenSpecModal,
  controlledActiveTab,
  onActiveTabChange,
  onNavigateToWallet,
  isAnalyzingWithGemini,
  onRunGeminiAnalysis,
  onOpenBenchmarkModal,
  analysisLatencyMs,
  auditLogs,
}) => {
  // Filter state (responsive ASEAN scrollable filter and status filters)
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'approved' | 'escalated' | 'rejected'>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [internalActiveTab, setInternalActiveTab] = useState<'crosscheck' | 'pipeline' | 'forensics' | 'audit'>('crosscheck');
  const [isMobileQueueOpen, setIsMobileQueueOpen] = useState<boolean>(false);

  // Smooth scroll state for ASEAN country filter ribbon
  const aseanScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState<boolean>(false);
  const [canScrollRight, setCanScrollRight] = useState<boolean>(true);

  // Shared hover flag synchronization between ID image bounding boxes and risk panel (UI-02)
  const [hoveredFlagIndex, setHoveredFlagIndex] = useState<number | null>(null);

  const activeTab = controlledActiveTab || internalActiveTab;
  const setActiveTab = (tab: 'crosscheck' | 'pipeline' | 'forensics' | 'audit') => {
    setInternalActiveTab(tab);
    if (onActiveTabChange) onActiveTabChange(tab);
  };

  const currentDecision = decisionStatus[activeApplicant.id] || null;

  const getAseanFlag = (nat: string) => {
    switch (nat) {
      case 'KHM': return 'KH';
      case 'SGP': return 'SG';
      case 'MYS': return 'MY';
      case 'THA': return 'TH';
      case 'IDN': return 'ID';
      case 'VNM': return 'VN';
      case 'PHL': return 'PH';
      case 'LAO': return 'LA';
      case 'MMR': return 'MM';
      case 'BRN': return 'BN';
      default: return 'ALL';
    }
  };

  const getCaseBadge = (app: ApplicantProfile) => {
    const caseMatch = app.scenarioTag?.match(/Case\s*(\d+)/i);
    if (caseMatch) return `#${caseMatch[1]}`;
    const genuineMatch = app.scenarioTag?.match(/Genuine\s*(\d+)/i);
    if (genuineMatch) {
      const num = parseInt(genuineMatch[1], 10);
      return `#${num.toString().padStart(2, '0')}`;
    }
    const tamperedMatch = app.scenarioTag?.match(/Tampered\s*(\d+)/i);
    if (tamperedMatch) {
      const num = 20 + parseInt(tamperedMatch[1], 10);
      return `#${num.toString().padStart(2, '0')}`;
    }
    const idx = queue.findIndex((q) => q.id === app.id);
    return idx >= 0 ? `#${(idx + 1).toString().padStart(2, '0')}` : '#--';
  };

  const getCountryName = (nat: string) => {
    switch (nat) {
      case 'KHM': return 'Cambodia';
      case 'SGP': return 'Singapore';
      case 'MYS': return 'Malaysia';
      case 'THA': return 'Thailand';
      case 'IDN': return 'Indonesia';
      case 'VNM': return 'Vietnam';
      case 'PHL': return 'Philippines';
      case 'LAO': return 'Laos';
      case 'MMR': return 'Myanmar';
      case 'BRN': return 'Brunei';
      default: return nat;
    }
  };

  const ASEAN_NATIONS = [
    { code: 'all', label: 'All Countries' },
    { code: 'KHM', label: 'Cambodia' },
    { code: 'SGP', label: 'Singapore' },
    { code: 'MYS', label: 'Malaysia' },
    { code: 'THA', label: 'Thailand' },
    { code: 'IDN', label: 'Indonesia' },
    { code: 'VNM', label: 'Vietnam' },
    { code: 'PHL', label: 'Philippines' },
    { code: 'LAO', label: 'Laos' },
    { code: 'MMR', label: 'Myanmar' },
    { code: 'BRN', label: 'Brunei' },
  ];

  const getCountryCount = (code: string) => {
    if (code === 'all') return queue.length;
    return queue.filter((item) => item.nationality === code).length;
  };

  const checkAseanScroll = () => {
    if (!aseanScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = aseanScrollRef.current;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
  };

  useEffect(() => {
    checkAseanScroll();
    window.addEventListener('resize', checkAseanScroll);
    return () => window.removeEventListener('resize', checkAseanScroll);
  }, []);

  const scrollAsean = (direction: 'left' | 'right') => {
    if (!aseanScrollRef.current) return;
    const offset = direction === 'left' ? -180 : 180;
    aseanScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    setTimeout(checkAseanScroll, 200);
  };

  const handleSelectCountry = (code: string, e?: React.MouseEvent) => {
    setCountryFilter(code);
    if (e?.currentTarget) {
      (e.currentTarget as HTMLElement).scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest',
      });
    }
  };

  // Filtered queue items (UI-04, UI-10)
  const filteredQueue = queue.filter((item) => {
    const dec = decisionStatus[item.id];
    if (countryFilter !== 'all' && item.nationality !== countryFilter) return false;
    if (filterMode === 'pending') return !dec;
    if (filterMode === 'approved') return dec === 'APPROVED';
    if (filterMode === 'escalated') return dec === 'ESCALATED';
    if (filterMode === 'rejected') return dec === 'REJECTED';
    return true;
  });

  return (
    <div className="space-y-4 min-w-0 w-full">
      {/* Target Layout: Responsive 3-Column Reviewer Console Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-w-0">
        {/* ============================================================== */}
        {/* LEFT COLUMN: Queue with Responsive Scrollable Country Filter   */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 space-y-3 min-w-0 w-full">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-sm min-w-0 overflow-hidden">
            {/* Queue Header with Total Counter & Mobile/Tablet Toggle */}
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800 text-xs min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <Users className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-bold text-slate-200 text-sm truncate">Applicants</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-cyan-300 border border-blue-500/20 font-bold">
                  {filteredQueue.length}
                </span>

                {/* Mobile/Tablet Queue List Accordion Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileQueueOpen(!isMobileQueueOpen)}
                  className="lg:hidden px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors"
                  title="Toggle Queue List"
                >
                  <span>{isMobileQueueOpen ? 'Collapse' : 'Expand'}</span>
                  {isMobileQueueOpen ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Country Filtering: Always Visible Responsive Scrollable Ribbon */}
            <div className="mb-2.5 space-y-1.5 min-w-0">
              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-300">
                <span className="flex items-center gap-1 text-slate-300 truncate">
                  <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span className="truncate">Filter by Country</span>
                </span>

                {/* Left / Right Scroll Navigation Arrows */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => scrollAsean('left')}
                    disabled={!canScrollLeft}
                    className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                    title="Scroll countries left"
                    aria-label="Scroll countries left"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollAsean('right')}
                    disabled={!canScrollRight}
                    className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                    title="Scroll countries right"
                    aria-label="Scroll countries right"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Horizontal Scrollable Container with Fade Edge Cues */}
              <div className="relative w-full min-w-0 overflow-hidden">
                {canScrollLeft && (
                  <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-slate-900 to-transparent pointer-events-none z-10"></div>
                )}

                <div
                  ref={aseanScrollRef}
                  onScroll={checkAseanScroll}
                  className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1 scroll-smooth select-none text-xs w-full"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  {ASEAN_NATIONS.map((nation) => {
                    const isSelected = countryFilter === nation.code;
                    const count = getCountryCount(nation.code);

                    return (
                      <button
                        key={nation.code}
                        type="button"
                        onClick={(e) => handleSelectCountry(nation.code, e)}
                        className={`shrink-0 px-2.5 py-1 rounded-lg font-medium text-[11px] cursor-pointer transition-all flex items-center gap-1.5 border whitespace-nowrap ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm ring-1 ring-blue-400 font-bold'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                        }`}
                      >
                        <span>{nation.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            isSelected
                              ? 'bg-blue-800 text-cyan-200'
                              : 'bg-slate-900 text-slate-400'
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {canScrollRight && (
                  <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none z-10"></div>
                )}
              </div>
            </div>

            {/* Active Applicant Summary Bar (Shown on < lg when queue list is collapsed) */}
            <div
              className={`lg:hidden p-2.5 rounded-xl border text-xs ${
                isMobileQueueOpen ? 'hidden' : 'bg-slate-950 border-blue-500/40 block'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-slate-100 truncate">
                    {activeApplicant.fullName.split('(')[0].trim()}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400">
                <span className="truncate">{activeApplicant.documentType.split('(')[0].trim()} · {getCountryName(activeApplicant.nationality)}</span>
              </div>
            </div>

            {/* Expandable Queue List on Mobile/Tablet, Always Visible on Desktop */}
            <div className={`${isMobileQueueOpen ? 'block' : 'hidden lg:block'} min-w-0`}>
              {/* Status Filter Buttons (UI-10: Needs review / Approved / All) */}
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 mb-2.5 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setFilterMode('all')}
                  className={`py-1.5 px-1 rounded-lg text-center cursor-pointer transition-colors truncate ${
                    filterMode === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('pending')}
                  className={`py-1.5 px-1 rounded-lg text-center cursor-pointer transition-colors truncate ${
                    filterMode === 'pending'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Pending
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('approved')}
                  className={`py-1.5 px-1 rounded-lg text-center cursor-pointer transition-colors truncate ${
                    filterMode === 'approved'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Approved
                </button>
              </div>

              {/* Compact Queue Cards: 2-col on tablet (sm/md), 1-col on mobile and desktop sidebar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-1.5 max-h-[240px] lg:max-h-[540px] overflow-y-auto pr-1 min-w-0">
                {filteredQueue.map((app) => {
                  const isSelected = app.id === activeApplicant.id;
                  const dec = decisionStatus[app.id];

                  return (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => {
                        onSelectApplicant(app.id);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl border text-left cursor-pointer transition-all text-xs relative min-w-0 ${
                        isSelected
                          ? 'bg-blue-950/90 border-blue-500 shadow-md ring-1 ring-blue-500/50 text-white'
                          : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/40 hover:border-slate-700'
                      }`}
                    >
                      {/* Line 1: Name and Status */}
                      <div className="flex items-center justify-between gap-2 mb-1 min-w-0">
                        <span className="font-bold text-xs truncate text-slate-100 flex-1 min-w-0">
                          {app.fullName.split('(')[0].trim()}
                        </span>

                        {dec ? (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0 ${
                              dec === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : dec === 'ESCALATED'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {dec === 'APPROVED' ? 'Approved' : dec === 'ESCALATED' ? 'Escalated' : 'Rejected'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-blue-500/10 text-cyan-300">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Line 2: Document Type & Country */}
                      <div className="flex items-center justify-between gap-2 text-[11px] text-slate-400 min-w-0">
                        <span className="truncate min-w-0 flex-1">{app.documentType.split('(')[0].trim()}</span>
                        <span className="text-slate-400 text-[11px] shrink-0">
                          {getCountryName(app.nationality)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CENTRE COLUMN: Largest - ID & Selfie + Tabs (UI-01, UI-02)     */}
        {/* ============================================================== */}
        <div className="lg:col-span-6 space-y-4 min-w-0 w-full">
          {/* 1. Large ID and Selfie Viewer with Numbered Bounding Boxes (UI-01, UI-02) */}
          <DocumentInspectionViewer
            applicant={activeApplicant}
            analysis={activeAnalysis}
            customDocUrl={customDocUrl}
            customSelfieUrl={customSelfieUrl}
            hoveredFlagIndex={hoveredFlagIndex}
            onHoverFlag={setHoveredFlagIndex}
            isAnalyzingWithGemini={isAnalyzingWithGemini}
            onRunGeminiAnalysis={onRunGeminiAnalysis}
            onOpenBenchmarkModal={onOpenBenchmarkModal}
            analysisLatencyMs={analysisLatencyMs}
          />

          {/* 2. Tabs Below Centre: Details Check · Photo Check · Review History */}
          <div className="space-y-3 min-w-0 w-full">
            <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs font-semibold min-w-0">
              <button
                type="button"
                onClick={() => setActiveTab('crosscheck')}
                className={`py-2 px-2 rounded-lg text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 min-w-0 ${
                  activeTab === 'crosscheck'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                <span className="truncate">Details Check</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('forensics')}
                className={`py-2 px-2 rounded-lg text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 min-w-0 ${
                  activeTab === 'forensics'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                <span className="truncate">Photo Check</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('audit')}
                className={`py-2 px-2 rounded-lg text-center cursor-pointer transition-all flex items-center justify-center gap-1.5 min-w-0 ${
                  activeTab === 'audit'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <History className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Review History</span>
              </button>
            </div>

            {/* Tab View Content */}
            <div className="min-w-0 w-full">
              {activeTab === 'crosscheck' && (
                <ExtractionCrossCheck
                  analysis={activeAnalysis}
                  applicant={activeApplicant}
                />
              )}

              {activeTab === 'forensics' && (
                <DocumentForensicsViewer
                  applicant={activeApplicant}
                  analysis={activeAnalysis}
                  customDocUrl={customDocUrl}
                  customSelfieUrl={customSelfieUrl}
                />
              )}

              {activeTab === 'audit' && (
                <AuditLedgerModal externalLogs={auditLogs} />
              )}
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: Risk Score, Numbered Flags & Decision (UI-05)    */}
        {/* ============================================================== */}
        <div className="lg:col-span-3 min-w-0 w-full">
          <GeminiRiskPanel
            analysis={activeAnalysis}
            applicant={activeApplicant}
            onApprove={onApprove}
            onReject={onReject}
            onEscalate={onEscalate}
            isProcessing={isProcessingDecision}
            decisionMade={currentDecision}
            hoveredFlagIndex={hoveredFlagIndex}
            onHoverFlag={setHoveredFlagIndex}
            onNavigateToWallet={onNavigateToWallet}
            latestAuditRecord={
              auditLogs?.find(
                (r) =>
                  r.applicantDid === activeApplicant.did ||
                  r.applicantName === activeApplicant.fullName
              ) || null
            }
            onViewAuditLog={() => setActiveTab('audit')}
          />
        </div>
      </div>
    </div>
  );
};
