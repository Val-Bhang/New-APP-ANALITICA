import { SpectrumRecord, SpectrumPeak, DetailedAnalysis, RegionObservation } from '../types/spectrum';
import { FUNCTIONAL_GROUPS } from '../data/functionalGroups';
import { safeParsePeaks } from './schemaValidation';

/**
 * Calculates Degree of Unsaturation (Index of Hydrogen Deficiency, IHD)
 * IHD = C + 1 - (H / 2) - (Halogens / 2) + (N / 2)
 */
export function calculateIHD(formula?: string): number | null {
  if (!formula) return null;
  const clean = formula.trim();

  const cMatch = clean.match(/C(\d*)/);
  const hMatch = clean.match(/H(\d*)/);
  const nMatch = clean.match(/N(\d*)/);
  const clMatch = clean.match(/Cl(\d*)/);
  const brMatch = clean.match(/Br(\d*)/);
  const fMatch = clean.match(/F(\d*)/);
  const iMatch = clean.match(/I(\d*)/);

  if (!cMatch) return null;

  const C = cMatch[1] === '' ? 1 : parseInt(cMatch[1] || '0', 10);
  const H = hMatch ? (hMatch[1] === '' ? 1 : parseInt(hMatch[1] || '0', 10)) : 0;
  const N = nMatch ? (nMatch[1] === '' ? 1 : parseInt(nMatch[1] || '0', 10)) : 0;
  const X =
    (clMatch ? (clMatch[1] === '' ? 1 : parseInt(clMatch[1] || '0', 10)) : 0) +
    (brMatch ? (brMatch[1] === '' ? 1 : parseInt(brMatch[1] || '0', 10)) : 0) +
    (fMatch ? (fMatch[1] === '' ? 1 : parseInt(fMatch[1] || '0', 10)) : 0) +
    (iMatch ? (iMatch[1] === '' ? 1 : parseInt(iMatch[1] || '0', 10)) : 0);

  const ihd = C + 1 - H / 2 - X / 2 + N / 2;
  return ihd >= 0 ? Math.round(ihd * 10) / 10 : null;
}

/**
 * Generates an exhaustive, high-level scientific description of what is observed in an IR spectrum
 */
