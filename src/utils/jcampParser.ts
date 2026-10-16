import { SpectrumPoint, SpectrumPeak, ParseResult } from '../types/spectrum';
import { FUNCTIONAL_GROUPS } from '../data/functionalGroups';

/**
 * Parses JCAMP-DX (.jdx, .dx) or tabular text (CSV, TSV, TXT)
 */
export function parseSpectrumFile(fileContent: string, fileName: string): ParseResult {
  const isJcamp =
    fileName.toLowerCase().endsWith('.jdx') ||
    fileName.toLowerCase().endsWith('.dx') ||
    fileContent.includes('##JCAMP-DX') ||
    fileContent.includes('##XYDATA=');

  if (isJcamp) {
    return parseJCAMP(fileContent, fileName);
  } else {
    return parseDelimitedText(fileContent, fileName);
  }
}

/**
 * Parses JCAMP-DX standard spectroscopic files
 */
function parseJCAMP(content: string, fileName: string): ParseResult {
  const lines = content.split(/\r?\n/);
  let title = fileName.replace(/\.[^/.]+$/, '');
  let yUnit: 'transmittance' | 'absorbance' = 'transmittance';
  let instrument = '';
  let resolution = '';
  let notes = '';
  let points: SpectrumPoint[] = [];

  let inXYData = false;
  let xyFormat = '';

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    if (rawLine.startsWith('##TITLE=')) {
      title = rawLine.substring(8).trim() || title;
    } else if (rawLine.startsWith('##YUNITS=')) {
      const unit = rawLine.substring(9).trim().toLowerCase();
      if (unit.includes('absorb') || unit === 'a') {
        yUnit = 'absorbance';
      } else {
        yUnit = 'transmittance';
      }
    } else if (rawLine.startsWith('##SPECTROMETER/DATA SYSTEM=') || rawLine.startsWith('##INSTRUMENT=')) {
      instrument = rawLine.split('=')[1]?.trim() || '';
    } else if (rawLine.startsWith('##RESOLUTION=')) {
      resolution = rawLine.split('=')[1]?.trim() || '';
    } else if (rawLine.startsWith('##COMMENTS=')) {
      notes += (notes ? ' ' : '') + rawLine.substring(11).trim();
    } else if (rawLine.startsWith('##XYDATA=')) {
      inXYData = true;
      xyFormat = rawLine.substring(9).trim();
      continue;
    } else if (rawLine.startsWith('##END=')) {
      inXYData = false;
      break;
    } else if (inXYData && !rawLine.startsWith('##')) {
      // Parse XY lines
      // JCAMP formats: (X++(Y..Y)) or (XY..XY)
      const tokens = rawLine
        .replace(/,/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter(Boolean);

      if (tokens.length >= 2) {
        if (xyFormat.includes('X++(Y..Y)')) {
          const startX = parseFloat(tokens[0]);
          if (!isNaN(startX)) {
            // If deltaX is unknown, approximate from subsequent lines or assume (XY)
            for (let k = 1; k < tokens.length; k++) {
              const val = parseFloat(tokens[k]);
              if (!isNaN(val)) {
                // If it's a series, delta will be computed later or spacing applied
                points.push([startX - (k - 1) * 2, val]);
              }
            }
          }
        } else {
          // Pairs of X Y X Y
          for (let k = 0; k < tokens.length; k += 2) {
            const x = parseFloat(tokens[k]);
            const y = parseFloat(tokens[k + 1]);
            if (!isNaN(x) && !isNaN(y)) {
              points.push([x, y]);
            }
          }
        }
      }
    }
  }

  // Fallback if XY parsing returned few points
  if (points.length < 5) {
    points = parseDelimitedText(content, fileName).points;
  }

  // Normalize points: sort descending by wavenumber (4000 to 400)
  points = normalizeAndDownsamplePoints(points);

  const peaks = detectPeaks(points, yUnit);
  const { primaryGroup, secondaryGroups } = classifyFunctionalGroup(peaks);

  return {
    title,
    compoundName: title.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    yUnit,
    points,
    peaks,
    suggestedFunctionalGroup: primaryGroup,
    suggestedSecondaryGroups: secondaryGroups,
    instrument: instrument || 'Espectrómetro FTIR',
    resolution: resolution || '4 cm⁻¹',
    notes,
  };
}

/**
 * Parses Delimited Text (CSV, TSV, TXT, whitespace-separated)
 */
