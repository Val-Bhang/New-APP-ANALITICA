import React from 'react';
import { FUNCTIONAL_GROUPS, DIAGNOSTIC_ZONES } from '../data/functionalGroups';
import { FunctionalGroupDef } from '../types/spectrum';
import { X, BookOpen, Layers, CheckCircle, ExternalLink, ArrowRight } from 'lucide-react';

interface FunctionalGroupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGroup: (groupId: string) => void;
}

export const FunctionalGroupGuideModal: React.FC<FunctionalGroupGuideModalProps> = ({
  isOpen,
  onClose,
  onSelectGroup,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100 dark:border-slate-800 bg-purple-50/50 dark:bg-slate-800/60 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-teal-100 dark:bg-teal-900/50 text-teal-800 dark:text-teal-300 rounded-2xl shadow-2xs border border-teal-200">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-purple-950 dark:text-slate-100">
                Guía y Tablas de Correlación Espectral Infrarroja (IR / FTIR)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bandas características, frecuencias diagnósticas y formas de absorción por grupo funcional
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-900 dark:hover:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Diagnostic 4 Zones Overview */}
          <div>
            <h3 className="text-sm font-bold text-purple-950 dark:text-slate-100 uppercase tracking-wider mb-3">
              Las Cuatro Regiones Espectrales Diagnósticas del Infrarrojo
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {DIAGNOSTIC_ZONES.map((zone) => (
                <div
                  key={zone.id}
                  className="p-3.5 rounded-2xl border border-purple-100 dark:border-slate-800 bg-white/90 dark:bg-slate-800/40 relative overflow-hidden shadow-2xs"
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5"
                    style={{ backgroundColor: zone.color }}
                  />
                  <div className="flex items-center justify-between mb-1 mt-1">
                    <span className="font-bold text-xs text-purple-950 dark:text-slate-100">
                      {zone.name}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500">
                      {zone.range[1]}-{zone.range[0]} cm⁻¹
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mb-2">
                    {zone.description}
                  </p>
                  <span className="inline-block text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 dark:bg-slate-800 text-purple-900 dark:text-slate-300 border border-purple-200/60 font-semibold">
                    {zone.typicalBonds}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-purple-100 dark:bg-slate-800" />

          {/* Groups List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-purple-950 dark:text-slate-100 uppercase tracking-wider">
              Bandas Diagnósticas de Grupos Funcionales
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FUNCTIONAL_GROUPS.map((group) => (
                <div
                  key={group.id}
                  className="p-4 rounded-2xl border border-purple-100 dark:border-slate-800 bg-white/90 dark:bg-slate-800/40 hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <h4 className="font-bold text-sm text-purple-950 dark:text-slate-100">
                          {group.name}
                        </h4>
                      </div>
                      {group.generalFormula && (
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-purple-100/70 dark:bg-slate-800 text-purple-900 dark:text-slate-300 font-bold border border-purple-200/60">
                          {group.generalFormula}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                      {group.description}
                    </p>

                    {/* Band Table */}
                    <div className="space-y-1.5 mb-3">
                      {group.keyBands.map((band, bIdx) => (
                        <div
                          key={bIdx}
                          className="flex items-start justify-between text-[11px] p-1.5 rounded-xl bg-purple-50/50 dark:bg-slate-800/80 border border-purple-100/60 dark:border-slate-700/60"
                        >
                          <div>
                            <span className="font-mono font-bold text-purple-700 dark:text-purple-400">
                              {band.range[0]} - {band.range[1]} cm⁻¹
                            </span>
                            <span className="text-slate-800 dark:text-slate-300 ml-1.5 font-semibold">
                              {band.label}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 italic max-w-[140px] text-right truncate">
                            {band.appearance}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Filter action button */}
                  <div className="flex items-center justify-between pt-2 border-t border-purple-100/60 dark:border-slate-800 text-xs">
                    <span className="text-[11px] text-slate-400 truncate max-w-[220px]">
                      Ejemplos: {group.examples.slice(0, 3).join(', ')}
                    </span>
                    <button
                      onClick={() => {
                        onSelectGroup(group.id);
                        onClose();
                      }}
                      className="flex items-center gap-1 font-bold text-purple-700 dark:text-purple-400 hover:text-purple-900 hover:underline"
                    >
                      Filtrar espectros <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-purple-100 dark:border-slate-800 bg-purple-50/40 dark:bg-slate-800/60 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
