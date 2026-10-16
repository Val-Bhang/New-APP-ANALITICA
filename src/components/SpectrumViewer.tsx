import React, { useState, useRef, useEffect, useMemo } from 'react';
import { SpectrumPoint, SpectrumPeak, SpectrumRecord } from '../types/spectrum';
import { DIAGNOSTIC_ZONES, FUNCTIONAL_GROUPS } from '../data/functionalGroups';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Layers,
  Crosshair,
  Info,
  Sliders,
  Eye,
  EyeOff,
} from 'lucide-react';
import { safeParseDataPoints, safeParsePeaks } from '../utils/schemaValidation';

interface SpectrumViewerProps {
  spectrum: SpectrumRecord;
  compareSpectrum?: SpectrumRecord | null;
  onSelectPeak?: (peak: SpectrumPeak) => void;
  highlightedPeak?: SpectrumPeak | null;
  height?: number;
}

export const SpectrumViewer: React.FC<SpectrumViewerProps> = ({
  spectrum,
  compareSpectrum,
  onSelectPeak,
  highlightedPeak,
  height = 420,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Parse points and peaks safely with Zod schema validation
  const points: SpectrumPoint[] = useMemo(() => {
    return safeParseDataPoints(spectrum.dataPointsJson);
  }, [spectrum.dataPointsJson]);

  const peaks: SpectrumPeak[] = useMemo(() => {
    return safeParsePeaks(spectrum.peaksJson);
  }, [spectrum.peaksJson]);

  const comparePoints: SpectrumPoint[] = useMemo(() => {
    if (!compareSpectrum?.dataPointsJson) return [];
    return safeParseDataPoints(compareSpectrum.dataPointsJson);
  }, [compareSpectrum]);

  // Viewer controls
  const [viewUnit, setViewUnit] = useState<'transmittance' | 'absorbance'>('transmittance');
  const [showZones, setShowZones] = useState<boolean>(true);
  const [showPeakMarkers, setShowPeakMarkers] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; wn: number; val: number } | null>(null);
  const [activePeak, setActivePeak] = useState<SpectrumPeak | null>(null);

  // Zoom bounds: standard FTIR is 4000 down to 400 cm^-1
  const [minWn, setMinWn] = useState<number>(400);
  const [maxWn, setMaxWn] = useState<number>(4000);

  // Reset zoom on spectrum change
  useEffect(() => {
    setMinWn(400);
    setMaxWn(4000);
    setActivePeak(null);
  }, [spectrum.id]);

  useEffect(() => {
    if (highlightedPeak !== undefined) {
      setActivePeak(highlightedPeak);
    }
  }, [highlightedPeak]);

  // Color matching functional group
  const groupDef = useMemo(() => {
    return FUNCTIONAL_GROUPS.find((g) => g.name === spectrum.primaryFunctionalGroup);
  }, [spectrum.primaryFunctionalGroup]);

  const primaryColor = groupDef?.color || '#0284c7';
  const compareColor = '#f59e0b'; // Amber for comparison

  // Convert points according to viewUnit if needed
  const displayPoints = useMemo(() => {
    const isSourceTransmittance = spectrum.yUnit === 'transmittance';
    return points.map(([wn, val]) => {
      let v = val;
      if (viewUnit === 'absorbance' && isSourceTransmittance) {
        // A = -log10(T/100)
        const t = Math.max(0.01, Math.min(100, val)) / 100;
        v = Math.round(-Math.log10(t) * 100) / 100;
      } else if (viewUnit === 'transmittance' && !isSourceTransmittance) {
        // T% = 10^(-A) * 100
        v = Math.round(Math.pow(10, -val) * 1000) / 10;
      }
      return [wn, v] as SpectrumPoint;
    });
  }, [points, viewUnit, spectrum.yUnit]);

  const displayComparePoints = useMemo(() => {
    if (!compareSpectrum) return [];
    const isSourceTransmittance = compareSpectrum.yUnit === 'transmittance';
    return comparePoints.map(([wn, val]) => {
      let v = val;
      if (viewUnit === 'absorbance' && isSourceTransmittance) {
        const t = Math.max(0.01, Math.min(100, val)) / 100;
        v = Math.round(-Math.log10(t) * 100) / 100;
      } else if (viewUnit === 'transmittance' && !isSourceTransmittance) {
        v = Math.round(Math.pow(10, -val) * 1000) / 10;
      }
      return [wn, v] as SpectrumPoint;
    });
  }, [comparePoints, viewUnit, compareSpectrum]);

  // Canvas Drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Padding margins
    const padLeft = 60;
    const padRight = 30;
    const padTop = showZones ? 55 : 25;
    const padBottom = 45;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    ctx.clearRect(0, 0, width, height);

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Plot background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(padLeft, padTop, plotWidth, plotHeight);

    // Function to map Wavenumber (4000 on left -> 400 on right) to Canvas X
    const wnToX = (wn: number) => {
      const fraction = (maxWn - wn) / (maxWn - minWn);
      return padLeft + fraction * plotWidth;
    };

    const xToWn = (x: number) => {
      const fraction = (x - padLeft) / plotWidth;
      return maxWn - fraction * (maxWn - minWn);
    };

    // Y Axis scaling
    let minY = 0;
    let maxY = 100;
    if (viewUnit === 'absorbance') {
      minY = 0;
      maxY = 1.8;
      // adjust based on data
      const allVals = displayPoints.map((p) => p[1]);
      if (allVals.length > 0) {
        maxY = Math.max(1.0, Math.ceil(Math.max(...allVals) * 1.2 * 10) / 10);
      }
    } else {
      minY = 0;
      maxY = 105;
    }

    const valToY = (val: number) => {
      // In FTIR %T, 100% is at the top (padTop), 0% is at the bottom (padTop + plotHeight)
      // In Absorbance, 0 is at bottom, max is at top
      if (viewUnit === 'transmittance') {
        const fraction = (val - minY) / (maxY - minY);
        return padTop + plotHeight - fraction * plotHeight;
      } else {
        const fraction = (val - minY) / (maxY - minY);
        return padTop + plotHeight - fraction * plotHeight;
      }
    };

    // 1. Draw Diagnostic Zone Ribbons
    if (showZones) {
      DIAGNOSTIC_ZONES.forEach((zone) => {
        const x1 = Math.max(padLeft, wnToX(Math.min(maxWn, zone.range[1])));
        const x2 = Math.min(padLeft + plotWidth, wnToX(Math.max(minWn, zone.range[0])));
        const zoneWidth = x2 - x1;

        if (zoneWidth > 5) {
          // Zone top pill banner
          ctx.fillStyle = zone.color + '15'; // 10% opacity in plot
          ctx.fillRect(x1, padTop, zoneWidth, plotHeight);

          // Top label bar
          ctx.fillStyle = zone.color + '25';
          ctx.fillRect(x1, 10, zoneWidth, 30);
          ctx.strokeStyle = zone.color;
          ctx.lineWidth = 1;
          ctx.strokeRect(x1, 10, zoneWidth, 30);

          ctx.fillStyle = '#334155';
          ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(zone.name, x1 + zoneWidth / 2, 24);

          ctx.fillStyle = '#64748b';
          ctx.font = '9px system-ui, -apple-system, sans-serif';
          ctx.fillText(`${zone.range[1]} - ${zone.range[0]} cm⁻¹`, x1 + zoneWidth / 2, 35);
        }
      });
    }

    // 2. Draw Grid Lines
    if (showGrid) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);

      // Wavenumber grid vertical lines (every 500 cm^-1)
      for (let wn = 4000; wn >= 400; wn -= 500) {
        if (wn <= maxWn && wn >= minWn) {
          const gx = wnToX(wn);
          ctx.beginPath();
          ctx.moveTo(gx, padTop);
          ctx.lineTo(gx, padTop + plotHeight);
          ctx.stroke();
        }
      }

      // Y-axis grid horizontal lines
      const ySteps = viewUnit === 'transmittance' ? [20, 40, 60, 80, 100] : [0.2, 0.4, 0.6, 0.8, 1.0, 1.2, 1.5];
      ySteps.forEach((yVal) => {
        if (yVal <= maxY && yVal >= minY) {
          const gy = valToY(yVal);
          ctx.beginPath();
          ctx.moveTo(padLeft, gy);
          ctx.lineTo(padLeft + plotWidth, gy);
          ctx.stroke();
        }
      });
      ctx.setLineDash([]);
    }

    // 3. Draw Plot Border
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(padLeft, padTop, plotWidth, plotHeight);

    // 4. Draw Secondary/Comparison Curve (if active)
    if (displayComparePoints.length > 1) {
      ctx.strokeStyle = compareColor;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      let first = true;
      for (const [cwn, cval] of displayComparePoints) {
        if (cwn <= maxWn && cwn >= minWn) {
          const cx = wnToX(cwn);
          const cy = valToY(cval);
          if (first) {
            ctx.moveTo(cx, cy);
            first = false;
          } else {
            ctx.lineTo(cx, cy);
          }
        }
      }
      ctx.stroke();
    }

    // 5. Draw Primary Spectrum Curve
    if (displayPoints.length > 1) {
      // Line gradient
      const grad = ctx.createLinearGradient(padLeft, padTop, padLeft + plotWidth, padTop);
      grad.addColorStop(0, primaryColor);
      grad.addColorStop(1, primaryColor);

      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.2;
      ctx.lineJoin = 'round';
      ctx.beginPath();

      let first = true;
      for (const [wn, val] of displayPoints) {
        if (wn <= maxWn && wn >= minWn) {
          const x = wnToX(wn);
          const y = valToY(val);
          if (first) {
            ctx.moveTo(x, y);
            first = false;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // 6. Draw Peak Markers & Labels
    if (showPeakMarkers && peaks.length > 0) {
      peaks.forEach((peak) => {
        if (peak.wavenumber <= maxWn && peak.wavenumber >= minWn) {
          const px = wnToX(peak.wavenumber);
          // Find matching point value
          const pt = displayPoints.find((p) => Math.abs(p[0] - peak.wavenumber) <= 5);
          const py = pt ? valToY(pt[1]) : valToY(peak.value);

          const isSelected = activePeak?.wavenumber === peak.wavenumber;

          // Vertical indicator dash
          ctx.strokeStyle = isSelected ? '#ef4444' : '#64748b';
          ctx.lineWidth = isSelected ? 2 : 1;
          ctx.setLineDash([2, 2]);
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(px, viewUnit === 'transmittance' ? py + 22 : py - 22);
          ctx.stroke();
          ctx.setLineDash([]);

          // Peak dot
          ctx.fillStyle = isSelected ? '#ef4444' : primaryColor;
          ctx.beginPath();
          ctx.arc(px, py, isSelected ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Peak wavenumber text
          ctx.fillStyle = isSelected ? '#b91c1c' : '#334155';
          ctx.font = isSelected ? 'bold 11px system-ui' : '10px system-ui';
          ctx.textAlign = 'center';
          const textY = viewUnit === 'transmittance' ? py + 34 : py - 28;
          ctx.fillText(`${peak.wavenumber}`, px, textY);
        }
      });
    }

    // 7. Draw Axes & Labels
    // X Axis Ticks
    ctx.fillStyle = '#475569';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';

    const tickInterval = maxWn - minWn > 2000 ? 500 : maxWn - minWn > 800 ? 200 : 100;
    const startTick = Math.floor(maxWn / tickInterval) * tickInterval;

    for (let wn = startTick; wn >= minWn; wn -= tickInterval) {
      const tx = wnToX(wn);
      if (tx >= padLeft && tx <= padLeft + plotWidth) {
        ctx.beginPath();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.moveTo(tx, padTop + plotHeight);
        ctx.lineTo(tx, padTop + plotHeight + 5);
        ctx.stroke();

        ctx.fillText(`${wn}`, tx, padTop + plotHeight + 18);
      }
    }

    // X Axis Label
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText('Número de onda / Wavenumber (cm⁻¹)', padLeft + plotWidth / 2, padTop + plotHeight + 35);

    // Y Axis Ticks & Label
    ctx.textAlign = 'right';
    ctx.font = '11px system-ui, sans-serif';

    const ySteps = viewUnit === 'transmittance' ? [0, 20, 40, 60, 80, 100] : [0, 0.5, 1.0, 1.5];
    ySteps.forEach((yVal) => {
      if (yVal <= maxY && yVal >= minY) {
        const ty = valToY(yVal);
        ctx.beginPath();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.moveTo(padLeft - 5, ty);
        ctx.lineTo(padLeft, ty);
        ctx.stroke();

        ctx.fillText(viewUnit === 'transmittance' ? `${yVal}%` : `${yVal.toFixed(1)}`, padLeft - 8, ty + 4);
      }
    });

    // Y Axis Title (Rotated)
    ctx.save();
    ctx.translate(16, padTop + plotHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(
      viewUnit === 'transmittance' ? '% Transmitancia (%T)' : 'Absorbancia (A)',
      0,
      0
    );
    ctx.restore();

    // 8. Crosshair & Hover Tooltip
    if (hoveredPoint) {
      const hx = wnToX(hoveredPoint.wn);
      const hy = valToY(hoveredPoint.val);

      if (hx >= padLeft && hx <= padLeft + plotWidth) {
        // Crosshair lines
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        ctx.beginPath();
        ctx.moveTo(hx, padTop);
        ctx.lineTo(hx, padTop + plotHeight);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(padLeft, hy);
        ctx.lineTo(padLeft + plotWidth, hy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Intersection point
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  }, [
    displayPoints,
    displayComparePoints,
    peaks,
    minWn,
    maxWn,
    viewUnit,
    showZones,
    showPeakMarkers,
    showGrid,
    hoveredPoint,
    activePeak,
    primaryColor,
    compareColor,
    height,
  ]);

  // Mouse interactivity
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const padLeft = 60;
    const padRight = 30;
    const plotWidth = rect.width - padLeft - padRight;

    if (mouseX >= padLeft && mouseX <= padLeft + plotWidth) {
      const fraction = (mouseX - padLeft) / plotWidth;
      const targetWn = maxWn - fraction * (maxWn - minWn);

      // Find closest point
      let closestPt = displayPoints[0];
      let minDiff = 99999;
      for (const p of displayPoints) {
        const diff = Math.abs(p[0] - targetWn);
        if (diff < minDiff) {
          minDiff = diff;
          closestPt = p;
        }
      }

      if (closestPt) {
        setHoveredPoint({
          x: mouseX,
          y: mouseY,
          wn: closestPt[0],
          val: closestPt[1],
        });

        // Check if cursor is near a peak
        const nearPeak = peaks.find((pk) => Math.abs(pk.wavenumber - closestPt[0]) < 20);
        if (nearPeak) {
          setActivePeak(nearPeak);
        }
      }
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleClick = () => {
    if (activePeak && onSelectPeak) {
      onSelectPeak(activePeak);
    }
  };

  // Zoom actions
  const zoomIn = () => {
    const range = maxWn - minWn;
    if (range > 400) {
      const center = (maxWn + minWn) / 2;
      const newHalf = (range * 0.7) / 2;
      setMinWn(Math.max(400, Math.round(center - newHalf)));
      setMaxWn(Math.min(4000, Math.round(center + newHalf)));
    }
  };

  const zoomOut = () => {
    const range = maxWn - minWn;
    const center = (maxWn + minWn) / 2;
    const newHalf = (range * 1.35) / 2;
    setMinWn(Math.max(400, Math.round(center - newHalf)));
    setMaxWn(Math.min(4000, Math.round(center + newHalf)));
  };

  const resetZoom = () => {
    setMinWn(400);
    setMaxWn(4000);
  };

  // Export spectrum canvas to PNG image
  const exportImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${spectrum.compoundName || 'espectro_ir'}_ftir.png`;
    a.click();
  };

  // Identify current diagnostic zone under hover
  const currentZone = useMemo(() => {
    if (!hoveredPoint) return null;
    return DIAGNOSTIC_ZONES.find(
      (z) => hoveredPoint.wn >= z.range[0] && hoveredPoint.wn <= z.range[1]
    );
  }, [hoveredPoint]);

  return (
    <div
      ref={containerRef}
      className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden"
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-purple-50/50 dark:bg-slate-800/80 border-b border-purple-100 dark:border-slate-700/80 gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: primaryColor }}
            />
            <span className="font-bold text-sm text-purple-950 dark:text-slate-100">
              {spectrum.compoundName}
            </span>
          </div>

          {compareSpectrum && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-purple-200 dark:border-slate-700">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: compareColor }}
              />
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                vs {compareSpectrum.compoundName}
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          {/* Unit Switcher */}
          <div className="flex bg-purple-100/70 dark:bg-slate-700 p-0.5 rounded-xl mr-1 border border-purple-200/60">
            <button
              onClick={() => setViewUnit('transmittance')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                viewUnit === 'transmittance'
                  ? 'bg-white dark:bg-slate-800 text-purple-950 dark:text-slate-100 font-bold shadow-xs'
                  : 'text-purple-800 dark:text-slate-300 hover:text-purple-950'
              }`}
            >
              % Transmitancia
            </button>
            <button
              onClick={() => setViewUnit('absorbance')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                viewUnit === 'absorbance'
                  ? 'bg-white dark:bg-slate-800 text-purple-950 dark:text-slate-100 font-bold shadow-xs'
                  : 'text-purple-800 dark:text-slate-300 hover:text-purple-950'
              }`}
            >
              Absorbancia
            </button>
          </div>

          {/* Toggle Diagnostic Zones - Pastel Azul Verde */}
          <button
            onClick={() => setShowZones(!showZones)}
            title="Alternar zonas espectrales IR"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-colors shadow-2xs ${
              showZones
                ? 'bg-teal-100 dark:bg-teal-950/50 text-teal-950 dark:text-teal-200 border-teal-300 dark:border-teal-800 font-semibold'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-purple-200 dark:border-slate-700 hover:bg-purple-50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-teal-700" />
            <span className="hidden sm:inline">Zonas</span>
          </button>

          {/* Toggle Peak Markers - Pastel Lila */}
          <button
            onClick={() => setShowPeakMarkers(!showPeakMarkers)}
            title="Alternar etiquetas de picos"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border transition-colors shadow-2xs ${
              showPeakMarkers
                ? 'bg-purple-100 dark:bg-purple-950/50 text-purple-950 dark:text-purple-200 border-purple-300 dark:border-purple-800 font-semibold'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-purple-200 dark:border-slate-700 hover:bg-purple-50'
            }`}
          >
            <Crosshair className="w-3.5 h-3.5 text-purple-700" />
            <span className="hidden sm:inline">Picos</span>
          </button>

          {/* Zoom Buttons */}
          <button
            onClick={zoomIn}
            title="Acercar zoom"
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-purple-900 dark:text-slate-300 hover:bg-purple-50 shadow-2xs"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={zoomOut}
            title="Alejar zoom"
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-purple-900 dark:text-slate-300 hover:bg-purple-50 shadow-2xs"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetZoom}
            title="Restablecer escala (4000-400 cm⁻¹)"
            className="p-1.5 rounded-xl bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 text-purple-900 dark:text-slate-300 hover:bg-purple-50 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Export PNG */}
          <button
            onClick={exportImage}
            title="Descargar imagen del espectro en alta resolución"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">PNG</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full overflow-hidden bg-white dark:bg-slate-950">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
          style={{ width: '100%', height: `${height}px`, display: 'block', cursor: 'crosshair' }}
        />

        {/* Live Cursor Readout Overlay */}
        {hoveredPoint && (
          <div className="absolute bottom-2 left-16 bg-slate-900/90 text-white text-xs px-3 py-1.5 rounded-xl shadow-lg pointer-events-none flex items-center gap-3 backdrop-blur-xs border border-purple-500/20">
            <div>
              <span className="text-slate-400">ν: </span>
              <span className="font-bold text-amber-300">{hoveredPoint.wn} cm⁻¹</span>
            </div>
            <div>
              <span className="text-slate-400">
                {viewUnit === 'transmittance' ? '%T: ' : 'Abs: '}
              </span>
              <span className="font-bold text-teal-300">
                {hoveredPoint.val}
                {viewUnit === 'transmittance' ? '%' : ''}
              </span>
            </div>
            {currentZone && (
              <span className="text-slate-300 border-l border-slate-700 pl-2">
                {currentZone.name}
              </span>
            )}
          </div>
        )}

        {/* Active Peak Detail Overlay (when hovered/clicked) */}
        {activePeak && (
          <div className="absolute top-16 right-4 max-w-xs bg-white/95 dark:bg-slate-900/95 border border-purple-300 dark:border-purple-700 rounded-2xl p-3 shadow-xl text-xs backdrop-blur-xs">
            <div className="flex items-center justify-between font-bold text-purple-950 dark:text-slate-100 mb-1">
              <span>Pico {activePeak.wavenumber} cm⁻¹</span>
              <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-300 text-[10px] font-bold border border-purple-200">
                {activePeak.intensityType}
              </span>
            </div>
            {activePeak.assignment && (
              <p className="text-slate-600 dark:text-slate-300 mb-1 leading-snug">
                {activePeak.assignment}
              </p>
            )}
            {activePeak.functionalGroup && (
              <p className="text-[11px] font-semibold text-teal-700 dark:text-teal-400">
                Grupo: {activePeak.functionalGroup}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Interactive Peak Chips Carousel */}
      {peaks.length > 0 && (
        <div className="px-4 py-2 bg-purple-50/40 dark:bg-slate-900 border-t border-purple-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-purple-900/70 font-bold whitespace-nowrap flex items-center gap-1">
            <Crosshair className="w-3 h-3 text-purple-600" /> Picos detectados:
          </span>
          {peaks.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setActivePeak(p);
                if (onSelectPeak) onSelectPeak(p);
              }}
              className={`px-2.5 py-1 rounded-xl border whitespace-nowrap transition-colors flex items-center gap-1.5 shadow-2xs ${
                activePeak?.wavenumber === p.wavenumber
                  ? 'bg-purple-600 text-white border-purple-700 font-bold'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-purple-200 dark:border-slate-700 hover:border-purple-400 hover:bg-purple-50/60'
              }`}
            >
              <span className="font-bold">{p.wavenumber}</span>
              <span className="text-[10px] opacity-75">{p.assignment ? p.assignment.split(' ')[0] : 'cm⁻¹'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
