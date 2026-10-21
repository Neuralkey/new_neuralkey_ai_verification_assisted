import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, FileCode, CheckSquare, Sparkles, HelpCircle } from 'lucide-react';
import { ForensicAnalysis, ApplicantProfile } from '../types';

interface ExtractionCrossCheckProps {
  analysis: ForensicAnalysis;
  applicant: ApplicantProfile;
}

export const ExtractionCrossCheck: React.FC<ExtractionCrossCheckProps> = ({
  analysis,
  applicant,
}) => {
  const { extractedVisualZone, extractedMrzZone, consistencyChecks } = analysis;

  // Single consistent status rendering (UI-12: green = match, amber = check, red = flag, icon + word)
  const renderStatus = (status: 'MATCH' | 'CHECK' | 'FLAG', label?: string) => {
    if (status === 'MATCH') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{label || 'Matched'}</span>
        </span>
      );
    }
    if (status === 'CHECK') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>{label || 'Needs Check'}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-300 bg-red-500/20 border border-red-500/40 px-2 py-0.5 rounded-md">
        <XCircle className="w-3.5 h-3.5 text-red-400" />
        <span>{label || 'Mismatch'}</span>
      </span>
    );
  };

  const normalizeText = (val?: string) =>
    (val || '')
      .split('(')[0]
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

  const rawLines = extractedMrzZone?.rawLines || [];
  const safeConsistencyChecks = consistencyChecks || [];

  // Dynamically parse candidate holder name from raw MRZ lines
  const printedName = extractedVisualZone?.fullName || applicant.fullName;
  let mrzParsedName = printedName;
  if (rawLines.length > 0) {
    const line0 = rawLines[0].replace(/<+$/, '');
    if (line0.startsWith('P<') || line0.startsWith('I<')) {
      const nameSegment = line0.slice(5);
      const nameParts = nameSegment.split('<<').map((t) => t.replace(/</g, ' ').trim()).filter(Boolean);
      if (nameParts.length > 0) {
        mrzParsedName = nameParts.join(', ');
      }
    }
  }

  const normDeclared = normalizeText(applicant.fullName);
  const normPrinted = normalizeText(printedName);
  const normMrz = normalizeText(mrzParsedName);

  const isNameMismatch =
    (Boolean(normPrinted) && Boolean(normMrz) && !normPrinted.includes(normMrz) && !normMrz.includes(normPrinted)) ||
    (Boolean(normDeclared) && Boolean(normPrinted) && !normDeclared.includes(normPrinted) && !normPrinted.includes(normDeclared));

  const normalizeIsoDate = (val?: string): string => {
    const raw = (val || '').split('(')[0].trim();
    const isoMatch = raw.match(/\b(\d{4})[./-](\d{2})[./-](\d{2})\b/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
    const dmyMatch = raw.match(/\b(\d{2})[./-](\d{2})[./-](\d{4})\b/);
    if (dmyMatch) return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    return raw;
  };

  const isDobMismatch =
    (Boolean(extractedMrzZone?.dateOfBirth) &&
      Boolean(extractedVisualZone?.dateOfBirth) &&
      normalizeIsoDate(extractedVisualZone?.dateOfBirth) !== normalizeIsoDate(extractedMrzZone?.dateOfBirth)) ||
    (Boolean(applicant.dateOfBirth) &&
      Boolean(extractedVisualZone?.dateOfBirth) &&
      normalizeIsoDate(applicant.dateOfBirth) !== normalizeIsoDate(extractedVisualZone?.dateOfBirth));

  const isDocNumMismatch =
    (Boolean(extractedMrzZone?.documentNumber) &&
      Boolean(extractedVisualZone?.documentNumber) &&
      normalizeText(extractedVisualZone?.documentNumber) !== normalizeText(extractedMrzZone?.documentNumber)) ||
    (Boolean(normalizeText(applicant.documentNumber)) &&
      Boolean(normalizeText(extractedVisualZone?.documentNumber)) &&
      normalizeText(applicant.documentNumber) !== normalizeText(extractedVisualZone?.documentNumber));

  const declaredExpiry = applicant.documentExpiry || extractedVisualZone?.expiryDate || '2033-09-12';
  const printedExpiry = extractedVisualZone?.expiryDate || applicant.documentExpiry || '2033-09-12';
  const mrzExpiry = extractedMrzZone?.expiryDate || extractedVisualZone?.expiryDate || '2033-09-12';

  const normDeclaredExpiry = normalizeIsoDate(declaredExpiry);
  const normPrintedExpiry = normalizeIsoDate(printedExpiry);
  const normMrzExpiry = normalizeIsoDate(mrzExpiry);
  const todayIso = new Date().toISOString().slice(0, 10);

  const isDocExpired =
    ( /^\d{4}-\d{2}-\d{2}$/.test(normPrintedExpiry) && normPrintedExpiry < todayIso ) ||
    ( /^\d{4}-\d{2}-\d{2}$/.test(normMrzExpiry) && normMrzExpiry < todayIso );

  const isExpiryCrossMismatch =
    (Boolean(normPrintedExpiry) &&
      Boolean(normMrzExpiry) &&
      normPrintedExpiry !== 'N/A' &&
      normMrzExpiry !== 'N/A' &&
      normPrintedExpiry !== normMrzExpiry) ||
    (Boolean(applicant.documentExpiry) &&
      Boolean(normPrintedExpiry) &&
      normPrintedExpiry !== 'N/A' &&
      normDeclaredExpiry !== normPrintedExpiry);

  const isExpiryFlagged = isDocExpired || isExpiryCrossMismatch;

  const validAseanIso = ['KHM', 'SGP', 'MYS', 'THA', 'IDN', 'VNM', 'PHL', 'LAO', 'MMR', 'BRN'];
  const isCountryMismatch =
    extractedMrzZone?.issuingState && !validAseanIso.includes(extractedMrzZone.issuingState);

  const fieldRows = [
    {
      label: 'Full Name',
      declared: applicant.fullName,
      printed: printedName,
      mrz: mrzParsedName,
      isMismatch: isNameMismatch,
      statusNode: isNameMismatch
        ? renderStatus('FLAG', 'Name Mismatch')
        : renderStatus('MATCH'),
      mono: false,
    },
    {
      label: 'ID Number',
      declared: applicant.documentNumber,
      printed: extractedVisualZone?.documentNumber || applicant.documentNumber,
      mrz: extractedMrzZone?.documentNumber || extractedVisualZone?.documentNumber,
      isMismatch: isDocNumMismatch,
      statusNode: !isDocNumMismatch
        ? renderStatus('MATCH')
        : renderStatus('FLAG', 'Mismatch'),
      mono: true,
    },
    {
      label: 'Date of Birth',
      declared: applicant.dateOfBirth,
      printed: extractedVisualZone?.dateOfBirth || applicant.dateOfBirth,
      mrz: extractedMrzZone?.dateOfBirth || extractedVisualZone?.dateOfBirth,
      isMismatch: isDobMismatch,
      statusNode: isDobMismatch
        ? renderStatus('FLAG', 'Date Mismatch')
        : renderStatus('MATCH'),
      mono: true,
    },
    {
      label: 'Expiry Date',
      declared: declaredExpiry,
      printed: printedExpiry,
      mrz: mrzExpiry,
      isMismatch: isExpiryFlagged,
      statusNode: isDocExpired
        ? renderStatus('FLAG', isExpiryCrossMismatch ? 'Expired / Mismatch' : 'Expired')
        : isExpiryCrossMismatch
        ? renderStatus('FLAG', 'Expiry Mismatch')
        : renderStatus('MATCH', 'Valid'),
      mono: true,
    },
    {
      label: 'Country',
      declared: applicant.nationality,
      printed: extractedVisualZone?.issuingCountry || applicant.nationality,
      mrz: extractedMrzZone?.issuingState || applicant.nationality,
      isMismatch: Boolean(isCountryMismatch),
      statusNode: isCountryMismatch
        ? renderStatus('FLAG', 'Invalid ISO Code')
        : renderStatus('MATCH', 'Valid'),
      mono: false,
    },
  ];

  return (
    <div className="space-y-4 min-w-0 w-full">
      {/* Field Extraction & Zone Cross-Check */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span className="font-bold text-slate-200 text-sm">
              Information Comparison
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              <span>Multimodal OCR &amp; MRZ Cross-Check</span>
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Submitted vs. Printed on ID
          </span>
        </div>

        {/* Mobile Stacked Comparison Cards (< md) — Zero Horizontal Overflow */}
        <div className="md:hidden space-y-2.5 min-w-0">
          {fieldRows.map((row) => (
            <div
              key={row.label}
              className={`p-3 rounded-xl border text-xs space-y-2 min-w-0 ${
                row.isMismatch
                  ? 'bg-red-950/30 border-red-500/50'
                  : 'bg-slate-950/90 border-slate-800'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-slate-800/80">
                <span className="font-bold text-slate-100 text-xs">{row.label}</span>
                <div className="shrink-0">{row.statusNode}</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block">
                    Submitted
                  </span>
                  <span className={`text-slate-200 break-words ${row.mono ? 'font-mono' : ''}`}>
                    {row.declared}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block">
                    Printed on ID
                  </span>
                  <span
                    className={`font-bold break-words ${
                      row.isMismatch ? 'text-red-400 underline decoration-red-500' : 'text-white'
                    } ${row.mono ? 'font-mono text-cyan-300' : ''}`}
                  >
                    {row.printed}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block">
                    ID Barcode / Band
                  </span>
                  <span
                    className={`font-mono break-words ${
                      row.isMismatch
                        ? 'text-red-300 bg-red-900/40 px-1.5 py-0.5 rounded font-bold inline-block'
                        : 'text-slate-200'
                    }`}
                  >
                    {row.mrz}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tablet/Desktop Comparison Table (>= md) */}
        <div className="hidden md:block overflow-x-auto w-full min-w-0">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs">
                <th className="pb-2.5 pr-2 font-semibold">Detail</th>
                <th className="pb-2.5 pr-2 font-semibold">Submitted</th>
                <th className="pb-2.5 pr-2 font-semibold">Printed on ID</th>
                <th className="pb-2.5 pr-2 font-semibold">ID Security Band</th>
                <th className="pb-2.5 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-sans text-sm">
              {fieldRows.map((row) => (
                <tr
                  key={row.label}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    row.isMismatch ? 'bg-red-950/30' : ''
                  }`}
                >
                  <td className="py-2.5 pr-2 font-semibold text-slate-200">{row.label}</td>
                  <td className={`py-2.5 pr-2 text-slate-300 ${row.mono ? 'font-mono' : ''}`}>
                    {row.declared?.split('(')[0].trim()}
                  </td>
                  <td
                    className={`py-2.5 pr-2 font-bold ${
                      row.isMismatch
                        ? 'text-red-400 underline decoration-red-500'
                        : row.mono
                        ? 'font-mono text-cyan-300'
                        : 'text-white'
                    }`}
                  >
                    {row.printed?.split('(')[0].trim()}
                  </td>
                  <td
                    className={`py-2.5 pr-2 font-mono ${
                      row.isMismatch
                        ? 'text-red-300 bg-red-900/40 px-1.5 py-0.5 rounded font-bold'
                        : row.mono
                        ? 'text-cyan-300'
                        : 'text-slate-200'
                    }`}
                  >
                    {row.mrz?.split('(')[0].trim()}
                  </td>
                  <td className="py-2.5 text-right whitespace-nowrap">{row.statusNode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Features & Automated Consistency Rules */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-sm min-w-0 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-bold text-slate-200 text-sm">
              Document Security Checks
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-mono text-cyan-300">
              <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
              <span>ICAO 9303 &amp; Security Validator</span>
            </span>
          </div>
          <span className="text-xs text-slate-400 shrink-0">
            {safeConsistencyChecks.filter((c) => c.status === 'PASS').length} Passed ·{' '}
            {safeConsistencyChecks.filter((c) => c.status === 'FAIL').length} Issues
          </span>
        </div>

        <div className="space-y-2 min-w-0">
          {safeConsistencyChecks.map((check, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors min-w-0 ${
                check.status === 'PASS'
                  ? 'bg-slate-950 border-slate-800'
                  : check.status === 'WARN'
                  ? 'bg-amber-950/20 border-amber-500/40'
                  : 'bg-red-950/30 border-red-500/50'
              }`}
            >
              <div className="space-y-1 sm:pr-2 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-slate-100 text-xs">{check.rule}</span>
                  <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
                    Automated Verification Rule
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed break-words">{check.details}</p>
              </div>

              <div className="shrink-0 self-start sm:self-center">
                {check.status === 'PASS'
                  ? renderStatus('MATCH', 'Passed')
                  : check.status === 'WARN'
                  ? renderStatus('CHECK', 'Review')
                  : renderStatus('FLAG', 'Failed')}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
