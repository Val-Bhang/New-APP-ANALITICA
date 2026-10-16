import React, { useMemo } from 'react';
import { SpectrumRecord, SpectrumPeak } from '../types/spectrum';
import { generateSpectrumAnalysis, calculateIHD } from '../utils/spectrumAnalysis';
import { FUNCTIONAL_GROUPS } from '../data/functionalGroups';
import {
  FileText,
  Sparkles,
  Info,
  CheckCircle2,
  Atom,
  HelpCircle,
  Eye,
  Layers,
  Activity,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

import { safeParsePeaks } from '../utils/schemaValidation';

interface SpectrumAnalysisPanelProps {
  spectrum: SpectrumRecord;
  onSelectPeak?: (peak: SpectrumPeak) => void;
}

export const SpectrumAnalysisPanel: React.FC<SpectrumAnalysisPanelProps> = ({
  spectrum,
  onSelectPeak,
}) => {
  const analysis = useMemo(() => {
    return generateSpectrumAnalysis(spectrum);
  }, [spectrum]);

  const ihd = useMemo(() => {
    return calculateIHD(spectrum.chemicalFormula);
  }, [spectrum.chemicalFormula]);

  const groupDef = useMemo(() => {
    return FUNCTIONAL_GROUPS.find((g) => g.name === spectrum.primaryFunctionalGroup);
  }, [spectrum.primaryFunctionalGroup]);

  const peaks: SpectrumPeak[] = useMemo(() => {
    return safeParsePeaks(spectrum.peaksJson);
  }, [spectrum.peaksJson]);

  // Formatter for molecular formula with chemical subscripts
  const formatFormula = (f?: string) => {
    if (!f) return null;
    return f.split(/(\d+)/).map((part, i) => {
      if (/^\d+$/.test(part)) {
        return <sub key={i} className="text-[10px] font-bold">{part}</sub>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-white/90 dark:bg-slate-900 border border-purple-100 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-purple-100 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: groupDef?.color || '#9333ea' }}
            />
            <h3 className="text-lg font-bold text-purple-950 dark:text-slate-100">
              Descripción Detallada del Espectro: {spectrum.compoundName}
            </h3>

            {/* Formula Pill */}
            {spectrum.chemicalFormula && (
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-900 dark:text-teal-300 font-bold border border-teal-300 dark:border-teal-800">
                {formatFormula(spectrum.chemicalFormula)}
              </span>
            )}

            {/* Group Badge */}
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full border"
              style={{
                backgroundColor: (groupDef?.color || '#9333ea') + '15',
                color: groupDef?.color || '#9333ea',
                borderColor: (groupDef?.color || '#9333ea') + '30',
              }}
            >
              {spectrum.primaryFunctionalGroup}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            {spectrum.iupacName && <span>IUPAC: <strong className="text-slate-700 dark:text-slate-300">{spectrum.iupacName}</strong> • </span>}
            {spectrum.casNumber && <span>CAS: {spectrum.casNumber} • </span>}
            <span>Estado: {spectrum.sampleState || 'IR'}</span>
          </p>
        </div>

        {/* Unsaturation & Physicochemical Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {ihd !== null && (
            <div className="px-3 py-1.5 rounded-xl bg-purple-100/70 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-800/60 text-purple-900 dark:text-purple-300 text-xs flex items-center gap-1.5 font-medium shadow-2xs">
              <Atom className="w-3.5 h-3.5 text-purple-700" />
              <span>
                Insaturaciones (IDH): <strong>{ihd}</strong>
              </span>
            </div>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-teal-100/70 dark:bg-slate-800 border border-teal-300 dark:border-teal-700 text-teal-950 dark:text-slate-300 text-xs flex items-center gap-1.5 font-medium shadow-2xs">
            <Activity className="w-3.5 h-3.5 text-teal-700" />
            <span>{peaks.length} bandas detectadas</span>
          </div>
        </div>
      </div>

      {/* Summary Narrative Box - Pastel gradient */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-100/80 via-pink-100/60 to-teal-100/70 dark:from-purple-950/20 dark:to-teal-950/20 border border-purple-200 dark:border-purple-900/40 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950 dark:text-purple-300 mb-1.5 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-700" />
          Resumen Espectroscópico Global
        </h4>
        <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-normal">
          {analysis.summary}
        </p>
      </div>

      {/* Zone by Zone Detailed Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950/80 dark:text-slate-400">
          Análisis Espectral Desglosado por Zonas Diagnósticas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {analysis.regions.map((reg, idx) => {
            const isChar = reg.status === 'característico';
            const isPres = reg.status === 'presente';

            return (
              <div
                key={idx}
                className={`p-4 rounded-2xl border transition-all ${
                  isChar
                    ? 'border-purple-300 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20 shadow-xs'
                    : isPres
                    ? 'border-teal-200 dark:border-teal-800 bg-teal-50/40 dark:bg-slate-800/40'
                    : 'border-purple-100/70 dark:border-slate-800/60 bg-white/80 dark:bg-slate-800/20 opacity-80'
                }`}
              >
                {/* Region Title & Range */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        isChar ? 'bg-purple-500 animate-pulse' : isPres ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    />
                    <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100">
                      {reg.zoneName}
                    </h5>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-purple-900 bg-purple-100/70 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-purple-200/60">
                    {reg.range}
                  </span>
                </div>

                {/* Observation Narrative */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2.5">
                  {reg.observation}
                </p>

                {/* Key Peaks Chips */}
                <div className="pt-2 border-t border-purple-100/60 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Señales observadas:</span>
                  <span className="font-mono font-bold text-purple-900 dark:text-slate-300 text-right truncate max-w-[200px]">
                    {reg.keyPeaks}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Diagnostic Deduction - Pastel Verde Azul */}
      <div className="p-4 rounded-2xl bg-teal-50/80 dark:bg-teal-950/20 border border-teal-300 dark:border-teal-900/50 flex items-start gap-3 shadow-2xs">
        <ShieldCheck className="w-5 h-5 text-teal-700 dark:text-teal-400 flex-shrink-0 mt-0.5" />
        <div>
          <h5 className="text-xs font-bold text-teal-950 dark:text-teal-300 uppercase tracking-wider mb-1">
            Conclusión Diagnóstica y Deducción Estructural
          </h5>
          <p className="text-xs text-slate-800 dark:text-slate-300 leading-relaxed">
            {analysis.diagnosticDeduction}
          </p>
        </div>
      </div>

      {/* Interactive Peaks Details Table */}
      {peaks.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-950 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-600" />
              Bandas Vibracionales Identificadas en el Gráfico ({peaks.length})
            </h4>
            <span className="text-[11px] text-slate-500">
              Haz clic en cualquier banda para resaltarla en el espectro
            </span>
          </div>

          <div className="border border-purple-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-purple-100/70 dark:bg-slate-800 text-purple-950 dark:text-slate-300 uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-2.5">Frecuencia (cm⁻¹)</th>
                  <th className="px-4 py-2.5">Intensidad</th>
                  <th className="px-4 py-2.5">Forma de Banda</th>
                  <th className="px-4 py-2.5">Grupo Funcional</th>
                  <th className="px-4 py-2.5">Asignación Vibracional Observada</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-50 dark:divide-slate-800 bg-white/90">
                {peaks.map((p, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onSelectPeak?.(p)}
                    className="hover:bg-purple-50/70 dark:hover:bg-purple-950/30 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-2.5 font-mono font-bold text-purple-700 dark:text-purple-400">
                      {p.wavenumber} cm⁻¹
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 font-mono">
                      {p.value}%T
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          p.intensityType === 'muy fuerte'
                            ? 'bg-pink-100 text-pink-900 border-pink-300 dark:bg-rose-950/60 dark:text-rose-300'
                            : p.intensityType === 'fuerte'
                            ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                            : p.intensityType === 'ancha'
                            ? 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {p.intensityType}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-300">
                      {p.functionalGroup || 'General'}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                      {p.assignment || 'Vibración de esqueleto'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
