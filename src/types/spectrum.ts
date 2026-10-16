export type SpectrumPoint = [number, number]; // [wavenumber (cm^-1), value (%T or Absorbance)]

export interface SpectrumPeak {
  wavenumber: number;
  value: number; // raw value at peak
  intensity: number; // percentage or relative height
  intensityType: 'muy fuerte' | 'fuerte' | 'media' | 'débil' | 'ancha';
  functionalGroup?: string;
  assignment?: string; // e.g., "O-H stretch", "C=O carbonilo", "C-H alifático"
}

export interface RegionObservation {
  zoneName: string;
  range: string;
  status: 'presente' | 'ausente' | 'característico';
  observation: string;
  keyPeaks?: string;
}

export interface DetailedAnalysis {
  summary: string;
  molecularWeight?: number;
  iupacName?: string;
  regions: RegionObservation[];
  diagnosticDeduction: string;
}

export interface SpectrumRecord {
  id: string;
  userId: string;
  userEmail?: string;
  compoundName: string;
  primaryFunctionalGroup: string;
  secondaryFunctionalGroups?: string;
  chemicalFormula?: string;
  casNumber?: string;
  sampleState?: string;
  instrument?: string;
  resolution?: string;
  notes?: string;
  fileName?: string;
  fileType?: string; // 'jdx' | 'csv' | 'txt' | 'tsv' | 'referencia' | 'manual'
  yUnit: 'transmittance' | 'absorbance';
  dataPointsJson: string; // JSON.stringify(SpectrumPoint[])
  peaksJson?: string; // JSON.stringify(SpectrumPeak[])
  createdAt: string;
  updatedAt: string;
  isReference?: boolean; // client-side flag for preloaded library
  iupacName?: string;
  molecularWeight?: number;
  detailedAnalysis?: DetailedAnalysis;
}

export interface FunctionalGroupDef {
  id: string;
  name: string; // e.g. "Alcoholes y Fenoles"
  shortName: string; // e.g. "Alcoholes"
  category: 'Oxigenados' | 'Nitrogenados' | 'Hidrocarburos' | 'Halogenados' | 'Otros';
  color: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  iconName: string;
  description: string;
  generalFormula?: string;
  keyBands: {
    range: [number, number];
    label: string;
    vibration: string;
    appearance: string;
    importance: 'clave' | 'secundaria';
  }[];
  examples: string[];
}

export interface DiagnosticZone {
  id: string;
  name: string;
  range: [number, number]; // [minWavenumber, maxWavenumber]
  color: string;
  description: string;
  typicalBonds: string;
}

export interface ParseResult {
  title: string;
  compoundName: string;
  yUnit: 'transmittance' | 'absorbance';
  points: SpectrumPoint[];
  peaks: SpectrumPeak[];
  suggestedFunctionalGroup?: string;
  suggestedSecondaryGroups?: string[];
  instrument?: string;
  resolution?: string;
  notes?: string;
}