export function generateSpectrumAnalysis(spectrum: SpectrumRecord): DetailedAnalysis {
  // If already provided in reference data, return it
  if (spectrum.detailedAnalysis) {
    return spectrum.detailedAnalysis;
  }

  const peaks: SpectrumPeak[] = safeParsePeaks(spectrum.peaksJson);

  const ihd = calculateIHD(spectrum.chemicalFormula);

  const pWns = peaks.map((p) => p.wavenumber);
  const hasPeakInRange = (min: number, max: number) => pWns.some((w) => w >= min && w <= max);
  const getPeaksInRange = (min: number, max: number) =>
    peaks.filter((p) => p.wavenumber >= min && p.wavenumber <= max);

  const regions: RegionObservation[] = [];

  // 1. Zona X-H (4000 - 2500 cm⁻¹)
  const xhPeaks = getPeaksInRange(2500, 4000);
  let xhObs = '';
  let xhStatus: RegionObservation['status'] = 'ausente';

  // Check Carboxylic Acid broad OH
  const acidOH = peaks.find((p) => p.wavenumber >= 2500 && p.wavenumber <= 3300 && p.intensityType === 'ancha');
  const alcoholOH = peaks.find((p) => p.wavenumber >= 3200 && p.wavenumber <= 3650 && (p.intensityType === 'ancha' || p.intensityType === 'muy fuerte'));
  const alkyneCH = peaks.find((p) => p.wavenumber >= 3260 && p.wavenumber <= 3330 && p.intensityType !== 'ancha');
  const amineNH = peaks.filter((p) => p.wavenumber >= 3300 && p.wavenumber <= 3500);
  const aromaticCH = peaks.find((p) => p.wavenumber >= 3000 && p.wavenumber <= 3120);
  const aliphaticCH = peaks.filter((p) => p.wavenumber >= 2840 && p.wavenumber <= 2990);
  const aldehydeFermi = peaks.filter((p) => (p.wavenumber >= 2700 && p.wavenumber <= 2750) || (p.wavenumber >= 2810 && p.wavenumber <= 2840));

  if (acidOH) {
    xhStatus = 'característico';
    xhObs = `Se observa una banda extremadamente ancha e intensa centrada en ~${acidOH.wavenumber} cm⁻¹ que se expande desde 3300 hasta 2500 cm⁻¹. Es el clásico "patio" de dímero de ácido carboxílico, cuyos puentes de hidrógeno intermoleculares solapan con las señales C-H alifáticas y aromáticas.`;
  } else if (alcoholOH) {
    xhStatus = 'característico';
    xhObs = `Destaca una protuberante y suave banda ancha de absorción en ~${alcoholOH.wavenumber} cm⁻¹ característica de la tensión O-H asociada mediante puentes de hidrógeno intermoleculares. Indica la presencia indiscutible de un grupo hidroxilo alcohólico o fenólico.`;
  } else if (alkyneCH) {
    xhStatus = 'característico';
    xhObs = `Aparece una señal muy aguda, limpia y penetrante en ~${alkyneCH.wavenumber} cm⁻¹. Corresponde al estiramiento ≡C-H de un carbono con hibridación sp (alquino terminal), inconfundible frente a bandas más anchas.`;
  } else if (amineNH.length > 0) {
    xhStatus = 'característico';
    if (amineNH.length >= 2) {
      xhObs = `Se aprecia un doblete de bandas N-H a ${amineNH.map((p) => p.wavenumber + ' cm⁻¹').join(' y ')}, atribuible a las vibraciones de tensión asimétrica y simétrica de una amina primaria (-NH₂).`;
    } else {
      xhObs = `Se observa un pico individual en ~${amineNH[0].wavenumber} cm⁻¹, correspondiente a la tensión N-H de una amina secundaria o amida.`;
    }
  } else {
    const chDetails: string[] = [];
    if (aromaticCH) {
      chDetails.push(`estiramientos =C-H (sp²) aromáticos/olefínicos justo por encima de 3000 cm⁻¹ (${aromaticCH.wavenumber} cm⁻¹)`);
    }
    if (aliphaticCH.length > 0) {
      chDetails.push(`estiramientos C-H alifáticos (sp³) por debajo de 3000 cm⁻¹ (${aliphaticCH.map((p) => p.wavenumber + ' cm⁻¹').join(', ')})`);
    }
    if (aldehydeFermi.length > 0) {
      chDetails.push(`doblete de Fermi del protón aldehídico C-H en ~${aldehydeFermi.map((p) => p.wavenumber + ' cm⁻¹').join(' y ')}`);
    }

    if (chDetails.length > 0) {
      xhStatus = 'presente';
      xhObs = `Se observan exclusivamente vibraciones C-H: ${chDetails.join(' y ')}. Se constata la ausencia total de absorciones O-H o N-H en la región de 3200-3600 cm⁻¹.`;
    } else {
      xhObs = `Región mayormente limpia, sin absorciones notables de estiramiento de enlaces a hidrógeno en 2500-4000 cm⁻¹.`;
    }
  }

  regions.push({
    zoneName: 'Zona X-H (Elongación de enlaces a hidrógeno)',
    range: '4000 - 2500 cm⁻¹',
    status: xhStatus,
    observation: xhObs,
    keyPeaks: xhPeaks.map((p) => `${p.wavenumber} cm⁻¹ (${p.assignment || p.intensityType})`).join(', ') || 'Sin picos significativos',
  });

  // 2. Zona de Triples Enlaces (2500 - 2000 cm⁻¹)
  const triplePeaks = getPeaksInRange(2000, 2500);
  let tripleObs = '';
  let tripleStatus: RegionObservation['status'] = 'ausente';

  const nitrilePeak = peaks.find((p) => p.wavenumber >= 2210 && p.wavenumber <= 2270);
  const alkyneCC = peaks.find((p) => p.wavenumber >= 2100 && p.wavenumber <= 2210);

  if (nitrilePeak) {
    tripleStatus = 'característico';
    tripleObs = `Se detecta un pico nítido y fino en ${nitrilePeak.wavenumber} cm⁻¹ correspondiente al estiramiento del triple enlace C≡N (nitrilo). Esta banda es sumamente diagnóstica porque cae en una ventana del espectro libre de interferencias.`;
  } else if (alkyneCC) {
    tripleStatus = 'característico';
    tripleObs = `Se observa una banda en ${alkyneCC.wavenumber} cm⁻¹ asignable a la tensión del triple enlace C≡C (alquino).`;
  } else {
    tripleObs = `Ventana espectral completamente limpia y transparente (2000 a 2500 cm⁻¹). Esto descarta de manera concluyente la presencia de triples enlaces (C≡C, C≡N) o dobles enlaces acumulados (alenos, isocianatos).`;
  }

  regions.push({
    zoneName: 'Zona de Triples Enlaces',
    range: '2500 - 2000 cm⁻¹',
    status: tripleStatus,
    observation: tripleObs,
    keyPeaks: triplePeaks.map((p) => `${p.wavenumber} cm⁻¹`).join(', ') || 'Región transparente (sin absorción)',
  });

  // 3. Zona de Dobles Enlaces (2000 - 1500 cm⁻¹)
  const doublePeaks = getPeaksInRange(1500, 2000);
  let doubleObs = '';
  let doubleStatus: RegionObservation['status'] = 'ausente';

  const carbonylPeak = peaks.find((p) => p.wavenumber >= 1650 && p.wavenumber <= 1780);
  const amidePeaks = peaks.filter((p) => (p.wavenumber >= 1640 && p.wavenumber <= 1690) || (p.wavenumber >= 1530 && p.wavenumber <= 1640));
  const nitroPeaks = peaks.filter((p) => (p.wavenumber >= 1500 && p.wavenumber <= 1560) || (p.wavenumber >= 1320 && p.wavenumber <= 1370));
  const aromaticRingPeaks = peaks.filter((p) => (p.wavenumber >= 1480 && p.wavenumber <= 1615));
  const alkeneCC = peaks.find((p) => p.wavenumber >= 1620 && p.wavenumber <= 1680);

  if (carbonylPeak) {
    doubleStatus = 'característico';
    let cType = 'carbonilo';
    if (carbonylPeak.wavenumber >= 1735) cType = 'éster alifático (alta frecuencia por efecto inductivo del oxígeno)';
    else if (carbonylPeak.wavenumber >= 1720) cType = 'aldehído';
    else if (carbonylPeak.wavenumber >= 1705) cType = 'cetona alifática';
    else if (carbonylPeak.wavenumber >= 1680) cType = 'carbonilo conjugado (ácido carboxílico o cetona aromática con deslocalización de densidad electrónica)';
    else cType = 'amida (Amida I)';

    doubleObs = `Destaca la banda más dominante del espectro: un agudo y potente pico de absorción C=O a ${carbonylPeak.wavenumber} cm⁻¹, correspondiente a ${cType}.`;
    if (aromaticRingPeaks.length > 0) {
      doubleObs += ` Acompañado de vibraciones de respiración del anillo aromático en ${aromaticRingPeaks.map((p) => p.wavenumber + ' cm⁻¹').join(', ')}.`;
    }
  } else if (nitroPeaks.length > 0) {
    doubleStatus = 'característico';
    doubleObs = `Sobresale la fuertísima absorción asimétrica del grupo nitro (-NO₂) a ${nitroPeaks[0].wavenumber} cm⁻¹, complementada con la simétrica en la zona adyacente.`;
  } else if (alkeneCC) {
    doubleStatus = 'presente';
    doubleObs = `Se observa una banda moderada a ${alkeneCC.wavenumber} cm⁻¹ atribuible a la tensión C=C de alqueno.`;
  } else if (aromaticRingPeaks.length > 0) {
    doubleStatus = 'presente';
    doubleObs = `Presenta bandas de tensión de esqueleto aromático C=C en ${aromaticRingPeaks.map((p) => p.wavenumber + ' cm⁻¹').join(' y ')}. No hay carbonilo presente.`;
  } else {
    doubleObs = `Sin bandas notables de carbonilo o dobles enlaces en 1500-2000 cm⁻¹, lo que descarta ésteres, cetonas, aldehídos, amidas y ácidos.`;
  }

  regions.push({
    zoneName: 'Zona de Dobles Enlaces (C=O, C=C, N=O)',
    range: '2000 - 1500 cm⁻¹',
    status: doubleStatus,
    observation: doubleObs,
    keyPeaks: doublePeaks.map((p) => `${p.wavenumber} cm⁻¹ (${p.assignment || p.intensityType})`).join(', ') || 'Sin picos dominantes',
  });

  // 4. Zona de Huella Dactilar (1500 - 400 cm⁻¹)
  const fingerPeaks = getPeaksInRange(400, 1500);
  let fingerObs = '';
  let fingerStatus: RegionObservation['status'] = 'presente';

  const coPeaks = peaks.filter((p) => p.wavenumber >= 1000 && p.wavenumber <= 1300 && (p.intensityType === 'muy fuerte' || p.intensityType === 'fuerte'));
  const oopPeaks = peaks.filter((p) => p.wavenumber >= 680 && p.wavenumber <= 860 && (p.intensityType === 'muy fuerte' || p.intensityType === 'fuerte'));
  const halidePeaks = peaks.filter((p) => p.wavenumber >= 500 && p.wavenumber <= 800);

  const notes: string[] = [];
  if (coPeaks.length > 0) {
    notes.push(`fuertes estiramientos C-O a ${coPeaks.map((p) => p.wavenumber + ' cm⁻¹').join(', ')} (confirma alcohol, éster, ácido o éter)`);
  }
  if (oopPeaks.length > 0) {
    notes.push(`intensas señales de flexión C-H fuera del plano (OOP) a ${oopPeaks.map((p) => p.wavenumber + ' cm⁻¹').join(' y ')} diagnósticas de la sustitución del anillo bencénico`);
  }
  if (halidePeaks.length > 0 && spectrum.primaryFunctionalGroup.includes('Haluro')) {
    notes.push(`bandas de enlace C-X a bajas frecuencias (${halidePeaks.map((p) => p.wavenumber + ' cm⁻¹').join(', ')})`);
  }

  fingerObs = notes.length > 0
    ? `En la huella dactilar se aprecian: ${notes.join('; ')}, junto con las deformaciones esqueléticas C-C características de esta molécula.`
    : `Complejo patrón de flexiones C-H y tensiones esqueléticas C-C único para la molécula de ${spectrum.compoundName}.`;

  regions.push({
    zoneName: 'Zona de Huella Dactilar (Fingerprint)',
    range: '1500 - 400 cm⁻¹',
    status: fingerStatus,
    observation: fingerObs,
    keyPeaks: fingerPeaks.slice(0, 4).map((p) => `${p.wavenumber} cm⁻¹`).join(', ') + (fingerPeaks.length > 4 ? ` (+${fingerPeaks.length - 4} más)` : ''),
  });

  // Summary and Diagnostic Deduction
  const formulaInfo = spectrum.chemicalFormula ? `Fórmula: ${spectrum.chemicalFormula}${ihd !== null ? ` (Grado de insaturación IDH = ${ihd})` : ''}` : '';
  const summary = `El espectro IR de ${spectrum.compoundName} exhibe el perfil espectral característico de la familia de ${spectrum.primaryFunctionalGroup}. ${formulaInfo ? formulaInfo + '. ' : ''}${spectrum.notes ? spectrum.notes : 'Muestra una excelente resolución con bandas diagnósticas bien definidas que permiten una identificación molecular concluyente.'}`;

  const diagnosticDeduction = `La concurrencia de ${carbonylPeak ? `la banda intensa de carbonilo C=O a ${carbonylPeak.wavenumber} cm⁻¹` : ''} ${acidOH ? `con la monumental banda O-H de dímero (3300-2500 cm⁻¹)` : alcoholOH ? `con la banda O-H asociada en ${alcoholOH.wavenumber} cm⁻¹` : nitrilePeak ? `con el estiramiento C≡N a ${nitrilePeak.wavenumber} cm⁻¹` : alkyneCH ? `con el estiramiento ≡C-H a ${alkyneCH.wavenumber} cm⁻¹` : 'las señales vibracionales características'} verifica inequívocamente su clasificación en ${spectrum.primaryFunctionalGroup}.`;

  return {
    summary,
    molecularWeight: spectrum.molecularWeight,
    iupacName: spectrum.iupacName || spectrum.compoundName,
    regions,
    diagnosticDeduction,
  };
}
