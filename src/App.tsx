import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  testConnection,
  loginWithGoogle,
  logoutUser,
  subscribeToUserSpectrums,
  saveSpectrumToFirestore,
  deleteSpectrumFromFirestore,
} from './firebase';
import { SpectrumRecord, SpectrumPeak } from './types/spectrum';
import { REFERENCE_SPECTRUMS, FUNCTIONAL_GROUPS } from './data/functionalGroups';
import { Navbar } from './components/Navbar';
import { SidebarGroups } from './components/SidebarGroups';
import { SpectrumCard } from './components/SpectrumCard';
import { SpectrumViewer } from './components/SpectrumViewer';
import { UploadModal } from './components/UploadModal';
import { SpectrumDetailModal } from './components/SpectrumDetailModal';
import { DiagnosticTool } from './components/DiagnosticTool';
import { FunctionalGroupGuideModal } from './components/FunctionalGroupGuideModal';
import { InstantFormulaSearch } from './components/InstantFormulaSearch';
import { SpectrumAnalysisPanel } from './components/SpectrumAnalysisPanel';
import {
  FlaskConical,
  Plus,
  Layers,
  Sparkles,
  BookOpen,
  Cloud,
  CheckCircle2,
  AlertCircle,
  X,
  SlidersHorizontal,
  FolderOpen,
} from 'lucide-react';
import { safeParseUserRecords, safeParsePeaks } from './utils/schemaValidation';

const LOCAL_STORAGE_KEY = 'espectro_ir_user_records_v1';

