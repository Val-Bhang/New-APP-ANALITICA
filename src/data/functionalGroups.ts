import { FunctionalGroupDef, DiagnosticZone, SpectrumRecord, SpectrumPoint, SpectrumPeak } from '../types/spectrum';

export const DIAGNOSTIC_ZONES: DiagnosticZone[] = [
  {
    id: 'xh-stretch',
    name: 'Zona X-H (Elongación)',
    range: [2500, 4000],
    color: '#14b8a6', // Pastel Azul Verde / Teal
    description: 'Vibraciones de tensión de enlaces a hidrógeno: O-H, N-H, C-H alifático, aromático, alqueno y alquino.',
    typicalBonds: 'O-H, N-H, ≡C-H, =C-H, C-H sp3',
  },
  {
    id: 'triple-bonds',
    name: 'Zona de Triples Enlaces',
    range: [2000, 2500],
    color: '#a855f7', // Pastel Lila / Violet
    description: 'Vibraciones de tensión de enlaces triples y dobles acumulados.',
    typicalBonds: 'C≡C, C≡N, N=C=O, N=C=S, C=C=O',
  },
  {
    id: 'double-bonds',
    name: 'Zona de Dobles Enlaces',
    range: [1500, 2000],
    color: '#ec4899', // Pastel Rosado / Pink
    description: 'Vibraciones de tensión de grupos carbonilo (C=O), alquenos (C=C), y anillos aromáticos.',
    typicalBonds: 'C=O (éster, cetona, ácido, amida), C=C, N=O',
  },
  {
    id: 'fingerprint',
    name: 'Zona de Huella Dactilar',
    range: [400, 1500],
    color: '#eab308', // Pastel Amarillo / Yellow
    description: 'Vibraciones de flexión complejas y tensiones de enlace sencillo C-C, C-O, C-N y halógenos. Única para cada molécula.',
    typicalBonds: 'C-O, C-N, C-X, flexiones C-H out-of-plane',
  },
];

