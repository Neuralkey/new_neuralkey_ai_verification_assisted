import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Scan, Eye, Sparkles, AlertTriangle, ShieldCheck, Camera, Layers, Check } from 'lucide-react';
import { ApplicantProfile, ForensicAnalysis } from '../types';

interface DocumentForensicsViewerProps {
  applicant: ApplicantProfile;
  analysis: ForensicAnalysis;
  customDocUrl?: string;
  customSelfieUrl?: string;
}

export const DocumentForensicsViewer: React.FC<DocumentForensicsViewerProps> = ({
  applicant,
  analysis,
  customDocUrl,
  customSelfieUrl,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [filterMode, setFilterMode] = useState<'normal' | 'forensic_uv' | 'contrast' | 'edge'>('normal');
  const [showMrzOverlay, setShowMrzOverlay] = useState<boolean>(true);
  const [showFaceMesh, setShowFaceMesh] = useState<boolean>(true);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 75));
  const handleResetZoom = () => setZoomLevel(100);

  // Determine filter CSS
  const getFilterStyle = () => {
    switch (filterMode) {
      case 'forensic_uv':
        return {
          filter: 'invert(80%) hue-rotate(190deg) contrast(140%) brightness(110%)',
        };
      case 'contrast':
        return {
          filter: 'contrast(180%) saturate(140%)',
        };
      case 'edge':
        return {
          filter: 'grayscale(100%) contrast(250%)',
        };
      default:
        return {};
    }
  };

  return (
    <div className="space-y-4 min-w-0 w-full">
      {/* Document Inspector Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm min-w-0 overflow-hidden">
        {/* Inspection Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800 text-xs min-w-0">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="font-bold text-slate-200 flex items-center gap-1.5 min-w-0 text-sm">
              <span className="truncate">ID Document Preview</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 truncate max-w-full">
              {applicant.documentType.split('(')[0].trim()}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            {/* Filter Toggle */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setFilterMode('normal')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-all ${
                  filterMode === 'normal'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('forensic_uv')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-all ${
                  filterMode === 'forensic_uv'
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="View under UV light"
              >
                UV Light
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('contrast')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-all ${
                  filterMode === 'contrast'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="High contrast view"
              >
                Contrast
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-950 rounded-lg border border-slate-800 p-0.5">
              <button
                type="button"
                onClick={handleZoomOut}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono px-1.5 text-slate-400">{zoomLevel}%</span>
              <button
                type="button"
                onClick={handleZoomIn}
                className="p-1 text-slate-400 hover:text-white rounded cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-1 text-slate-400 hover:text-white rounded ml-0.5 cursor-pointer"
                title="Reset zoom"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Viewport for Document Display */}
        <div className="relative bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 p-2.5 sm:p-3 min-h-[260px] flex items-center justify-center min-w-0">
          {filterMode === 'forensic_uv' && (
            <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded bg-purple-900/80 text-purple-200 text-[10px] font-medium border border-purple-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              UV Light Active
            </div>
          )}

          {/* Render Document: Custom Upload or Scenario SVG Card */}
          <div
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'center center',
              transition: 'transform 0.15s ease-out',
              ...getFilterStyle(),
            }}
            className="w-full max-w-[480px] select-none min-w-0 overflow-hidden"
          >
            {Boolean(
              customDocUrl &&
                /^data:image\/(png|jpeg|jpg|webp|gif);base64,/i.test(customDocUrl) &&
                applicant.id.startsWith('case_')
            ) ? (
              <div className="relative rounded-lg overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-900">
                <img
                  src={customDocUrl}
                  alt="Custom identity document"
                  className="w-full max-h-[300px] object-contain"
                />
                {showMrzOverlay && (
                  <div className="absolute bottom-2 left-2 right-2 border-2 border-dashed border-cyan-400/80 bg-cyan-900/20 p-1.5 rounded text-[11px] font-mono text-cyan-200 flex items-center justify-between">
                    <span>MRZ ZONE DETECTED</span>
                    <span className="text-[10px] bg-cyan-500/30 px-1 rounded">ICAO Doc 9303</span>
                  </div>
                )}
              </div>
            ) : applicant.id === 'sok_chandara' ||
              (applicant.id.startsWith('case_') &&
                !applicant.documentType.toLowerCase().includes('passport')) ? (
              /* Cambodian National ID Card (អត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ) */
              <div className="rounded-xl overflow-hidden border-2 border-cyan-500/50 shadow-2xl bg-gradient-to-br from-[#0c2638] via-[#091e2c] to-[#061520] text-slate-200 p-4 relative font-sans">
                {/* Guilloche & Security Pattern */}
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:7px_7px]"></div>

                {/* Card Header with Khmer Script */}
                <div className="border-b border-cyan-500/30 pb-2 mb-2 relative">
                  <div className="text-center">
                    <div className="text-[11px] font-bold text-amber-300 tracking-wide font-khmer">
                      ព្រះរាជាណាចក្រកម្ពុជា
                    </div>
                    <div className="text-[9px] text-amber-200/80 tracking-widest font-khmer">
                      ជាតិ សាសនា ព្រះមហាក្សត្រ
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-cyan-500/20 text-[10px]">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-[8px] font-bold text-amber-300">
                        KH
                      </div>
                      <div>
                        <div className="font-bold text-white text-[10px] font-khmer">
                          អត្តសញ្ញាណប័ណ្ណសញ្ជាតិខ្មែរ
                        </div>
                        <div className="text-[8px] uppercase tracking-wider text-cyan-300">
                          {applicant.documentType || 'National Identity Card'}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[8px] text-slate-400">លេខសម្គាល់ / ID NO.</div>
                      <div className="font-mono font-bold text-cyan-300 text-xs tracking-wider">
                        {applicant.documentNumber || '010892746'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Center Content: Photo, Smart Chip & Khmer Fields */}
                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                  {/* Left Column: Portrait & Smart Chip */}
                  <div className="col-span-4 space-y-1.5">
                    {/* Metallic Smart Contact Chip */}
                    <div className="w-9 h-7 rounded bg-gradient-to-br from-amber-200 via-amber-400 to-amber-500 border border-amber-300 shadow-sm p-0.5 flex flex-col justify-between">
                      <div className="h-0.5 w-full bg-amber-600/40 rounded"></div>
                      <div className="flex justify-between items-center px-0.5">
                        <div className="w-1.5 h-2.5 border border-amber-700/40 rounded-sm"></div>
                        <div className="w-2.5 h-1 border border-amber-700/40 rounded-sm"></div>
                        <div className="w-1.5 h-2.5 border border-amber-700/40 rounded-sm"></div>
                      </div>
                      <div className="h-0.5 w-full bg-amber-600/40 rounded"></div>
                    </div>

                    {/* Portrait Photo */}
                    <div className="w-24 h-28 rounded-lg overflow-hidden border-2 border-cyan-400/60 shadow-md relative bg-slate-900 ring-1 ring-cyan-500/30">
                      <img
                        src={
                          applicant.avatarUrl ||
                          applicant.selfieUrl ||
                          'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
                        }
                        alt={applicant.fullName}
                        className="w-full h-full object-cover"
                      />
                      {/* Security Micro Hologram Strip */}
                      <div className="absolute top-0 right-0 w-2 h-full bg-gradient-to-b from-cyan-400/40 via-purple-400/30 to-amber-400/40 opacity-70"></div>
                      {/* Ghost portrait */}
                      <div className="absolute bottom-1 right-1 w-6 h-7 rounded overflow-hidden border border-cyan-300/60 opacity-40">
                        <img
                          src={
                            applicant.avatarUrl ||
                            applicant.selfieUrl ||
                            'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80'
                          }
                          alt="Ghost"
                          className="w-full h-full object-cover grayscale"
                        />
                      </div>
                    </div>
                    <div className="text-[8px] text-center font-mono text-cyan-300/80">
                      ISO 7816 SMART e-ID
                    </div>
                  </div>

                  {/* Right Column: Bilingual Khmer & English Fields */}
                  <div className="col-span-8 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] text-slate-400 block font-khmer">
                        នាមត្រកូល និងនាមខ្លួន / Full Name
                      </span>
                      <div className="font-bold text-white text-xs font-khmer">
                        សុខ ចាន់ដារ៉ា
                      </div>
                      <div className="font-bold text-cyan-200 text-[11px] tracking-wide">
                        {(analysis.extractedVisualZone?.fullName || applicant.fullName).toUpperCase()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-slate-400 block font-khmer">
                          ភេទ / Sex
                        </span>
                        <span className="font-semibold text-slate-200 text-[10px]">
                          ប្រុស / {analysis.extractedVisualZone?.sex || 'M'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block font-khmer">
                          ថ្ងៃខែឆ្នាំកំណើត / DOB
                        </span>
                        <span className="font-mono font-semibold text-slate-200 text-[10px]">
                          {analysis.extractedVisualZone?.dateOfBirth || applicant.dateOfBirth || '1995-09-12'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[8px] text-slate-400 block font-khmer">
                        ទីកន្លែងកំណើត / Place of Birth
                      </span>
                      <span className="text-slate-200 text-[10px] font-khmer">
                        រាជធានីភ្នំពេញ (Phnom Penh)
                      </span>
                    </div>

                    <div>
                      <span className="text-[8px] text-slate-400 block font-khmer">
                        អាសយដ្ឋាន / Address
                      </span>
                      <span className="text-slate-300 text-[9px] font-khmer leading-tight block">
                        សង្កាត់ទួលទំពូង១ ខណ្ឌចំការមន ភ្នំពេញ
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-0.5">
                      <div>
                        <span className="text-[8px] text-slate-400 block font-khmer">
                          សុពលភាព / Expiry
                        </span>
                        <span className="font-mono text-emerald-300 text-[10px]">
                          {analysis.extractedVisualZone?.expiryDate || '2033-09-12'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] text-slate-400 block font-khmer">
                          អគ្គនាយកដ្ឋាន
                        </span>
                        <span className="text-[9px] font-mono text-amber-300">
                          GDI / អ.អ.ក
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ICAO Machine-Readable Band */}
                <div
                  className={`mt-2 font-mono text-[10px] tracking-wider leading-relaxed p-2 rounded bg-black/85 text-emerald-400 border transition-all ${
                    showMrzOverlay
                      ? 'border-cyan-400/70 shadow-sm ring-1 ring-cyan-500/30'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="break-all">
                    {analysis.extractedMrzZone?.rawLines?.[0] ||
                      `I<KHM${applicant.documentNumber.replace(/\D/g, '').padEnd(9, '<')}<<<<<<<<<<<<<`}
                  </div>
                  <div className="break-all">
                    {analysis.extractedMrzZone?.rawLines?.[1] ||
                      `${applicant.dateOfBirth.replace(/-/g, '').slice(2)}4M3309128KHM<<<<<<<<<<<2`}
                  </div>
                </div>
              </div>
            ) : applicant.id === 'pich_sovann' ||
              (applicant.id.startsWith('case_') &&
                applicant.documentType.toLowerCase().includes('passport')) ? (
              /* Kingdom of Cambodia e-Passport (លិខិតឆ្លងដែន ព្រះរាជាណាចក្រកម្ពុជា) */
              <div className="rounded-xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-[#0a1e36] text-slate-200 p-4 relative font-sans">
                {/* Angkor Wat & Royal Guilloche Motif */}
                <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#fbbf24_1px,transparent_1px)] [background-size:8px_8px]"></div>

                {/* Passport Header */}
                <div className="flex items-center justify-between border-b border-amber-500/30 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center text-[11px] font-bold text-amber-300">
                      KH
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-amber-300 font-khmer">
                        ព្រះរាជាណាចក្រកម្ពុជា · KINGDOM OF CAMBODIA
                      </div>
                      <div className="text-xs font-bold tracking-wider text-white flex items-center gap-1.5 font-khmer">
                        <span>លិខិតឆ្លងដែន / PASSPORT</span>
                        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                          ⚲ e-Chip
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] font-mono text-slate-400">KHM · TYPE: P</div>
                    <div className="text-xs font-mono font-bold text-amber-300">N02194857</div>
                  </div>
                </div>

                {/* Passport Data Page Grid */}
                <div className="grid grid-cols-3 gap-3 items-center mb-3">
                  {/* Photo & Angkor Wat Watermark Background */}
                  <div className="relative">
                    <div className="w-24 h-32 rounded-lg overflow-hidden border-2 border-amber-400/60 shadow-lg relative bg-slate-900">
                      <img
                        src={applicant.avatarUrl}
                        alt="Pich Sovann Portrait"
                        className="w-full h-full object-cover"
                      />
                      {/* Angkor Wat security ghost watermark */}
                      <div className="absolute bottom-1 right-1 w-7 h-9 rounded opacity-40 overflow-hidden border border-amber-200">
                        <img
                          src={applicant.avatarUrl}
                          alt="Ghost"
                          className="w-full h-full object-cover grayscale"
                        />
                      </div>
                    </div>
                    <div className="mt-1 text-[8px] text-center font-mono text-amber-300/80">
                      DOC 9303 BIOMETRIC
                    </div>
                  </div>

                  {/* Visual Fields */}
                  <div className="col-span-2 space-y-1.5 text-[11px]">
                    <div>
                      <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-khmer">
                        នាមត្រកូល / Surname
                      </span>
                      <span className="font-bold text-white tracking-wide">PICH</span>
                    </div>
                    <div>
                      <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-khmer">
                        នាមខ្លួន / Given Names
                      </span>
                      <span className="font-semibold text-slate-200 font-khmer">
                        SOVANN (ពេជ្រ សុវណ្ណ)
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-khmer">
                          សញ្ជាតិ / Nationality
                        </span>
                        <span className="font-semibold text-slate-200">CAMBODIAN / កម្ពុជា</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-khmer">
                          ថ្ងៃកំណើត / Date of Birth
                        </span>
                        <span className="font-semibold text-slate-200">04 JUL / JUIL 1993</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-khmer">
                          ទីកន្លែងកំណើត / Place of Birth
                        </span>
                        <span className="font-mono text-slate-200">KANDAL / កណ្ដាល</span>
                      </div>
                      <div>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 block font-khmer">
                          ថ្ងៃផុតកំណត់ / Expiry
                        </span>
                        <span className="font-semibold text-emerald-300">04 JUL / JUIL 2031</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ICAO TD3 MRZ Zone */}
                <div
                  className={`mt-2 font-mono text-[10px] tracking-wider leading-relaxed p-2 rounded bg-black/85 text-emerald-400 border transition-all ${
                    showMrzOverlay
                      ? 'border-amber-400/70 shadow-sm ring-1 ring-amber-500/30'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="break-all">P&lt;KHMPICH&lt;&lt;SOVANN&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                  <div className="break-all">N021948574KHM9307041M3107048&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;04</div>
                </div>
              </div>
            ) : applicant.id === 'meas_vannak' ? (
              /* Cambodian Driver's License (ប័ណ្ណបើកបរយានយន្ត - ក្រសួងសាធារណការ និងដឹកជញ្ជូន) */
              <div className="rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-gradient-to-br from-[#1c2430] via-[#151c26] to-[#0f141c] text-slate-200 p-4 relative font-sans">
                {/* Header */}
                <div className="border-b border-amber-500/30 pb-2 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-[10px] font-bold text-amber-300">
                        MPWT
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-amber-300 font-khmer">
                          ក្រសួងសាធារណការ និងដឹកជញ្ជូន
                        </div>
                        <div className="text-[8px] uppercase tracking-wider text-slate-400">
                          Ministry of Public Works and Transport
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 font-bold">
                        ប្រភេទ B (Class B)
                      </span>
                    </div>
                  </div>
                  <div className="text-xs font-bold text-white mt-1 text-center font-khmer">
                    ប័ណ្ណបើកបរយានយន្ត · DRIVING LICENSE
                  </div>
                </div>

                {/* Center Content */}
                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                  <div className="col-span-4 space-y-1">
                    <div className="w-24 h-28 rounded-lg overflow-hidden border border-slate-600 shadow-md relative bg-slate-900">
                      <img
                        src={applicant.avatarUrl}
                        alt="Meas Vannak Portrait"
                        className="w-full h-full object-cover"
                      />
                      {/* Specular glare simulation for challenge scenario */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none"></div>
                    </div>
                    <div className="text-[8px] text-center font-mono text-slate-400">
                      ISS: 20-12-2022
                    </div>
                  </div>

                  <div className="col-span-8 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] text-slate-400 block">លេខប័ណ្ណ / DL NO.</span>
                      <span className="font-mono font-bold text-white">DL-KHM-582914</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block font-khmer">ឈ្មោះ / NAME</span>
                      <div className="font-bold text-white font-khmer text-xs">មាស វណ្ណៈ</div>
                      <div className="font-bold text-slate-200 text-[10px]">MEAS VANNAK</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-slate-400 block">ថ្ងៃខែឆ្នាំកំណើត / DOB</span>
                        <span className="font-mono text-slate-200 text-[10px]">20-12-1997</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">ភេទ / SEX</span>
                        <span className="text-slate-200 text-[10px]">ប្រុស / M</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <div>
                        <span className="text-[8px] text-slate-400 block">ផុតកំណត់ / EXPIRY</span>
                        <span className="font-mono text-emerald-300 text-[10px]">20-12-2027</span>
                      </div>
                      {/* Specular glare notice */}
                      <div className="p-1 rounded bg-amber-950/60 border border-amber-500/60 shadow-sm">
                        <span className="text-[8px] font-bold text-amber-300 block flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                          <span>GLARE NOTICE</span>
                        </span>
                        <span className="text-[8px] text-amber-200/90 block">
                          Seal reflection
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2D Barcode & Verification Zone */}
                <div className="mt-2 font-mono text-[9px] p-2 rounded bg-black/90 border border-slate-800 flex items-center justify-between text-slate-400">
                  <div>
                    <div>DLKHM582914&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                    <div>9712204M2712202KHM&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;7</div>
                  </div>
                  <div className="text-right text-[8px] text-amber-300/80 font-khmer">
                    ក្រសួងសាធារណការ
                  </div>
                </div>
              </div>
            ) : applicant.id === 'amira_chen' ? (
              /* Singapore National Registration ID Card (Pink IC with Deepfake Anomaly) */
              <div className="rounded-xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-gradient-to-br from-[#111c2e] via-[#0d1624] to-[#080d16] text-slate-200 p-4 relative font-sans">
                {/* Security Guilloche Pattern */}
                <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ec4899_1px,transparent_1px)] [background-size:8px_8px]"></div>

                {/* Card Header */}
                <div className="flex items-center justify-between border-b border-rose-500/30 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-rose-600/20 border border-rose-500/50 flex items-center justify-center text-[10px] font-bold text-rose-300">
                      SG
                    </div>
                    <div>
                      <div className="text-[11px] font-bold tracking-wider text-slate-100">
                        REPUBLIC OF SINGAPORE
                      </div>
                      <div className="text-[8px] uppercase tracking-wider text-rose-300/90 font-medium">
                        NATIONAL REGISTRATION IDENTITY CARD
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] text-slate-400">IDENTITY NO.</div>
                    <div className="text-xs font-mono text-cyan-300 font-bold">S8839201F</div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                  {/* Photo with edge-softening highlight */}
                  <div className="col-span-4 space-y-1">
                    <div className="w-24 h-28 rounded-lg overflow-hidden border-2 border-amber-400/60 shadow-md relative bg-slate-900 ring-2 ring-amber-500/30">
                      <img
                        src={applicant.avatarUrl}
                        alt="Amira Chen Portrait"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 border border-amber-400/40 rounded-lg pointer-events-none"></div>
                    </div>
                    <div className="text-[8px] text-center font-mono text-amber-400 mt-1 flex items-center justify-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>SYNTHETIC BIOMETRIC</span>
                    </div>
                  </div>

                  {/* Visual Fields */}
                  <div className="col-span-8 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] text-slate-400 block">NAME / 姓名</span>
                      <span className="font-bold text-white text-xs">AMIRA CHEN WEI</span>
                      <span className="font-bold text-rose-200 text-[10px] ml-1.5">陈美华</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-slate-400 block">RACE / SEX</span>
                        <span className="text-slate-200 text-[10px]">CHINESE / F</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">DOB</span>
                        <span className="font-mono text-slate-200 text-[10px]">04-11-1998</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-slate-400 block">COUNTRY OF BIRTH</span>
                        <span className="text-slate-200 text-[10px]">SINGAPORE</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">STATUS</span>
                        <span className="font-mono text-emerald-300 text-[10px]">CITIZEN (PINK)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`mt-2 font-mono text-[9px] tracking-wider leading-relaxed p-2 rounded bg-black/90 border ${
                    showMrzOverlay ? 'border-rose-500/60' : 'border-slate-800'
                  }`}
                >
                  <div className="text-slate-300">I&lt;SGPS8839201F1&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                  <div className="text-slate-300">9811042F2811046SGP&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;8</div>
                </div>
              </div>
            ) : applicant.id === 'darren_tan' ? (
              /* Singapore Biometric Passport */
              <div className="rounded-xl overflow-hidden border-2 border-rose-500/50 shadow-2xl bg-gradient-to-br from-[#2a0e14] via-[#1a080d] to-[#100407] text-slate-200 p-4 relative font-sans">
                <div className="flex items-center justify-between border-b border-rose-500/30 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">SG</span>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-rose-300">
                        REPUBLIC OF SINGAPORE
                      </div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>PASSPORT · PASPORT</span>
                        <span className="text-[9px] font-mono px-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          ⚲ ICAO TD3
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] text-slate-400">PASSPORT NO.</div>
                    <div className="text-xs font-mono font-bold text-rose-300">K9382104E</div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                  <div className="col-span-4 space-y-1">
                    <div className="w-24 h-30 rounded-lg overflow-hidden border-2 border-rose-400/60 shadow-md relative bg-slate-900">
                      <img src={applicant.avatarUrl} alt="Darren Tan" className="w-full h-full object-cover" />
                      <div className="absolute bottom-1 right-1 w-6 h-7 rounded border border-rose-300 opacity-40 overflow-hidden">
                        <img src={applicant.avatarUrl} alt="Ghost" className="w-full h-full object-cover grayscale" />
                      </div>
                    </div>
                    <div className="text-[8px] text-center font-mono text-rose-300/80">ICA CSCA VERIFIED</div>
                  </div>
                  <div className="col-span-8 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] text-slate-400 block">SURNAME / GIVEN NAMES</span>
                      <div className="font-bold text-white">TAN, DARREN JUN HAO</div>
                      <div className="text-[10px] text-rose-200">陈俊豪</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-slate-400 block">NATIONALITY</span>
                        <span className="font-semibold text-slate-200 text-[10px]">SINGAPORE CITIZEN</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">DATE OF BIRTH</span>
                        <span className="font-mono text-slate-200 text-[10px]">22 MAR 1994</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-slate-400 block">SEX</span>
                        <span className="text-slate-200 text-[10px]">M</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">EXPIRY DATE</span>
                        <span className="font-mono text-emerald-300 text-[10px]">22 MAR 2034</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 font-mono text-[9px] p-2 rounded bg-black/90 text-emerald-400 border border-slate-800">
                  <div>P&lt;SGPTAN&lt;&lt;DARREN&lt;JUN&lt;HAO&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                  <div>K9382104E8SGP9403225M3403228&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;02</div>
                </div>
              </div>
            ) : applicant.id === 'nurul_aisyah' ? (
              /* Malaysia MyKad Smart Card */
              <div className="rounded-xl overflow-hidden border-2 border-blue-500/50 shadow-2xl bg-gradient-to-br from-[#0d1e34] via-[#091524] to-[#050c14] text-slate-200 p-4 relative font-sans">
                <div className="flex items-center justify-between border-b border-blue-500/30 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">MY</span>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-amber-300">MALAYSIA</div>
                      <div className="text-xs font-bold text-white">KAD PENGENALAN · MYKAD</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] text-slate-400">NO. KPT</div>
                    <div className="text-xs font-mono font-bold text-cyan-300">960514-10-5432</div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                  <div className="col-span-4 space-y-1.5">
                    {/* MyKad Touch n Go Smart Chip */}
                    <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-300 shadow p-0.5 flex flex-col justify-between">
                      <div className="h-0.5 bg-amber-700/40 rounded"></div>
                      <div className="flex justify-between px-0.5">
                        <div className="w-1.5 h-2 border border-amber-800/40"></div>
                        <div className="w-1.5 h-2 border border-amber-800/40"></div>
                      </div>
                      <div className="h-0.5 bg-amber-700/40 rounded"></div>
                    </div>
                    <div className="w-24 h-28 rounded-lg overflow-hidden border-2 border-cyan-400/60 shadow relative bg-slate-900">
                      <img src={applicant.avatarUrl} alt="Nurul Aisyah" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[8px] text-center font-mono text-cyan-300">WARGANEGARA</div>
                  </div>

                  <div className="col-span-8 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] text-slate-400 block">NAMA / FULL NAME</span>
                      <div className="font-bold text-white text-xs">NURUL AISYAH BINTI RAHMAN</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-slate-400 block">JANTINA / SEX</span>
                        <span className="text-slate-200 text-[10px]">PEREMPUAN</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">TARIKH LAHIR</span>
                        <span className="font-mono text-slate-200 text-[10px]">14-05-1996</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block">ALAMAT / ADDRESS</span>
                      <span className="text-slate-300 text-[9px] block">
                        NO. 18 JALAN AMPANG JAYA, 68000 AMPANG, SELANGOR
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 font-mono text-[9px] p-2 rounded bg-black/90 text-cyan-300 border border-slate-800 flex justify-between">
                  <span>I&lt;MYS960514105432&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
                  <span className="text-slate-400">JPN JATA NEGARA</span>
                </div>
              </div>
            ) : applicant.id === 'hafiz_zulkifli' ? (
              /* Malaysia International Passport with Tampered Expiry Alert */
              <div className="rounded-xl overflow-hidden border-2 border-red-500/50 shadow-2xl bg-gradient-to-br from-[#260c0e] via-[#1a080a] to-[#120406] text-slate-200 p-4 relative font-sans">
                <div className="flex items-center justify-between border-b border-red-500/30 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">MY</span>
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400">MALAYSIA</div>
                      <div className="text-xs font-bold text-white">PASPORT · PASSPORT</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] text-slate-400">PASPORT NO.</div>
                    <div className="text-xs font-mono font-bold text-amber-300">A59201482</div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                  <div className="col-span-4 space-y-1">
                    <div className="w-24 h-28 rounded-lg overflow-hidden border border-slate-600 shadow relative bg-slate-900">
                      <img src={applicant.avatarUrl} alt="Hafiz Zulkifli" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="col-span-8 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] text-slate-400 block">NAMA / NAME</span>
                      <div className="font-bold text-white text-xs">MUHAMMAD HAFIZ BIN ZULKIFLI</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-slate-400 block">WARGANEGARA</span>
                        <span className="text-slate-200 text-[10px]">MALAYSIAN</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">TARIKH LAHIR</span>
                        <span className="font-mono text-slate-200 text-[10px]">19 AUG 1991</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      {/* Tampered Expiry Notice */}
                      <div className="p-1 rounded bg-red-950/80 border border-red-500/80 shadow-sm relative">
                        <span className="text-[8px] font-bold text-red-300 flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                          <span>EXPIRY ALTERED</span>
                        </span>
                        <span className="font-mono font-bold text-red-200 text-xs">19 AUG 2029</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">MRZ ACTUAL</span>
                        <span className="font-mono text-amber-400 text-xs">19 AUG 2024</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 font-mono text-[9px] p-2 rounded bg-black/95 border border-red-500/60 text-slate-300">
                  <div>P&lt;MYSZULKIFLI&lt;&lt;MUHAMMAD&lt;HAFIZ&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
                  <div className="flex items-center gap-1">
                    <span>A592014824MYS9108191M</span>
                    <span className="bg-red-500/40 text-red-200 px-1 font-bold underline">2408193</span>
                    <span>&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;08</span>
                  </div>
                  <div className="text-[8px] text-red-400 mt-0.5 flex items-center gap-1 font-sans">
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                    <span>MRZ indicates 2024 expiration (expired 2 years ago), not 2029!</span>
                  </div>
                </div>
              </div>
            ) : applicant.id === 'somchai_prasert' ? (
              /* Thailand Smart National ID Card */
              <div className="rounded-xl overflow-hidden border-2 border-blue-500/50 shadow-2xl bg-gradient-to-br from-[#122238] via-[#0d1829] to-[#070d17] text-slate-200 p-4 relative font-sans">
                <div className="flex items-center justify-between border-b border-blue-400/30 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">TH</span>
                    <div>
                      <div className="text-[10px] font-bold text-amber-300 font-thai">
                        บัตรประจำตัวประชาชนไทย
                      </div>
                      <div className="text-[8px] uppercase tracking-wider text-slate-400">
                        Thai National ID Card (DOPA)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] text-slate-400 font-thai">เลขประจำตัวประชาชน</div>
                    <div className="text-xs font-mono font-bold text-cyan-300">1-1037-02948-12-3</div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                  <div className="col-span-4 space-y-1">
                    <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-300 p-0.5 flex flex-col justify-between">
                      <div className="h-0.5 bg-amber-700/40 rounded"></div>
                      <div className="flex justify-between px-0.5">
                        <div className="w-1.5 h-2 border border-amber-800/40"></div>
                        <div className="w-1.5 h-2 border border-amber-800/40"></div>
                      </div>
                      <div className="h-0.5 bg-amber-700/40 rounded"></div>
                    </div>
                    <div className="w-24 h-28 rounded-lg overflow-hidden border-2 border-cyan-400/60 shadow relative bg-slate-900">
                      <img src={applicant.avatarUrl} alt="Somchai Prasert" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[8px] text-center font-mono text-cyan-300">GARUDA SEAL</div>
                  </div>

                  <div className="col-span-8 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] text-slate-400 block font-thai">ชื่อตัวและชื่อสกุล / Name</span>
                      <div className="font-bold text-white text-xs font-thai">นายสมชาย ประเสริฐ</div>
                      <div className="text-slate-200 text-[10px] font-bold">Mr. Somchai Prasert</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] text-slate-400 block font-thai">เกิดวันที่ / DOB</span>
                        <span className="font-mono text-slate-200 text-[10px]">28 พ.ย. 2533 (1990)</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block font-thai">ศาสนา / Religion</span>
                        <span className="text-slate-200 text-[10px] font-thai">พุทธ (Buddhism)</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block font-thai">วันหมดอายุ / Expiry</span>
                      <span className="font-mono text-emerald-300 text-[10px]">28 พ.ย. 2573 (2030)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 font-mono text-[9px] p-2 rounded bg-black/90 text-cyan-300 border border-slate-800 flex justify-between">
                  <span>IDTHA1103702948123&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
                  <span className="text-amber-300/80 font-thai">กรมการปกครอง</span>
                </div>
              </div>
            ) : applicant.id === 'siti_rahmawati' ? (
              /* Indonesia e-KTP */
              <div className="rounded-xl overflow-hidden border-2 border-cyan-500/50 shadow-2xl bg-gradient-to-br from-[#0c2438] via-[#091b2b] to-[#05111c] text-slate-200 p-4 relative font-sans">
                <div className="border-b border-cyan-500/30 pb-2 mb-2 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs">ID</span>
                    <span className="text-[11px] font-black tracking-wider text-cyan-200">
                      REPUBLIK INDONESIA
                    </span>
                  </div>
                  <div className="text-[9px] tracking-widest text-slate-300 font-bold">
                    PROVINSI DKI JAKARTA · KARTU TANDA PENDUDUK
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                  <div className="col-span-8 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] text-slate-400 block font-bold">NIK</span>
                      <span className="font-mono font-bold text-amber-300 text-xs">3174055209930002</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block">Nama</span>
                      <span className="font-bold text-white text-xs">SITI RAHMAWATI</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div>
                        <span className="text-[8px] text-slate-400 block">Tempat/Tgl Lahir</span>
                        <span className="font-mono text-slate-200">JAKARTA, 12-09-1993</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">Jenis Kelamin</span>
                        <span className="text-slate-200">PEREMPUAN</span>
                      </div>
                    </div>
                    <div className="text-[10px]">
                      <span className="text-[8px] text-slate-400 block">Berlaku Hingga</span>
                      <span className="font-mono text-emerald-300 font-bold">SEUMUR HIDUP</span>
                    </div>
                  </div>

                  <div className="col-span-4 space-y-1">
                    <div className="w-24 h-28 rounded-lg overflow-hidden border-2 border-cyan-400/60 shadow relative bg-slate-900">
                      <img src={applicant.avatarUrl} alt="Siti Rahmawati" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[8px] text-center font-mono text-cyan-300">DUKCAPIL CHIP</div>
                  </div>
                </div>

                <div className="mt-2 font-mono text-[9px] p-2 rounded bg-black/90 text-emerald-400 border border-slate-800 flex justify-between">
                  <span>I&lt;IDN3174055209930002&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
                  <span className="text-slate-400">GARUDA PANCASILA</span>
                </div>
              </div>
            ) : applicant.id === 'nguyen_mai' ? (
              /* Vietnam CCCD Chip Card */
              <div className="rounded-xl overflow-hidden border-2 border-red-500/50 shadow-2xl bg-gradient-to-br from-[#261014] via-[#1a0a0d] to-[#0e0406] text-slate-200 p-4 relative font-sans">
                <div className="border-b border-red-500/30 pb-2 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">VN</span>
                      <div>
                        <div className="text-[10px] font-bold text-amber-300">
                          CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                        </div>
                        <div className="text-[8px] text-slate-400">Độc lập - Tự do - Hạnh phúc</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-mono px-1 rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                        BỘ CÔNG AN
                      </span>
                    </div>
                  </div>
                  <div className="text-center mt-1">
                    <div className="text-xs font-bold text-white tracking-wide">
                      CĂN CƯỚC CÔNG DÂN / CITIZEN IDENTITY CARD
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                  <div className="col-span-4 space-y-1">
                    <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-300 to-amber-500 border border-amber-300 p-0.5 flex flex-col justify-between">
                      <div className="h-0.5 bg-amber-700/40 rounded"></div>
                      <div className="flex justify-between px-0.5">
                        <div className="w-1.5 h-2 border border-amber-800/40"></div>
                        <div className="w-1.5 h-2 border border-amber-800/40"></div>
                      </div>
                      <div className="h-0.5 bg-amber-700/40 rounded"></div>
                    </div>
                    <div className="w-24 h-28 rounded-lg overflow-hidden border-2 border-red-400/60 shadow relative bg-slate-900">
                      <img src={applicant.avatarUrl} alt="Nguyen Thi Mai" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="col-span-8 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] text-slate-400 block">Số / No.</span>
                      <span className="font-mono font-bold text-amber-300 text-xs">001197028491</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block">Họ và tên / Full name</span>
                      <span className="font-bold text-white text-xs">NGUYỄN THỊ MAI</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div>
                        <span className="text-[8px] text-slate-400 block">Ngày sinh / DOB</span>
                        <span className="font-mono text-slate-200">25/06/1997</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">Giới tính / Sex</span>
                        <span className="text-slate-200">Nữ / F</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block">Có giá trị đến / Date of expiry</span>
                      <span className="font-mono text-emerald-300 text-[10px]">25/06/2037</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 font-mono text-[9px] p-2 rounded bg-black/90 text-emerald-400 border border-slate-800 flex justify-between">
                  <span>IDVNM001197028491&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
                  <span className="text-amber-300/80">QR CHIP 2026</span>
                </div>
              </div>
            ) : applicant.id === 'maria_santos' ? (
              /* Philippines PhilSys National ID (PhilID) */
              <div className="rounded-xl overflow-hidden border-2 border-blue-500/50 shadow-2xl bg-gradient-to-br from-[#0c223c] via-[#08182b] to-[#040e1b] text-slate-200 p-4 relative font-sans">
                <div className="flex items-center justify-between border-b border-blue-400/30 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">PH</span>
                    <div>
                      <div className="text-[10px] font-bold text-amber-300">
                        REPUBLIKA NG PILIPINAS
                      </div>
                      <div className="text-[8px] uppercase tracking-wider text-slate-300">
                        Philippine Identification System (PhilSys)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-mono text-slate-400">PSA PhilID</span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                  <div className="col-span-4 space-y-1">
                    <div className="w-24 h-28 rounded-lg overflow-hidden border-2 border-amber-400/60 shadow relative bg-slate-900">
                      <img src={applicant.avatarUrl} alt="Maria Santos" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[8px] text-center font-mono text-amber-300">PSA VERIFIED</div>
                  </div>

                  <div className="col-span-8 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] text-slate-400 block">PhilSys Card Number (PCN)</span>
                      <span className="font-mono font-bold text-cyan-300 text-xs">6019-4820-1948-2018</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block">Apelyido / Last Name</span>
                      <span className="font-bold text-white text-xs">DELA CRUZ</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block">Mga Pangalan / Given Names</span>
                      <span className="font-bold text-slate-200 text-xs">MARIA SANTOS</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div>
                        <span className="text-[8px] text-slate-400 block">Kapanganakan / DOB</span>
                        <span className="font-mono text-slate-200">12/08/1995</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">Kasarian / Sex</span>
                        <span className="text-slate-200">FEMALE</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 font-mono text-[9px] p-2 rounded bg-black/90 text-cyan-300 border border-slate-800 flex justify-between">
                  <span>IDPHL6019482019482018&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
                  <span className="text-amber-300/80">EAGLE CREST</span>
                </div>
              </div>
            ) : applicant.id === 'sengdao_phomvihane' ? (
              /* Laos National ID Card */
              <div className="rounded-xl overflow-hidden border-2 border-red-500/50 shadow-2xl bg-gradient-to-br from-[#1e1022] via-[#150a18] to-[#0c050e] text-slate-200 p-4 relative font-sans">
                <div className="border-b border-red-500/30 pb-2 mb-2 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs">LA</span>
                    <span className="text-[10px] font-bold text-amber-300">
                      ສາທາລະນະລັດ ປະຊາທິປະໄຕ ປະຊາຊົນລາວ
                    </span>
                  </div>
                  <div className="text-[8px] text-slate-400">
                    Lao People's Democratic Republic · National Identity Card
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                  <div className="col-span-4 space-y-1">
                    <div className="w-24 h-28 rounded-lg overflow-hidden border-2 border-red-400/60 shadow relative bg-slate-900">
                      <img src={applicant.avatarUrl} alt="Sengdao Phomvihane" className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[8px] text-center font-mono text-amber-300">PHA THAT LUANG</div>
                  </div>

                  <div className="col-span-8 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] text-slate-400 block">ເລກບັດ / ID NUMBER</span>
                      <span className="font-mono font-bold text-amber-300 text-xs">06-01928401</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block">ຊື່ ແລະ ນາມສະກຸນ / Name</span>
                      <div className="font-bold text-white text-xs">ແສງດາວ ພົມວິຫານ</div>
                      <div className="text-slate-200 text-[10px]">SENGDAO PHOMVIHANE</div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div>
                        <span className="text-[8px] text-slate-400 block">ວັນເດືອນປີເກີດ / DOB</span>
                        <span className="font-mono text-slate-200">18/05/1994</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">ເພດ / Sex</span>
                        <span className="text-slate-200">ຍິງ / F</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 font-mono text-[9px] p-2 rounded bg-black/90 text-emerald-400 border border-slate-800 flex justify-between">
                  <span>IDLAO0601928401&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
                  <span className="text-slate-400">VIENTIANE 06</span>
                </div>
              </div>
            ) : applicant.id === 'aung_kyaw_moe' ? (
              /* Myanmar National Registration Card (NRC) */
              <div className="rounded-xl overflow-hidden border-2 border-amber-500/50 shadow-2xl bg-gradient-to-br from-[#1c1808] via-[#141005] to-[#0a0802] text-slate-200 p-4 relative font-sans">
                <div className="border-b border-amber-500/30 pb-2 mb-2 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className="text-xs">MM</span>
                    <span className="text-[10px] font-bold text-amber-300">
                      ပြည်ထောင်စုသမ္မတမြန်မာနိုင်ငံတော်
                    </span>
                  </div>
                  <div className="text-[8px] text-slate-400">
                    Republic of the Union of Myanmar · National Registration Card
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                  <div className="col-span-4 space-y-1">
                    <div className="w-24 h-28 rounded-lg overflow-hidden border-2 border-amber-400/60 shadow relative bg-slate-900">
                      <img src={applicant.avatarUrl} alt="Aung Kyaw Moe" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="col-span-8 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] text-slate-400 block">မှတ်ပုံတင်အမှတ် / NRC NO.</span>
                      <span className="font-mono font-bold text-amber-300 text-xs">12/KAMAYA(N)092810</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block">အမည် / Name</span>
                      <div className="font-bold text-white text-xs">အောင်ကျော်မိုး</div>
                      <div className="text-slate-200 text-[10px]">AUNG KYAW MOE</div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div>
                        <span className="text-[8px] text-slate-400 block">မွေးသက္ကရာဇ် / DOB</span>
                        <span className="font-mono text-slate-200">20-01-1993</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">လူမျိုး / Ethnicity</span>
                        <span className="text-slate-200">ဗမာ (Bamar)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 font-mono text-[9px] p-2 rounded bg-black/90 text-amber-300 border border-slate-800 flex justify-between">
                  <span>IDMMR12KAMAYA092810&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
                  <span className="text-slate-400">YANGON REGION</span>
                </div>
              </div>
            ) : applicant.id === 'siti_hajar' ? (
              /* Brunei Smart Identity Card (Yellow Citizen IC) */
              <div className="rounded-xl overflow-hidden border-2 border-amber-400/60 shadow-2xl bg-gradient-to-br from-[#2a2208] via-[#1a1403] to-[#0e0b02] text-slate-200 p-4 relative font-sans">
                <div className="border-b border-amber-400/40 pb-2 mb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">BN</span>
                      <div>
                        <div className="text-[10px] font-bold text-amber-300">
                          NEGARA BRUNEI DARUSSALAM
                        </div>
                        <div className="text-[8px] text-slate-300">
                          KAD PENGENALAN PINTAR (WARGA NEGARA)
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] font-mono px-1 rounded bg-amber-400/20 text-amber-200 border border-amber-400/40">
                        YELLOW IC
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center mb-2">
                  <div className="col-span-4 space-y-1">
                    <div className="w-8 h-6 rounded bg-gradient-to-br from-amber-200 to-amber-500 border border-amber-300 p-0.5 flex flex-col justify-between">
                      <div className="h-0.5 bg-amber-700/40 rounded"></div>
                      <div className="flex justify-between px-0.5">
                        <div className="w-1.5 h-2 border border-amber-800/40"></div>
                        <div className="w-1.5 h-2 border border-amber-800/40"></div>
                      </div>
                      <div className="h-0.5 bg-amber-700/40 rounded"></div>
                    </div>
                    <div className="w-24 h-28 rounded-lg overflow-hidden border-2 border-amber-400/60 shadow relative bg-slate-900">
                      <img src={applicant.avatarUrl} alt="Siti Hajar" className="w-full h-full object-cover" />
                    </div>
                  </div>

                  <div className="col-span-8 space-y-1 text-[11px]">
                    <div>
                      <span className="text-[8px] text-slate-400 block">NOMBOR K.P. / IC NO.</span>
                      <span className="font-mono font-bold text-amber-300 text-xs">01-094820</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-400 block">NAMA / NAME</span>
                      <div className="font-bold text-white text-xs">DAYANGKU SITI HAJAR BINTI PENGIRAN</div>
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <div>
                        <span className="text-[8px] text-slate-400 block">TARIKH LAHIR / DOB</span>
                        <span className="font-mono text-slate-200">12-04-1995</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-slate-400 block">JANTINA / SEX</span>
                        <span className="text-slate-200">PEREMPUAN</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-2 font-mono text-[9px] p-2 rounded bg-black/90 text-amber-300 border border-slate-800 flex justify-between">
                  <span>IDBRN01094820&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
                  <span className="text-slate-400">CREST OF BRUNEI</span>
                </div>
              </div>
            ) : (
              /* Universal ASEAN Document Template for Passports & National IDs */
              <div className="rounded-xl overflow-hidden border-2 border-slate-700 shadow-2xl bg-gradient-to-br from-[#0e1726] via-[#09111e] to-[#050912] text-slate-200 p-4 relative font-sans">
                <div className="flex items-center justify-between border-b border-slate-700 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">
                      {applicant.nationality === 'KHM'
                        ? 'KH'
                        : applicant.nationality === 'SGP'
                        ? 'SG'
                        : applicant.nationality === 'MYS'
                        ? 'MY'
                        : applicant.nationality === 'THA'
                        ? 'TH'
                        : applicant.nationality === 'IDN'
                        ? 'ID'
                        : applicant.nationality === 'VNM'
                        ? 'VN'
                        : applicant.nationality === 'PHL'
                        ? 'PH'
                        : applicant.nationality === 'LAO'
                        ? 'LA'
                        : applicant.nationality === 'MMR'
                        ? 'MM'
                        : applicant.nationality === 'BRN'
                        ? 'BN'
                        : '🌐'}
                    </span>
                    <div>
                      <div className="text-[11px] font-bold tracking-wider text-slate-100">
                        {applicant.documentType}
                      </div>
                      <div className="text-[8px] uppercase tracking-wider text-slate-400">
                        ASEAN VERIFIED IDENTITY DOCUMENT
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] text-slate-400">DOCUMENT NO.</div>
                    <div className="text-xs font-mono font-bold text-cyan-300">
                      {applicant.documentNumber}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 items-center mb-2 min-w-0">
                  <div className="col-span-4 space-y-1 min-w-0">
                    <div className="w-16 h-20 sm:w-24 sm:h-28 rounded-lg overflow-hidden border border-slate-600 shadow relative bg-slate-900">
                      <img src={applicant.avatarUrl} alt={applicant.fullName} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="col-span-8 space-y-1 text-[11px] min-w-0">
                    <div className="min-w-0">
                      <span className="text-[8px] text-slate-400 block">FULL LEGAL NAME</span>
                      <span className="font-bold text-white text-xs truncate block">{applicant.fullName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 min-w-0">
                      <div className="min-w-0">
                        <span className="text-[8px] text-slate-400 block">NATIONALITY</span>
                        <span className="text-slate-200 text-[10px] font-semibold truncate block">{applicant.nationality}</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[8px] text-slate-400 block">DATE OF BIRTH</span>
                        <span className="font-mono text-slate-200 text-[10px] truncate block">{applicant.dateOfBirth}</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <span className="text-[8px] text-slate-400 block">STATUS</span>
                      <span className="text-[10px] text-emerald-300 font-mono truncate block">ASEAN RECOGNIZED</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 font-mono text-[9px] p-2 rounded bg-black/90 text-emerald-400 border border-slate-800 flex items-center justify-between gap-2 min-w-0 overflow-hidden">
                  <span className="truncate min-w-0 flex-1">I&lt;{applicant.nationality}{applicant.documentNumber.replace(/[^a-zA-Z0-9]/g, '')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</span>
                  <span className="text-slate-400 shrink-0">ICAO DOC 9303</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Biometric Liveness Capture & Facial Alignment Stream */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Camera className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-slate-200 text-sm">
              Face &amp; Liveness Check
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowFaceMesh(!showFaceMesh)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition-all shrink-0 ${
              showFaceMesh
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {showFaceMesh ? 'Hide Face Guide' : 'Show Face Guide'}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center min-w-0">
          {/* Selfie Capture Box */}
          <div className="relative rounded-xl overflow-hidden border border-slate-700 bg-slate-950 max-h-[200px] flex items-center justify-center">
            <img
              src={customSelfieUrl || applicant.selfieUrl}
              alt="Applicant selfie"
              className="w-full h-[200px] object-cover"
            />

            {/* Face Guide Overlay */}
            {showFaceMesh && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <svg className="w-48 h-48 text-cyan-400/60" viewBox="0 0 100 100">
                  <circle cx="35" cy="42" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <circle cx="65" cy="42" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <line x1="50" y1="42" x2="50" y2="56" stroke="currentColor" strokeWidth="0.8" />
                  <ellipse cx="50" cy="68" rx="12" ry="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
                  <path d="M 22,40 Q 24,78 50,88 Q 76,78 78,40" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2,2" />
                </svg>
              </div>
            )}
          </div>

          {/* Biometric Scores & Diagnostics */}
          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-400">Face Match Score</span>
                <span
                  className={`font-mono font-bold ${
                    analysis.biometricAnalysis.faceMatchScore >= 80
                      ? 'text-emerald-400'
                      : analysis.biometricAnalysis.faceMatchScore >= 60
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {analysis.biometricAnalysis.faceMatchScore}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    analysis.biometricAnalysis.faceMatchScore >= 80
                      ? 'bg-emerald-500'
                      : analysis.biometricAnalysis.faceMatchScore >= 60
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${analysis.biometricAnalysis.faceMatchScore}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Live Person Check</span>
                <span className="font-bold text-emerald-400">
                  Passed ({analysis.biometricAnalysis.livenessConfidence}%)
                </span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Photo Comparison</span>
                <span
                  className={`font-bold ${
                    analysis.biometricAnalysis.faceMatchStatus === 'MATCH'
                      ? 'text-emerald-400'
                      : analysis.biometricAnalysis.faceMatchStatus === 'INCONCLUSIVE'
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {analysis.biometricAnalysis.faceMatchStatus === 'MATCH' ? 'Matched' : 'Mismatch'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
              {analysis.biometricAnalysis.notes}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
