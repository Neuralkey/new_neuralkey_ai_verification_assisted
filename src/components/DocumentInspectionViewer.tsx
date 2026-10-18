import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  X,
  Layers,
  Sparkles,
  Camera,
  CheckCircle2,
  AlertTriangle,
  User,
  Scan,
  Cpu,
} from 'lucide-react';
import { ApplicantProfile, ForensicAnalysis, FraudSignal } from '../types';

interface DocumentInspectionViewerProps {
  applicant: ApplicantProfile;
  analysis: ForensicAnalysis;
  customDocUrl?: string;
  customSelfieUrl?: string;
  hoveredFlagIndex?: number | null;
  onHoverFlag?: (index: number | null) => void;
  isAnalyzingWithGemini?: boolean;
  onRunGeminiAnalysis?: () => void;
  onOpenBenchmarkModal?: () => void;
  analysisLatencyMs?: number;
}

export const DocumentInspectionViewer: React.FC<DocumentInspectionViewerProps> = ({
  applicant,
  analysis,
  customDocUrl,
  customSelfieUrl,
  hoveredFlagIndex,
  onHoverFlag,
  isAnalyzingWithGemini,
  onRunGeminiAnalysis,
  analysisLatencyMs,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [filterMode, setFilterMode] = useState<'normal' | 'uv' | 'contrast'>('normal');
  const [showMrzOverlay, setShowMrzOverlay] = useState<boolean>(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  const { fraudSignals, extractedVisualZone, extractedMrzZone } = analysis;

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 20, 180));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 20, 80));
  const handleResetZoom = () => setZoomLevel(100);

  // Parse bounding box or ROI
  const getBoxCoords = (signal: FraudSignal): [number, number, number, number] | null => {
    if (signal.box_2d && signal.box_2d.length === 4) {
      return signal.box_2d;
    }
    const match = signal.evidenceZone?.match(/X:(\d+),\s*Y:(\d+),\s*W:(\d+),\s*H:(\d+)/i);
    if (match) {
      const x = parseInt(match[1], 10);
      const y = parseInt(match[2], 10);
      const w = parseInt(match[3], 10);
      const h = parseInt(match[4], 10);
      const ymin = Math.round((y / 320) * 1000);
      const xmin = Math.round((x / 500) * 1000);
      const ymax = Math.min(1000, Math.round(((y + h) / 320) * 1000));
      const xmax = Math.min(1000, Math.round(((x + w) / 500) * 1000));
      return [ymin, xmin, ymax, xmax];
    }
    return null;
  };

  const getFilterStyle = () => {
    switch (filterMode) {
      case 'uv':
        return { filter: 'invert(80%) hue-rotate(190deg) contrast(140%) brightness(110%)' };
      case 'contrast':
        return { filter: 'contrast(180%) saturate(130%)' };
      default:
        return {};
    }
  };

  // Country code helper for ASEAN
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

  const getCaseBadge = (tag?: string) => {
    const caseMatch = tag?.match(/Case\s*(\d+)/i);
    if (caseMatch) return `#${caseMatch[1]}`;
    const genuineMatch = tag?.match(/Genuine\s*(\d+)/i);
    if (genuineMatch) return `#${parseInt(genuineMatch[1], 10).toString().padStart(2, '0')}`;
    const tamperedMatch = tag?.match(/Tampered\s*(\d+)/i);
    if (tamperedMatch) return `#${(20 + parseInt(tamperedMatch[1], 10)).toString().padStart(2, '0')}`;
    return null;
  };

  // Only render a raw <img> if the user uploaded an actual raster image (PNG/JPEG/WebP); otherwise generate the rich synthetic card
  const isUploadedRasterDoc = Boolean(
    customDocUrl &&
      /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(customDocUrl) &&
      applicant.id.startsWith('case_')
  );
  const safePortraitUrl =
    applicant.avatarUrl ||
    applicant.selfieUrl ||
    customSelfieUrl ||
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm space-y-3 min-w-0 overflow-hidden">
      {/* Viewer Header & Controls (UI-01, UI-11): Stacked 2-row header so toolbar never clips */}
      <div className="flex flex-col gap-2 pb-2.5 border-b border-slate-800 text-xs min-w-0">
        {/* Row 1: Document Title & Number + Gemini AI Task Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span
              className="font-bold text-slate-200 text-sm truncate"
              title={applicant.documentType}
            >
              {applicant.documentType.split('(')[0].trim()}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-semibold text-cyan-300 shrink-0">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Vision OCR &amp; ROI Inspector</span>
            </span>
          </div>
          <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 shrink-0">
            {applicant.documentNumber}
          </span>
        </div>

        {/* Row 2: Filters, Zoom & Fullscreen Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Filter selector */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs shrink-0">
            <button
              onClick={() => setFilterMode('normal')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filterMode === 'normal'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setFilterMode('uv')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filterMode === 'uv'
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Simulate UV luminescence inspection"
            >
              UV Light
            </button>
            <button
              onClick={() => setFilterMode('contrast')}
              className={`px-2.5 py-1 rounded font-medium cursor-pointer transition-colors ${
                filterMode === 'contrast'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="High contrast for microprint analysis"
            >
              Contrast
            </button>
          </div>

          {/* Zoom & Lightbox controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                onClick={handleZoomOut}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-slate-300">{zoomLevel}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleResetZoom}
                className="p-1 text-slate-400 hover:text-white cursor-pointer border-l border-slate-800 ml-0.5"
                title="Reset zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={() => setIsLightboxOpen(true)}
              className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 cursor-pointer transition-colors"
              title="Expand to Fullscreen Lightbox"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Gemini AI Live Model Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-blue-500/30 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="font-bold text-white flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Model: gemini-3.8-flash</span>
          </span>
          {analysisLatencyMs ? (
            <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
              Latency: {analysisLatencyMs}ms
            </span>
          ) : null}
        </div>

        <div className="flex items-center gap-1.5">
          {onRunGeminiAnalysis && (
            <button
              onClick={onRunGeminiAnalysis}
              disabled={isAnalyzingWithGemini}
              className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              title="Run real Gemini 3.8 Flash multimodal extraction, MRZ decoding, and fraud scoring"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingWithGemini ? 'animate-spin text-cyan-200' : 'text-cyan-300'}`} />
              <span>{isAnalyzingWithGemini ? 'Extracting & Checking...' : 'Run Gemini Analysis'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Centre Inspection Workspace: ID Card and Selfie Beside It (UI-01) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch min-w-0">
        {/* Left (or main): Large ID Document Viewer with Bounding Boxes (8 cols) */}
        <div className="sm:col-span-8 bg-slate-950 rounded-xl border border-slate-800/80 p-2.5 sm:p-3 flex flex-col justify-between relative overflow-hidden min-h-[260px] min-w-0">
          {/* Sub-Card Task Label Header */}
          <div className="w-full flex flex-wrap items-center justify-between gap-1.5 pb-2 mb-2 border-b border-slate-800/80 text-[11px]">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Scan className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>ID Document Visual &amp; Bounding Box Output</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              <span>Vision OCR &amp; 2D Anomaly Detector</span>
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative w-full">
          {filterMode === 'uv' && (
            <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-purple-900/90 text-purple-200 text-[10px] font-medium border border-purple-500/40 flex items-center gap-1.5 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              UV Light Active
            </div>
          )}

          {/* Interactive Scaled Card Container */}
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
              ...getFilterStyle(),
            }}
            className="relative w-full max-w-[460px] select-none min-w-0"
          >
            {/* The Document Visual (Custom Image or Synthetic SVG ID) */}
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="relative w-full min-h-[205px] rounded-xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-gradient-to-br from-[#0c2238] via-[#081827] to-[#040e17] cursor-pointer group"
            >
              {/* Active Scanner Line when Analyzing with Gemini */}
              {isAnalyzingWithGemini && (
                <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden rounded-xl">
                  <div className="w-full h-1 bg-cyan-400 shadow-[0_0_15px_#22d3ee] animate-pulse absolute top-1/2 -translate-y-1/2"></div>
                  <div className="absolute inset-0 bg-cyan-500/10 backdrop-blur-[1px]"></div>
                  <div className="absolute bottom-3 left-3 px-2 py-1 rounded bg-slate-950/90 text-cyan-300 font-mono text-[10px] border border-cyan-500/40 flex items-center gap-1.5 shadow-lg">
                    <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                    <span>Gemini 3.8 Flash Scanning...</span>
                  </div>
                </div>
              )}
              {isUploadedRasterDoc ? (
                <img
                  src={customDocUrl}
                  alt="Submitted ID Document"
                  className="w-full h-full max-h-[260px] object-contain"
                />
              ) : (
                /* High-Fidelity Synthetic ASEAN Identity Document */
                <div className="w-full h-full p-3 sm:p-4 flex flex-col justify-between text-slate-200 relative min-w-0 gap-3">
                  {/* Security Guilloche Pattern */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:6px_6px]"></div>

                  {/* Header Strip */}
                  <div className="flex items-center justify-between gap-2 border-b border-cyan-500/30 pb-2 relative z-10 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] font-bold text-white tracking-wide uppercase truncate">
                          {applicant.nationality === 'KHM'
                            ? 'ព្រះរាជាណាចក្រកម្ពុជា · CAMBODIA'
                            : applicant.nationality === 'SGP'
                            ? 'REPUBLIC OF SINGAPORE'
                            : applicant.nationality === 'MYS'
                            ? 'MALAYSIA · KAD PENGENALAN'
                            : applicant.nationality === 'THA'
                            ? 'ราชอาณาจักรไทย · THAILAND'
                            : applicant.nationality === 'IDN'
                            ? 'REPUBLIK INDONESIA · e-KTP'
                            : applicant.nationality === 'VNM'
                            ? 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'
                            : applicant.nationality === 'PHL'
                            ? 'REPUBLIC OF THE PHILIPPINES'
                            : `${applicant.nationality} IDENTITY AUTHORITY`}
                        </div>
                        <div className="text-[9px] text-cyan-300 font-semibold uppercase tracking-wider truncate">
                          <span>{applicant.documentType.split('(')[0].trim()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-[8px] text-slate-400 uppercase">ID Number</div>
                      <div className="font-mono font-bold text-cyan-300 text-[11px] tracking-wider">
                        {applicant.documentNumber}
                      </div>
                    </div>
                  </div>

                  {/* Body: Photo & Printed Details */}
                  <div className="grid grid-cols-12 gap-3 items-center relative z-10 my-1 min-w-0">
                    {/* Left: Portrait Photo & Smart Chip */}
                    <div className="col-span-4 flex flex-col items-center min-w-0">
                      <div className="w-18 h-22 sm:w-20 sm:h-24 rounded-lg overflow-hidden border-2 border-cyan-400/60 shadow-md relative bg-slate-900 ring-1 ring-cyan-500/30">
                        <img
                          src={safePortraitUrl}
                          alt={applicant.fullName}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-0 right-0 w-1.5 h-full bg-gradient-to-b from-cyan-400/40 via-purple-400/30 to-amber-400/40 opacity-70"></div>
                        {/* Metallic Contact Smart Chip badge */}
                        <div className="absolute bottom-1 left-1 w-5 h-3.5 rounded-sm bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-200/80 shadow-sm opacity-90"></div>
                      </div>
                    </div>

                    {/* Right: Printed Fields */}
                    <div className="col-span-8 space-y-1.5 text-slate-200 text-[10.5px] font-sans min-w-0">
                      <div className="min-w-0">
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 block">
                          Full Name
                        </span>
                        <div className="font-bold text-white tracking-wide truncate">
                          {extractedVisualZone?.fullName || applicant.fullName}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[10px] min-w-0">
                        <div className="min-w-0">
                          <span className="text-[8px] uppercase tracking-wider text-slate-400 block truncate">
                            Date of Birth
                          </span>
                          <div className="font-mono font-semibold text-slate-200 truncate">
                            {extractedVisualZone?.dateOfBirth || applicant.dateOfBirth}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[8px] uppercase tracking-wider text-slate-400 block truncate">
                            Nationality
                          </span>
                          <div className="font-semibold text-amber-300 truncate">
                            {extractedVisualZone?.nationality || applicant.nationality}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-1.5 text-[10px] min-w-0">
                        <div className="min-w-0">
                          <span className="text-[8px] uppercase tracking-wider text-slate-400 block truncate">
                            Expiry Date
                          </span>
                          <div className="font-mono text-slate-200 truncate">
                            {extractedVisualZone?.expiryDate || '2033-09-12'}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <span className="text-[8px] uppercase tracking-wider text-slate-400 block truncate">
                            Gender
                          </span>
                          <div className="text-slate-300 truncate">
                            {extractedVisualZone?.sex === 'F' ? 'Female' : 'Male'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Hover Overlay Hint */}
              <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 text-white text-xs font-semibold shadow-lg border border-slate-700 flex items-center gap-1.5">
                  <Maximize2 className="w-3.5 h-3.5 text-cyan-400" /> Click to Enlarge
                </span>
              </div>
            </div>

            {/* Overlaid Numbered Red Bounding Boxes for Each Flag (UI-02) */}
            {fraudSignals.map((signal, idx) => {
              const coords = getBoxCoords(signal);
              if (!coords) return null;
              const [ymin, xmin, ymax, xmax] = coords;
              const top = `${ymin / 10}%`;
              const left = `${xmin / 10}%`;
              const height = `${Math.max(8, (ymax - ymin) / 10)}%`;
              const width = `${Math.max(8, (xmax - xmin) / 10)}%`;
              const isHovered = hoveredFlagIndex === idx;

              return (
                <div
                  key={signal.code}
                  onMouseEnter={() => onHoverFlag && onHoverFlag(idx)}
                  onMouseLeave={() => onHoverFlag && onHoverFlag(null)}
                  style={{ top, left, width, height }}
                  className={`absolute z-30 transition-all cursor-pointer pointer-events-auto rounded ${
                    isHovered
                      ? 'border-2 border-red-400 ring-4 ring-red-500/50 bg-red-500/25 shadow-lg'
                      : 'border-2 border-red-500 bg-red-500/15 hover:bg-red-500/25'
                  }`}
                >
                  {/* Numbered Badge (UI-02: matching flag number) */}
                  <span className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-red-600 text-white font-mono font-bold text-[11px] flex items-center justify-center shadow-lg border-2 border-white/80">
                    {idx + 1}
                  </span>

                  {/* Tooltip on Hover */}
                  {isHovered && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-slate-950 text-white text-[11px] font-semibold rounded shadow-xl border border-red-500 whitespace-nowrap z-50 pointer-events-none">
                      Issue #{idx + 1}: {signal.title}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          </div>
        </div>

        {/* Right Beside It: Matching Selfie Portrait (UI-01) */}
        <div className="sm:col-span-4 bg-slate-950 rounded-xl border border-slate-800/80 p-2.5 sm:p-3 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex flex-col gap-1.5 pb-2 mb-2 border-b border-slate-800 text-xs min-w-0">
              <div className="flex items-center justify-between gap-1 min-w-0">
                <span className="font-bold text-slate-200 flex items-center gap-1.5 truncate">
                  <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Live Selfie</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 shrink-0 whitespace-nowrap">
                  Verified Live
                </span>
              </div>
              <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300 w-fit max-w-full">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                <span className="truncate">Biometric Face Matcher</span>
              </div>
            </div>

            {/* Portrait Frame */}
            <div className="relative aspect-[3/4] max-h-[200px] rounded-lg overflow-hidden border-2 border-slate-700 bg-slate-900 mx-auto shadow-md">
              <img
                src={customSelfieUrl || applicant.selfieUrl}
                alt="Applicant live selfie"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-slate-950/85 backdrop-blur-sm px-2 py-1 rounded border border-slate-800 text-[10px] text-slate-300 flex items-center justify-between gap-1">
                <span className="truncate">Face Match</span>
                <span
                  className={`font-mono font-bold shrink-0 ${
                    analysis.biometricAnalysis.faceMatchStatus === 'MATCH'
                      ? 'text-emerald-400'
                      : analysis.biometricAnalysis.faceMatchStatus === 'INCONCLUSIVE'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {analysis.biometricAnalysis.faceMatchScore}%
                </span>
              </div>
            </div>
          </div>

          {/* Quick Cross-Check Status */}
          <div className="mt-2.5 p-2 bg-slate-900 rounded-lg border border-slate-800 text-[11px] space-y-1 min-w-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="text-slate-400 truncate">Photo Match:</span>
              <span
                className={`font-semibold flex items-center gap-1 shrink-0 ${
                  analysis.biometricAnalysis.faceMatchStatus === 'MATCH'
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {analysis.biometricAnalysis.faceMatchStatus === 'MATCH' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Matched
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> Mismatch
                  </>
                )}
              </span>
            </div>
            <div className="text-[9.5px] font-mono text-cyan-400/90 flex items-center gap-1 truncate">
              <Cpu className="w-2.5 h-2.5 shrink-0" />
              <span className="truncate">Task: 1:1 ID Portrait vs. Liveness Verification</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal (UI-01: Zoom on Click, Original Aspect Ratio) */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md overflow-y-auto">
          <div className="relative max-w-4xl w-full max-h-[92vh] overflow-y-auto bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-4 shadow-2xl flex flex-col items-center">
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer z-50"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs pr-8">
              <span className="font-bold text-white text-sm">
                {applicant.fullName.split('(')[0].trim()} · {applicant.documentType.split('(')[0].trim()}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 w-full items-center justify-center py-2">
              <div className="md:col-span-8 flex justify-center">
                <div className="w-full max-w-[560px] aspect-[1.58/1] rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl relative">
                  {isUploadedRasterDoc ? (
                    <img
                      src={customDocUrl}
                      alt="Full ID"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#0a1e36] p-5 text-white flex flex-col justify-between">
                      <div className="flex items-center justify-between border-b border-cyan-500/40 pb-2.5">
                        <span className="font-bold text-sm uppercase">{applicant.documentType.split('(')[0].trim()}</span>
                        <span className="font-mono text-cyan-300">{applicant.documentNumber}</span>
                      </div>
                      <div className="grid grid-cols-12 gap-4 items-center my-auto">
                        <div className="col-span-4">
                          <img
                            src={safePortraitUrl}
                            alt=""
                            className="w-24 h-28 object-cover rounded-lg border border-cyan-400/50"
                          />
                        </div>
                        <div className="col-span-8 space-y-1.5 text-xs">
                          <div className="text-sm font-bold">{extractedVisualZone?.fullName || applicant.fullName}</div>
                          <div className="text-slate-300">Date of Birth: <span className="font-mono text-white">{extractedVisualZone?.dateOfBirth || applicant.dateOfBirth}</span></div>
                          <div className="text-slate-300">Nationality: <span className="text-amber-300 font-semibold">{extractedVisualZone?.nationality || applicant.nationality}</span></div>
                          <div className="text-slate-300">Expiry Date: <span className="font-mono text-white">{extractedVisualZone?.expiryDate || '2033-09-12'}</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Numbered Bounding Boxes in Lightbox */}
                  {fraudSignals.map((signal, idx) => {
                    const coords = getBoxCoords(signal);
                    if (!coords) return null;
                    const [ymin, xmin, ymax, xmax] = coords;
                    return (
                      <div
                        key={signal.code}
                        style={{
                          top: `${ymin / 10}%`,
                          left: `${xmin / 10}%`,
                          width: `${(xmax - xmin) / 10}%`,
                          height: `${(ymax - ymin) / 10}%`,
                        }}
                        className="absolute border-2 border-red-500 bg-red-500/20 z-30"
                      >
                        <span className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-red-600 text-white font-mono font-bold text-xs flex items-center justify-center shadow-lg border border-white">
                          {idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-4 flex flex-col items-center">
                <span className="text-xs text-slate-400 block mb-2 font-semibold">
                  Applicant Portrait (Live Verification)
                </span>
                <div className="w-36 h-48 rounded-xl overflow-hidden border-2 border-slate-700 shadow-xl">
                  <img
                    src={customSelfieUrl || applicant.selfieUrl}
                    alt="Selfie"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