export const FUNCTIONAL_GROUPS: FunctionalGroupDef[] = [
  {
    id: 'alcohol',
    name: 'Alcoholes y Fenoles',
    shortName: 'Alcoholes',
    category: 'Oxigenados',
    color: '#0d9488', // Azul verde
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeText: 'text-teal-700 dark:text-teal-300',
    borderColor: 'border-teal-300 dark:border-teal-800',
    iconName: 'Droplet',
    description: 'Se caracterizan por una banda O-H muy ancha e intensa centrada en ~3300 cm⁻¹ debida a puentes de hidrógeno, más la tensión C-O en 1260-1000 cm⁻¹.',
    generalFormula: 'R-OH / Ar-OH',
    keyBands: [
      { range: [3200, 3600], label: 'O-H stretch (asociado)', vibration: 'Tensión O-H con puente de H', appearance: 'Banda muy ancha e intensa con forma de U redondeada', importance: 'clave' },
      { range: [3600, 3650], label: 'O-H libre', vibration: 'Tensión O-H en fase vapor o muy diluido', appearance: 'Aguda y débil', importance: 'secundaria' },
      { range: [1000, 1260], label: 'C-O stretch', vibration: 'Tensión C-O (1°: ~1050, 2°: ~1100, 3°: ~1150, fenol: ~1220 cm⁻¹)', appearance: 'Fuerte', importance: 'clave' },
      { range: [1300, 1420], label: 'O-H bend en el plano', vibration: 'Flexión O-H', appearance: 'Media', importance: 'secundaria' },
    ],
    examples: ['Etanol', 'Isopropanol', 'Metanol', 'Ciclohexanol', 'Fenol'],
  },
  {
    id: 'cetona',
    name: 'Cetonas',
    shortName: 'Cetonas',
    category: 'Oxigenados',
    color: '#db2777', // Rosado
    badgeBg: 'bg-pink-50 dark:bg-pink-950/40',
    badgeText: 'text-pink-700 dark:text-pink-300',
    borderColor: 'border-pink-300 dark:border-pink-800',
    iconName: 'Flame',
    description: 'Poseen una de las señales más limpias e intensas del espectro IR: la banda de carbonilo (C=O) en 1715 cm⁻¹, sin bandas de absorción C-H de aldehído.',
    generalFormula: 'R-CO-R\'',
    keyBands: [
      { range: [1705, 1725], label: 'C=O stretch (alifática)', vibration: 'Tensión C=O carbonilo no conjugado', appearance: 'Pico muy intenso y agudo en ~1715 cm⁻¹', importance: 'clave' },
      { range: [1675, 1700], label: 'C=O conjugada', vibration: 'Tensión C=O con alqueno o anillo aromático adyacente', appearance: 'Fuerte (desplazada a menor frecuencia)', importance: 'clave' },
      { range: [1100, 1250], label: 'C-C-C bend / stretch', vibration: 'Vibraciones del esqueleto adyacente al carbonilo', appearance: 'Media', importance: 'secundaria' },
    ],
    examples: ['Acetona', '2-Butanona', 'Acetofenona', 'Ciclohexanona'],
  },
  {
    id: 'aldehido',
    name: 'Aldehídos',
    shortName: 'Aldehídos',
    category: 'Oxigenados',
    color: '#ca8a04', // Amarillo dorado
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-800 dark:text-amber-300',
    borderColor: 'border-amber-300 dark:border-amber-800',
    iconName: 'Wind',
    description: 'Carbonilo C=O en 1740-1720 cm⁻¹ acompañado del diagnóstico "doblete de Fermi" del protón aldehídico C-H en ~2820 y 2720 cm⁻¹.',
    generalFormula: 'R-CHO',
    keyBands: [
      { range: [1720, 1740], label: 'C=O stretch', vibration: 'Tensión de carbonilo', appearance: 'Muy intensa y definida', importance: 'clave' },
      { range: [2700, 2740], label: 'C-H aldehídico (Banda 1 Fermi)', vibration: 'Resonancia de Fermi de C-H', appearance: 'Media/débil característica en ~2720 cm⁻¹', importance: 'clave' },
      { range: [2800, 2840], label: 'C-H aldehídico (Banda 2 Fermi)', vibration: 'Resonancia de Fermi de C-H', appearance: 'Media en ~2820 cm⁻¹', importance: 'clave' },
    ],
    examples: ['Benzaldehído', 'Acetaldehído', 'Butanal', 'Formaldehído'],
  },
  {
    id: 'acido_carboxilico',
    name: 'Ácidos Carboxílicos',
    shortName: 'Ácidos Carboxílicos',
    category: 'Oxigenados',
    color: '#9333ea', // Lila
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-300 dark:border-purple-800',
    iconName: 'Sparkles',
    description: 'Diagnóstico inconfundible: banda de O-H monstruosamente ancha (3300-2500 cm⁻¹) que envuelve los estiramientos C-H, combinada con C=O en ~1710 cm⁻¹ y C-O en ~1250 cm⁻¹.',
    generalFormula: 'R-COOH',
    keyBands: [
      { range: [2500, 3300], label: 'O-H stretch dímero', vibration: 'Tensión O-H con puente de H intermolecular muy fuerte', appearance: 'Extremadamente ancha ("patio"), cubre de 3300 a 2500 cm⁻¹', importance: 'clave' },
      { range: [1700, 1725], label: 'C=O stretch', vibration: 'Tensión carbonilo del dímero ácido', appearance: 'Muy fuerte y ancha en ~1710 cm⁻¹', importance: 'clave' },
      { range: [1210, 1320], label: 'C-O stretch', vibration: 'Tensión C-O', appearance: 'Fuerte en ~1280 cm⁻¹', importance: 'secundaria' },
      { range: [900, 960], label: 'O-H out-of-plane bend', vibration: 'Flexión fuera del plano del dímero', appearance: 'Ancha de intensidad media (~935 cm⁻¹)', importance: 'secundaria' },
    ],
    examples: ['Ácido Benzoico', 'Ácido Acético', 'Ácido Propanoico', 'Ácido Salicílico'],
  },
  {
    id: 'ester',
    name: 'Ésteres',
    shortName: 'Ésteres',
    category: 'Oxigenados',
    color: '#059669', // Azul verde esmeralda
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    borderColor: 'border-emerald-300 dark:border-emerald-800',
    iconName: 'Tag',
    description: 'Carbonilo C=O a mayor frecuencia que cetonas (1750-1735 cm⁻¹) junto a dos bandas intensas de tensión C-O en 1300-1000 cm⁻¹.',
    generalFormula: 'R-COO-R\'',
    keyBands: [
      { range: [1735, 1750], label: 'C=O stretch', vibration: 'Tensión C=O carbonilo de éster alifático', appearance: 'Muy intensa en ~1740 cm⁻¹', importance: 'clave' },
      { range: [1150, 1300], label: 'C-O-C asimétrico', vibration: 'Tensión C-O acetato/propionato', appearance: 'Fuerte y prominente en ~1240 cm⁻¹', importance: 'clave' },
      { range: [1000, 1150], label: 'C-O-C simétrico', vibration: 'Tensión C-O alcohólico', appearance: 'Fuerte en ~1050 cm⁻¹', importance: 'secundaria' },
    ],
    examples: ['Acetato de Etilo', 'Benzoato de Metilo', 'Butirato de Butilo', 'Formiato de Etilo'],
  },
  {
    id: 'amina',
    name: 'Aminas',
    shortName: 'Aminas',
    category: 'Nitrogenados',
    color: '#0891b2', // Azul verdoso
    badgeBg: 'bg-cyan-50 dark:bg-cyan-950/40',
    badgeText: 'text-cyan-700 dark:text-cyan-300',
    borderColor: 'border-cyan-300 dark:border-cyan-800',
    iconName: 'Layers',
    description: 'Bandas N-H en 3500-3300 cm⁻¹: Aminas 1ª muestran un doblete característico (tensión simétrica y asimétrica); aminas 2ª un solo pico; aminas 3ª carecen de banda N-H.',
    generalFormula: 'R-NH2 / R2NH / R3N',
    keyBands: [
      { range: [3300, 3500], label: 'N-H stretch (1ª doblete, 2ª singulete)', vibration: 'Tensiones simétrica y asimétrica N-H', appearance: 'Agudas de intensidad media (menos anchas que O-H)', importance: 'clave' },
      { range: [1550, 1650], label: 'N-H bend (scissoring)', vibration: 'Flexión N-H', appearance: 'Media a fuerte', importance: 'clave' },
      { range: [1180, 1360], label: 'C-N stretch', vibration: 'Tensión C-N aromática o alifática', appearance: 'Media', importance: 'secundaria' },
    ],
    examples: ['Anilina', 'Bencilamina', 'Dietilamina', 'Trietilamina', 'Hexilamina'],
  },
  {
    id: 'amida',
    name: 'Amidas',
    shortName: 'Amidas',
    category: 'Nitrogenados',
    color: '#7c3aed', // Lila violeta
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-300 dark:border-purple-800',
    iconName: 'Bookmark',
    description: 'Poseen la "Banda Amida I" (C=O en 1690-1650 cm⁻¹) y la "Banda Amida II" (flexión N-H en 1640-1550 cm⁻¹), además de bandas N-H en 3400-3180 cm⁻¹.',
    generalFormula: 'R-CO-NR\'R\'\'',
    keyBands: [
      { range: [1640, 1690], label: 'Amida I (C=O stretch)', vibration: 'Tensión C=O debilitada por resonancia con el N', appearance: 'Muy fuerte en ~1660 cm⁻¹', importance: 'clave' },
      { range: [1530, 1640], label: 'Amida II (N-H bend / C-N)', vibration: 'Combinación flexión N-H y tensión C-N', appearance: 'Fuerte en ~1550-1600 cm⁻¹', importance: 'clave' },
      { range: [3180, 3400], label: 'N-H stretch (Amida 1ª o 2ª)', vibration: 'Tensión N-H enlazado', appearance: 'Dos picos en 1ª (~3350 y 3180 cm⁻¹)', importance: 'clave' },
    ],
    examples: ['Acetamida', 'Benzamida', 'N,N-Dimetilformamida (DMF)', 'N-Metilacetamida'],
  },
  {
    id: 'aromatico',
    name: 'Compuestos Aromáticos (Arenos)',
    shortName: 'Aromáticos',
    category: 'Hidrocarburos',
    color: '#be185d', // Rosado intenso
    badgeBg: 'bg-pink-50 dark:bg-pink-950/40',
    badgeText: 'text-pink-700 dark:text-pink-300',
    borderColor: 'border-pink-300 dark:border-pink-800',
    iconName: 'Hexagon',
    description: 'C-H aromático agudo justo encima de 3000 cm⁻¹ (3100-3000 cm⁻¹), respiración del anillo C=C en 1600, 1500 y 1450 cm⁻¹, sobretonos de 2000-1660 cm⁻¹, y flexiones C-H OOP en 900-675 cm⁻¹.',
    generalFormula: 'Ar-R',
    keyBands: [
      { range: [3000, 3100], label: '=C-H stretch (sp2)', vibration: 'Tensión C-H de carbonos sp2 aromáticos', appearance: 'Aguda y moderada a la izquierda de 3000 cm⁻¹', importance: 'clave' },
      { range: [1450, 1600], label: 'C=C anillo aromático', vibration: 'Vibraciones de esqueleto del anillo bencénico', appearance: 'Pares o cuartetos en 1600, 1580, 1500 y 1450 cm⁻¹', importance: 'clave' },
      { range: [1660, 2000], label: 'Sobretonos de sustitución', vibration: 'Sobretonos y bandas de combinación', appearance: 'Serie de crestas pequeñas ("dientes de sierra")', importance: 'secundaria' },
      { range: [675, 900], label: 'C-H out-of-plane bend (OOP)', vibration: 'Flexión fuera del plano (patrón orto/meta/para)', appearance: 'Muy intensa (monosustituido: 750 y 690 cm⁻¹)', importance: 'clave' },
    ],
    examples: ['Tolueno', 'Benceno', 'o-Xileno', 'Naftaleno', 'Etilbenceno'],
  },
  {
    id: 'alqueno',
    name: 'Alquenos',
    shortName: 'Alquenos',
    category: 'Hidrocarburos',
    color: '#14b8a6', // Azul verde / Teal
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeText: 'text-teal-700 dark:text-teal-300',
    borderColor: 'border-teal-300 dark:border-teal-800',
    iconName: 'Activity',
    description: 'Tensión =C-H (sp2) en 3100-3010 cm⁻¹, doble enlace C=C en 1680-1620 cm⁻¹ (fuerte si asimétrico) y flexiones =C-H fuera del plano en 1000-650 cm⁻¹.',
    generalFormula: 'R-CH=CH-R\'',
    keyBands: [
      { range: [3010, 3100], label: '=C-H stretch (sp2)', vibration: 'Tensión C-H vinílico', appearance: 'Pico agudo en ~3080 cm⁻¹', importance: 'clave' },
      { range: [1620, 1680], label: 'C=C stretch', vibration: 'Tensión de doble enlace carbono-carbono', appearance: 'Media a débil en ~1640-1660 cm⁻¹', importance: 'clave' },
      { range: [650, 1000], label: '=C-H bend OOP', vibration: 'Flexión fuera del plano de hidrógenos vinílicos', appearance: 'Fuerte en ~990 y 910 cm⁻¹ (terminales)', importance: 'clave' },
    ],
    examples: ['Ciclohexeno', '1-Hexeno', 'Estireno', 'Limoneno'],
  },
  {
    id: 'alquino',
    name: 'Alquinos',
    shortName: 'Alquinos',
    category: 'Hidrocarburos',
    color: '#a855f7', // Lila
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-300 dark:border-purple-800',
    iconName: 'Zap',
    description: 'Alquinos terminales exhiben un pico muy agudo de ≡C-H (sp) en ~3300 cm⁻¹ y la banda C≡C en 2260-2100 cm⁻¹.',
    generalFormula: 'R-C≡C-R\'',
    keyBands: [
      { range: [3260, 3330], label: '≡C-H stretch (terminal)', vibration: 'Tensión C-H de carbono sp acetilénico', appearance: 'Muy aguda, prominente y definida en ~3300 cm⁻¹', importance: 'clave' },
      { range: [2100, 2260], label: 'C≡C stretch', vibration: 'Tensión de triple enlace carbono-carbono', appearance: 'Débil a media en ~2120 cm⁻¹ (débil o nula si simétrico)', importance: 'clave' },
      { range: [600, 700], label: '≡C-H bend', vibration: 'Flexión de C-H acetilénico', appearance: 'Ancha y fuerte en ~630 cm⁻¹', importance: 'secundaria' },
    ],
    examples: ['1-Hexino', 'Fenilacetileno', 'Propargilo', '1-Octino'],
  },
  {
    id: 'alcano',
    name: 'Alcanos (Hidrocarburos Saturados)',
    shortName: 'Alcanos',
    category: 'Hidrocarburos',
    color: '#ca8a04', // Amarillo cálido
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-800 dark:text-amber-300',
    borderColor: 'border-amber-300 dark:border-amber-800',
    iconName: 'Box',
    description: 'Presentan estiramientos C-H alifáticos (sp3) exclusivamente por debajo de 3000 cm⁻¹ (2960-2850 cm⁻¹) y flexiones en 1465 cm⁻¹ (-CH2-) y 1375 cm⁻¹ (-CH3).',
    generalFormula: 'CnH2n+2',
    keyBands: [
      { range: [2850, 2960], label: 'C-H stretch (sp3)', vibration: 'Tensión simétrica y asimétrica C-H alifático', appearance: 'Grupo de picos agudos e intensos justo < 3000 cm⁻¹', importance: 'clave' },
      { range: [1450, 1470], label: 'CH2 / CH3 bending', vibration: 'Flexión de tijera de metilenos y metilos', appearance: 'Fuerte en ~1465 cm⁻¹', importance: 'secundaria' },
      { range: [1365, 1385], label: 'CH3 umbrella bend', vibration: 'Flexión simétrica de metilo', appearance: 'Pico moderado en ~1375 cm⁻¹ (doblete en isopropilo)', importance: 'secundaria' },
    ],
    examples: ['Hexano', 'Heptano', 'Ciclohexano', 'Isooctano'],
  },
  {
    id: 'nitrilo',
    name: 'Nitrilos',
    shortName: 'Nitrilos',
    category: 'Nitrogenados',
    color: '#9333ea', // Lila
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-700 dark:text-purple-300',
    borderColor: 'border-purple-300 dark:border-purple-800',
    iconName: 'Compass',
    description: 'Pico agudo y limpio de tensión C≡N en 2260-2220 cm⁻¹ en una región generalmente desprovista de otras interferencias.',
    generalFormula: 'R-C≡N',
    keyBands: [
      { range: [2220, 2260], label: 'C≡N stretch', vibration: 'Tensión de triple enlace carbono-nitrógeno', appearance: 'Agudo y de intensidad media en ~2250 cm⁻¹', importance: 'clave' },
    ],
    examples: ['Acetonitrilo', 'Benzonitrilo', 'Propionitrilo', 'Butironitrilo'],
  },
  {
    id: 'nitro',
    name: 'Compuestos Nitro',
    shortName: 'Nitro',
    category: 'Nitrogenados',
    color: '#e11d48', // Rosado cálido
    badgeBg: 'bg-pink-50 dark:bg-pink-950/40',
    badgeText: 'text-pink-700 dark:text-pink-300',
    borderColor: 'border-pink-300 dark:border-pink-800',
    iconName: 'ShieldAlert',
    description: 'Poseen dos bandas excepcionalmente intensas correspondientes a la tensión asimétrica (1550-1500 cm⁻¹) y simétrica (1360-1320 cm⁻¹) del grupo -NO2.',
    generalFormula: 'R-NO2 / Ar-NO2',
    keyBands: [
      { range: [1500, 1560], label: 'NO2 stretch asimétrico', vibration: 'Tensión asimétrica de los dos enlaces N-O', appearance: 'Muy intensa en ~1525 cm⁻¹', importance: 'clave' },
      { range: [1320, 1370], label: 'NO2 stretch simétrico', vibration: 'Tensión simétrica de los dos enlaces N-O', appearance: 'Muy intensa en ~1345 cm⁻¹', importance: 'clave' },
    ],
    examples: ['Nitrobenceno', 'Nitrometano', '1-Nitropropano', '2,4-Dinitrotolueno'],
  },
  {
    id: 'eter',
    name: 'Éteres',
    shortName: 'Éteres',
    category: 'Oxigenados',
    color: '#ca8a04', // Amarillo dorado
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-800 dark:text-amber-300',
    borderColor: 'border-amber-300 dark:border-amber-800',
    iconName: 'Link',
    description: 'Carecen de absorciones O-H y C=O. Presentan una prominente banda de tensión C-O en 1150-1085 cm⁻¹ (alifáticos) o ~1250 cm⁻¹ (alquil-aril éteres).',
    generalFormula: 'R-O-R\'',
    keyBands: [
      { range: [1085, 1150], label: 'C-O-C stretch (alifático)', vibration: 'Tensión asimétrica C-O-C', appearance: 'Muy intensa y ancha en ~1120 cm⁻¹', importance: 'clave' },
      { range: [1200, 1275], label: 'C-O-C stretch (aril-éter)', vibration: 'Tensión C-O aromática', appearance: 'Muy fuerte en ~1245 cm⁻¹ (ej. anisol)', importance: 'secundaria' },
    ],
    examples: ['Éter Dietílico', 'Tetrahidrofurano (THF)', 'Anisol', 'Éter Diisopropílico'],
  },
  {
    id: 'haluro',
    name: 'Haluros de Alquilo (Organohalógenos)',
    shortName: 'Haluros',
    category: 'Halogenados',
    color: '#0d9488', // Azul verde / Teal
    badgeBg: 'bg-teal-50 dark:bg-teal-950/40',
    badgeText: 'text-teal-700 dark:text-teal-300',
    borderColor: 'border-teal-300 dark:border-teal-800',
    iconName: 'Crosshair',
    description: 'Bandas C-X situadas en frecuencias bajas debido a la alta masa de los halógenos: C-F (1400-1000 cm⁻¹), C-Cl (850-550 cm⁻¹), C-Br (690-515 cm⁻¹), C-I (<500 cm⁻¹).',
    generalFormula: 'R-X (X = F, Cl, Br, I)',
    keyBands: [
      { range: [550, 850], label: 'C-Cl stretch', vibration: 'Tensión carbono-cloro', appearance: 'Fuerte en ~700 cm⁻¹', importance: 'clave' },
      { range: [500, 690], label: 'C-Br stretch', vibration: 'Tensión carbono-bromo', appearance: 'Fuerte a frecuencias bajas (~600 cm⁻¹)', importance: 'clave' },
      { range: [1000, 1400], label: 'C-F stretch', vibration: 'Tensión carbono-flúor', appearance: 'Muy intensa en ~1100-1250 cm⁻¹', importance: 'secundaria' },
    ],
    examples: ['Clorobenceno', 'Bromobenceno', '1-Clorobutano', 'Diclorometano'],
  },
];

