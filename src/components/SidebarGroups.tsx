import React from 'react';
import { FunctionalGroupDef } from '../types/spectrum';
import { FUNCTIONAL_GROUPS } from '../data/functionalGroups';
import {
  Folder,
  Layers,
  Database,
  Sparkles,
  BookOpen,
  Filter,
  Check,
} from 'lucide-react';

interface SidebarGroupsProps {
  selectedGroupId: string | null;
  onSelectGroup: (groupId: string | null) => void;
  spectrumCounts: Record<string, number>;
  totalCount: number;
  userCount: number;
  referenceCount: number;
  filterMode: 'all' | 'user' | 'reference';
  onChangeFilterMode: (mode: 'all' | 'user' | 'reference') => void;
}

export const SidebarGroups: React.FC<SidebarGroupsProps> = ({
  selectedGroupId,
  onSelectGroup,
  spectrumCounts,
  totalCount,
  userCount,
  referenceCount,
  filterMode,
  onChangeFilterMode,
}) => {
  // Group functional groups by category
  const categories: ('Oxigenados' | 'Nitrogenados' | 'Hidrocarburos' | 'Halogenados')[] = [
    'Oxigenados',
    'Nitrogenados',
    'Hidrocarburos',
    'Halogenados',
  ];

  return (
    <aside className="w-full lg:w-72 flex-shrink-0 bg-white/90 dark:bg-slate-900 border border-purple-100 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-5">
      {/* Scope Navigation Filter */}
      <div className="space-y-1">
        <span className="text-[11px] font-bold text-purple-900/60 dark:text-slate-500 uppercase tracking-wider px-2">
          Ámbito de Datos
        </span>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => {
              onChangeFilterMode('all');
              onSelectGroup(null);
            }}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'all' && selectedGroupId === null
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50/70 dark:hover:bg-slate-800 hover:text-purple-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className={`w-4 h-4 ${filterMode === 'all' && selectedGroupId === null ? 'text-white' : 'text-purple-500'}`} />
              <span>Todos los Espectros</span>
            </div>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                filterMode === 'all' && selectedGroupId === null
                  ? 'bg-white/20 text-white'
                  : 'bg-purple-100 dark:bg-slate-800 text-purple-900 dark:text-slate-400'
              }`}
            >
              {totalCount}
            </span>
          </button>

          <button
            onClick={() => onChangeFilterMode('user')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'user'
                ? 'bg-pink-500 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-pink-50/70 dark:hover:bg-slate-800 hover:text-pink-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className={`w-4 h-4 ${filterMode === 'user' ? 'text-white' : 'text-pink-500'}`} />
              <span>Mis Archivos Subidos</span>
            </div>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                filterMode === 'user'
                  ? 'bg-white/20 text-white'
                  : 'bg-pink-100 dark:bg-slate-800 text-pink-900 dark:text-slate-400'
              }`}
            >
              {userCount}
            </span>
          </button>

          <button
            onClick={() => onChangeFilterMode('reference')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterMode === 'reference'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-700 dark:text-slate-300 hover:bg-teal-50/70 dark:hover:bg-slate-800 hover:text-teal-950'
            }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className={`w-4 h-4 ${filterMode === 'reference' ? 'text-white' : 'text-teal-600'}`} />
              <span>Biblioteca de Referencia</span>
            </div>
            <span
              className={`text-[11px] px-1.5 py-0.2 rounded-full font-bold ${
                filterMode === 'reference'
                  ? 'bg-white/20 text-white'
                  : 'bg-teal-100 dark:bg-slate-800 text-teal-900 dark:text-slate-400'
              }`}
            >
              {referenceCount}
            </span>
          </button>
        </div>
      </div>

      <div className="h-px bg-purple-100 dark:bg-slate-800" />

      {/* Categorized Functional Groups */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <span className="text-[11px] font-bold text-purple-900/60 dark:text-slate-500 uppercase tracking-wider">
            Grupos Funcionales
          </span>
          {selectedGroupId && (
            <button
              onClick={() => onSelectGroup(null)}
              className="text-[11px] text-purple-700 dark:text-purple-400 font-bold hover:underline"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {categories.map((cat) => {
          const groups = FUNCTIONAL_GROUPS.filter((g) => g.category === cat);
          return (
            <div key={cat} className="space-y-1">
              <span className="text-[10px] font-bold text-purple-950/70 dark:text-slate-400 px-2 uppercase">
                {cat}
              </span>
              <div className="space-y-0.5">
                {groups.map((group) => {
                  const count = spectrumCounts[group.name] || 0;
                  const isSelected = selectedGroupId === group.id;

                  return (
                    <button
                      key={group.id}
                      onClick={() => onSelectGroup(isSelected ? null : group.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-all ${
                        isSelected
                          ? 'bg-purple-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-purple-50/60 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: group.color }}
                        />
                        <span className="truncate">{group.shortName}</span>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                          isSelected
                            ? 'bg-white/20 dark:bg-slate-900/20 text-inherit'
                            : count > 0
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-900 dark:text-purple-300 font-bold border border-purple-200'
                            : 'text-slate-400'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
