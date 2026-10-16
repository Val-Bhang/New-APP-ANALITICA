import React from 'react';
import { User } from 'firebase/auth';
import {
  FlaskConical,
  Search,
  Upload,
  Sparkles,
  BookOpen,
  LogIn,
  LogOut,
  Cloud,
  CheckCircle2,
  X,
} from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenUpload: () => void;
  onOpenDiagnostic: () => void;
  onOpenGuide: () => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isCloudConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onOpenUpload,
  onOpenDiagnostic,
  onOpenGuide,
  user,
  onLogin,
  onLogout,
  isCloudConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/85 dark:bg-slate-900/90 backdrop-blur-md border-b border-purple-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-300 via-pink-200 to-teal-200 flex items-center justify-center text-purple-950 shadow-xs border border-purple-300/50">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg text-purple-950 dark:text-slate-100 tracking-tight">
                Espectro<span className="text-purple-600">IR</span>
              </h1>
              <span className="hidden sm:inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200">
                FTIR Database
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Organizador de espectros infrarrojos por grupo funcional
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md relative hidden md:block">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar por compuesto, fórmula, CAS o pico (ej. 1715 cm⁻¹)..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-purple-50/40 dark:bg-slate-800/80 border border-purple-200 dark:border-slate-700 focus:border-purple-400 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-purple-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Actions & User */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Diagnostic Tool Button - Pastel Amarillo */}
          <button
            onClick={onOpenDiagnostic}
            title="Herramienta para identificar grupo funcional a partir de picos"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-100/90 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900/50 text-amber-950 dark:text-amber-200 hover:bg-amber-200 transition-colors shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden lg:inline">Diagnóstico por Picos</span>
          </button>

          {/* Correlation Guide - Pastel Azul Verde */}
          <button
            onClick={onOpenGuide}
            title="Tablas y guía de frecuencias de grupos funcionales"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-teal-100/80 dark:bg-teal-950/40 border border-teal-300 dark:border-teal-800 text-teal-950 dark:text-teal-200 hover:bg-teal-200 transition-colors shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-teal-700" />
            <span className="hidden lg:inline">Guía Espectral</span>
          </button>

          {/* Upload Spectrum - Pastel Lila */}
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-500 hover:bg-purple-600 text-white shadow-xs transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="font-bold">Subir Espectro</span>
          </button>

          {/* Cloud Auth Status */}
          <div className="pl-1 border-l border-purple-200 dark:border-slate-700 flex items-center">
            {user ? (
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-400 via-pink-300 to-teal-300 text-purple-950 flex items-center justify-center font-bold text-xs ring-2 ring-purple-200 dark:ring-purple-900 shadow-2xs"
                  title={`Conectado como ${user.email}`}
                >
                  {user.displayName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                </div>
                <button
                  onClick={onLogout}
                  title="Cerrar sesión"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-rose-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-purple-950 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-700 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Iniciar Sesión</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Input */}
      <div className="p-3 border-t border-purple-100 dark:border-slate-800 md:hidden bg-purple-50/40 dark:bg-slate-800/40">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-purple-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por compuesto, fórmula o pico..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
          />
        </div>
      </div>
    </header>
  );
};
