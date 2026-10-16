import React, { useState, useEffect, useRef } from 'react';
import { SpectrumRecord } from '../types/spectrum';
import { Search, Sparkles, X, Check, FlaskConical, ArrowRight } from 'lucide-react';

interface InstantFormulaSearchProps {
  allSpectrums: SpectrumRecord[];
  activeSpectrumId: string;
  onSelectSpectrum: (spectrum: SpectrumRecord) => void;
}

export const InstantFormulaSearch: React.FC<InstantFormulaSearchProps> = ({
  allSpectrums,
  activeSpectrumId,
  onSelectSpectrum,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isOpenDropdown, setIsOpenDropdown] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalize formula (ignore case, remove spaces, handle subscripts)
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[\s\-_]/g, '')
      .replace(/₀/g, '0')
      .replace(/₁/g, '1')
      .replace(/₂/g, '2')
      .replace(/₃/g, '3')
      .replace(/₄/g, '4')
      .replace(/₅/g, '5')
      .replace(/₆/g, '6')
      .replace(/₇/g, '7')
      .replace(/₈/g, '8')
      .replace(/₉/g, '9');
  };

  // Find matches
  const matches = React.useMemo(() => {
    if (!searchTerm.trim()) return [];
    const query = normalize(searchTerm);

    return allSpectrums.filter((s) => {
      const matchFormula = s.chemicalFormula && normalize(s.chemicalFormula).includes(query);
      const matchName = normalize(s.compoundName).includes(query);
      const matchIupac = s.iupacName && normalize(s.iupacName).includes(query);
      const matchGroup = normalize(s.primaryFunctionalGroup).includes(query);
      return matchFormula || matchName || matchIupac || matchGroup;
    });
  }, [searchTerm, allSpectrums]);

  // When user types an exact formula or name, trigger instant select!
  useEffect(() => {
    if (!searchTerm.trim()) return;
    const query = normalize(searchTerm);

    const exactMatch = allSpectrums.find((s) => {
      const isExactFormula = s.chemicalFormula && normalize(s.chemicalFormula) === query;
      const isExactName = normalize(s.compoundName) === query;
      return isExactFormula || isExactName;
    });

    if (exactMatch && exactMatch.id !== activeSpectrumId) {
      onSelectSpectrum(exactMatch);
    }
  }, [searchTerm, allSpectrums, activeSpectrumId, onSelectSpectrum]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpenDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (spec: SpectrumRecord) => {
    onSelectSpectrum(spec);
    setSearchTerm(`${spec.compoundName} (${spec.chemicalFormula || ''})`);
    setIsOpenDropdown(false);
  };

  // Quick preset pills with chemical formulas
  const presetFormulas = [
    { formula: 'C2H6O', label: 'Etanol (C₂H₆O)' },
    { formula: 'C3H6O', label: 'Acetona (C₃H₆O)' },
    { formula: 'C7H6O2', label: 'Ácido Benzoico (C₇H₆O₂)' },
    { formula: 'C2H4O2', label: 'Ácido Acético (C₂H₄O₂)' },
    { formula: 'C4H8O2', label: 'Acetato de Etilo (C₄H₈O₂)' },
    { formula: 'C7H6O', label: 'Benzaldehído (C₇H₆O)' },
    { formula: 'C7H8', label: 'Tolueno (C₇H₈)' },
    { formula: 'C6H7N', label: 'Anilina (C₆H₇N)' },
    { formula: 'C6H10', label: '1-Hexino (C₆H₁₀)' },
    { formula: 'C2H3N', label: 'Acetonitrilo (C₂H₃N)' },
    { formula: 'C6H5NO2', label: 'Nitrobenceno (C₆H₅NO₂)' },
    { formula: 'C2H5NO', label: 'Acetamida (C₂H₅NO)' },
    { formula: 'C4H10O', label: 'Éter Dietílico (C₄H₁₀O)' },
    { formula: 'CH4O', label: 'Metanol (CH₄O)' },
    { formula: 'C6H12', label: 'Ciclohexano (C₆H₁₂)' },
    { formula: 'C6H5Cl', label: 'Clorobenceno (C₆H₅Cl)' },
    { formula: 'C6H6O', label: 'Fenol (C₆H₆O)' },
  ];

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-purple-600 dark:text-purple-400">
          <FlaskConical className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpenDropdown(true);
          }}
          onFocus={() => setIsOpenDropdown(true)}
          placeholder="Busca por fórmula molecular (ej. C2H6O, C7H6O2, C3H6O) o nombre (ej. Etanol, Acetona)..."
          className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm font-medium bg-white/95 dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-700/80 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:border-teal-400 focus:ring-4 focus:ring-purple-200/50 shadow-sm transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => {
              setSearchTerm('');
              setIsOpenDropdown(false);
            }}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-purple-600 dark:hover:text-purple-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown */}
      {isOpenDropdown && matches.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white/95 dark:bg-slate-900 border border-purple-200 dark:border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden max-h-72 overflow-y-auto divide-y divide-purple-50 dark:divide-slate-800">
          <div className="px-4 py-2 bg-purple-50/80 dark:bg-slate-800/80 text-[11px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
            Coincidencias encontradas ({matches.length}) - Haz clic para ver el espectro y análisis:
          </div>
          {matches.map((spec) => {
            const isCurrent = spec.id === activeSpectrumId;
            return (
              <div
                key={spec.id}
                onClick={() => handleSelect(spec)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors ${
                  isCurrent
                    ? 'bg-purple-100/70 dark:bg-purple-950/50 text-purple-950 dark:text-purple-100 font-semibold'
                    : 'hover:bg-pink-50/50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{spec.compoundName}</span>
                      {spec.chemicalFormula && (
                        <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-teal-100 text-teal-900 border border-teal-300 font-bold">
                          {spec.chemicalFormula}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Grupo: {spec.primaryFunctionalGroup}
                      {spec.casNumber ? ` • CAS: ${spec.casNumber}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isCurrent ? (
                    <span className="flex items-center gap-1 text-xs font-bold text-purple-700 dark:text-purple-300">
                      <Check className="w-4 h-4" /> Mostrando
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-purple-700">
                      Cargar <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Click Formula Pills - Pastel Lilac, Pink, Blue-Green & Yellow */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs scrollbar-none">
        <span className="text-[11px] font-bold text-purple-900 whitespace-nowrap flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-600" /> Fórmulas rápidas:
        </span>
        {presetFormulas.map((p, idx) => {
          const matchSpec = allSpectrums.find(
            (s) => s.chemicalFormula && normalize(s.chemicalFormula) === normalize(p.formula)
          );
          const isSelected = matchSpec && matchSpec.id === activeSpectrumId;

          // Palette rotation: 0 = Lila, 1 = Rosado, 2 = Azul Verde, 3 = Amarillo
          const paletteStyles = [
            'bg-purple-100/90 text-purple-950 border-purple-300 hover:bg-purple-200 hover:border-purple-400',
            'bg-pink-100/90 text-pink-950 border-pink-300 hover:bg-pink-200 hover:border-pink-400',
            'bg-teal-100/90 text-teal-950 border-teal-300 hover:bg-teal-200 hover:border-teal-400',
            'bg-amber-100/90 text-amber-950 border-amber-300 hover:bg-amber-200 hover:border-amber-400',
          ];
          const pillColor = paletteStyles[idx % paletteStyles.length];

          return (
            <button
              key={p.formula}
              type="button"
              onClick={() => {
                if (matchSpec) {
                  onSelectSpectrum(matchSpec);
                  setSearchTerm(`${matchSpec.compoundName} (${matchSpec.chemicalFormula})`);
                }
              }}
              className={`px-2.5 py-1 rounded-xl font-mono text-[11px] whitespace-nowrap transition-all border shadow-2xs ${
                isSelected
                  ? 'bg-purple-600 text-white border-purple-700 font-bold ring-2 ring-purple-300 shadow-xs'
                  : pillColor
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