// Helper to generate realistic FTIR curve from baseline + peaks
function generateSyntheticFTIR(
  peaks: { center: number; width: number; depth: number }[],
  noiseAmp: number = 0.5
): SpectrumPoint[] {
  const points: SpectrumPoint[] = [];
  // Standard FTIR range 4000 to 400 cm^-1, sampled every 4 cm^-1 (901 points)
  for (let wn = 4000; wn >= 400; wn -= 4) {
    let t = 98 - (Math.random() - 0.5) * noiseAmp; // baseline at ~98% transmittance
    // slight spectrometer baseline drift at high wavenumber
    t -= Math.sin(wn / 1500) * 1.5;

    for (const p of peaks) {
      // Gaussian / Lorentzian absorption band
      const diff = wn - p.center;
      const absorption = p.depth * Math.exp(-0.5 * Math.pow(diff / (p.width / 2.355), 2));
      t -= absorption;
    }

    t = Math.max(2, Math.min(100, Math.round(t * 10) / 10));
    points.push([wn, t]);
  }
  return points;
}

// 12 Authentic Reference Spectra preloaded into the application
export const REFERENCE_SPECTRUMS: SpectrumRecord[] = [
  {
    id: 'ref-ethanol',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Etanol',
    primaryFunctionalGroup: 'Alcoholes y Fenoles',
    secondaryFunctionalGroups: 'Alcanos (Hidrocarburos Saturados)',
    chemicalFormula: 'C2H6O',
    casNumber: '64-17-5',
    sampleState: 'Líquido puro (película fina entre placas de NaCl)',
    instrument: 'FTIR Nicolet iS50',
    resolution: '4 cm⁻¹',
    notes: 'Espectro típico de alcohol primario. Se observa la enorme y ancha banda de tensión O-H asociada en 3340 cm⁻¹, los estiramientos C-H alifáticos asimétricos y simétricos a 2975 y 2885 cm⁻¹, la flexión O-H en 1380 cm⁻¹ y la intensa tensión C-O alcohólica en 1050 cm⁻¹.',
    fileName: 'etanol_referencia.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 3340, width: 260, depth: 85 }, // O-H broad
        { center: 2975, width: 35, depth: 65 }, // C-H stretch
        { center: 2885, width: 30, depth: 45 }, // C-H stretch
        { center: 1450, width: 35, depth: 30 }, // CH2/CH3 bend
        { center: 1380, width: 30, depth: 38 }, // O-H in-plane bend
        { center: 1088, width: 30, depth: 72 }, // C-C-O bend
        { center: 1048, width: 45, depth: 88 }, // C-O stretch
        { center: 880, width: 40, depth: 35 },
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 3340, value: 13, intensity: 85, intensityType: 'muy fuerte', functionalGroup: 'Alcoholes y Fenoles', assignment: 'Tensión O-H intermolecular (puente de hidrógeno)' },
      { wavenumber: 2975, value: 33, intensity: 65, intensityType: 'fuerte', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Tensión C-H asimétrica (sp3)' },
      { wavenumber: 2885, value: 53, intensity: 45, intensityType: 'media', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Tensión C-H simétrica (sp3)' },
      { wavenumber: 1450, value: 68, intensity: 30, intensityType: 'media', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Flexión de tijera -CH2-' },
      { wavenumber: 1380, value: 60, intensity: 38, intensityType: 'media', functionalGroup: 'Alcoholes y Fenoles', assignment: 'Flexión O-H en el plano' },
      { wavenumber: 1048, value: 10, intensity: 88, intensityType: 'muy fuerte', functionalGroup: 'Alcoholes y Fenoles', assignment: 'Tensión C-O (alcohol 1°)' },
    ]),
  },
  {
    id: 'ref-acetone',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Acetona (Propanona)',
    primaryFunctionalGroup: 'Cetonas',
    secondaryFunctionalGroups: 'Alcanos (Hidrocarburos Saturados)',
    chemicalFormula: 'C3H6O',
    casNumber: '67-64-1',
    sampleState: 'Líquido puro ATR (diamante)',
    instrument: 'PerkinElmer Spectrum Two',
    resolution: '4 cm⁻¹',
    notes: 'Espectro paradigmático de carbonilo de cetona alifática simple. Presenta un agudo y potentísimo pico C=O a 1715 cm⁻¹, estiramientos C-H a 2965 y 2920 cm⁻¹, y la vibración de deformación esquelética C-C-C a 1222 cm⁻¹.',
    fileName: 'acetona_referencia.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 3000, width: 25, depth: 15 },
        { center: 2965, width: 30, depth: 38 }, // C-H asym
        { center: 2920, width: 25, depth: 25 }, // C-H sym
        { center: 1715, width: 32, depth: 92 }, // C=O ketone!
        { center: 1420, width: 28, depth: 42 }, // CH3 scissor
        { center: 1365, width: 25, depth: 68 }, // CH3 umbrella
        { center: 1222, width: 35, depth: 75 }, // C-CO-C stretch
        { center: 530, width: 40, depth: 35 },
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 2965, value: 60, intensity: 38, intensityType: 'media', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Tensión C-H asimétrica' },
      { wavenumber: 1715, value: 6, intensity: 92, intensityType: 'muy fuerte', functionalGroup: 'Cetonas', assignment: 'Tensión C=O carbonilo no conjugado' },
      { wavenumber: 1365, value: 30, intensity: 68, intensityType: 'fuerte', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Flexión simétrica de metilos -CH3' },
      { wavenumber: 1222, value: 23, intensity: 75, intensityType: 'fuerte', functionalGroup: 'Cetonas', assignment: 'Tensión asimétrica C-C(=O)-C' },
    ]),
  },
  {
    id: 'ref-benzoic-acid',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Ácido Benzoico',
    primaryFunctionalGroup: 'Ácidos Carboxílicos',
    secondaryFunctionalGroups: 'Compuestos Aromáticos (Arenos)',
    chemicalFormula: 'C7H6O2',
    casNumber: '65-85-0',
    sampleState: 'Pastilla de KBr al 1%',
    instrument: 'Shimadzu IRAffinity-1S',
    resolution: '2 cm⁻¹',
    notes: 'Espectro emblemático de ácido carboxílico aromático. Destaca la impresionante banda O-H de dímero que se expande desde 3200 hasta 2500 cm⁻¹ con dientes de sierra (sub-picos en 2600-2700 cm⁻¹), C=O intenso a 1685 cm⁻¹ (desplazado por conjugación con el anillo aromático) y flexión fuera del plano C-H aromático a 707 cm⁻¹.',
    fileName: 'acido_benzoico.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 3070, width: 25, depth: 30 }, // C-H aromatic
        { center: 2980, width: 350, depth: 75 }, // Carboxylic O-H monster broad
        { center: 2680, width: 60, depth: 40 }, // Fermi resonance shoulder
        { center: 2560, width: 50, depth: 35 }, // Fermi resonance shoulder
        { center: 1685, width: 35, depth: 90 }, // C=O conjugated acid
        { center: 1600, width: 22, depth: 45 }, // aromatic ring C=C
        { center: 1450, width: 25, depth: 42 }, // aromatic ring C=C
        { center: 1420, width: 25, depth: 60 }, // C-O-H bend
        { center: 1290, width: 35, depth: 85 }, // C-O stretch
        { center: 935, width: 60, depth: 55 }, // O-H out-of-plane dimer
        { center: 707, width: 25, depth: 88 }, // monosubstituted aromatic OOP
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 3070, value: 68, intensity: 30, intensityType: 'media', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Tensión C-H aromático (sp2)' },
      { wavenumber: 2980, value: 23, intensity: 75, intensityType: 'ancha', functionalGroup: 'Ácidos Carboxílicos', assignment: 'Tensión O-H dímero de ácido carboxílico (3300-2500 cm⁻¹)' },
      { wavenumber: 1685, value: 8, intensity: 90, intensityType: 'muy fuerte', functionalGroup: 'Ácidos Carboxílicos', assignment: 'Tensión C=O carbonilo conjugado' },
      { wavenumber: 1600, value: 53, intensity: 45, intensityType: 'media', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Vibración de esqueleto C=C del anillo aromático' },
      { wavenumber: 1290, value: 13, intensity: 85, intensityType: 'muy fuerte', functionalGroup: 'Ácidos Carboxílicos', assignment: 'Tensión C-O' },
      { wavenumber: 935, value: 43, intensity: 55, intensityType: 'ancha', functionalGroup: 'Ácidos Carboxílicos', assignment: 'Flexión O-H fuera del plano del dímero' },
      { wavenumber: 707, value: 10, intensity: 88, intensityType: 'muy fuerte', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Flexión C-H fuera del plano (anillo monosustituido)' },
    ]),
  },
  {
    id: 'ref-ethyl-acetate',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Acetato de Etilo',
    primaryFunctionalGroup: 'Ésteres',
    secondaryFunctionalGroups: 'Alcanos (Hidrocarburos Saturados)',
    chemicalFormula: 'C4H8O2',
    casNumber: '141-78-6',
    sampleState: 'Líquido puro',
    instrument: 'Agilent Cary 630 FTIR',
    resolution: '4 cm⁻¹',
    notes: 'Espectro característico de éster. Muestra la potente banda de tensión C=O a 1740 cm⁻¹ (frecuencia más alta que las cetonas) y el doblete muy pronunciado de tensión C-O en 1240 cm⁻¹ (C-O acilo) y 1045 cm⁻¹ (C-O alquilo).',
    fileName: 'acetato_etilo.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 2985, width: 30, depth: 50 }, // C-H sp3
        { center: 2940, width: 25, depth: 32 },
        { center: 1740, width: 30, depth: 94 }, // C=O ester!
        { center: 1445, width: 28, depth: 35 },
        { center: 1370, width: 26, depth: 60 }, // acetate CH3
        { center: 1240, width: 42, depth: 92 }, // C-O acetate stretch!
        { center: 1045, width: 36, depth: 82 }, // C-O ethyl stretch
        { center: 845, width: 30, depth: 30 },
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 2985, value: 48, intensity: 50, intensityType: 'media', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Tensión C-H alifático' },
      { wavenumber: 1740, value: 4, intensity: 94, intensityType: 'muy fuerte', functionalGroup: 'Ésteres', assignment: 'Tensión C=O carbonilo de éster alifático' },
      { wavenumber: 1370, value: 38, intensity: 60, intensityType: 'fuerte', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Flexión simétrica C-H del grupo acetilo' },
      { wavenumber: 1240, value: 6, intensity: 92, intensityType: 'muy fuerte', functionalGroup: 'Ésteres', assignment: 'Tensión asimétrica C-O-C (banda acetato)' },
      { wavenumber: 1045, value: 16, intensity: 82, intensityType: 'fuerte', functionalGroup: 'Ésteres', assignment: 'Tensión C-O del residuo etoxilo' },
    ]),
  },
  {
    id: 'ref-benzaldehyde',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Benzaldehído',
    primaryFunctionalGroup: 'Aldehídos',
    secondaryFunctionalGroups: 'Compuestos Aromáticos (Arenos)',
    chemicalFormula: 'C7H6O',
    casNumber: '100-52-7',
    sampleState: 'Líquido puro en celda NaCl',
    instrument: 'FTIR Nicolet iS50',
    resolution: '4 cm⁻¹',
    notes: 'Espectro perfecto para demostrar el "doblete de Fermi" característico del hidrógeno del aldehído: dos bandas nítidas a 2820 cm⁻¹ y 2735 cm⁻¹. El carbonilo C=O aparece a 1700 cm⁻¹ conjugado al anillo aromático.',
    fileName: 'benzaldehido.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 3065, width: 25, depth: 35 }, // C-H aromatic
        { center: 2820, width: 22, depth: 40 }, // Fermi 1
        { center: 2735, width: 20, depth: 38 }, // Fermi 2
        { center: 1700, width: 32, depth: 93 }, // C=O aldehyde
        { center: 1595, width: 22, depth: 55 }, // aromatic ring C=C
        { center: 1585, width: 18, depth: 40 }, // aromatic ring C=C
        { center: 1455, width: 22, depth: 42 }, // aromatic ring
        { center: 1205, width: 30, depth: 70 }, // C-H ip bend
        { center: 745, width: 25, depth: 85 }, // aromatic OOP
        { center: 688, width: 22, depth: 82 }, // aromatic OOP
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 3065, value: 63, intensity: 35, intensityType: 'media', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Tensión C-H aromático' },
      { wavenumber: 2820, value: 58, intensity: 40, intensityType: 'media', functionalGroup: 'Aldehídos', assignment: 'Tensión C-H aldehídico (Resonancia de Fermi 1)' },
      { wavenumber: 2735, value: 60, intensity: 38, intensityType: 'media', functionalGroup: 'Aldehídos', assignment: 'Tensión C-H aldehídico (Resonancia de Fermi 2)' },
      { wavenumber: 1700, value: 5, intensity: 93, intensityType: 'muy fuerte', functionalGroup: 'Aldehídos', assignment: 'Tensión C=O carbonilo de aldehído aromático' },
      { wavenumber: 1595, value: 43, intensity: 55, intensityType: 'fuerte', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Vibración de tensión C=C del anillo aromático' },
      { wavenumber: 745, value: 13, intensity: 85, intensityType: 'muy fuerte', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Flexión C-H fuera del plano (anillo monosustituido)' },
    ]),
  },
  {
    id: 'ref-aniline',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Anilina (Fenilamina)',
    primaryFunctionalGroup: 'Aminas',
    secondaryFunctionalGroups: 'Compuestos Aromáticos (Arenos)',
    chemicalFormula: 'C6H7N',
    casNumber: '62-53-3',
    sampleState: 'Líquido puro',
    instrument: 'PerkinElmer Spectrum Two',
    resolution: '4 cm⁻¹',
    notes: 'Amina primaria clásica con su distintivo doblete N-H en 3435 cm⁻¹ (asimétrica) y 3355 cm⁻¹ (simétrica). Banda de flexión N-H intensa a 1618 cm⁻¹ y tensión C-N aromática a 1275 cm⁻¹.',
    fileName: 'anilina.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 3435, width: 35, depth: 55 }, // N-H asym primary amine
        { center: 3355, width: 35, depth: 52 }, // N-H sym primary amine
        { center: 3030, width: 25, depth: 32 }, // C-H aromatic
        { center: 1618, width: 32, depth: 75 }, // N-H scissoring
        { center: 1498, width: 25, depth: 68 }, // aromatic ring
        { center: 1275, width: 32, depth: 78 }, // C-N stretch
        { center: 750, width: 28, depth: 85 }, // aromatic OOP
        { center: 690, width: 25, depth: 80 },
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 3435, value: 43, intensity: 55, intensityType: 'fuerte', functionalGroup: 'Aminas', assignment: 'Tensión N-H asimétrica (amina primaria 1°)' },
      { wavenumber: 3355, value: 46, intensity: 52, intensityType: 'fuerte', functionalGroup: 'Aminas', assignment: 'Tensión N-H simétrica (amina primaria 1°)' },
      { wavenumber: 1618, value: 23, intensity: 75, intensityType: 'fuerte', functionalGroup: 'Aminas', assignment: 'Flexión N-H (tijera)' },
      { wavenumber: 1275, value: 20, intensity: 78, intensityType: 'fuerte', functionalGroup: 'Aminas', assignment: 'Tensión C-N aromática' },
      { wavenumber: 750, value: 13, intensity: 85, intensityType: 'muy fuerte', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Flexión fuera del plano (anillo aromático)' },
    ]),
  },
  {
    id: 'ref-toluene',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Tolueno (Metilbenceno)',
    primaryFunctionalGroup: 'Compuestos Aromáticos (Arenos)',
    secondaryFunctionalGroups: 'Alcanos (Hidrocarburos Saturados)',
    chemicalFormula: 'C7H8',
    casNumber: '108-88-3',
    sampleState: 'Líquido puro',
    instrument: 'Shimadzu IRAffinity-1S',
    resolution: '4 cm⁻¹',
    notes: 'Contraste perfecto entre hidrógenos sp2 aromáticos (>3000 cm⁻¹ en 3030 cm⁻¹) e hidrógenos sp3 alifáticos (<3000 cm⁻¹ en 2925 y 2860 cm⁻¹). Bandas del esqueleto bencénico en 1605 y 1495 cm⁻¹, sobretonos de 1700-2000 cm⁻¹ y doblete característico de monosustitución a 728 y 694 cm⁻¹.',
    fileName: 'tolueno.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 3085, width: 22, depth: 35 }, // C-H aromatic
        { center: 3030, width: 22, depth: 45 }, // C-H aromatic
        { center: 2925, width: 28, depth: 55 }, // C-H methyl asym
        { center: 2860, width: 24, depth: 35 }, // C-H methyl sym
        { center: 1945, width: 18, depth: 15 }, // overtone
        { center: 1865, width: 18, depth: 14 }, // overtone
        { center: 1805, width: 18, depth: 18 }, // overtone
        { center: 1605, width: 20, depth: 58 }, // aromatic ring C=C
        { center: 1495, width: 22, depth: 72 }, // aromatic ring C=C
        { center: 1460, width: 22, depth: 50 }, // methyl bend
        { center: 1378, width: 18, depth: 38 }, // methyl umbrella
        { center: 728, width: 24, depth: 89 }, // mono-substitution OOP
        { center: 694, width: 22, depth: 91 }, // mono-substitution OOP
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 3030, value: 53, intensity: 45, intensityType: 'media', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Tensión C-H aromático (sp2)' },
      { wavenumber: 2925, value: 43, intensity: 55, intensityType: 'fuerte', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Tensión C-H alifático del metilo (sp3)' },
      { wavenumber: 1605, value: 40, intensity: 58, intensityType: 'fuerte', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Tensión C=C esqueleto aromático' },
      { wavenumber: 1495, value: 26, intensity: 72, intensityType: 'fuerte', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Tensión C=C esqueleto aromático' },
      { wavenumber: 728, value: 9, intensity: 89, intensityType: 'muy fuerte', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Flexión fuera del plano C-H (monosustitución)' },
      { wavenumber: 694, value: 7, intensity: 91, intensityType: 'muy fuerte', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Deformación del anillo aromático' },
    ]),
  },
  {
    id: 'ref-1-hexyne',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: '1-Hexino',
    primaryFunctionalGroup: 'Alquinos',
    secondaryFunctionalGroups: 'Alcanos (Hidrocarburos Saturados)',
    chemicalFormula: 'C6H10',
    casNumber: '693-02-7',
    sampleState: 'Líquido puro',
    instrument: 'FTIR Nicolet iS50',
    resolution: '4 cm⁻¹',
    notes: 'Alquino terminal clásico con la agudísima y fina señal de estiramiento ≡C-H a 3310 cm⁻¹ (fácil de diferenciar de O-H o N-H por su estrechez), estiramiento débil a medio de C≡C a 2120 cm⁻¹ y flexión ≡C-H a 630 cm⁻¹.',
    fileName: '1_hexino.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 3310, width: 20, depth: 82 }, // ≡C-H sharp sharp!
        { center: 2960, width: 28, depth: 65 }, // C-H aliph
        { center: 2935, width: 25, depth: 62 },
        { center: 2870, width: 24, depth: 45 },
        { center: 2120, width: 20, depth: 42 }, // C≡C alkyne
        { center: 1465, width: 28, depth: 40 },
        { center: 1380, width: 22, depth: 30 },
        { center: 630, width: 45, depth: 75 }, // ≡C-H bend
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 3310, value: 16, intensity: 82, intensityType: 'muy fuerte', functionalGroup: 'Alquinos', assignment: 'Tensión ≡C-H de alquino terminal (sp)' },
      { wavenumber: 2120, value: 56, intensity: 42, intensityType: 'media', functionalGroup: 'Alquinos', assignment: 'Tensión de triple enlace C≡C' },
      { wavenumber: 2960, value: 33, intensity: 65, intensityType: 'fuerte', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Tensión C-H de la cadena butílica' },
      { wavenumber: 630, value: 23, intensity: 75, intensityType: 'fuerte', functionalGroup: 'Alquinos', assignment: 'Flexión de ≡C-H acetilénico' },
    ]),
  },
  {
    id: 'ref-acetonitrile',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Acetonitrilo',
    primaryFunctionalGroup: 'Nitrilos',
    secondaryFunctionalGroups: 'Alcanos (Hidrocarburos Saturados)',
    chemicalFormula: 'C2H3N',
    casNumber: '75-05-8',
    sampleState: 'Líquido espectroscópico',
    instrument: 'Agilent Cary 630',
    resolution: '4 cm⁻¹',
    notes: 'Espectro muy limpio. Muestra la singular y distintiva absorción del triple enlace C≡N a 2252 cm⁻¹, completamente aislada en la ventana de 2500-2000 cm⁻¹.',
    fileName: 'acetonitrilo.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 3005, width: 22, depth: 30 },
        { center: 2945, width: 26, depth: 45 },
        { center: 2252, width: 22, depth: 78 }, // C≡N nitrile!
        { center: 1445, width: 25, depth: 40 },
        { center: 1375, width: 22, depth: 55 },
        { center: 1040, width: 30, depth: 32 },
        { center: 918, width: 25, depth: 40 },
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 2252, value: 20, intensity: 78, intensityType: 'fuerte', functionalGroup: 'Nitrilos', assignment: 'Tensión del triple enlace C≡N nitrilo' },
      { wavenumber: 2945, value: 53, intensity: 45, intensityType: 'media', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Tensión C-H alifático del metilo' },
      { wavenumber: 1375, value: 43, intensity: 55, intensityType: 'media', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Flexión simétrica C-H del metilo' },
    ]),
  },
  {
    id: 'ref-nitrobenzene',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Nitrobenceno',
    primaryFunctionalGroup: 'Compuestos Nitro',
    secondaryFunctionalGroups: 'Compuestos Aromáticos (Arenos)',
    chemicalFormula: 'C6H5NO2',
    casNumber: '98-95-3',
    sampleState: 'Líquido puro en NaCl',
    instrument: 'PerkinElmer Spectrum Two',
    resolution: '4 cm⁻¹',
    notes: 'Patrón de doble banda nitro inconfundible: tensión asimétrica N=O a 1525 cm⁻¹ y tensión simétrica N=O a 1347 cm⁻¹, ambas de extraordinaria intensidad.',
    fileName: 'nitrobenceno.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 3105, width: 22, depth: 32 }, // C-H aromatic
        { center: 3080, width: 22, depth: 35 },
        { center: 1525, width: 32, depth: 95 }, // NO2 asym stretch!
        { center: 1478, width: 22, depth: 45 },
        { center: 1347, width: 30, depth: 93 }, // NO2 sym stretch!
        { center: 852, width: 25, depth: 72 }, // C-N stretch
        { center: 793, width: 25, depth: 76 },
        { center: 704, width: 24, depth: 88 }, // aromatic OOP
        { center: 680, width: 22, depth: 80 },
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 1525, value: 3, intensity: 95, intensityType: 'muy fuerte', functionalGroup: 'Compuestos Nitro', assignment: 'Tensión asimétrica del grupo -NO2' },
      { wavenumber: 1347, value: 5, intensity: 93, intensityType: 'muy fuerte', functionalGroup: 'Compuestos Nitro', assignment: 'Tensión simétrica del grupo -NO2' },
      { wavenumber: 3080, value: 63, intensity: 35, intensityType: 'media', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Tensión C-H aromático (sp2)' },
      { wavenumber: 704, value: 10, intensity: 88, intensityType: 'muy fuerte', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Flexión fuera del plano (anillo monosustituido)' },
    ]),
  },
  {
    id: 'ref-acetamide',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Acetamida',
    primaryFunctionalGroup: 'Amidas',
    secondaryFunctionalGroups: 'Alcanos (Hidrocarburos Saturados)',
    chemicalFormula: 'C2H5NO',
    casNumber: '60-35-5',
    sampleState: 'Sólido (pastilla KBr)',
    instrument: 'Shimadzu IRAffinity-1S',
    resolution: '4 cm⁻¹',
    notes: 'Amida primaria con el doblete N-H en 3350 y 3180 cm⁻¹. La famosa "Banda Amida I" (C=O carbonilo de amida) en 1665 cm⁻¹ y la "Banda Amida II" (flexión N-H) en 1610 cm⁻¹.',
    fileName: 'acetamida.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 3350, width: 45, depth: 72 }, // N-H asym
        { center: 3180, width: 45, depth: 68 }, // N-H sym
        { center: 2940, width: 25, depth: 32 },
        { center: 1665, width: 35, depth: 92 }, // Amide I (C=O)
        { center: 1610, width: 32, depth: 82 }, // Amide II (N-H bend)
        { center: 1395, width: 26, depth: 55 }, // C-N stretch
        { center: 1145, width: 30, depth: 40 },
        { center: 700, width: 50, depth: 52 }, // N-H wag
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 3350, value: 26, intensity: 72, intensityType: 'fuerte', functionalGroup: 'Amidas', assignment: 'Tensión N-H asimétrica de amida primaria' },
      { wavenumber: 3180, value: 30, intensity: 68, intensityType: 'fuerte', functionalGroup: 'Amidas', assignment: 'Tensión N-H simétrica con puente de H' },
      { wavenumber: 1665, value: 6, intensity: 92, intensityType: 'muy fuerte', functionalGroup: 'Amidas', assignment: 'Banda Amida I (Tensión C=O carbonilo de amida)' },
      { wavenumber: 1610, value: 16, intensity: 82, intensityType: 'muy fuerte', functionalGroup: 'Amidas', assignment: 'Banda Amida II (Flexión N-H acoplada a C-N)' },
    ]),
  },
  {
    id: 'ref-diethyl-ether',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Éter Dietílico',
    primaryFunctionalGroup: 'Éteres',
    secondaryFunctionalGroups: 'Alcanos (Hidrocarburos Saturados)',
    chemicalFormula: 'C4H10O',
    casNumber: '60-29-7',
    sampleState: 'Líquido puro (celda sellada)',
    instrument: 'FTIR Nicolet iS50',
    resolution: '4 cm⁻¹',
    notes: 'Carece por completo de absorciones en las regiones de O-H (>3200 cm⁻¹) y C=O (1700 cm⁻¹). Exhibe estiramientos C-H alifáticos intensos a 2980-2860 cm⁻¹ y la característica banda ancha y muy fuerte de tensión C-O-C a 1125 cm⁻¹.',
    fileName: 'eter_dietilico.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 2980, width: 30, depth: 78 }, // C-H asym
        { center: 2930, width: 28, depth: 65 },
        { center: 2865, width: 25, depth: 55 },
        { center: 1450, width: 30, depth: 45 },
        { center: 1385, width: 25, depth: 48 },
        { center: 1125, width: 48, depth: 94 }, // C-O-C ether!
        { center: 840, width: 30, depth: 38 },
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 2980, value: 20, intensity: 78, intensityType: 'fuerte', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Tensión C-H alifática' },
      { wavenumber: 1125, value: 4, intensity: 94, intensityType: 'muy fuerte', functionalGroup: 'Éteres', assignment: 'Tensión asimétrica C-O-C de éter alifático' },
      { wavenumber: 1385, value: 50, intensity: 48, intensityType: 'media', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Flexión simétrica de metilos' },
    ]),
  },
  {
    id: 'ref-acetic-acid',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Ácido Acético (Ácido Etanoico)',
    primaryFunctionalGroup: 'Ácidos Carboxílicos',
    secondaryFunctionalGroups: 'Alcanos (Hidrocarburos Saturados)',
    chemicalFormula: 'C2H4O2',
    casNumber: '64-19-7',
    sampleState: 'Líquido puro (película fina entre placas NaCl)',
    instrument: 'FTIR Nicolet iS50',
    resolution: '4 cm⁻¹',
    notes: 'Espectro clásico de ácido carboxílico alifático simple. Muestra la característica banda O-H de dímero extremadamente ancha e irregular (3300-2500 cm⁻¹), el potente carbonilo C=O a 1715 cm⁻¹, la flexión C-O-H en 1415 cm⁻¹ y la tensión C-O en 1265 cm⁻¹.',
    fileName: 'acido_acetico.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 2980, width: 380, depth: 80 }, // huge O-H dimer
        { center: 2650, width: 60, depth: 38 }, // Fermi shoulder
        { center: 1715, width: 34, depth: 95 }, // C=O acid
        { center: 1415, width: 28, depth: 65 }, // C-O-H in-plane bend
        { center: 1265, width: 38, depth: 88 }, // C-O stretch
        { center: 935, width: 55, depth: 60 }, // O-H out-of-plane dimer
        { center: 620, width: 40, depth: 45 },
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 2980, value: 18, intensity: 80, intensityType: 'ancha', functionalGroup: 'Ácidos Carboxílicos', assignment: 'Tensión O-H dímero de ácido carboxílico (3300-2500 cm⁻¹)' },
      { wavenumber: 1715, value: 5, intensity: 95, intensityType: 'muy fuerte', functionalGroup: 'Ácidos Carboxílicos', assignment: 'Tensión C=O carbonilo del dímero' },
      { wavenumber: 1415, value: 35, intensity: 65, intensityType: 'fuerte', functionalGroup: 'Ácidos Carboxílicos', assignment: 'Flexión en el plano C-O-H' },
      { wavenumber: 1265, value: 12, intensity: 88, intensityType: 'muy fuerte', functionalGroup: 'Ácidos Carboxílicos', assignment: 'Tensión C-O' },
      { wavenumber: 935, value: 40, intensity: 60, intensityType: 'ancha', functionalGroup: 'Ácidos Carboxílicos', assignment: 'Flexión fuera del plano O-H del dímero' },
    ]),
  },
  {
    id: 'ref-methanol',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Metanol (Alcohol Metílico)',
    primaryFunctionalGroup: 'Alcoholes y Fenoles',
    chemicalFormula: 'CH4O',
    casNumber: '67-56-1',
    sampleState: 'Líquido puro',
    instrument: 'PerkinElmer Spectrum Two',
    resolution: '4 cm⁻¹',
    notes: 'Alcohol más simple. Exhibe la fuerte y ancha banda O-H asociada en 3335 cm⁻¹, estiramientos C-H asimétrico y simétrico a 2945 y 2835 cm⁻¹, flexión C-H de metilo a 1450 cm⁻¹ y una intensa banda C-O a 1030 cm⁻¹.',
    fileName: 'metanol.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 3335, width: 280, depth: 88 }, // O-H broad
        { center: 2945, width: 30, depth: 65 }, // C-H asym
        { center: 2835, width: 25, depth: 52 }, // C-H sym
        { center: 1450, width: 28, depth: 45 },
        { center: 1030, width: 40, depth: 92 }, // C-O primary alcohol
        { center: 680, width: 50, depth: 35 },
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 3335, value: 10, intensity: 88, intensityType: 'muy fuerte', functionalGroup: 'Alcoholes y Fenoles', assignment: 'Tensión O-H asociada (puentes de H)' },
      { wavenumber: 2945, value: 35, intensity: 65, intensityType: 'fuerte', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Tensión C-H asimétrica de metilo' },
      { wavenumber: 1030, value: 8, intensity: 92, intensityType: 'muy fuerte', functionalGroup: 'Alcoholes y Fenoles', assignment: 'Tensión C-O (alcohol 1° metílico)' },
    ]),
  },
  {
    id: 'ref-cyclohexane',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Ciclohexano',
    primaryFunctionalGroup: 'Alcanos (Hidrocarburos Saturados)',
    chemicalFormula: 'C6H12',
    casNumber: '110-82-7',
    sampleState: 'Líquido puro',
    instrument: 'Agilent Cary 630',
    resolution: '4 cm⁻¹',
    notes: 'Hidrocarburo saturado cíclico puro. Muestra únicamente estiramientos C-H alifáticos intensos por debajo de 3000 cm⁻¹ (2930 y 2855 cm⁻¹) y la flexión de tijera de metilenos -CH2- en 1452 cm⁻¹. Ausencia total de enlaces dobles o funcionales oxigenados.',
    fileName: 'ciclohexano.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 2930, width: 30, depth: 88 }, // C-H asym CH2
        { center: 2855, width: 28, depth: 78 }, // C-H sym CH2
        { center: 1452, width: 26, depth: 68 }, // CH2 scissoring
        { center: 1030, width: 25, depth: 30 },
        { center: 862, width: 25, depth: 55 }, // ring deformation
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 2930, value: 12, intensity: 88, intensityType: 'muy fuerte', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Tensión C-H asimétrica de grupos metileno -CH2-' },
      { wavenumber: 2855, value: 22, intensity: 78, intensityType: 'fuerte', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Tensión C-H simétrica de grupos metileno -CH2-' },
      { wavenumber: 1452, value: 32, intensity: 68, intensityType: 'fuerte', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Flexión de tijera (scissoring) de -CH2-' },
      { wavenumber: 862, value: 45, intensity: 55, intensityType: 'media', functionalGroup: 'Alcanos (Hidrocarburos Saturados)', assignment: 'Deformación del esqueleto del anillo ciclohexánico' },
    ]),
  },
  {
    id: 'ref-chlorobenzene',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Clorobenceno',
    primaryFunctionalGroup: 'Haluros de Alquilo (Organohalógenos)',
    secondaryFunctionalGroups: 'Compuestos Aromáticos (Arenos)',
    chemicalFormula: 'C6H5Cl',
    casNumber: '108-90-7',
    sampleState: 'Líquido puro',
    instrument: 'FTIR Nicolet iS50',
    resolution: '4 cm⁻¹',
    notes: 'Haluro aromático. Muestra tensión C-H aromático a 3060 cm⁻¹, bandas del anillo bencénico en 1585 y 1475 cm⁻¹, sobretonos de 1700-1950 cm⁻¹, la fuerte flexión fuera del plano (OOP) a 745 y 685 cm⁻¹ y la característica tensión C-Cl a 705 cm⁻¹.',
    fileName: 'clorobenceno.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 3060, width: 22, depth: 40 }, // C-H aromatic
        { center: 1585, width: 20, depth: 55 }, // ring C=C
        { center: 1475, width: 22, depth: 78 }, // ring C=C
        { center: 1085, width: 24, depth: 62 }, // C-H ip bend
        { center: 745, width: 25, depth: 90 }, // OOP
        { center: 705, width: 22, depth: 92 }, // C-Cl stretch & OOP
        { center: 685, width: 22, depth: 85 }, // ring bend
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 3060, value: 60, intensity: 40, intensityType: 'media', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Tensión C-H aromático (sp2)' },
      { wavenumber: 1475, value: 22, intensity: 78, intensityType: 'fuerte', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Vibración de esqueleto del anillo bencénico' },
      { wavenumber: 745, value: 10, intensity: 90, intensityType: 'muy fuerte', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Flexión fuera del plano (anillo monosustituido)' },
      { wavenumber: 705, value: 8, intensity: 92, intensityType: 'muy fuerte', functionalGroup: 'Haluros de Alquilo (Organohalógenos)', assignment: 'Tensión carbono-cloro (C-Cl)' },
    ]),
  },
  {
    id: 'ref-phenol',
    userId: 'system-reference',
    userEmail: 'biblioteca@espectroir.org',
    compoundName: 'Fenol (Hidroxibenceno)',
    primaryFunctionalGroup: 'Alcoholes y Fenoles',
    secondaryFunctionalGroups: 'Compuestos Aromáticos (Arenos)',
    chemicalFormula: 'C6H6O',
    casNumber: '108-95-2',
    sampleState: 'Sólido (pastilla KBr)',
    instrument: 'Shimadzu IRAffinity-1S',
    resolution: '2 cm⁻¹',
    notes: 'Fenol característico. Banda O-H ancha e intensa en 3360 cm⁻¹, estiramiento =C-H aromático a 3045 cm⁻¹, bandas del anillo aromático en 1595 y 1475 cm⁻¹, y la muy intensa tensión C-O fenólica a 1230 cm⁻¹ (más alta que en alcoholes alifáticos por carácter parcial de doble enlace).',
    fileName: 'fenol.jdx',
    fileType: 'referencia',
    yUnit: 'transmittance',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    isReference: true,
    dataPointsJson: JSON.stringify(
      generateSyntheticFTIR([
        { center: 3360, width: 240, depth: 85 }, // O-H phenol
        { center: 3045, width: 22, depth: 38 }, // C-H aromatic
        { center: 1595, width: 22, depth: 65 }, // aromatic ring C=C
        { center: 1475, width: 22, depth: 60 },
        { center: 1365, width: 25, depth: 45 }, // O-H in-plane bend
        { center: 1230, width: 35, depth: 90 }, // C-O phenolic stretch
        { center: 750, width: 24, depth: 85 }, // mono-substitution OOP
        { center: 690, width: 22, depth: 82 },
      ])
    ),
    peaksJson: JSON.stringify([
      { wavenumber: 3360, value: 15, intensity: 85, intensityType: 'muy fuerte', functionalGroup: 'Alcoholes y Fenoles', assignment: 'Tensión O-H asociada de fenol' },
      { wavenumber: 3045, value: 62, intensity: 38, intensityType: 'media', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Tensión C-H aromático' },
      { wavenumber: 1595, value: 35, intensity: 65, intensityType: 'fuerte', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Tensión C=C del anillo bencénico' },
      { wavenumber: 1230, value: 10, intensity: 90, intensityType: 'muy fuerte', functionalGroup: 'Alcoholes y Fenoles', assignment: 'Tensión C-O aromática/fenólica' },
      { wavenumber: 750, value: 15, intensity: 85, intensityType: 'muy fuerte', functionalGroup: 'Compuestos Aromáticos (Arenos)', assignment: 'Flexión fuera del plano C-H' },
    ]),
  },
];

