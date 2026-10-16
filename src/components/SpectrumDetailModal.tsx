import React, { useMemo, useState } from 'react';
import { SpectrumRecord, SpectrumPeak } from '../types/spectrum';
import { FUNCTIONAL_GROUPS } from '../data/functionalGroups';
import { SpectrumViewer } from './SpectrumViewer';
import {
  X,
  Download,
  FileCode,
  FileSpreadsheet,
  Layers,
  FlaskConical,
  Info,
  Calendar,
  Bookmark,
  Sparkles,
} from 'lucide-react';

import { safeParseDataPoints, safeParsePeaks } from '../utils/schemaValidation';

interface SpectrumDetailModalProps {
  spectrum: SpectrumRecord | null;
  allSpectrums: SpectrumRecord[];
  onClose: () => void;
}

export const SpectrumDetailModal: React.FC<SpectrumDetailModalProps> = ({
  spectrum,
  allSpectrums,
  onClose,
}) => {
  const [compareId, setCompareId] = useState<string>('');

  if (!spectrum) return null;

  const groupDef = useMemo(() => {
    return FUNCTIONAL_GROUPS.find((g) => g.name === spectrum.primaryFunctionalGroup);
  }, [spectrum.primaryFunctionalGroup]);

  const compareSpectrum = useMemo(() => {
    if (!compareId) return null;
    return allSpectrums.find((s) => s.id === compareId) || null;
  }, [compareId, allSpectrums]);

  const peaks: SpectrumPeak[] = useMemo(() => {
    return safeParsePeaks(spectrum.peaksJson);
  }, [spectrum.peaksJson]);

  // Export JCAMP-DX
  const exportJCAMP = () => {
    let jcamp = `##TITLE=${spectrum.compoundName}\n`;
    jcamp += `##JCAMP-DX=4.24\n`;
    jcamp += `##DATA TYPE=INFRARED SPECTRUM\n`;
    jcamp += `##XUNITS=1/CM\n`;
    jcamp += `##YUNITS=${spectrum.yUnit.toUpperCase()}\n`;
    if (spectrum.instrument) jcamp += `##SPECTROMETER/DATA SYSTEM=${spectrum.instrument}\n`;
    if (spectrum.resolution) jcamp += `##RESOLUTION=${spectrum.resolution}\n`;
    if (spectrum.casNumber) jcamp += `##CAS REGISTRY NO=${spectrum.casNumber}\n`;
    if (spectrum.chemicalFormula) jcamp += `##MOLFORM=${spectrum.chemicalFormula}\n`;
    if (spectrum.notes) jcamp += `##COMMENTS=${spectrum.notes}\n`;
    jcamp += `##XYDATA=(XY..XY)\n`;

    const points = safeParseDataPoints(spectrum.dataPointsJson);
    points.forEach(([wn, val]) => {
      jcamp += `${wn} ${val}\n`;
    });
    jcamp += `##END=\n`;

    const blob = new Blob([jcamp], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spectrum.compoundName.replace(/\s+/g, '_')}.jdx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV
  const exportCSV = () => {
    let csv = `Wavenumber_cm-1,${spectrum.yUnit === 'transmittance' ? 'Transmittance_pct' : 'Absorbance'}\n`;
    const points = safeParseDataPoints(spectrum.dataPointsJson);
    points.forEach(([wn, val]) => {
      csv += `${wn},${val}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${spectrum.compoundName.replace(/\s+/g, '_')}_ftir.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 dark:border-slate-800 bg-purple-50/50 dark:bg-slate-800/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="w-3.5 h-3.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: groupDef?.color || '#9333ea' }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-purple-950 dark:text-slate-100">
                  {spectrum.compoundName}
                </h2>
                {spectrum.chemicalFormula && (
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-900 dark:text-teal-300 font-bold border border-teal-300 dark:border-teal-800">
                    {spectrum.chemicalFormula}
                  </span>
                )}
                {spectrum.isReference && (
                  <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                    Espectro de Referencia
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grupo Funcional: <strong className="text-slate-700 dark:text-slate-300">{spectrum.primaryFunctionalGroup}</strong>
                {spectrum.secondaryFunctionalGroups && ` • Secundario: ${spectrum.secondaryFunctionalGroups}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Compare Select */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs">
              <span className="text-slate-500">Superponer:</span>
              <select
                value={compareId}
                onChange={(e) => setCompareId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-purple-300 shadow-2xs"
              >
                <option value="">Ninguno (solo este espectro)</option>
                {allSpectrums
                  .filter((s) => s.id !== spectrum.id)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.compoundName} ({s.primaryFunctionalGroup})
                    </option>
                  ))}
              </select>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-900 dark:hover:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Spectrometer Canvas Display */}
          <SpectrumViewer
            spectrum={spectrum}
            compareSpectrum={compareSpectrum}
            height={400}
          />

          {/* Metadata Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-purple-50/40 dark:bg-slate-800/50 border border-purple-100 dark:border-slate-700/60 shadow-2xs">
              <span className="text-purple-900/60 dark:text-slate-400 block text-[10px] uppercase font-bold">Estado Físico</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block truncate">
                {spectrum.sampleState || 'No especificado'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-pink-50/40 dark:bg-slate-800/50 border border-pink-100 dark:border-slate-700/60 shadow-2xs">
              <span className="text-pink-900/60 dark:text-slate-400 block text-[10px] uppercase font-bold">Instrumento</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block truncate">
                {spectrum.instrument || 'Espectrómetro FTIR'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-teal-50/40 dark:bg-slate-800/50 border border-teal-100 dark:border-slate-700/60 shadow-2xs">
              <span className="text-teal-900/60 dark:text-slate-400 block text-[10px] uppercase font-bold">Resolución Óptica</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100 mt-0.5 block">
                {spectrum.resolution || '4 cm⁻¹'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-amber-50/40 dark:bg-slate-800/50 border border-amber-100 dark:border-slate-700/60 shadow-2xs">
              <span className="text-amber-900/60 dark:text-slate-400 block text-[10px] uppercase font-bold">Número CAS</span>
              <span className="font-semibold font-mono text-slate-800 dark:text-slate-100 mt-0.5 block">
                {spectrum.casNumber || 'N/A'}
              </span>
            </div>
          </div>

          {/* Notes */}
          {spectrum.notes && (
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-xs shadow-2xs">
              <h4 className="font-bold text-amber-950 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600" /> Notas Analíticas y Características Espectrales:
              </h4>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {spectrum.notes}
              </p>
            </div>
          )}

          {/* Peak Table */}
          <div>
            <h4 className="text-sm font-bold text-purple-950 dark:text-slate-100 mb-3 flex items-center justify-between">
              <span>Tabla de Asignación de Picos e Infrarrojo Diagnóstico</span>
              <span className="text-xs font-normal text-slate-500">
                {peaks.length} bandas detectadas
              </span>
            </h4>

            {peaks.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No hay picos registrados para este espectro.</p>
            ) : (
              <div className="border border-purple-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-purple-100/60 dark:bg-slate-800 text-purple-950 dark:text-slate-300 uppercase text-[10px] font-bold border-b border-purple-200 dark:border-slate-700">
                    <tr>
                      <th className="px-4 py-2.5">Número de onda</th>
                      <th className="px-4 py-2.5">Intensidad</th>
                      <th className="px-4 py-2.5">Tipo de Banda</th>
                      <th className="px-4 py-2.5">Grupo Funcional</th>
                      <th className="px-4 py-2.5">Asignación Vibracional</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-50 dark:divide-slate-800 font-medium">
                    {peaks.map((p, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-purple-50/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="px-4 py-2.5 font-mono font-bold text-purple-700 dark:text-purple-400">
                          {p.wavenumber} cm⁻¹
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
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
                                : 'bg-teal-50 text-teal-900 border-teal-200 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {p.intensityType}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                          {p.functionalGroup || 'General'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                          {p.assignment || 'Vibración del esqueleto'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Export Tools */}
        <div className="flex flex-wrap items-center justify-between px-6 py-4 border-t border-purple-100 dark:border-slate-800 bg-purple-50/40 dark:bg-slate-800/60 gap-3 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={exportJCAMP}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-purple-950 dark:text-slate-200 hover:border-purple-400 shadow-2xs transition-colors"
            >
              <FileCode className="w-4 h-4 text-purple-600" />
              Descargar JCAMP-DX (.jdx)
            </button>
            <button
              onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-teal-200 dark:border-slate-700 text-teal-950 dark:text-slate-200 hover:border-teal-400 shadow-2xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              Exportar Puntos CSV (.csv)
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