function parseDelimitedText(content: string, fileName: string): ParseResult {
  const lines = content.split(/\r?\n/);
  const points: SpectrumPoint[] = [];
  let yUnit: 'transmittance' | 'absorbance' = 'transmittance';
  const title = fileName.replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    // Detect header units
    const lower = trimmed.toLowerCase();
    if (lower.includes('absorb')) {
      yUnit = 'absorbance';
      continue;
    }
    if (lower.includes('trans') || lower.includes('%t')) {
      yUnit = 'transmittance';
      continue;
    }
    if (lower.includes('wavenumber') || lower.includes('cm-1') || lower.includes('cm^-1')) {
      continue;
    }

    // Replace comma with dot IF it is decimal format (e.g. 3400,2; 50,4)
    // First test if separated by semicolon or tab
    let parts: string[] = [];
    if (trimmed.includes(';')) {
      parts = trimmed.split(';').map((s) => s.replace(',', '.'));
    } else if (trimmed.includes('\t')) {
      parts = trimmed.split('\t').map((s) => s.replace(',', '.'));
    } else if (trimmed.includes(',')) {
      // Could be comma-separated or comma decimal
      const commas = trimmed.split(',');
      if (commas.length === 2) {
        parts = commas;
      } else {
        // Space separated with decimal comma
        parts = trimmed.split(/\s+/).map((s) => s.replace(',', '.'));
      }
    } else {
      parts = trimmed.split(/\s+/);
    }

    if (parts.length >= 2) {
      const x = parseFloat(parts[0].trim());
      const y = parseFloat(parts[1].trim());
      if (!isNaN(x) && !isNaN(y) && x >= 300 && x <= 5000) {
        points.push([x, y]);
      }
    }
  }

  // Normalize points
  const normalized = normalizeAndDownsamplePoints(points);
  const peaks = detectPeaks(normalized, yUnit);
  const { primaryGroup, secondaryGroups } = classifyFunctionalGroup(peaks);

  return {
    title,
    compoundName: title.replace(/\b\w/g, (l) => l.toUpperCase()),
    yUnit,
    points: normalized,
    peaks,
    suggestedFunctionalGroup: primaryGroup,
    suggestedSecondaryGroups: secondaryGroups,
    instrument: 'FTIR',
    resolution: '4 cm⁻¹',
    notes: 'Importado desde archivo ' + fileName,
  };
}

/**
 * Sorts points by decreasing wavenumber (4000 -> 400 cm^-1 standard),
 * eliminates duplicates and bounds to 4000-400 cm^-1.
 */
export function normalizeAndDownsamplePoints(points: SpectrumPoint[]): SpectrumPoint[] {
  if (points.length === 0) return [];

  // Filter in range 4000 to 400 cm^-1
  const filtered = points.filter(([x]) => x >= 380 && x <= 4200);

  // Sort descending by wavenumber (standard spectroscopy)
  filtered.sort((a, b) => b[0] - a[0]);

  // Remove duplicate wavenumbers within 1 cm^-1
  const deduped: SpectrumPoint[] = [];
  let lastX = -9999;
  for (const pt of filtered) {
    if (Math.abs(pt[0] - lastX) >= 1) {
      deduped.push(pt);
      lastX = pt[0];
    }
  }

  // If too dense (>1600 points), downsample evenly to keep response blazing fast
  if (deduped.length > 1600) {
    const step = Math.ceil(deduped.length / 1200);
    const sampled: SpectrumPoint[] = [];
    for (let i = 0; i < deduped.length; i += step) {
      sampled.push(deduped[i]);
    }
    return sampled;
  }

  return deduped;
}

/**
 * Peak detection algorithm for FTIR spectra
 * For Transmittance: peaks are dips (local minima)
 * For Absorbance: peaks are local maxima
 */
