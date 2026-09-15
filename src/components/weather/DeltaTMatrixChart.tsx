import React, { useState, useMemo, useRef, useCallback } from 'react';
import { 
  Droplets, 
  Thermometer, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info,
  RotateCcw
} from 'lucide-react';
import { calculateWetBulbTemp, calculateDeltaT } from '../../services/weatherService';

export interface DeltaTMatrixChartProps {
  currentTemp: number;
  currentHumidity: number;
  cityName?: string;
  onSelectPoint?: (temp: number, humidity: number) => void;
  isSimulating?: boolean;
  compact?: boolean;
  className?: string;
}

// Psychrometric solver: computes RH (%) for a given Dry Bulb T (°C) and target Delta T (°C)
function findRhForDeltaT(T: number, targetDeltaT: number): number | null {
  const maxDelta = calculateDeltaT(T, 0.5);
  if (maxDelta < targetDeltaT) return null;

  let low = 0.5;
  let high = 100;
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    const dt = calculateDeltaT(T, mid);
    if (dt > targetDeltaT) {
      low = mid;
    } else {
      high = mid;
    }
  }
  const result = (low + high) / 2;
  return result >= 0 && result <= 100 ? result : null;
}

export const DeltaTMatrixChart: React.FC<DeltaTMatrixChartProps> = ({
  currentTemp,
  currentHumidity,
  cityName,
  onSelectPoint,
  isSimulating = false,
  compact = false,
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  
  // Interactive state
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; temp: number; rh: number; dt: number } | null>(null);
  const [pinnedPoint, setPinnedPoint] = useState<{ temp: number; rh: number } | null>(null);
  const [showHelperInfo, setShowHelperInfo] = useState(false);

  // Active display point (pinned simulation or real current weather)
  const activeTemp = pinnedPoint ? pinnedPoint.temp : currentTemp;
  const activeHumidity = pinnedPoint ? pinnedPoint.rh : currentHumidity;
  const activeDeltaT = useMemo(() => {
    return calculateDeltaT(activeTemp, activeHumidity);
  }, [activeTemp, activeHumidity]);

  const activeWetBulb = useMemo(() => {
    return calculateWetBulbTemp(activeTemp, activeHumidity);
  }, [activeTemp, activeHumidity]);

  // Agronomic Suitability Classification
  const suitability = useMemo(() => {
    if (activeDeltaT >= 2.0 && activeDeltaT <= 8.0) {
      return {
        status: 'ADEQUADA',
        label: 'Condições Adequadas para Pulverização',
        shortLabel: 'Janela Ideal',
        color: 'emerald',
        badgeBg: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        cardBg: 'bg-emerald-500/10 border-emerald-500/25',
        textColor: 'text-emerald-700 dark:text-emerald-300',
        markerColor: '#10B981',
        icon: CheckCircle2,
        desc: 'Janela ideal termodinâmica! Evaporação sob controle, excelente absorção estomática foliar e perda mínima por deriva.',
        action: 'Pulverização 100% liberada com gotas finas a médias (150-250 µm).'
      };
    } else if (activeDeltaT < 2.0) {
      return {
        status: 'ARRISCADA_BAIXA',
        label: 'Condições Arriscadas (Delta T Baixo < 2°C)',
        shortLabel: 'Risco Inversão / Orvalho',
        color: 'amber',
        badgeBg: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
        cardBg: 'bg-amber-500/10 border-amber-500/25',
        textColor: 'text-amber-700 dark:text-amber-300',
        markerColor: '#F59E0B',
        icon: AlertTriangle,
        desc: 'Ar saturado e umidade elevada. As gotas não evaporam, aumentando o risco de névoa suspensa e escorrimento foliar.',
        action: 'Ajustar volume de calda, evitar bicos ultra-finos e verificar vento > 3 km/h.'
      };
    } else if (activeDeltaT <= 10.0) {
      return {
        status: 'ARRISCADA_ALTA',
        label: 'Condições Arriscadas (Delta T Moderado 8-10°C)',
        shortLabel: 'Atenção Evaporação',
        color: 'amber',
        badgeBg: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
        cardBg: 'bg-amber-500/10 border-amber-500/25',
        textColor: 'text-amber-700 dark:text-amber-300',
        markerColor: '#F59E0B',
        icon: AlertTriangle,
        desc: 'Evaporação acelerada das gotas finas antes de atingirem o alvo da cultura (baixeiro).',
        action: 'Obrigatório uso de adjuvante anti-evaporante / óleo e bicos de gotas médias/grossas.'
      };
    } else {
      return {
        status: 'INADEQUADA',
        label: 'Condições Inadequadas (Delta T Crítico > 10°C)',
        shortLabel: 'Evaporação Crítica',
        color: 'rose',
        badgeBg: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
        cardBg: 'bg-rose-500/10 border-rose-500/25',
        textColor: 'text-rose-700 dark:text-rose-300',
        markerColor: '#F43F5E',
        icon: XCircle,
        desc: 'Ar extremamente seco e quente. Perda superior a 60-80% do defensivo por evaporação instantânea no ar.',
        action: 'Decolagem e pulverização PROIBIDAS. Aguardar melhora climática.'
      };
    }
  }, [activeDeltaT]);

  // Chart Dimensions (Increased by +30% as requested)
  const svgWidth = 610;
  const svgHeight = 384;
  const margin = { top: 23, right: 94, bottom: 42, left: 49 };
  const plotWidth = svgWidth - margin.left - margin.right;
  const plotHeight = svgHeight - margin.top - margin.bottom;

  // Scales
  const minTemp = 0;
  const maxTemp = 50;
  const minRh = 0;
  const maxRh = 100;

  const tempToX = useCallback((t: number) => {
    const clamped = Math.max(minTemp, Math.min(maxTemp, t));
    return margin.left + ((clamped - minTemp) / (maxTemp - minTemp)) * plotWidth;
  }, [margin.left, plotWidth]);

  const rhToY = useCallback((rh: number) => {
    const clamped = Math.max(minRh, Math.min(maxRh, rh));
    return margin.top + (1 - (clamped - minRh) / (maxRh - minRh)) * plotHeight;
  }, [margin.top, plotHeight]);

  const xToTemp = useCallback((x: number) => {
    const t = minTemp + ((x - margin.left) / plotWidth) * (maxTemp - minTemp);
    return Math.round(Math.max(minTemp, Math.min(maxTemp, t)) * 10) / 10;
  }, [margin.left, plotWidth]);

  const yToRh = useCallback((y: number) => {
    const rh = minRh + (1 - (y - margin.top) / plotHeight) * (maxRh - minRh);
    return Math.round(Math.max(minRh, Math.min(maxRh, rh)) * 10) / 10;
  }, [margin.top, plotHeight]);

  // Generate Isobaric Curves for Delta T: 2, 4, 6, 8, 10, 12, 14, 16, 18, 20
  const deltaTCurves = useMemo(() => {
    const targetDts = [2, 4, 6, 8, 10, 12, 14, 16, 18, 20];
    const curvePointsMap: Record<number, Array<{ temp: number; rh: number; x: number; y: number }>> = {};

    targetDts.forEach(dt => {
      const points: Array<{ temp: number; rh: number; x: number; y: number }> = [];
      for (let t = minTemp; t <= maxTemp; t += 0.5) {
        const rh = findRhForDeltaT(t, dt);
        if (rh !== null && rh >= minRh && rh <= maxRh) {
          points.push({
            temp: t,
            rh,
            x: tempToX(t),
            y: rhToY(rh)
          });
        }
      }
      curvePointsMap[dt] = points;
    });

    return curvePointsMap;
  }, [tempToX, rhToY]);

  // Construct Smooth SVG Polygon Paths for the 3 Agronomic Zones
  const zonePolygons = useMemo(() => {
    const c2 = deltaTCurves[2] || [];
    const c8 = deltaTCurves[8] || [];
    const c10 = deltaTCurves[10] || [];

    // 1. Top Amber Zone (Delta T < 2 / High Humidity)
    let topAmberPath = `M ${tempToX(0)} ${rhToY(100)} L ${tempToX(50)} ${rhToY(100)}`;
    if (c2.length > 0) {
      const lastC2 = c2[c2.length - 1];
      topAmberPath += ` L ${lastC2.x} ${lastC2.y}`;
      for (let i = c2.length - 1; i >= 0; i--) {
        topAmberPath += ` L ${c2[i].x} ${c2[i].y}`;
      }
      const firstC2 = c2[0];
      topAmberPath += ` L ${tempToX(0)} ${firstC2.y}`;
    }
    topAmberPath += ' Z';

    // 2. Middle Emerald Zone (Ideal Spraying Window: Delta T 2 to 8°C)
    let emeraldPath = '';
    if (c2.length > 0) {
      emeraldPath = `M ${c2[0].x} ${c2[0].y}`;
      for (let i = 1; i < c2.length; i++) {
        emeraldPath += ` L ${c2[i].x} ${c2[i].y}`;
      }
      if (c8.length > 0) {
        const lastC8 = c8[c8.length - 1];
        emeraldPath += ` L ${tempToX(50)} ${lastC8.y}`;
        for (let i = c8.length - 1; i >= 0; i--) {
          emeraldPath += ` L ${c8[i].x} ${c8[i].y}`;
        }
        const firstC8 = c8[0];
        emeraldPath += ` L ${tempToX(firstC8.temp)} ${rhToY(0)} L ${tempToX(0)} ${rhToY(0)} L ${tempToX(0)} ${c2[0].y}`;
      }
      emeraldPath += ' Z';
    }

    // 3. Middle-Lower Amber Zone (Caution: Delta T 8 to 10°C)
    let midAmberPath = '';
    if (c8.length > 0 && c10.length > 0) {
      midAmberPath = `M ${c8[0].x} ${c8[0].y}`;
      for (let i = 1; i < c8.length; i++) {
        midAmberPath += ` L ${c8[i].x} ${c8[i].y}`;
      }
      const lastC10 = c10[c10.length - 1];
      midAmberPath += ` L ${tempToX(50)} ${lastC10.y}`;
      for (let i = c10.length - 1; i >= 0; i--) {
        midAmberPath += ` L ${c10[i].x} ${c10[i].y}`;
      }
      const firstC10 = c10[0];
      midAmberPath += ` L ${tempToX(firstC10.temp)} ${rhToY(0)} L ${tempToX(c8[0].temp)} ${rhToY(0)}`;
      midAmberPath += ' Z';
    }

    // 4. Bottom Rose/Red Zone (Hazard: Delta T > 10°C)
    let rosePath = '';
    if (c10.length > 0) {
      rosePath = `M ${c10[0].x} ${c10[0].y}`;
      for (let i = 1; i < c10.length; i++) {
        rosePath += ` L ${c10[i].x} ${c10[i].y}`;
      }
      rosePath += ` L ${tempToX(50)} ${rhToY(0)} L ${tempToX(c10[0].temp)} ${rhToY(0)}`;
      rosePath += ' Z';
    }

    return { topAmberPath, emeraldPath, midAmberPath, rosePath };
  }, [deltaTCurves, tempToX, rhToY]);

  // Handle Mouse Events for Hover & Click Simulation
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const svgPointX = (clientX / rect.width) * svgWidth;
    const svgPointY = (clientY / rect.height) * svgHeight;

    if (
      svgPointX >= margin.left &&
      svgPointX <= margin.left + plotWidth &&
      svgPointY >= margin.top &&
      svgPointY <= margin.top + plotHeight
    ) {
      const temp = xToTemp(svgPointX);
      const rh = yToRh(svgPointY);
      const dt = calculateDeltaT(temp, rh);
      setHoveredPoint({ x: svgPointX, y: svgPointY, temp, rh, dt });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const svgPointX = (clientX / rect.width) * svgWidth;
    const svgPointY = (clientY / rect.height) * svgHeight;

    if (
      svgPointX >= margin.left &&
      svgPointX <= margin.left + plotWidth &&
      svgPointY >= margin.top &&
      svgPointY <= margin.top + plotHeight
    ) {
      const temp = xToTemp(svgPointX);
      const rh = yToRh(svgPointY);
      setPinnedPoint({ temp, rh });
      if (onSelectPoint) {
        onSelectPoint(temp, rh);
      }
    }
  };

  const resetPin = () => {
    setPinnedPoint(null);
    if (onSelectPoint) {
      onSelectPoint(currentTemp, currentHumidity);
    }
  };

  return (
    <div className={`bg-transparent p-0 transition-all duration-300 ${compact ? 'space-y-2' : 'space-y-3.5 max-w-3xl'} mx-auto w-full ${className}`}>
      
      {/* COMPACT MINIMALIST HEADER */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${compact ? 'pb-1.5' : 'pb-2.5'} border-b border-slate-200/70 dark:border-emerald-900/50`}>
        <div className="flex items-center gap-2">
          <span className={`${compact ? 'p-1' : 'p-1.5'} rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0`}>
            <Droplets className={compact ? "w-3.5 h-3.5" : "w-4 h-4"} />
          </span>
          <div>
            <h4 className={`${compact ? 'text-[11px] sm:text-xs' : 'text-xs sm:text-sm'} font-black text-slate-900 dark:text-white tracking-tight uppercase`}>
              TABELA DELTA T: CONDIÇÕES IDEAIS PARA APLICAÇÃO
            </h4>
            <span className={`${compact ? 'text-[9.5px]' : 'text-[11px]'} text-slate-500 dark:text-emerald-300/70 block font-medium`}>
              Matriz psicrométrica termodinâmica (Temperatura do Ar × Umidade Relativa)
            </span>
          </div>
        </div>

        {/* Live Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {pinnedPoint && (
            <button
              onClick={resetPin}
              className="px-2 py-0.5 text-[9.5px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              title="Restaurar clima da estação"
            >
              <RotateCcw className="w-3 h-3" />
              Resetar Ponto
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-emerald-950/60 border border-slate-200 dark:border-emerald-800/60 font-mono text-[11px] shadow-2xs">
            <span className="text-slate-700 dark:text-emerald-300 font-bold flex items-center gap-1">
              <Thermometer className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              {activeTemp.toFixed(1)}°C
            </span>
            <span className="text-slate-300 dark:text-emerald-800">•</span>
            <span className="text-sky-700 dark:text-sky-300 font-bold flex items-center gap-1">
              <Droplets className="w-3 h-3 text-sky-500" />
              {activeHumidity.toFixed(0)}%
            </span>
            <span className="text-slate-300 dark:text-emerald-800">•</span>
            <span className={`px-1.5 py-0.2 rounded font-black text-[10px] border ${suitability.badgeBg}`}>
              ΔT {activeDeltaT.toFixed(1)}°C
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowHelperInfo(!showHelperInfo)}
            className="p-1 rounded-lg text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-300 transition-colors cursor-pointer"
            title="Como ler a tabela psicrométrica"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Helper Drawer */}
      {showHelperInfo && (
        <div className="bg-slate-50/90 dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 rounded-xl p-2.5 text-xs text-slate-700 dark:text-emerald-200 animate-in fade-in duration-200 space-y-1">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1 text-[11px]">
            <Sparkles className="w-3 h-3 text-amber-500" />
            Interpretação Rápida de Delta T:
          </div>
          <p className="text-[10.5px] leading-relaxed text-slate-600 dark:text-emerald-300/80">
            A faixa verde (<strong>2°C a 8°C</strong>) garante absorção estomática máxima e perda mínima por evaporação. Abaixo de 2°C há risco de orvalho e inversão térmica; acima de 10°C as gotas evaporam instantaneamente no ar. <strong>Clique no gráfico</strong> para simular cenários operacionais.
          </p>
        </div>
      )}

      {/* TRANSPARENT VECTOR SVG CONTAINER */}
      <div className="relative overflow-hidden flex justify-center bg-transparent rounded-2xl p-0.5">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className={`w-full h-auto ${compact ? 'max-h-[255px] max-w-[540px]' : 'max-h-[380px] max-w-[624px]'} select-none cursor-crosshair transition-all duration-150`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        >
          <defs>
            {/* Elegant Clean Gradients */}
            <linearGradient id="topAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.92" />
            </linearGradient>

            <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.96" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.96" />
            </linearGradient>

            <linearGradient id="midAmberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.92" />
            </linearGradient>

            <linearGradient id="roseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#E11D48" stopOpacity="0.92" />
            </linearGradient>
          </defs>

          {/* 1. AGRONOMIC ZONES BACKGROUND */}
          <g id="agronomic-zones">
            <path d={zonePolygons.topAmberPath} fill="url(#topAmberGrad)" />
            <path d={zonePolygons.emeraldPath} fill="url(#emeraldGrad)" />
            <path d={zonePolygons.midAmberPath} fill="url(#midAmberGrad)" />
            <path d={zonePolygons.rosePath} fill="url(#roseGrad)" />
          </g>

          {/* 2. CRISP GRID */}
          <g id="grid-lines" stroke="#0f172a" strokeWidth="1" opacity="0.65">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(rh => (
              <line
                key={`grid-rh-${rh}`}
                x1={tempToX(minTemp)}
                y1={rhToY(rh)}
                x2={tempToX(maxTemp)}
                y2={rhToY(rh)}
              />
            ))}

            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(t => (
              <line
                key={`grid-t-${t}`}
                x1={tempToX(t)}
                y1={rhToY(minRh)}
                x2={tempToX(t)}
                y2={rhToY(maxRh)}
              />
            ))}
          </g>

          {/* 3. ISOBARIC DELTA T CURVES WITH SYMBOLS */}
          <g id="delta-t-curves">
            {/* Delta T = 2 (Dotted + Diamonds) */}
            {deltaTCurves[2] && deltaTCurves[2].length > 1 && (
              <g id="curve-dt-2">
                <path
                  d={`M ${deltaTCurves[2].map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                />
                {deltaTCurves[2]
                  .filter((_, idx) => idx % 10 === 0 && idx > 0)
                  .map((pt, i) => (
                    <polygon
                      key={`dt2-pt-${i}`}
                      points={`${pt.x},${pt.y - 3.5} ${pt.x + 3.5},${pt.y} ${pt.x},${pt.y + 3.5} ${pt.x - 3.5},${pt.y}`}
                      fill="#0f172a"
                      stroke="#ffffff"
                      strokeWidth="0.8"
                    />
                  ))}
              </g>
            )}

            {/* Delta T = 4 (Dotted + Squares) */}
            {deltaTCurves[4] && deltaTCurves[4].length > 1 && (
              <g id="curve-dt-4">
                <path
                  d={`M ${deltaTCurves[4].map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="1.6"
                  strokeDasharray="3 3"
                />
                {deltaTCurves[4]
                  .filter((_, idx) => idx % 10 === 0 && idx > 0)
                  .map((pt, i) => (
                    <rect
                      key={`dt4-pt-${i}`}
                      x={pt.x - 2.8}
                      y={pt.y - 2.8}
                      width="5.6"
                      height="5.6"
                      fill="#0f172a"
                      stroke="#ffffff"
                      strokeWidth="0.8"
                    />
                  ))}
              </g>
            )}

            {/* Delta T = 6 (Line + Triangles) */}
            {deltaTCurves[6] && deltaTCurves[6].length > 1 && (
              <g id="curve-dt-6">
                <path
                  d={`M ${deltaTCurves[6].map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
                {deltaTCurves[6]
                  .filter((_, idx) => idx % 10 === 0 && idx > 0)
                  .map((pt, i) => (
                    <polygon
                      key={`dt6-pt-${i}`}
                      points={`${pt.x},${pt.y - 3.5} ${pt.x + 3.2},${pt.y + 3} ${pt.x - 3.2},${pt.y + 3}`}
                      fill="#ea580c"
                      stroke="#ffffff"
                      strokeWidth="0.8"
                    />
                  ))}
              </g>
            )}

            {/* Delta T = 8 (Line + Crosses) */}
            {deltaTCurves[8] && deltaTCurves[8].length > 1 && (
              <g id="curve-dt-8">
                <path
                  d={`M ${deltaTCurves[8].map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="1.8"
                />
                {deltaTCurves[8]
                  .filter((_, idx) => idx % 10 === 0 && idx > 0)
                  .map((pt, i) => (
                    <g key={`dt8-pt-${i}`} transform={`translate(${pt.x}, ${pt.y})`}>
                      <line x1="-2.8" y1="-2.8" x2="2.8" y2="2.8" stroke="#0284c7" strokeWidth="2.2" />
                      <line x1="-2.8" y1="2.8" x2="2.8" y2="-2.8" stroke="#0284c7" strokeWidth="2.2" />
                    </g>
                  ))}
              </g>
            )}

            {/* Delta T = 10 (Dotted + Circles) */}
            {deltaTCurves[10] && deltaTCurves[10].length > 1 && (
              <g id="curve-dt-10">
                <path
                  d={`M ${deltaTCurves[10].map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="#0f172a"
                  strokeWidth="1.8"
                  strokeDasharray="3 3"
                />
                {deltaTCurves[10]
                  .filter((_, idx) => idx % 10 === 0 && idx > 0)
                  .map((pt, i) => (
                    <circle
                      key={`dt10-pt-${i}`}
                      cx={pt.x}
                      cy={pt.y}
                      r="3.2"
                      fill="#0f172a"
                      stroke="#ffffff"
                      strokeWidth="0.8"
                    />
                  ))}
              </g>
            )}

            {/* Delta T = 12, 14, 16, 18, 20 (Contours) */}
            {[12, 14, 16, 18, 20].map(dt => {
              const pts = deltaTCurves[dt];
              if (!pts || pts.length <= 1) return null;
              return (
                <path
                  key={`curve-dt-${dt}`}
                  d={`M ${pts.map(p => `${p.x} ${p.y}`).join(' L ')}`}
                  fill="none"
                  stroke="#1e293b"
                  strokeWidth="1.2"
                  opacity="0.85"
                />
              );
            })}
          </g>

          {/* 4. SOLID AXES BORDER */}
          <rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={plotHeight}
            fill="none"
            stroke="#0f172a"
            strokeWidth="2.5"
          />

          {/* 5. AXIS LABELS & TICKS */}
          {/* Y-Axis (0 to 100%) */}
          <g id="y-axis-labels" textAnchor="end" className="text-[10px] font-mono font-bold fill-slate-800 dark:fill-slate-200 select-none">
            {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(rh => (
              <text key={`ytick-${rh}`} x={margin.left - 5} y={rhToY(rh) + 3.5}>
                {rh}
              </text>
            ))}
          </g>

          <text
            x={-(margin.top + plotHeight / 2)}
            y={14}
            transform="rotate(-90)"
            textAnchor="middle"
            className="text-[11px] font-bold fill-slate-700 dark:fill-slate-300 tracking-wider select-none uppercase"
          >
            Umidade relativa (%)
          </text>

          {/* X-Axis (0 to 50°C) */}
          <g id="x-axis-labels" textAnchor="middle" className="text-[10px] font-mono font-bold fill-slate-800 dark:fill-slate-200 select-none">
            {[0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50].map(t => (
              <text key={`xtick-${t}`} x={tempToX(t)} y={margin.top + plotHeight + 15}>
                {t}
              </text>
            ))}
          </g>

          <text
            x={margin.left + plotWidth / 2}
            y={margin.top + plotHeight + 33}
            textAnchor="middle"
            className="text-[11px] font-bold fill-slate-700 dark:fill-slate-300 tracking-wider select-none uppercase"
          >
            Temperatura ºC
          </text>

          {/* 6. RIGHT SIDE ISOBAR LEGEND */}
          <g id="right-legend" transform={`translate(${svgWidth - margin.right + 12}, ${margin.top})`}>
            <text x="0" y="8" className="text-[11px] font-black fill-slate-900 dark:fill-white uppercase tracking-wider">
              Delta T
            </text>
            <line x1="0" y1="13" x2="72" y2="13" stroke="#64748b" strokeWidth="1" />

            {/* 2 */}
            <g transform="translate(0, 28)">
              <line x1="0" y1="0" x2="24" y2="0" stroke="#0f172a" strokeWidth="1.8" strokeDasharray="3 2" />
              <polygon points="12,-3.5 15.5,0 12,3.5 8.5,0" fill="#0f172a" />
              <text x="32" y="3.5" className="text-[10px] font-bold fill-slate-800 dark:fill-slate-200 font-mono">2</text>
            </g>

            {/* 4 */}
            <g transform="translate(0, 50)">
              <line x1="0" y1="0" x2="24" y2="0" stroke="#0f172a" strokeWidth="1.8" strokeDasharray="3 2" />
              <rect x="9.5" y="-2.5" width="5" height="5" fill="#0f172a" />
              <text x="32" y="3.5" className="text-[10px] font-bold fill-slate-800 dark:fill-slate-200 font-mono">4</text>
            </g>

            {/* 6 */}
            <g transform="translate(0, 72)">
              <line x1="0" y1="0" x2="24" y2="0" stroke="#ea580c" strokeWidth="1.8" />
              <polygon points="12,-3 15,2.5 9,2.5" fill="#ea580c" />
              <text x="32" y="3.5" className="text-[10px] font-bold fill-slate-800 dark:fill-slate-200 font-mono">6</text>
            </g>

            {/* 8 */}
            <g transform="translate(0, 94)">
              <line x1="0" y1="0" x2="24" y2="0" stroke="#0284c7" strokeWidth="1.8" />
              <g transform="translate(12, 0)">
                <line x1="-2.5" y1="-2.5" x2="2.5" y2="2.5" stroke="#0284c7" strokeWidth="2" />
                <line x1="-2.5" y1="2.5" x2="2.5" y2="-2.5" stroke="#0284c7" strokeWidth="2" />
              </g>
              <text x="32" y="3.5" className="text-[10px] font-bold fill-slate-800 dark:fill-slate-200 font-mono">8</text>
            </g>

            {/* 10 */}
            <g transform="translate(0, 116)">
              <line x1="0" y1="0" x2="24" y2="0" stroke="#0f172a" strokeWidth="1.8" strokeDasharray="3 2" />
              <circle cx="12" cy="0" r="3" fill="#0f172a" />
              <text x="32" y="3.5" className="text-[10px] font-bold fill-slate-800 dark:fill-slate-200 font-mono">10</text>
            </g>

            {/* 12 */}
            <g transform="translate(0, 138)">
              <line x1="0" y1="0" x2="24" y2="0" stroke="#78350f" strokeWidth="2" />
              <text x="32" y="3.5" className="text-[10px] font-bold fill-slate-800 dark:fill-slate-200 font-mono">12</text>
            </g>

            {/* 14 */}
            <g transform="translate(0, 160)">
              <line x1="0" y1="0" x2="24" y2="0" stroke="#581c87" strokeWidth="2" />
              <text x="32" y="3.5" className="text-[10px] font-bold fill-slate-800 dark:fill-slate-200 font-mono">14</text>
            </g>

            {/* 16 */}
            <g transform="translate(0, 182)">
              <line x1="0" y1="0" x2="24" y2="0" stroke="#134e4a" strokeWidth="2" />
              <text x="32" y="3.5" className="text-[10px] font-bold fill-slate-800 dark:fill-slate-200 font-mono">16</text>
            </g>

            {/* 18 */}
            <g transform="translate(0, 204)">
              <line x1="0" y1="0" x2="24" y2="0" stroke="#881337" strokeWidth="2" />
              <text x="32" y="3.5" className="text-[10px] font-bold fill-slate-800 dark:fill-slate-200 font-mono">18</text>
            </g>

            {/* 20 */}
            <g transform="translate(0, 226)">
              <line x1="0" y1="0" x2="24" y2="0" stroke="#022c22" strokeWidth="2" />
              <text x="32" y="3.5" className="text-[10px] font-bold fill-slate-800 dark:fill-slate-200 font-mono">20</text>
            </g>
          </g>

          {/* 7. FIXED INTERSECTION POINT TARGET (STABLE, LOCALIZED & CLEAN) */}
          <g id="active-marker" transform={`translate(${tempToX(activeTemp)}, ${rhToY(activeHumidity)})`}>
            {/* Projection guidelines to axes */}
            <line
              x1="0"
              y1="0"
              x2={-(tempToX(activeTemp) - margin.left)}
              y2="0"
              stroke="#0f172a"
              strokeWidth="1.2"
              strokeDasharray="2.5 2.5"
              opacity="0.8"
            />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={margin.top + plotHeight - rhToY(activeHumidity)}
              stroke="#0f172a"
              strokeWidth="1.2"
              strokeDasharray="2.5 2.5"
              opacity="0.8"
            />

            {/* Outer Target Ring (Static & Contained - No Outward Flyout) */}
            <circle
              cx="0"
              cy="0"
              r="11"
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.8"
              opacity="0.75"
            />

            {/* Center Target Dot */}
            <circle
              cx="0"
              cy="0"
              r="5.5"
              fill={suitability.markerColor}
              stroke="#ffffff"
              strokeWidth="2.2"
            />
            <circle cx="0" cy="0" r="1.5" fill="#ffffff" />

            {/* Value Tag */}
            <g transform="translate(10, -18)">
              <rect
                x="0"
                y="0"
                width="72"
                height="18"
                rx="5"
                fill="#0f172a"
                opacity="0.92"
              />
              <text
                x="36"
                y="12.5"
                textAnchor="middle"
                className="text-[9.5px] font-mono font-black fill-white"
              >
                ΔT {activeDeltaT.toFixed(1)}°C
              </text>
            </g>
          </g>

          {/* 8. HOVER FLOATING TOOLTIP */}
          {hoveredPoint && (
            <g id="hover-marker" transform={`translate(${hoveredPoint.x}, ${hoveredPoint.y})`}>
              <circle cx="0" cy="0" r="3.5" fill="#ffffff" stroke="#0284c7" strokeWidth="2" />
              <g transform="translate(10, -40)">
                <rect
                  x="0"
                  y="0"
                  width="108"
                  height="34"
                  rx="5"
                  fill="#020617"
                  stroke="#38bdf8"
                  strokeWidth="1"
                  opacity="0.95"
                />
                <text x="6" y="13" className="text-[9.5px] font-bold fill-sky-300 font-mono">
                  {hoveredPoint.temp}°C • {hoveredPoint.rh}% UR
                </text>
                <text x="6" y="26" className="text-[10.5px] font-black fill-emerald-400 font-mono">
                  Delta T: {hoveredPoint.dt.toFixed(1)}°C
                </text>
              </g>
            </g>
          )}
        </svg>
      </div>

      {/* COMPACT BOTTOM LEGEND BAR */}
      <div className={`grid grid-cols-1 sm:grid-cols-3 ${compact ? 'gap-1.5 text-[10.5px]' : 'gap-2 text-xs'} font-semibold`}>
        <div className={`flex items-center gap-1.5 ${compact ? 'p-1.5' : 'p-2'} rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300`}>
          <div className="w-2.5 h-2.5 rounded-sm bg-[#10B981] shadow-2xs shrink-0" />
          <span className="truncate">Adequada (2 a 8°C)</span>
        </div>
        <div className={`flex items-center gap-1.5 ${compact ? 'p-1.5' : 'p-2'} rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300`}>
          <div className="w-2.5 h-2.5 rounded-sm bg-[#F59E0B] shadow-2xs shrink-0" />
          <span className="truncate">Arriscada (&lt;2° ou 8-10°C)</span>
        </div>
        <div className={`flex items-center gap-1.5 ${compact ? 'p-1.5' : 'p-2'} rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300`}>
          <div className="w-2.5 h-2.5 rounded-sm bg-[#F43F5E] shadow-2xs shrink-0" />
          <span className="truncate">Inadequada (&gt;10°C)</span>
        </div>
      </div>

      {/* COMPACT RECOMMENDATION CARD */}
      <div className={`${compact ? 'p-2 rounded-lg' : 'p-3 rounded-xl'} border ${suitability.cardBg} transition-all`}>
        <div className="flex items-start gap-2">
          <suitability.icon className={`${compact ? 'w-3.5 h-3.5 mt-0.5' : 'w-4 h-4 mt-0.5'} shrink-0 ${
            suitability.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
            suitability.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
            'text-rose-600 dark:text-rose-400'
          }`} />
          <div className="space-y-0.5 text-xs flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`font-black ${compact ? 'text-[11px]' : 'text-xs'} ${suitability.textColor}`}>
                {suitability.label}
              </span>
              <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-white/80 dark:bg-emerald-950/90 border border-slate-200 dark:border-emerald-800/80 font-bold text-slate-700 dark:text-emerald-300">
                T: {activeTemp.toFixed(1)}°C • UR: {activeHumidity.toFixed(0)}% • Bulbo Úmido: {activeWetBulb.toFixed(1)}°C
              </span>
            </div>
            <p className={`${compact ? 'text-[10px]' : 'text-[11px]'} text-slate-600 dark:text-emerald-200/80 leading-tight`}>
              {suitability.desc}
            </p>
            <div className={`${compact ? 'text-[10px]' : 'text-[11px]'} font-bold text-slate-900 dark:text-white pt-0.5`}>
              📋 <strong>Diretriz:</strong> {suitability.action}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DeltaTMatrixChart;
