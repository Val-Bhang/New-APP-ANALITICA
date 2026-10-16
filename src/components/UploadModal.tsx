import React, { useState, useRef } from 'react';
import { SpectrumRecord, SpectrumPeak, SpectrumPoint } from '../types/spectrum';
import { FUNCTIONAL_GROUPS } from '../data/functionalGroups';
import { parseSpectrumFile } from '../utils/jcampParser';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  FlaskConical,
  HelpCircle,
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<SpectrumRecord, 'id' | 'createdAt' | 'updatedAt' | 'userId'>) => Promise<void>;
  currentUserId?: string;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('jdx');
  const [compoundName, setCompoundName] = useState<string>('');
  const [primaryGroup, setPrimaryGroup] = useState<string>(FUNCTIONAL_GROUPS[0].name);
  const [secondaryGroups, setSecondaryGroups] = useState<string>('');
  const [chemicalFormula, setChemicalFormula] = useState<string>('');
  const [casNumber, setCasNumber] = useState<string>('');
  const [sampleState, setSampleState] = useState<string>('Líquido puro (película fina)');
  const [instrument, setInstrument] = useState<string>('FTIR Nicolet iS50');
  const [resolution, setResolution] = useState<string>('4 cm⁻¹');
  const [notes, setNotes] = useState<string>('');
  const [yUnit, setYUnit] = useState<'transmittance' | 'absorbance'>('transmittance');

  const [points, setPoints] = useState<SpectrumPoint[]>([]);
  const [peaks, setPeaks] = useState<SpectrumPeak[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
  const MAX_SPECTRUM_POINTS = 20000; // Maximum allowed spectrum points

  // Process raw text content from file
  const handleContentParsed = (content: string, name: string) => {
    try {
      setIsLoading(true);
      setErrorMsg('');

      const result = parseSpectrumFile(content, name);

      if (result.points.length < 5) {
        throw new Error(
          'No se pudieron extraer suficientes puntos espectrales válidos. Verifica que el archivo tenga columnas de número de onda (cm⁻¹) y transmitancia/absorbancia.'
        );
      }

      if (result.points.length > MAX_SPECTRUM_POINTS) {
        throw new Error(
          `El archivo contiene ${result.points.length.toLocaleString()} puntos espectrales, superando el límite máximo permitido de ${MAX_SPECTRUM_POINTS.toLocaleString()} puntos. Reduce la densidad o resolución del espectro antes de cargarlo.`
        );
      }

      setFileName(name);
      setFileType(name.split('.').pop() || 'jdx');
      setCompoundName(result.compoundName || name.replace(/\.[^/.]+$/, ''));
      setYUnit(result.yUnit);
      setPoints(result.points);
      setPeaks(result.peaks);

      if (result.suggestedFunctionalGroup) {
        setPrimaryGroup(result.suggestedFunctionalGroup);
      }
      if (result.suggestedSecondaryGroups && result.suggestedSecondaryGroups.length > 0) {
        setSecondaryGroups(result.suggestedSecondaryGroups.join(', '));
      }
      if (result.instrument) setInstrument(result.instrument);
      if (result.resolution) setResolution(result.resolution);
      if (result.notes) setNotes(result.notes);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al procesar el archivo.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict 5 MB file size limit before readAsText
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg(
        `El archivo seleccionado excede el tamaño máximo permitido de 5 MB (tamaño: ${(file.size / (1024 * 1024)).toFixed(2)} MB). Por favor elige un archivo menor a 5 MB.`
      );
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      handleContentParsed(text, file.name);
    };
    reader.onerror = () => {
      setErrorMsg('No se pudo leer el archivo seleccionado.');
    };
    reader.readAsText(file);
  };

  // Quick sample loaders for testing
  const loadDemoSample = (type: 'ester' | 'alcohol' | 'acid' | 'alkyne') => {
    let mockContent = '';
    let name = '';

    if (type === 'ester') {
      name = 'muestra_butirato_metilo.csv';
      mockContent = 'Wavenumber,Transmittance\n';
      for (let wn = 4000; wn >= 400; wn -= 10) {
        let t = 95;
        if (Math.abs(wn - 2960) < 30) t -= 45;
        if (Math.abs(wn - 1742) < 25) t -= 90; // Ester C=O
        if (Math.abs(wn - 1180) < 35) t -= 85; // C-O
        if (Math.abs(wn - 1050) < 30) t -= 60;
        mockContent += `${wn},${Math.max(5, t)}\n`;
      }
    } else if (type === 'alcohol') {
      name = 'muestra_isopropanol.jdx';
      mockContent = '##TITLE=Isopropanol\n##JCAMP-DX=4.24\n##DATA TYPE=INFRARED SPECTRUM\n##YUNITS=TRANSMITTANCE\n##XYDATA=(XY..XY)\n';
      for (let wn = 4000; wn >= 400; wn -= 10) {
        let t = 98;
        if (Math.abs(wn - 3350) < 160) t -= 82; // Broad O-H
        if (Math.abs(wn - 2970) < 30) t -= 65;
        if (Math.abs(wn - 1380) < 20) t -= 45; // Isopropyl doublet
        if (Math.abs(wn - 1130) < 30) t -= 85; // 2° alcohol C-O
        mockContent += `${wn} ${Math.max(5, t)}\n`;
      }
      mockContent += '##END=\n';
    } else if (type === 'acid') {
      name = 'muestra_acido_hexanoico.csv';
      mockContent = 'cm-1;%T\n';
      for (let wn = 4000; wn >= 400; wn -= 10) {
        let t = 96;
        if (wn >= 2500 && wn <= 3300) t -= 65; // Monster broad OH
        if (Math.abs(wn - 1712) < 30) t -= 90; // Acid C=O
        if (Math.abs(wn - 1280) < 35) t -= 70;
        if (Math.abs(wn - 935) < 40) t -= 50; // Dimer OOP
        mockContent += `${wn};${Math.max(5, t)}\n`;
      }
    } else {
      name = 'muestra_1_octino.txt';
      mockContent = 'Wavenumber\tTransmittance\n';
      for (let wn = 4000; wn >= 400; wn -= 10) {
        let t = 97;
        if (Math.abs(wn - 3315) < 15) t -= 85; // Sharp alkyne
        if (Math.abs(wn - 2960) < 30) t -= 60;
        if (Math.abs(wn - 2120) < 18) t -= 45; // C#C
        if (Math.abs(wn - 635) < 35) t -= 70;
        mockContent += `${wn}\t${Math.max(5, t)}\n`;
      }
    }

    handleContentParsed(mockContent, name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (points.length === 0) {
      setErrorMsg('Debes seleccionar o cargar un archivo con datos de espectro.');
      return;
    }
    if (!compoundName.trim()) {
      setErrorMsg('Por favor ingresa el nombre del compuesto.');
      return;
    }

    try {
      setIsSaving(true);
      await onSave({
        compoundName: compoundName.trim(),
        primaryFunctionalGroup: primaryGroup,
        secondaryFunctionalGroups: secondaryGroups.trim() || undefined,
        chemicalFormula: chemicalFormula.trim() || undefined,
        casNumber: casNumber.trim() || undefined,
        sampleState: sampleState.trim() || undefined,
        instrument: instrument.trim() || undefined,
        resolution: resolution.trim() || undefined,
        notes: notes.trim() || undefined,
        fileName: fileName || 'espectro.jdx',
        fileType: fileType || 'jdx',
        yUnit,
        dataPointsJson: JSON.stringify(points),
        peaksJson: JSON.stringify(peaks),
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al guardar el espectro.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-2xl shadow-2xs border border-purple-200">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-purple-950 dark:text-slate-100">
                Añadir Archivo de Espectro IR a la Base de Datos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organiza y clasifica espectros infrarrojos por grupo funcional químico
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* File Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              points.length > 0
                ? 'border-teal-400 bg-teal-50/50 dark:border-teal-800 dark:bg-teal-950/20 shadow-xs'
                : 'border-purple-200 dark:border-slate-700 hover:border-purple-400 bg-purple-50/20 dark:bg-slate-800/40'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jdx,.dx,.csv,.txt,.tsv"
              onChange={handleFileChange}
              className="hidden"
            />
            {points.length > 0 ? (
              <div className="flex items-center justify-center gap-3 text-teal-800 dark:text-teal-400">
                <CheckCircle2 className="w-8 h-8 flex-shrink-0 text-teal-600" />
                <div className="text-left">
                  <p className="font-bold text-sm">
                    {fileName} ({points.length} puntos cargados, {peaks.length} picos detectados)
                  </p>
                  <p className="text-xs text-teal-700/80 dark:text-teal-400/80">
                    Haz clic para seleccionar otro archivo
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-2xs border border-purple-200">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-sm">
                  <span className="font-bold text-purple-800 dark:text-purple-300">
                    Sube un archivo de espectro IR
                  </span>{' '}
                  o arrástralo aquí
                </div>
                <p className="text-xs text-slate-500">
                  Formatos compatibles: JCAMP-DX (.jdx, .dx), CSV, TXT, TSV con pares (cm⁻¹, %T o Abs)
                </p>
              </div>
            )}
          </div>

          {/* Quick Demo Sample Files - Pastel Lilac, Pink, Blue-Green, Yellow */}
          <div className="flex items-center flex-wrap gap-2 text-xs bg-purple-50/40 dark:bg-slate-800/60 p-3 rounded-2xl border border-purple-100 dark:border-slate-700/60 shadow-2xs">
            <span className="text-purple-950 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Probar con archivo de muestra:
            </span>
            <button
              type="button"
              onClick={() => loadDemoSample('ester')}
              className="px-2.5 py-1 rounded-xl bg-teal-100 text-teal-950 border border-teal-300 hover:bg-teal-200 font-semibold transition-colors"
            >
              Éster (Butirato)
            </button>
            <button
              type="button"
              onClick={() => loadDemoSample('alcohol')}
              className="px-2.5 py-1 rounded-xl bg-pink-100 text-pink-950 border border-pink-300 hover:bg-pink-200 font-semibold transition-colors"
            >
              Alcohol (Isopropanol)
            </button>
            <button
              type="button"
              onClick={() => loadDemoSample('acid')}
              className="px-2.5 py-1 rounded-xl bg-purple-100 text-purple-950 border border-purple-300 hover:bg-purple-200 font-semibold transition-colors"
            >
              Ácido (Hexanoico)
            </button>
            <button
              type="button"
              onClick={() => loadDemoSample('alkyne')}
              className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-950 border border-amber-300 hover:bg-amber-200 font-semibold transition-colors"
            >
              Alquino (1-Octino)
            </button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form Metadata Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Compound Name */}
            <div>
              <label className="block font-semibold text-purple-950 dark:text-slate-300 mb-1">
                Nombre del Compuesto Químico *
              </label>
              <input
                type="text"
                required
                value={compoundName}
                onChange={(e) => setCompoundName(e.target.value)}
                placeholder="Ej. Benzoato de metilo, Ciclohexanona..."
                className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-300 shadow-2xs"
              />
            </div>

            {/* Primary Functional Group (Database Classification Key) */}
            <div>
              <label className="block font-semibold text-purple-950 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span>Grupo Funcional Principal (Organización) *</span>
                <span className="text-[10px] text-purple-600 font-semibold">Clasificación</span>
              </label>
              <select
                value={primaryGroup}
                onChange={(e) => setPrimaryGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-300 shadow-2xs"
              >
                {FUNCTIONAL_GROUPS.map((g) => (
                  <option key={g.id} value={g.name}>
                    {g.name} ({g.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Secondary Groups */}
            <div>
              <label className="block font-semibold text-purple-950 dark:text-slate-300 mb-1">
                Grupos Funcionales Secundarios (Opcional)
              </label>
              <input
                type="text"
                value={secondaryGroups}
                onChange={(e) => setSecondaryGroups(e.target.value)}
                placeholder="Ej. Compuestos Aromáticos (Arenos), Alcanos..."
                className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-300 shadow-2xs"
              />
            </div>

            {/* Chemical Formula */}
            <div>
              <label className="block font-semibold text-purple-950 dark:text-slate-300 mb-1">
                Fórmula Química
              </label>
              <input
                type="text"
                value={chemicalFormula}
                onChange={(e) => setChemicalFormula(e.target.value)}
                placeholder="Ej. C8H8O2"
                className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-300 shadow-2xs"
              />
            </div>

            {/* CAS Number */}
            <div>
              <label className="block font-semibold text-purple-950 dark:text-slate-300 mb-1">
                Número de Registro CAS
              </label>
              <input
                type="text"
                value={casNumber}
                onChange={(e) => setCasNumber(e.target.value)}
                placeholder="Ej. 93-58-3"
                className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-300 shadow-2xs"
              />
            </div>

            {/* Sample State */}
            <div>
              <label className="block font-semibold text-purple-950 dark:text-slate-300 mb-1">
                Estado de la Muestra / Preparación
              </label>
              <select
                value={sampleState}
                onChange={(e) => setSampleState(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-300 shadow-2xs"
              >
                <option value="Líquido puro (película fina entre placas NaCl)">
                  Líquido puro (película fina entre placas NaCl)
                </option>
                <option value="Pastilla de KBr al 1%">Pastilla de KBr al 1%</option>
                <option value="ATR (Cristal de Diamante)">ATR (Cristal de Diamante)</option>
                <option value="Suspensión en Nujol">Suspensión en Nujol</option>
                <option value="Gas (celda de 10 cm con ventanas KBr)">
                  Gas (celda de 10 cm con ventanas KBr)
                </option>
                <option value="Disolución en CCl4 / CS2">Disolución en CCl4 / CS2</option>
              </select>
            </div>

            {/* Instrument */}
            <div>
              <label className="block font-semibold text-purple-950 dark:text-slate-300 mb-1">
                Espectrómetro / Instrumento
              </label>
              <input
                type="text"
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                placeholder="Ej. FTIR Nicolet 6700, PerkinElmer..."
                className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-300 shadow-2xs"
              />
            </div>

            {/* Unit */}
            <div>
              <label className="block font-semibold text-purple-950 dark:text-slate-300 mb-1">
                Unidad del Eje Y
              </label>
              <select
                value={yUnit}
                onChange={(e) => setYUnit(e.target.value as 'transmittance' | 'absorbance')}
                className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-300 shadow-2xs"
              >
                <option value="transmittance">% Transmitancia (%T)</option>
                <option value="absorbance">Absorbancia (A)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="text-xs">
            <label className="block font-semibold text-purple-950 dark:text-slate-300 mb-1">
              Notas Experimentales y Observaciones Espectrales
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles de pureza, bandas características observadas, asignaciones..."
              className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-300 shadow-2xs"
            />
          </div>

          {/* Detected Peaks Preview */}
          {peaks.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
              <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-2 block">
                Picos espectrales identificados ({peaks.length}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {peaks.map((p, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-[11px] text-slate-800 dark:text-slate-300 shadow-2xs"
                  >
                    <span className="font-bold text-purple-700 dark:text-purple-400">
                      {p.wavenumber} cm⁻¹
                    </span>
                    <span className="text-[10px] text-slate-400">({p.intensityType})</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-purple-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || points.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Guardando en BD...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-purple-200" />
                  Guardar Espectro en la Base de Datos
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