export function detectPeaks(
  points: SpectrumPoint[],
  yUnit: 'transmittance' | 'absorbance' = 'transmittance'
): SpectrumPeak[] {
  if (points.length < 10) return [];

  const rawPeaks: { wavenumber: number; value: number; prominence: number }[] = [];
  const isTransmittance = yUnit === 'transmittance';

  // Window for local extrema
  const win = 4;
  for (let i = win; i < points.length - win; i++) {
    const curVal = points[i][1];
    const curWn = points[i][0];

    // Ignore edges (<450 or >3950) where spectrometer noise is high
    if (curWn < 450 || curWn > 3950) continue;

    let isPeak = true;
    for (let j = 1; j <= win; j++) {
      const leftVal = points[i - j][1];
      const rightVal = points[i + j][1];

      if (isTransmittance) {
        // In %T, peak is a minimum (dip)
        if (curVal > leftVal || curVal > rightVal) {
          isPeak = false;
          break;
        }
      } else {
        // In Absorbance, peak is a maximum
        if (curVal < leftVal || curVal < rightVal) {
          isPeak = false;
          break;
        }
      }
    }

    if (isPeak) {
      // Calculate depth / prominence
      if (isTransmittance) {
        const localBaseline = Math.max(points[i - win][1], points[i + win][1]);
        const prominence = Math.max(0, localBaseline - curVal);
        // Only consider if transmittance dip is noticeable (> 8% drop or T < 80%)
        if (prominence >= 8 || curVal < 70) {
          rawPeaks.push({
            wavenumber: Math.round(curWn),
            value: Math.round(curVal * 10) / 10,
            prominence: Math.round(prominence),
          });
        }
      } else {
        const localBaseline = Math.min(points[i - win][1], points[i + win][1]);
        const prominence = Math.max(0, curVal - localBaseline);
        if (prominence >= 0.1 || curVal > 0.3) {
          rawPeaks.push({
            wavenumber: Math.round(curWn),
            value: Math.round(curVal * 100) / 100,
            prominence: Math.round(prominence * 100),
          });
        }
      }
    }
  }

  // Sort peaks by prominence descending and avoid duplicate peaks within 25 cm^-1
  rawPeaks.sort((a, b) => b.prominence - a.prominence);
  const selected: { wavenumber: number; value: number; prominence: number }[] = [];

  for (const p of rawPeaks) {
    const exists = selected.some((s) => Math.abs(s.wavenumber - p.wavenumber) < 25);
    if (!exists) {
      selected.push(p);
      if (selected.length >= 15) break; // Top 15 diagnostic peaks
    }
  }

  // Sort back by descending wavenumber (spectroscopy reading order)
  selected.sort((a, b) => b.wavenumber - a.wavenumber);

  // Assign intensity type and functional group annotations
  return selected.map((p) => {
    let intensityType: SpectrumPeak['intensityType'] = 'media';
    const intensity = isTransmittance ? Math.max(5, 100 - p.value) : Math.min(100, p.value * 50);

    if (intensity >= 80) intensityType = 'muy fuerte';
    else if (intensity >= 55) intensityType = 'fuerte';
    else if (intensity >= 25) intensityType = 'media';
    else intensityType = 'débil';

    // Broad band check (e.g., O-H stretch around 3300)
    if (p.wavenumber >= 2500 && p.wavenumber <= 3500 && p.prominence > 40) {
      intensityType = 'ancha';
    }

    const { groupName, assignment } = assignPeakToFunctionalGroup(p.wavenumber, intensityType);

    return {
      wavenumber: p.wavenumber,
      value: p.value,
      intensity: Math.round(intensity),
      intensityType,
      functionalGroup: groupName,
      assignment,
    };
  });
}

/**
 * Correlates a specific wavenumber peak with standard FTIR diagnostic tables
 */
