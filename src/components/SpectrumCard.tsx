import React, { useMemo } from 'react';
import { SpectrumRecord, SpectrumPoint, SpectrumPeak } from '../types/spectrum';
import { FUNCTIONAL_GROUPS } from '../data/functionalGroups';
import {
  FileText,
  Trash2,
  Layers,
  Check,
  Eye,
  Crosshair,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

import { safeParseDataPoints, safeParsePeaks } from '../utils/schemaValidation';

interface SpectrumCardProps {
  spectrum: SpectrumRecord;
  isSelected: boolean;
  isCompareSelected: boolean;
  onSelect: () => void;
  onToggleCompare: () => void;
  onDelete?: () => void;
  canDelete?: boolean;
}

export const SpectrumCard: React.FC<SpectrumCardProps> = ({
  spectrum,
  isSelected,
  isCompareSelected,
  onSelect,
  onToggleCompare,
  onDelete,
  canDelete = false,
}) => {
  const groupDef = useMemo(() => {
    return FUNCTIONAL_GROUPS.find((g) => g.name === spectrum.primaryFunctionalGroup);
  }, [spectrum.primaryFunctionalGroup]);

  const points: SpectrumPoint[] = useMemo(() => {
    return safeParseDataPoints(spectrum.dataPointsJson);
  }, [spectrum.dataPointsJson]);

  const peaks: SpectrumPeak[] = useMemo(() => {
    return safeParsePeaks(spectrum.peaksJson);
  }, [spectrum.peaksJson]);

  // Generate lightweight SVG path for thumbnail
  const svgPath = useMemo(() => {
    if (points.length < 5) return '';
    const width = 180;
    const height = 45;
    const minWn = 400;
    const maxWn = 4000;

    let path = '';
    const step = Math.max(1, Math.floor(points.length / 50));
    for (let i = 0; i < points.length; i += step) {
      const [wn, val] = points[i];
      const x = ((maxWn - wn) / (maxWn - minWn)) * width;
      // %T: 100% is top (y=2), 0% is bottom (y=height-2)
      const y = Math.max(2, Math.min(height - 2, height - (val / 100) * height));
      path += (i === 0 ? 'M' : 'L') + `${x.toFixed(1)},${y.toFixed(1)} `;
    }
    return path;
  }, [points]);

  return (
    <div
      onClick={onSelect}
      className={`group relative rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
        isSelected
          ? 'border-purple-400 bg-purple-50/70 dark:bg-purple-950/30 shadow-md ring-2 ring-purple-300/40'
          : isCompareSelected
          ? 'border-amber-400 bg-amber-50/70 dark:bg-amber-950/30 shadow-sm ring-2 ring-amber-300/40'
          : 'border-purple-100 dark:border-slate-800 bg-white/90 dark:bg-slate-900 hover:border-purple-300 dark:hover:border-slate-700 hover:shadow-sm'
      }`}
    >
      <div>
        {/* Top Header & Badges */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Primary Functional Group Badge */}
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border"
              style={{
                backgroundColor: (groupDef?.color || '#9333ea') + '15',
                color: groupDef?.color || '#9333ea',
                borderColor: (groupDef?.color || '#9333ea') + '30',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: groupDef?.color || '#9333ea' }}
              />
              {groupDef?.shortName || spectrum.primaryFunctionalGroup}
            </span>

            {spectrum.isReference && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-purple-100/60 dark:bg-slate-800 text-purple-900 dark:text-slate-400 border border-purple-200/50">
                Referencia
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onToggleCompare}
              title={
                isCompareSelected
                  ? 'Quitar de la comparación'
                  : 'Comparar este espectro superpuesto con el visor'
              }
              className={`p-1.5 rounded-xl text-xs transition-colors ${
                isCompareSelected
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-400 hover:text-amber-800 hover:bg-amber-100 dark:hover:bg-amber-950/40'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>

            {canDelete && onDelete && (
              <button
                onClick={onDelete}
                title="Eliminar espectro de la base de datos"
                className="p-1.5 rounded-xl text-slate-400 hover:text-pink-600 hover:bg-pink-100 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Compound Title */}
        <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-purple-700 transition-colors line-clamp-1">
          {spectrum.compoundName}
        </h3>

        {/* Formula & CAS */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 mb-2.5">
          {spectrum.chemicalFormula && (
            <span className="font-mono font-bold text-purple-900 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/50 px-1.5 py-0.2 rounded border border-purple-200/60">
              {spectrum.chemicalFormula}
            </span>
          )}
          {spectrum.casNumber && <span>CAS: {spectrum.casNumber}</span>}
          {spectrum.fileName && !spectrum.isReference && (
            <span className="truncate max-w-[120px]" title={spectrum.fileName}>
              {spectrum.fileName}
            </span>
          )}
        </div>

        {/* Mini Spectrum Thumbnail Curve */}
        <div className="w-full h-11 bg-purple-50/30 dark:bg-slate-800/60 rounded-xl p-1 border border-purple-100/60 dark:border-slate-800 flex items-center justify-center overflow-hidden mb-3">
          <svg
            viewBox="0 0 180 45"
            className="w-full h-full overflow-visible"
            preserveAspectRatio="none"
          >
            <path
              d={svgPath}
              fill="none"
              stroke={groupDef?.color || '#9333ea'}
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Characteristic Peak Chips */}
        {peaks.length > 0 && (
          <div className="flex flex-wrap gap-1 text-[10px]">
            {peaks.slice(0, 3).map((p, idx) => (
              <span
                key={idx}
                className="px-1.5 py-0.5 rounded-md bg-purple-50 dark:bg-slate-800 text-purple-950 dark:text-slate-300 font-mono border border-purple-100/80"
              >
                {p.wavenumber} cm⁻¹
              </span>
            ))}
            {peaks.length > 3 && (
              <span className="px-1.5 py-0.5 text-slate-400">+{peaks.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-3 pt-2.5 border-t border-purple-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="truncate max-w-[150px]">{spectrum.sampleState || 'IR'}</span>
        <span className="flex items-center gap-1 font-bold text-purple-700 dark:text-purple-400 group-hover:underline">
          Ver <Eye className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
};