export default function App() {
  // Auth & Connection State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Spectra Data - Validated with Zod schema from localStorage
  const [userSpectrums, setUserSpectrums] = useState<SpectrumRecord[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return safeParseUserRecords(saved);
    } catch {
      return [];
    }
  });

  // Active Spectrum for top Interactive Viewer
  const [selectedSpectrumId, setSelectedSpectrumId] = useState<string>(
    REFERENCE_SPECTRUMS[0].id
  );

  // Spectrum to Compare (Overlay)
  const [compareSpectrumId, setCompareSpectrumId] = useState<string | null>(null);
  const [highlightedPeak, setHighlightedPeak] = useState<SpectrumPeak | null>(null);

  // Filters
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'user' | 'reference'>('all');

  // Modals & Panels
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);
  const [showDiagnosticPanel, setShowDiagnosticPanel] = useState<boolean>(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  // 1. Initial Connection Test
  useEffect(() => {
    testConnection().then((connected) => {
      setIsCloudConnected(connected);
    });
  }, []);

  // 2. Auth State Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
      if (user) {
        showToast(`Sesión iniciada como ${user.displayName || user.email}`, 'info');
      } else {
        // Clear local storage and state on logout to protect shared devices
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setUserSpectrums([]);
      }
    });
    return () => unsub();
  }, [showToast]);

  // 3. Firestore Subscription for Authenticated User
  useEffect(() => {
    if (!currentUser) return;

    const unsub = subscribeToUserSpectrums(
      currentUser.uid,
      (firestoreRecords) => {
        const validatedRecords = safeParseUserRecords(JSON.stringify(firestoreRecords));
        setUserSpectrums(validatedRecords);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(validatedRecords));
        } catch (e) {
          console.warn('LocalStorage error:', e);
        }
      },
      (err) => {
        console.error('Firestore listener error:', err);
      }
    );

    return () => unsub();
  }, [currentUser]);

  // Combine User Spectrums and Reference Spectrums
  const allSpectrums = useMemo(() => {
    return [...userSpectrums, ...REFERENCE_SPECTRUMS];
  }, [userSpectrums]);

  // Currently Selected Spectrum Object
  const activeSpectrum = useMemo(() => {
    return (
      allSpectrums.find((s) => s.id === selectedSpectrumId) ||
      REFERENCE_SPECTRUMS[0]
    );
  }, [allSpectrums, selectedSpectrumId]);

  // Comparison Spectrum Object
  const compareSpectrum = useMemo(() => {
    if (!compareSpectrumId) return null;
    return allSpectrums.find((s) => s.id === compareSpectrumId) || null;
  }, [allSpectrums, compareSpectrumId]);

  // Count spectrums per functional group
  const spectrumCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of FUNCTIONAL_GROUPS) {
      counts[g.name] = 0;
    }
    allSpectrums.forEach((s) => {
      if (counts[s.primaryFunctionalGroup] !== undefined) {
        counts[s.primaryFunctionalGroup]++;
      }
    });
    return counts;
  }, [allSpectrums]);

  // Selected Group Definition
  const selectedGroupDef = useMemo(() => {
    if (!selectedGroupId) return null;
    return FUNCTIONAL_GROUPS.find((g) => g.id === selectedGroupId) || null;
  }, [selectedGroupId]);

  // Filtered Spectrums List
  const filteredSpectrums = useMemo(() => {
    return allSpectrums.filter((s) => {
      // 1. Filter Mode
      if (filterMode === 'user' && s.isReference) return false;
      if (filterMode === 'reference' && !s.isReference) return false;

      // 2. Functional Group Filter
      if (selectedGroupDef) {
        const matchesPrimary = s.primaryFunctionalGroup === selectedGroupDef.name;
        const matchesSecondary = s.secondaryFunctionalGroups?.includes(selectedGroupDef.name);
        if (!matchesPrimary && !matchesSecondary) return false;
      }

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const inCompound = s.compoundName.toLowerCase().includes(q);
        const inGroup = s.primaryFunctionalGroup.toLowerCase().includes(q);
        const inSecondary = s.secondaryFunctionalGroups?.toLowerCase().includes(q) || false;
        const inFormula = s.chemicalFormula?.toLowerCase().includes(q) || false;
        const inCas = s.casNumber?.toLowerCase().includes(q) || false;
        const inNotes = s.notes?.toLowerCase().includes(q) || false;
        const inFileName = s.fileName?.toLowerCase().includes(q) || false;

        // Check if query is a numeric wavenumber (e.g. 1715)
        const numericQ = parseFloat(q);
        let inPeaks = false;
        if (!isNaN(numericQ) && s.peaksJson) {
          const peaks = safeParsePeaks(s.peaksJson);
          inPeaks = peaks.some((p) => Math.abs(p.wavenumber - numericQ) <= 30);
        }

        if (
          !inCompound &&
          !inGroup &&
          !inSecondary &&
          !inFormula &&
          !inCas &&
          !inNotes &&
          !inFileName &&
          !inPeaks
        ) {
          return false;
        }
      }

      return true;
    });
  }, [allSpectrums, filterMode, selectedGroupDef, searchQuery]);

  // Handle Save New Spectrum
  const handleSaveSpectrum = async (
    recordData: Omit<SpectrumRecord, 'id' | 'createdAt' | 'updatedAt' | 'userId'>
  ) => {
    const id = `spec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const userId = currentUser ? currentUser.uid : 'local-user';

    // Local record can maintain isReference for UI categorization
    const localRecord: SpectrumRecord = {
      ...recordData,
      id,
      userId,
      userEmail: currentUser?.email || undefined,
      createdAt: now,
      updatedAt: now,
      isReference: false,
    };

    // If signed into Firebase, save directly to Firestore:
    // Notice: Do NOT include isReference (not in Firestore rules hasOnly list),
    // and omit userEmail if undefined.
    if (currentUser) {
      const firestorePayload: Record<string, any> = {
        id,
        userId,
        compoundName: recordData.compoundName,
        primaryFunctionalGroup: recordData.primaryFunctionalGroup,
        yUnit: recordData.yUnit,
        dataPointsJson: recordData.dataPointsJson,
        createdAt: now,
        updatedAt: now,
      };

      if (currentUser.email) {
        firestorePayload.userEmail = currentUser.email;
      }
      if (recordData.secondaryFunctionalGroups) {
        firestorePayload.secondaryFunctionalGroups = recordData.secondaryFunctionalGroups;
      }
      if (recordData.chemicalFormula) {
        firestorePayload.chemicalFormula = recordData.chemicalFormula;
      }
      if (recordData.casNumber) {
        firestorePayload.casNumber = recordData.casNumber;
      }
      if (recordData.sampleState) {
        firestorePayload.sampleState = recordData.sampleState;
      }
      if (recordData.instrument) {
        firestorePayload.instrument = recordData.instrument;
      }
      if (recordData.resolution) {
        firestorePayload.resolution = recordData.resolution;
      }
      if (recordData.notes) {
        firestorePayload.notes = recordData.notes;
      }
      if (recordData.fileName) {
        firestorePayload.fileName = recordData.fileName;
      }
      if (recordData.fileType) {
        firestorePayload.fileType = recordData.fileType;
      }
      if (recordData.peaksJson) {
        firestorePayload.peaksJson = recordData.peaksJson;
      }

      await saveSpectrumToFirestore(firestorePayload as any);
    }

    // Always update local state
    const updated = [localRecord, ...userSpectrums];
    setUserSpectrums(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    setSelectedSpectrumId(localRecord.id);
    showToast(`"${localRecord.compoundName}" guardado en la base de datos`, 'success');
  };

  // Handle Delete Spectrum
  const handleDeleteSpectrum = async (recordId: string, compoundName: string) => {
    if (!confirm(`¿Estás seguro de eliminar el espectro "${compoundName}" de la base de datos?`)) {
      return;
    }

    if (currentUser) {
      try {
        await deleteSpectrumFromFirestore(recordId);
      } catch (e) {
        console.error('Delete from firestore failed:', e);
      }
    }

    const updated = userSpectrums.filter((s) => s.id !== recordId);
    setUserSpectrums(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn(e);
    }

    if (selectedSpectrumId === recordId) {
      setSelectedSpectrumId(REFERENCE_SPECTRUMS[0].id);
    }
    if (compareSpectrumId === recordId) {
      setCompareSpectrumId(null);
    }

    showToast(`Espectro "${compoundName}" eliminado`, 'info');
  };

  // Toggle Overlay Comparison
  const handleToggleCompare = (id: string) => {
    if (compareSpectrumId === id) {
      setCompareSpectrumId(null);
      showToast('Modo de comparación desactivado', 'info');
    } else {
      setCompareSpectrumId(id);
      const target = allSpectrums.find((s) => s.id === id);
      showToast(`Superponiendo espectro: ${target?.compoundName}`, 'info');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/70 via-pink-50/40 via-teal-50/40 to-amber-50/60 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans selection:bg-purple-200 selection:text-purple-950">
      {/* Navbar */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenDiagnostic={() => setShowDiagnosticPanel(!showDiagnosticPanel)}
        onOpenGuide={() => setIsGuideOpen(true)}
        user={currentUser}
        onLogin={async () => {
          try {
            await loginWithGoogle();
          } catch (e) {
            showToast('No se pudo completar el inicio de sesión', 'error');
          }
        }}
        onLogout={async () => {
          await logoutUser();
          localStorage.removeItem(LOCAL_STORAGE_KEY);
          setUserSpectrums([]);
          showToast('Sesión cerrada correctamente', 'info');
        }}
        isCloudConnected={isCloudConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Instant Formula & Compound Search Bar - Pastel Lilac, Pink, Blue-Green & Yellow Hero Banner */}
        <section className="bg-gradient-to-r from-purple-200/95 via-pink-200/90 via-teal-100/90 to-amber-200/95 rounded-3xl p-6 sm:p-7 text-slate-800 shadow-lg shadow-purple-500/5 border border-purple-300/60 relative overflow-hidden space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-300/80 border border-purple-400/50 flex items-center justify-center text-purple-900 shadow-xs">
                  <FlaskConical className="w-5 h-5 text-purple-800" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-purple-950">
                  Búsqueda Rápida por Fórmula Molecular o Nombre
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 max-w-2xl mt-2 leading-relaxed">
                Escribe la fórmula química (ej.{' '}
                <strong className="bg-teal-100 text-teal-900 border border-teal-300/80 px-1.5 py-0.5 rounded font-mono text-xs">
                  C2H6O
                </strong>
                ,{' '}
                <strong className="bg-pink-100 text-pink-900 border border-pink-300/80 px-1.5 py-0.5 rounded font-mono text-xs">
                  C7H6O2
                </strong>
                ,{' '}
                <strong className="bg-purple-100 text-purple-900 border border-purple-300/80 px-1.5 py-0.5 rounded font-mono text-xs">
                  C3H6O
                </strong>
                ,{' '}
                <strong className="bg-amber-100 text-amber-900 border border-amber-300/80 px-1.5 py-0.5 rounded font-mono text-xs">
                  C6H12
                </strong>
                ) o nombre del compuesto para cargar enseguida su espectro IR y análisis detallado.
              </p>
            </div>
            <div className="text-xs bg-amber-100/95 text-amber-900 border border-amber-300 px-3 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5 font-bold self-start md:self-auto">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Carga instantánea en pantalla</span>
            </div>
          </div>

          <InstantFormulaSearch
            allSpectrums={allSpectrums}
            activeSpectrumId={selectedSpectrumId}
            onSelectSpectrum={(spec) => {
              setSelectedSpectrumId(spec.id);
              setHighlightedPeak(null);
            }}
          />
        </section>

        {/* Diagnostic Tool Collapsible Banner / Section */}
        {showDiagnosticPanel && (
          <div className="relative">
            <button
              onClick={() => setShowDiagnosticPanel(false)}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
            <DiagnosticTool
              allSpectrums={allSpectrums}
              onSelectSpectrum={(spec) => {
                setSelectedSpectrumId(spec.id);
                setShowDiagnosticPanel(false);
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* Top Interactive FTIR Spectrometer Showcase */}
        {activeSpectrum && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-purple-600" /> Visor Espectral FTIR Interactivo
                </span>
                {compareSpectrum && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300/80 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                    <Layers className="w-3 h-3 text-amber-600" /> Modo Comparación Activado
                    <button
                      onClick={() => setCompareSpectrumId(null)}
                      className="ml-1 text-amber-800 hover:text-amber-950"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDetailOpen(true)}
                  className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:text-purple-900 hover:underline flex items-center gap-1"
                >
                  Ver Ficha y Exportar Archivos →
                </button>
              </div>
            </div>

            <SpectrumViewer
              spectrum={activeSpectrum}
              compareSpectrum={compareSpectrum}
              highlightedPeak={highlightedPeak}
              onSelectPeak={(pk) => setHighlightedPeak(pk)}
              height={380}
            />

            {/* Detailed Spectroscopic Description & Analysis Panel */}
            <SpectrumAnalysisPanel
              spectrum={activeSpectrum}
              onSelectPeak={(pk) => {
                setHighlightedPeak(pk);
              }}
            />
          </div>
        )}

        {/* Database Explorer Grid */}
        <div className="flex flex-col lg:flex-row gap-6 items-start pt-2">
          {/* Functional Groups Taxonomy Sidebar */}
          <SidebarGroups
            selectedGroupId={selectedGroupId}
            onSelectGroup={setSelectedGroupId}
            spectrumCounts={spectrumCounts}
            totalCount={allSpectrums.length}
            userCount={userSpectrums.length}
            referenceCount={REFERENCE_SPECTRUMS.length}
            filterMode={filterMode}
            onChangeFilterMode={setFilterMode}
          />

          {/* Spectrums Catalog Section */}
          <section className="flex-1 w-full space-y-4">
            {/* Catalog Filter Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white/90 dark:bg-slate-900 border border-purple-100 dark:border-slate-800 rounded-2xl px-5 py-3.5 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-purple-950 dark:text-slate-100">
                    {selectedGroupDef ? selectedGroupDef.name : 'Todos los Espectros Organizados'}
                  </h2>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-200">
                    {filteredSpectrums.length}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {selectedGroupDef
                    ? selectedGroupDef.description
                    : 'Catálogo de espectros infrarrojos clasificados por familias y grupos funcionales químicos'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-teal-100 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 border border-teal-300 dark:border-teal-800 hover:bg-teal-200 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Archivo IR</span>
                </button>
              </div>
            </div>

            {/* Spectrums Grid */}
            {filteredSpectrums.length === 0 ? (
              <div className="text-center py-16 px-4 bg-white/90 dark:bg-slate-900 border border-purple-100 dark:border-slate-800 rounded-2xl space-y-3">
                <FolderOpen className="w-12 h-12 text-purple-300 dark:text-slate-700 mx-auto" />
                <h3 className="font-bold text-base text-slate-700 dark:text-slate-300">
                  No se encontraron espectros
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {searchQuery
                    ? `No hay espectros que coincidan con "${searchQuery}". Intenta buscar por nombre de compuesto o frecuencia de pico.`
                    : 'Aún no hay espectros en este grupo funcional. ¡Sube tu primer archivo JCAMP o CSV!'}
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-purple-500 text-white hover:bg-purple-600 shadow-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Subir archivo ahora
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredSpectrums.map((spectrum) => (
                  <SpectrumCard
                    key={spectrum.id}
                    spectrum={spectrum}
                    isSelected={activeSpectrum.id === spectrum.id}
                    isCompareSelected={compareSpectrumId === spectrum.id}
                    onSelect={() => {
                      setSelectedSpectrumId(spectrum.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    onToggleCompare={() => handleToggleCompare(spectrum.id)}
                    onDelete={() => handleDeleteSpectrum(spectrum.id, spectrum.compoundName)}
                    canDelete={!spectrum.isReference}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-purple-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 py-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-purple-600" />
            <span className="font-semibold text-purple-950 dark:text-slate-300">
              EspectroIR - Base de Datos de Espectroscopía Infrarroja
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Compatible con JCAMP-DX (.jdx) & CSV</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5 text-teal-600" />
              {currentUser ? 'Sincronizado con Firebase Firestore' : 'Almacenamiento Local Activo'}
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSave={handleSaveSpectrum}
        currentUserId={currentUser?.uid}
      />

      <SpectrumDetailModal
        spectrum={isDetailOpen ? activeSpectrum : null}
        allSpectrums={allSpectrums}
        onClose={() => setIsDetailOpen(false)}
      />

      <FunctionalGroupGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onSelectGroup={(groupId) => {
          setSelectedGroupId(groupId);
          window.scrollTo({ top: 400, behavior: 'smooth' });
        }}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-slate-900 text-white text-xs shadow-xl border border-slate-800 animate-in fade-in slide-in-from-bottom-2">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-sky-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