export function assignPeakToFunctionalGroup(
  wavenumber: number,
  intensityType: SpectrumPeak['intensityType']
): { groupName: string; assignment: string } {
  // O-H Carboxylic Acid (very broad 3300-2500)
  if (wavenumber >= 2500 && wavenumber <= 3250 && intensityType === 'ancha') {
    return {
      groupName: 'Ácidos Carboxílicos',
      assignment: 'Tensión O-H dímero (puente de hidrógeno fuerte)',
    };
  }

  // O-H Alcohol (3650-3200)
  if (wavenumber >= 3200 && wavenumber <= 3650) {
    if (intensityType === 'ancha' || intensityType === 'muy fuerte' || intensityType === 'fuerte') {
      return { groupName: 'Alcoholes y Fenoles', assignment: 'Tensión O-H intermolecular asociada' };
    }
    return { groupName: 'Aminas', assignment: 'Tensión N-H libre' };
  }

  // ≡C-H Alkyne terminal (3330-3260, sharp)
  if (wavenumber >= 3260 && wavenumber <= 3330 && (intensityType === 'fuerte' || intensityType === 'muy fuerte')) {
    return { groupName: 'Alquinos', assignment: 'Tensión ≡C-H de alquino terminal (sp)' };
  }

  // =C-H Aromatic & Alkene (3100-3000)
  if (wavenumber >= 3000 && wavenumber <= 3150) {
    return {
      groupName: 'Compuestos Aromáticos (Arenos)',
      assignment: 'Tensión =C-H de carbono sp2 (aromático / alqueno)',
    };
  }

  // C-H Aliphatic Alkane (2970-2840)
  if (wavenumber >= 2840 && wavenumber <= 2990) {
    return {
      groupName: 'Alcanos (Hidrocarburos Saturados)',
      assignment: 'Tensión C-H asimétrica y simétrica (sp3)',
    };
  }

  // Aldehyde Fermi resonance (2830-2810 & 2735-2710)
  if ((wavenumber >= 2700 && wavenumber <= 2750) || (wavenumber >= 2800 && wavenumber <= 2840)) {
    return { groupName: 'Aldehídos', assignment: 'Doblete de Fermi C-H de aldehído' };
  }

  // Nitrile C≡N (2260-2220)
  if (wavenumber >= 2210 && wavenumber <= 2270) {
    return { groupName: 'Nitrilos', assignment: 'Tensión C≡N de nitrilo' };
  }

  // Alkyne C≡C (2260-2100)
  if (wavenumber >= 2100 && wavenumber <= 2210) {
    return { groupName: 'Alquinos', assignment: 'Tensión C≡C triple enlace' };
  }

  // Carbonyl Zone (1850-1650 cm^-1)
  if (wavenumber >= 1735 && wavenumber <= 1755) {
    return { groupName: 'Ésteres', assignment: 'Tensión C=O carbonilo de éster alifático' };
  }
  if (wavenumber >= 1720 && wavenumber <= 1735) {
    return { groupName: 'Aldehídos', assignment: 'Tensión C=O carbonilo de aldehído' };
  }
  if (wavenumber >= 1705 && wavenumber <= 1725) {
    return { groupName: 'Cetonas', assignment: 'Tensión C=O carbonilo de cetona' };
  }
  if (wavenumber >= 1690 && wavenumber <= 1715) {
    return { groupName: 'Ácidos Carboxílicos', assignment: 'Tensión C=O de ácido carboxílico' };
  }
  if (wavenumber >= 1640 && wavenumber <= 1690) {
    return { groupName: 'Amidas', assignment: 'Banda Amida I (Tensión C=O de amida)' };
  }

  // C=C Alkene (1680-1620)
  if (wavenumber >= 1620 && wavenumber <= 1660) {
    return { groupName: 'Alquenos', assignment: 'Tensión C=C doble enlace alquénico' };
  }

  // Nitro NO2 asym (1560-1500)
  if (wavenumber >= 1500 && wavenumber <= 1560) {
    return { groupName: 'Compuestos Nitro', assignment: 'Tensión asimétrica de grupo -NO2' };
  }

  // Aromatic ring C=C (1600, 1500, 1450)
  if (
    (wavenumber >= 1580 && wavenumber <= 1615) ||
    (wavenumber >= 1480 && wavenumber <= 1510) ||
    (wavenumber >= 1440 && wavenumber <= 1465)
  ) {
    return { groupName: 'Compuestos Aromáticos (Arenos)', assignment: 'Tensión C=C esqueleto aromático' };
  }

  // Nitro NO2 sym (1370-1320)
  if (wavenumber >= 1320 && wavenumber <= 1370) {
    return { groupName: 'Compuestos Nitro', assignment: 'Tensión simétrica de grupo -NO2' };
  }

  // C-O Stretch / Ether / Ester / Alcohol (1300-1000)
  if (wavenumber >= 1210 && wavenumber <= 1310) {
    return { groupName: 'Ésteres', assignment: 'Tensión C-O asimétrica (acilo)' };
  }
  if (wavenumber >= 1080 && wavenumber <= 1160) {
    return { groupName: 'Éteres', assignment: 'Tensión C-O-C de éter' };
  }
  if (wavenumber >= 1000 && wavenumber <= 1080) {
    return { groupName: 'Alcoholes y Fenoles', assignment: 'Tensión C-O alcohólico' };
  }

  // Out of plane aromatic C-H (900-680)
  if (wavenumber >= 680 && wavenumber <= 770) {
    return {
      groupName: 'Compuestos Aromáticos (Arenos)',
      assignment: 'Flexión fuera del plano C-H aromático (sustitución)',
    };
  }

  // C-Cl Halide (850-550)
  if (wavenumber >= 550 && wavenumber <= 850) {
    return { groupName: 'Haluros de Alquilo (Organohalógenos)', assignment: 'Tensión C-Cl halógeno' };
  }

  return { groupName: 'Huella Dactilar', assignment: 'Vibración de deformación esquelética' };
}

/**
 * Classifies an unknown spectrum into primary and secondary functional groups
 * based on its detected peak pattern
 */
