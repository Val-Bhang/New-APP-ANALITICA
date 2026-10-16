import React, { useState, useMemo } from 'react';
import { FUNCTIONAL_GROUPS } from '../data/functionalGroups';
import { SpectrumRecord, SpectrumPeak } from '../types/spectrum';
import { Sparkles, Search, Check, AlertCircle, ArrowRight, BookOpen } from 'lucide-react';

interface DiagnosticToolProps {
  allSpectrums: SpectrumRecord[];
  onSelectSpectrum: (spectrum: SpectrumRecord) => void;
}

export const DiagnosticTool: React.FC<DiagnosticToolProps> = ({
  allSpectrums,
  onSelectSpectrum,
}) => {
  const [peakInput, setPeakInput] = useState<string>('1715, 2965, 1365, 1222');
  const [broadOH, setBroadOH] = useState<boolean>(false);

  // Parse entered numbers
  const inputPeaks = useMemo(() => {
    return peakInput
      .split(/[\s,;]+/)
      .map((s) => parseFloat(s.trim()))
      .filter((n) => !isNaN(n) && n >= 400 && n <= 4000);
  }, [peakInput]);

  // Score functional groups based on matching key bands
  const scoredGroups = useMemo(() => {
    return FUNCTIONAL_GROUPS.map((group) => {
      let score = 0;
      const matchedBands: { bandLabel: string; userWn: number; range: [number, number] }[] = [];

      group.keyBands.forEach((band) => {
        // Find if any user peak falls within band range (+- 15 cm^-1 leeway)
        const hit = inputPeaks.find(
          (p) => p >= band.range[0] - 15 && p <= band.range[1] + 15
        );
        if (hit) {
          score += band.importance === 'clave' ? 30 : 15;
          matchedBands.push({
            bandLabel: band.label,
            userWn: hit,
            range: band.range,
          });
        }
      });

      // Special bonus for broad OH
      if (broadOH) {
        if (group.id === 'acido_carboxilico') score += 40;
        if (group.id === 'alcohol') score += 35;
      }

      // Calculate confidence %
      const maxPossible = group.keyBands.reduce(
        (acc, b) => acc + (b.importance === 'clave' ? 30 : 15),
        broadOH ? 40 : 0
      );
      const confidence = maxPossible > 0 ? Math.min(99, Math.round((score / maxPossible) * 100)) : 0;

      return {
        group,
        score,
        confidence,
        matchedBands,
      };
    })
      .filter((res) => res.matchedBands.length > 0 || res.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [inputPeaks, broadOH]);

  // Find matching database spectra
  const matchingSpectrums = useMemo(() => {
    if (scoredGroups.length === 0) return [];
    const topGroupName = scoredGroups[0].group.name;
    return allSpectrums.filter(
      (s) =>
        s.primaryFunctionalGroup === topGroupName ||
        s.secondaryFunctionalGroups?.includes(topGroupName)
    );
  }, [allSpectrums, scoredGroups]);

  return (
    <div className="bg-white/95 dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-3xl p-6 shadow-md space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-amber-950 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Identificador y Diagnóstico por Frecuencias de Pico (cm⁻¹)
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Ingresa las señales de absorción de tu muestra experimental desconocida para calcular el grupo funcional más probable y encontrar espectros de referencia coincidentes en la base de datos.
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-purple-950 dark:text-slate-300">
          Valores de picos observados en el espectro (separados por comas o espacios):
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={peakInput}
            onChange={(e) => setPeakInput(e.target.value)}
            placeholder="Ej. 3340, 2975, 1050 (Alcohol) o 1715, 2965 (Cetona) o 1740, 1240 (Éster)..."
            className="flex-1 px-4 py-2.5 rounded-2xl border border-purple-200 dark:border-slate-700 bg-purple-50/30 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-300 font-mono shadow-2xs"
          />
          <button
            type="button"
            onClick={() => setBroadOH(!broadOH)}
            className={`px-3 py-2 rounded-2xl text-xs font-semibold border transition-all ${
              broadOH
                ? 'bg-teal-600 text-white border-teal-700 shadow-xs'
                : 'bg-teal-50 dark:bg-slate-800 text-teal-900 dark:text-slate-300 border-teal-200 dark:border-slate-700 hover:bg-teal-100'
            }`}
          >
            {broadOH ? '✓ Banda O-H ancha marcada' : '+ ¿Banda muy ancha O-H (3300 cm⁻¹)?'}
          </button>
        </div>

        {/* Quick presets in pastel colors */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          <span className="text-slate-500 font-medium">Ejemplos rápidos:</span>
          <button
            onClick={() => {
              setPeakInput('3340, 2975, 1380, 1048');
              setBroadOH(true);
            }}
            className="px-2.5 py-1 rounded-xl bg-teal-100 text-teal-950 border border-teal-300 hover:bg-teal-200 text-[11px] font-semibold"
          >
            Alcohol primario
          </button>
          <button
            onClick={() => {
              setPeakInput('1715, 2965, 1365, 1222');
              setBroadOH(false);
            }}
            className="px-2.5 py-1 rounded-xl bg-pink-100 text-pink-950 border border-pink-300 hover:bg-pink-200 text-[11px] font-semibold"
          >
            Cetona alifática
          </button>
          <button
            onClick={() => {
              setPeakInput('2980, 1710, 1290, 935');
              setBroadOH(true);
            }}
            className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-950 border border-purple-300 hover:bg-purple-200 text-[11px] font-semibold"
          >
            Ácido Carboxílico
          </button>
          <button
            onClick={() => {
              setPeakInput('1740, 1240, 1045');
              setBroadOH(false);
            }}
            className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 text-[11px] font-semibold"
          >
            Éster alifático
          </button>
          <button
            onClick={() => {
              setPeakInput('3310, 2120, 630');
              setBroadOH(false);
            }}
            className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-950 border border-purple-300 hover:bg-purple-200 text-[11px] font-semibold"
          >
            Alquino terminal
          </button>
          <button
            onClick={() => {
              setPeakInput('3030, 1605, 1495, 728, 694');
              setBroadOH(false);
            }}
            className="px-2.5 py-1 rounded-xl bg-pink-100 text-pink-950 border border-pink-300 hover:bg-pink-200 text-[11px] font-semibold"
          >
            Aromático monosustituido
          </button>
          <button
            onClick={() => {
              setPeakInput('2252, 2945');
              setBroadOH(false);
            }}
            className="px-2.5 py-1 rounded-xl bg-teal-100 text-teal-950 border border-teal-300 hover:bg-teal-200 text-[11px] font-semibold"
          >
            Nitrilo
          </button>
        </div>
      </div>

      {/* Results grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Ranked Groups */}
        <div>
          <h4 className="text-xs font-bold text-purple-950 dark:text-slate-300 uppercase tracking-wider mb-3">
            Grupos Funcionales Identificados por Coincidencia
          </h4>
          {scoredGroups.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              Ingresa números de onda válidos entre 400 y 4000 cm⁻¹ para ver coincidencias químicas.
            </p>
          ) : (
            <div className="space-y-2.5">
              {scoredGroups.slice(0, 4).map(({ group, confidence, matchedBands }, idx) => (
                <div
                  key={group.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    idx === 0
                      ? 'border-purple-300 bg-purple-50/60 dark:bg-purple-950/20 shadow-xs'
                      : 'border-purple-100 dark:border-slate-800 bg-white dark:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: group.color }}
                      />
                      <span className="font-bold text-sm text-purple-950 dark:text-slate-100">
                        {group.name}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                        confidence >= 70
                          ? 'bg-teal-100 text-teal-900 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300'
                          : confidence >= 40
                          ? 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {confidence}% Coincidencia
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 leading-relaxed">
                    {group.description}
                  </p>

                  {/* Matched bands tags */}
                  <div className="flex flex-wrap gap-1">
                    {matchedBands.map((mb, bIdx) => (
                      <span
                        key={bIdx}
                        className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-800 border border-teal-200 text-teal-900 font-medium"
                      >
                        <Check className="w-2.5 h-2.5 text-teal-600" />
                        <span className="font-bold">{mb.userWn} cm⁻¹:</span> {mb.bandLabel}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Database Matches */}
        <div>
          <h4 className="text-xs font-bold text-purple-950 dark:text-slate-300 uppercase tracking-wider mb-3">
            Espectros en Base de Datos Compatibles ({matchingSpectrums.length})
          </h4>
          {matchingSpectrums.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No hay espectros cargados que pertenezcan al grupo funcional de mayor coincidencia.
            </p>
          ) : (
            <div className="space-y-2">
              {matchingSpectrums.slice(0, 4).map((spec) => (
                <div
                  key={spec.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-purple-100 dark:border-slate-800 hover:border-purple-300 bg-white dark:bg-slate-800/40 transition-colors shadow-2xs"
                >
                  <div>
                    <h5 className="font-bold text-xs text-purple-950 dark:text-slate-100">
                      {spec.compoundName}
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      {spec.chemicalFormula && <span className="font-mono font-bold text-purple-900">{spec.chemicalFormula} • </span>}
                      {spec.primaryFunctionalGroup}
                    </p>
                  </div>
                  <button
                    onClick={() => onSelectSpectrum(spec)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-100 hover:bg-purple-600 hover:text-white text-purple-900 border border-purple-300 transition-colors shadow-2xs"
                  >
                    Ver Espectro <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