export function classifyFunctionalGroup(peaks: SpectrumPeak[]): {
  primaryGroup: string;
  secondaryGroups: string[];
} {
  const scores: Record<string, number> = {};
  for (const g of FUNCTIONAL_GROUPS) {
    scores[g.name] = 0;
  }

  const wns = peaks.map((p) => p.wavenumber);

  const hasWn = (min: number, max: number) => wns.some((w) => w >= min && w <= max);
  const getPeaksInRange = (min: number, max: number) =>
    peaks.filter((p) => p.wavenumber >= min && p.wavenumber <= max);

  // Check 1: Broad OH + Carbonyl -> Carboxylic acid
  const broadOH = peaks.some(
    (p) => p.wavenumber >= 2500 && p.wavenumber <= 3400 && p.intensityType === 'ancha'
  );
  const hasCarbonyl = hasWn(1650, 1760);

  if (broadOH && hasCarbonyl) {
    scores['Ácidos Carboxílicos'] += 50;
  }

  // Check 2: Alcohol OH (3200-3600) + C-O (1000-1150)
  if (hasWn(3200, 3600) && hasWn(1000, 1150) && !hasCarbonyl) {
    scores['Alcoholes y Fenoles'] += 45;
  }

  // Check 3: Esters (C=O 1735-1750) + (C-O 1180-1280)
  if (hasWn(1730, 1755) && hasWn(1180, 1280)) {
    scores['Ésteres'] += 45;
  }

  // Check 4: Aldehydes (C=O ~1725) + Fermi doublet (2820 & 2720)
  if (hasCarbonyl && (hasWn(2700, 2750) || hasWn(2800, 2840))) {
    scores['Aldehídos'] += 45;
  }

  // Check 5: Ketones (C=O 1705-1725) without OH and without ester C-O
  if (hasWn(1705, 1725) && !broadOH && !hasWn(2700, 2750)) {
    scores['Cetonas'] += 35;
  }

  // Check 6: Amides (Amide I ~1665 and Amide II ~1610, NH 3200-3400)
  if (hasWn(1630, 1690) && hasWn(1530, 1630)) {
    scores['Amidas'] += 45;
  }

  // Check 7: Amines (NH doublet/singlet 3300-3500 and NH bend ~1600, no C=O)
  if (hasWn(3300, 3500) && hasWn(1580, 1640) && !hasCarbonyl) {
    scores['Aminas'] += 40;
  }

  // Check 8: Nitriles (Sharp 2220-2260)
  if (hasWn(2220, 2260)) {
    scores['Nitrilos'] += 50;
  }

  // Check 9: Terminal Alkynes (≡C-H sharp 3300 + C≡C 2120)
  if (hasWn(3280, 3330) && hasWn(2100, 2260)) {
    scores['Alquinos'] += 50;
  }

  // Check 10: Nitro (NO2 asym ~1525 + NO2 sym ~1345)
  if (hasWn(1500, 1555) && hasWn(1330, 1370)) {
    scores['Compuestos Nitro'] += 50;
  }

  // Check 11: Aromatic (C-H > 3000 + ring 1600 & 1500 + OOP 750/700)
  if (hasWn(3000, 3100) && (hasWn(1580, 1610) || hasWn(1480, 1510)) && hasWn(680, 770)) {
    scores['Compuestos Aromáticos (Arenos)'] += 35;
  }

  // Check 12: Alkene (=C-H > 3000 + C=C 1640 + OOP 910/990)
  if (hasWn(3010, 3100) && hasWn(1620, 1680) && !hasWn(1480, 1510)) {
    scores['Alquenos'] += 30;
  }

  // Check 13: Ethers (Strong C-O-C 1080-1150 with no carbonyl and no OH)
  if (hasWn(1080, 1150) && !hasCarbonyl && !hasWn(3200, 3600)) {
    scores['Éteres'] += 30;
  }

  // Add individual peak contributions from assignment
  for (const p of peaks) {
    if (p.functionalGroup && scores[p.functionalGroup] !== undefined) {
      scores[p.functionalGroup] += p.intensityType === 'muy fuerte' ? 5 : 2;
    }
  }

  // Sort scores
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const primaryGroup = sorted[0] && sorted[0][1] > 0 ? sorted[0][0] : 'Alcanos (Hidrocarburos Saturados)';

  const secondaryGroups: string[] = [];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i][1] >= 15 && sorted[i][0] !== primaryGroup) {
      secondaryGroups.push(sorted[i][0]);
    }
  }

  return {
    primaryGroup,
    secondaryGroups: secondaryGroups.slice(0, 2),
  };
}
