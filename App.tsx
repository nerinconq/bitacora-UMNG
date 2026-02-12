
import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';
import katex from 'katex';
import html2canvas from 'html2canvas';
import {
  FileText, Users, Settings, Table as TableIcon, BarChart, Download,
  Upload, X, Link as LinkIcon, RefreshCw, Save, FolderOpen, Plus, Trash2,
  Layers, Info, ArrowUp, ChevronLeft, ChevronRight, ImageIcon, ExternalLink, Loader2, Calculator,
  MinusCircle, PlusCircle, CheckCircle2, Star, Edit3, Save as SaveIcon, AlertCircle, TrendingUp, Settings2, BookOpen, HelpCircle, FlaskConical, Check,
  Database, Copy, Code
} from 'lucide-react';
import {
  LabReport, FormStep, MeasurementRow, MaterialRow, RegressionRow, RubricCriterion, Evaluation, RubricLevel,
  DataSeries, IndirectVariable, VariableConfig
} from './types';
import { calculateStats, parseNum, applyRuleOfGold, formatMeasure } from './utils/calculations';
import { formatStudentName } from './utils/formatters';
import { DesmosGraph } from './components/DesmosGraph';




const DEFAULT_RUBRIC: RubricCriterion[] = [
  {
    id: 'crit-1',
    section: FormStep.General,
    category: 'APRENDIZAJE-INVESTIGATIVO',
    title: 'TÍTULO, RESUMEN, BIBLIOGRAFÍA Y ORTOGRAFÍA',
    weight: 30,
    levels: [
      { label: 'EXCELENTE', points: 1.5, description: 'Título preciso, resumen relevante con metodología clara y bibliografía completa.' },
      { label: 'MUY BUENO', points: 1.2, description: 'Título claro, resumen relevante pero metodología poco clara.' },
      { label: 'BUENO', points: 1.05, description: 'Incluye título y resumen básico, faltan palabras clave relacionadas.' },
      { label: 'PROMEDIO', points: 0.9, description: 'Falta título o resumen, carece de concisión y metodología.' },
      { label: 'INCUMPLE', points: 0.01, description: 'Ausencia de compromiso.' }
    ]
  },
  {
    id: 'crit-2',
    section: FormStep.TextContent,
    category: 'APRENDIZAJE PRÁCTICO-PRESENCIAL',
    title: 'INTRODUCCIÓN, OBJETIVOS Y MARCO CONCEPTUAL',
    weight: 15,
    levels: [
      { label: 'EXCELENTE', points: 0.75, description: 'Hipótesis verificables, marco conceptual sólido y contrastación paso a paso.' },
      { label: 'MUY BUENO', points: 0.6, description: 'Hipótesis claras, marco conceptual conciso pero sin propuesta de contrastación.' },
      { label: 'BUENO', points: 0.53, description: 'Hipótesis verificables pero sin soporte teórico apropiado.' },
      { label: 'PROMEDIO', points: 0.45, description: 'Hipótesis poco clara y marco conceptual demasiado breve.' },
      { label: 'INCUMPLE', points: 0.01, description: 'Ausencia de compromiso o falta de relación técnica.' }
    ]
  },
  {
    id: 'crit-3',
    section: FormStep.Experimental,
    category: 'APRENDIZAJE PRÁCTICO-PRESENCIAL',
    title: 'METODOLOGÍA (MATERIALES Y MONTAJE)',
    weight: 12.5,
    levels: [
      { label: 'EXCELENTE', points: 0.625, description: 'Procedimiento claro y materiales descritos adecuadamente.' },
      { label: 'BUENO', points: 0.435, description: 'Procedimiento claro pero descripción de equipos insuficiente.' },
      { label: 'INCUMPLE', points: 0.01, description: 'No describe materiales ni equipos.' }
    ]
  },
  {
    id: 'crit-4',
    section: FormStep.Data,
    category: 'APRENDIZAJE DE MODELOS DE GOBERNANZA',
    title: 'TOMA DE DATOS Y CONFORMACIÓN DE GRUPOS',
    weight: 20,
    levels: [
      { label: 'CONCERTADO', points: 1.0, description: 'Datos reportados apropiadamente durante la jornada de laboratorio.' },
      { label: 'INCUMPLE', points: 0.01, description: 'Datos incompletos o falta de reporte en jornada.' }
    ]
  },
  {
    id: 'crit-5',
    section: FormStep.Analysis,
    category: 'APRENDIZAJE PERMANENTE-CRÍTICO',
    title: 'DISCUSIÓN Y CONCLUSIONES',
    weight: 22.5,
    levels: [
      { label: 'EXCELENTE', points: 1.125, description: 'Gráficas relevantes, análisis profundo e incertidumbres consideradas.' },
      { label: 'MUY BUENO', points: 0.9, description: 'Gráficas adecuadas pero argumento débil frente a la hipótesis.' },
      { label: 'INCUMPLE', points: 0.01, description: 'Ausencia de gráficas o conclusiones irrelevantes.' }
    ]
  }
];

const INITIAL_SERIES: DataSeries = {
  id: 'series-default',
  name: 'Serie 1',
  precisionX: 3, precisionY: 3,
  numMeasurements: 10, numRepetitionsDep: 3, numRepetitionsIndep: 5,
  varDep: { id: 'vdep-1', name: 'Distancia', symbol: 'x', unit: 'm', multiplier: 0.001, uncertainty: 0.5 },
  varIndep: { id: 'vind-1', name: 'Tiempo', symbol: 't', unit: 's', multiplier: 1, uncertainty: 0.01 },
  extraVariables: [],
  measurements: Array(10).fill(null).map((_, i) => ({
    n: i + 1, d: Array(10).fill(''), i: Array(10).fill(''), others: {}, dX: '0.01', dY: '0.5'
  })),
  indirectVariables: []
};

const INITIAL_REPORT: LabReport = {
  practiceNo: '', title: '', dateDev: new Date().toISOString().split('T')[0], dateDelivery: '',
  leader: '', int2: '', int3: '', int4: '', teacher: 'Nelson Rincon',
  abstract: '', introduction: '', objectiveGeneral: '', objectivesSpecific: '', hypothesis: '', marcoConceptual: '',
  montajeText: '', materials: [
    { id: 'mat-1', item: 'Regla', qty: '1', category: 'LABORATORY', description: 'Medición longitud' },
    { id: 'mat-2', item: 'Calibrador', qty: '1', category: 'LABORATORY', description: 'Alta precisión' }
  ],
  procedimiento: '', logoUrl: '', setupImageUrl: '', graphImageUrl: '', desmosLink: '',

  // Legacy fields (optional/ignored by new logic but kept for type safety if needed)
  precisionX: 3, precisionY: 3,
  numMeasurements: 10, numRepetitionsDep: 3, numRepetitionsIndep: 5,
  varDep: INITIAL_SERIES.varDep,
  varIndep: INITIAL_SERIES.varIndep,
  measurements: INITIAL_SERIES.measurements,

  analysis: '', conclusions: '', bibliography: '',
  rubric: DEFAULT_RUBRIC,
  evaluations: [],

  dataSeries: [INITIAL_SERIES],
  activeSeriesIndex: 0,
  images: {}
};

const steps = [
  { id: FormStep.General, label: 'GENERAL', icon: <Users size={18} /> },
  { id: FormStep.TextContent, label: 'TEORÍA', icon: <FileText size={18} /> },
  { id: FormStep.Experimental, label: 'MONTAJE', icon: <Settings size={18} /> },
  { id: FormStep.Data, label: 'DATOS', icon: <TableIcon size={18} /> },
  { id: FormStep.Analysis, label: 'RESULTADOS', icon: <BarChart size={18} /> },
];

const calculateRowAvgs = (row: MeasurementRow, series: DataSeries) => {
  const dVals = row.d.slice(0, series.numRepetitionsDep).map(v => parseNum(v)).filter(v => !isNaN(v));
  const iVals = row.i.slice(0, series.numRepetitionsIndep).map(v => parseNum(v)).filter(v => !isNaN(v));

  const dAvgRaw = dVals.length > 0 ? dVals.reduce((a, b) => a + b, 0) / dVals.length : 0;
  const iAvgRaw = iVals.length > 0 ? iVals.reduce((a, b) => a + b, 0) / iVals.length : 0;

  return {
    dAvg: dAvgRaw * series.varDep.multiplier,
    iAvg: iAvgRaw * series.varIndep.multiplier,
    dAvgRaw,
    iAvgRaw,
    dX: parseNum(row.dX) || series.varIndep.uncertainty,
    dY: parseNum(row.dY) || series.varDep.uncertainty,
    getExtraAvg: (evId: string) => {
      const ev = series.extraVariables.find(e => e.id === evId);
      if (!ev) return 0;
      const reps = ev.numRepetitions || 1;
      let sum = 0;
      let count = 0;
      for (let i = 0; i < reps; i++) {
        const rawVal = row.others[`${evId}_${i}`] || (i === 0 ? row.others[evId] : '');
        const val = parseNum(rawVal);
        if (!isNaN(val)) { sum += val; count++; }
      }
      return count > 0 ? (sum / count) * (ev.multiplier || 1) : 0;
    }
  };
};

const evaluateFormula = (formula: string, values: Record<string, number>): number => {
  try {
    let parsed = formula.includes('=') ? formula.split('=').pop()! : formula;
    // Sort keys by length descending to replace longer symbols first
    const keys = Object.keys(values).sort((a, b) => b.length - a.length);

    keys.forEach(sym => {
      // Use regex to replace whole words only, case-sensitive
      parsed = parsed.replace(new RegExp(`\\b${sym}\\b`, 'g'), values[sym].toString());
    });

    // Sanitization & Math functions mapping
    parsed = parsed.replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\blog\b/g, 'Math.log10')
      .replace(/\bln\b/g, 'Math.log')
      .replace(/\^/g, '**')
      .replace(/\bpi\b/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E');

    // Security check: only allow digits, arithmetic, parens, and Math.
    if (!/^[\d\.\+\-\*\/\(\)\sMath\.\w]+$/.test(parsed)) return NaN;

    return new Function(`return (${parsed})`)();
  } catch (e) {
    return NaN;
  }
};

const calculateIndirectValues = (row: MeasurementRow, series: DataSeries) => {
  const { iAvg, dAvg, dX, dY, getExtraAvg } = calculateRowAvgs(row, series);
  const symX = series.varIndep.symbol || 'x';
  const symY = series.varDep.symbol || 'y';

  const baseValues = { [symX]: iAvg, [symY]: dAvg };

  const extraValues = series.extraVariables.reduce((acc, ev) => {
    const val = getExtraAvg(ev.id);
    return { ...acc, [ev.symbol]: isNaN(val) ? 0 : val };
  }, {});

  let currentContext = { ...baseValues, ...extraValues };
  const results: (IndirectVariable & { value: number; error: number; relError: number; pctError: number })[] = [];

  series.indirectVariables.forEach(iv => {
    const val = evaluateFormula(iv.formula, currentContext);

    let error = 0;
    try {
      const delta = 1e-5;
      const d_dx = (evaluateFormula(iv.formula, { ...currentContext, [symX]: iAvg + delta }) - val) / delta;
      const d_dy = (evaluateFormula(iv.formula, { ...currentContext, [symY]: dAvg + delta }) - val) / delta;

      let variance = Math.pow(d_dx * dX, 2) + Math.pow(d_dy * dY, 2);

      series.extraVariables.forEach(ev => {
        const evSym = ev.symbol;
        const evVal = getExtraAvg(ev.id);
        const rowUnc = parseFloat(row.others[`${ev.id}_unc`] || ev.uncertainty.toString() || '0');
        const val_p = evaluateFormula(iv.formula, { ...currentContext, [evSym]: evVal + delta });
        const d_dev = (val_p - val) / delta;
        variance += Math.pow(d_dev * rowUnc, 2);
      });

      error = Math.sqrt(variance);
    } catch (e) { error = NaN; }

    const relError = Math.abs(val) > 1e-15 ? error / Math.abs(val) : 0;
    const pctError = relError * 100;

    if (iv.symbol) {
      currentContext = { ...currentContext, [iv.symbol]: isNaN(val) ? 0 : val };
    }

    results.push({ ...iv, value: val, error: error, relError, pctError });
  });

  return results;
};

const getRegressionData = (series: DataSeries): RegressionRow[] => {
  return series.measurements.map(r => {
    const avgs = calculateRowAvgs(r, series);
    // Use raw values for regression or averaged? 
    // Historically we used avgs.iAvg and avgs.dAvg.
    const x = avgs.iAvg;
    const y = avgs.dAvg;

    // For consistency with display which often uses rounded values, we might want to round here.
    // But for regression accuracy, raw logic is better. Reverting to logic found in previous turns.
    return {
      n: r.n,
      x, y,
      x2: x * x,
      y2: y * y,
      xy: x * y
    };
  }).filter(r => (r.y !== 0 || r.x !== 0) && !isNaN(r.y) && !isNaN(r.x));
};

const imageToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (url.startsWith('data:')) { resolve(url); return; }
    const img = new Image();
    const proxyUrl = url.includes('desmos.com')
      ? `https://images.weserv.nl/?url=${encodeURIComponent(url.replace('https://', ''))}`
      : url;
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try { resolve(canvas.toDataURL('image/png')); } catch (e) { reject(e); }
      } else { reject(new Error('Canvas context failed')); }
    };
    img.onerror = () => reject(new Error('Image load failed: ' + url));
    img.src = proxyUrl;
  });
};

const ExtraVarPanel = ({ series, onUpdate }: { series: DataSeries, onUpdate: (vars: VariableConfig[]) => void }) => {
  const [newVar, setNewVar] = useState<Partial<VariableConfig>>({ name: '', symbol: '', unit: '', uncertainty: 0, multiplier: 1 });

  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddOrUpdate = () => {
    if (!newVar.name || !newVar.symbol) return;

    if (editingId) {
      const updated = series.extraVariables.map(v => v.id === editingId ? { ...v, ...newVar } as VariableConfig : v);
      onUpdate(updated);
      setEditingId(null);
    } else {
      const v: VariableConfig = {
        id: `ev-${Date.now()}`,
        name: newVar.name,
        symbol: newVar.symbol,
        unit: newVar.unit || '',
        multiplier: newVar.multiplier || 1,
        uncertainty: newVar.uncertainty || 0,
        numRepetitions: newVar.numRepetitions || 1
      };
      onUpdate([...series.extraVariables, v]);
    }
    setNewVar({ name: '', symbol: '', unit: '', uncertainty: 0, multiplier: 1, numRepetitions: 1 });
  };

  const handleEdit = (v: VariableConfig) => {
    setNewVar(v);
    setEditingId(v.id);
  };


  return (
    <div className="bg-white p-8 rounded-[3rem] shadow-xl border-2 border-slate-50 mb-10">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-emerald-100/50 rounded-xl text-emerald-600"><Settings size={20} /></div>
        <h4 className="font-black text-emerald-900 uppercase tracking-widest text-xs">Variables Adicionales de Medida (Parámetros)</h4>
      </div>

      <div className="grid grid-cols-12 gap-4 bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 items-end">
        <div className="col-span-3">
          <InputMini label="Nombre (ej. Masa)" value={newVar.name} onChange={v => setNewVar({ ...newVar, name: v })} />
        </div>
        <div className="col-span-2">
          <InputMini label="Símbolo (ej. \rho)" value={newVar.symbol} onChange={v => setNewVar({ ...newVar, symbol: v })} />
          <span className="text-[9px] text-slate-400 block mt-1">Usa LaTeX: \rho, \theta, \Delta</span>
        </div>
        <div className="col-span-2">
          <InputMini label="Unidad (kg)" value={newVar.unit} onChange={v => setNewVar({ ...newVar, unit: v })} />
        </div>
        <div className="col-span-2">
          <SmartNumberInput label="Factor" value={newVar.multiplier} onChange={(v: number) => setNewVar({ ...newVar, multiplier: v || 1 })} />
        </div>
        <div className="col-span-1">
          <InputMini label="Reps" type="number" value={newVar.numRepetitions || 1} onChange={v => setNewVar({ ...newVar, numRepetitions: parseInt(v) || 1 })} />
        </div>
        <div className="col-span-2">
          <SmartNumberInput label="Incertidumbre (+/-)" value={newVar.uncertainty} onChange={(v: number) => setNewVar({ ...newVar, uncertainty: v || 0 })} />
        </div>
        <div className="col-span-3">
          <button onClick={handleAddOrUpdate} className={`w-full text-white p-3 rounded-xl transition-colors shadow-lg text-[10px] font-black uppercase tracking-widest flex items-center justify-center ${editingId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'}`}>
            {editingId ? <Edit3 size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
            {editingId ? 'ACTUALIZAR' : 'AGREGAR'}
          </button>
          {editingId && <button onClick={() => { setEditingId(null); setNewVar({ name: '', symbol: '', unit: '', uncertainty: 0, multiplier: 1, numRepetitions: 1 }); }} className="w-full mt-2 text-[9px] font-black uppercase text-slate-400 hover:text-slate-600">Cancelar Edición</button>}
        </div>
      </div>

      {series.extraVariables.length > 0 && (
        <div className="mt-6 space-y-2">
          {series.extraVariables.map(ev => (
            <div key={ev.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center space-x-4">
                <span className="font-mono font-black text-emerald-800 bg-emerald-50 px-2 py-1 rounded text-xs">{ev.symbol}</span>
                <span className="text-[11px] font-bold text-slate-600 uppercase">{ev.name} <span className="text-slate-300 mx-2">|</span> <span className="normal-case text-slate-400">Unidad: {ev.unit}</span> <span className="text-slate-300 mx-2">|</span> <span className="normal-case text-slate-400">x{ev.multiplier}</span> <span className="text-slate-300 mx-2">|</span> <span className="normal-case text-slate-400">Δ: {ev.uncertainty}</span></span>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => handleEdit(ev)} className="text-blue-200 hover:text-blue-500 transition-colors bg-blue-50 p-1.5 rounded-lg"><Settings size={14} /></button>
                <button onClick={() => onUpdate(series.extraVariables.filter(v => v.id !== ev.id))} className="text-red-200 hover:text-red-500 transition-colors bg-red-50 p-1.5 rounded-lg"><Trash2 size={14} /></button>
              </div>            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const renderErrorFormula = (iv: IndirectVariable, series: DataSeries) => {
  const syms: { sym: string; dSym: string; val: number; unc: number }[] = [];
  const row1 = series.measurements[0];
  if (!row1) return '';

  const { iAvg, dAvg, dX, dY, getExtraAvg } = calculateRowAvgs(row1, series);
  const indirects = calculateIndirectValues(row1, series);

  // 1. Detect Independent (Case Sensitive)
  if (new RegExp(`\\b${series.varIndep.symbol}\\b`).test(iv.formula)) {
    syms.push({ sym: series.varIndep.symbol, dSym: `\\Delta ${series.varIndep.symbol}`, val: iAvg, unc: dX });
  }
  // 2. Detect Dependent (Case Sensitive)
  if (new RegExp(`\\b${series.varDep.symbol}\\b`).test(iv.formula)) {
    syms.push({ sym: series.varDep.symbol, dSym: `\\Delta ${series.varDep.symbol}`, val: dAvg, unc: dY });
  }
  // 3. Detect Extra Variables (Case Sensitive)
  series.extraVariables.forEach(ev => {
    if (new RegExp(`\\b${ev.symbol}\\b`).test(iv.formula)) {
      const unc = parseFloat(row1.others[`${ev.id}_unc`] || ev.uncertainty.toString() || '0');
      syms.push({ sym: ev.symbol, dSym: `\\Delta ${ev.symbol}`, val: getExtraAvg(ev.id), unc });
    }
  });
  // 4. Detect previous Indirect Variables (Case Sensitive)
  series.indirectVariables.forEach(prevIv => {
    if (prevIv.id !== iv.id && new RegExp(`\\b${prevIv.symbol}\\b`).test(iv.formula)) {
      const calc = indirects.find(res => res.id === prevIv.id);
      if (calc) {
        syms.push({ sym: prevIv.symbol, dSym: `\\Delta ${prevIv.symbol}`, val: calc.value, unc: calc.error });
      }
    }
  });

  if (syms.length === 0) return '';

  const delta = 1e-6;
  const context = syms.reduce((acc, s) => ({ ...acc, [s.sym]: s.val }), {});
  const baseVal = evaluateFormula(iv.formula, context);

  // Power factor detection and relative notation
  const theoreticalTerms: string[] = [];
  const numTerms: string[] = [];
  let totalRelVar = 0;

  syms.forEach(s => {
    const perturbed = { ...context, [s.sym]: s.val + delta };
    const partial = (evaluateFormula(iv.formula, perturbed) - baseVal) / delta;

    // n_i factor (power/coefficient)
    const n_iRaw = (Math.abs(baseVal) > 1e-15 && Math.abs(s.val) > 1e-15) ? (s.val / baseVal) * partial : 1;
    const n_i = Math.abs(Math.round(n_iRaw * 2) / 2 - n_iRaw) < 0.05 ? Math.round(n_iRaw * 2) / 2 : n_iRaw;
    const n_i_abs = Math.abs(n_i);
    const n_i_fmt = (n_i_abs === 1) ? "" : (n_i_abs === 0.5 ? "0.5" : n_i_abs.toFixed(1)).replace(/\.0$/, '');

    theoreticalTerms.push(`\\left( ${n_i_fmt} \\frac{\\Delta ${s.sym}}{${s.sym}} \\right)^2`);

    const relUnc = Math.abs(s.val) > 1e-15 ? s.unc / Math.abs(s.val) : 0;
    const termVal = n_i * relUnc;
    totalRelVar += Math.pow(termVal, 2);

    // Explicit fraction substitution for clarity
    const subFrac = `\\frac{${s.unc.toPrecision(3)}}{${s.val.toPrecision(4)}}`;
    numTerms.push(`(${n_i_fmt ? n_i_fmt + ' \\cdot ' : ''}${subFrac})^2`);
  });

  const totalError = Math.abs(baseVal) * Math.sqrt(totalRelVar);

  return `$ ${iv.symbol} = ${baseVal.toPrecision(4)}; \\quad \\Delta ${iv.symbol} = |${iv.symbol}| \\sqrt{ ${theoreticalTerms.join(' + ')} } = ${Math.abs(baseVal).toPrecision(4)} \\sqrt{ ${numTerms.join(' + ')} } \\approx ${totalError.toPrecision(3)} $`;
};

const IndirectVarPanel: React.FC<{ series: DataSeries; onUpdate: (vars: IndirectVariable[]) => void }> = ({ series, onUpdate }) => {
  const [newVar, setNewVar] = useState<Partial<IndirectVariable>>({ name: '', symbol: '', unit: '', formula: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAddOrUpdate = () => {
    if (!newVar.name || !newVar.symbol || !newVar.formula) return;

    if (editingId) {
      // Update existing
      const updated = series.indirectVariables.map(v => v.id === editingId ? { ...v, ...newVar } as IndirectVariable : v);
      onUpdate(updated);
      setEditingId(null);
    } else {
      // Add new
      const v: IndirectVariable = {
        id: `ind-${Date.now()}`,
        name: newVar.name!,
        symbol: newVar.symbol!,
        unit: newVar.unit!,
        formula: newVar.formula!,
        precision: 3
      };
      onUpdate([...series.indirectVariables, v]);
    }
    setNewVar({ name: '', symbol: '', unit: '', formula: '' });
  };

  const handleEdit = (v: IndirectVariable) => {
    setNewVar(v);
    setEditingId(v.id);
  };

  const getErrorTypeSuggestion = (formula: string) => {
    if (/[*/]/.test(formula) && !/[+\-]/.test(formula)) return "Relativa (Productos/Cocientes)";
    if (/[+\-]/.test(formula) && !/[*/]/.test(formula)) return "Absoluta (Sumas/Restas)";
    return "Mixta / Compleja";
  };

  return (
    <div className="bg-white p-10 rounded-[3rem] shadow-lg border-2 border-purple-50">
      <h3 className="text-[10px] font-black text-purple-600 uppercase tracking-widest flex items-center mb-6">
        <Calculator className="mr-2" size={16} /> Magnitudes Indirectas & Propagación de Errores
      </h3>

      <div className="flex gap-4 mb-6 flex-wrap">
        {series.indirectVariables.map(v => (
          <div key={v.id} onClick={() => handleEdit(v)} className={`flex items-center gap-3 px-4 py-2 rounded-2xl border-2 cursor-pointer hover:scale-105 transition-transform ${editingId === v.id ? 'bg-purple-100 border-purple-300 ring-2 ring-purple-200' : 'bg-purple-50 border-purple-100'}`}>
            <span className="w-8 h-8 flex items-center justify-center bg-white rounded-lg font-black text-purple-700 text-xs shadow-sm">{v.symbol}</span>
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase text-purple-400">{v.name}</span>
              <span className="text-[10px] text-purple-800 font-mono font-bold tracking-tighter opacity-70">{v.formula}</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onUpdate(series.indirectVariables.filter(iv => iv.id !== v.id)); }} className="ml-2 text-purple-300 hover:text-red-400"><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-3 space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Nombre</label>
          <input className="w-full p-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-purple-200 text-sm" placeholder="Ej: Velocidad" value={newVar.name} onChange={e => setNewVar({ ...newVar, name: e.target.value })} />
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Símbolo</label>
          <input className="w-full p-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-purple-200 text-sm font-bold text-purple-700" placeholder="v" value={newVar.symbol} onChange={e => setNewVar({ ...newVar, symbol: e.target.value })} />
        </div>
        <div className="md:col-span-2 space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Unidad</label>
          <input className="w-full p-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-purple-200 text-sm" placeholder="m/s" value={newVar.unit} onChange={e => setNewVar({ ...newVar, unit: e.target.value })} />
        </div>
        <div className="md:col-span-4 space-y-1">
          <label className="text-[9px] font-bold text-slate-400 uppercase ml-2">Fórmula (use {series.varIndep.symbol || 't'}, {series.varDep.symbol || 'x'})</label>
          <input className="w-full p-3 rounded-xl border-none shadow-sm focus:ring-2 focus:ring-purple-200 text-sm font-mono tracking-wide" placeholder="x / t" value={newVar.formula} onChange={e => setNewVar({ ...newVar, formula: e.target.value })} />
          {newVar.formula && (
            <div className="flex flex-col gap-1 mt-1 px-2">
              <span className="text-[9px] text-purple-400 flex items-center">
                <Info size={10} className="mr-1" /> Sugerencia: {getErrorTypeSuggestion(newVar.formula)}
              </span>
              {/* PREVIEW ERROR FORMULA */}
              <span className="text-[10px] text-slate-600 mt-1 block" dangerouslySetInnerHTML={{ __html: renderLatexToHtml(renderErrorFormula({ ...newVar, symbol: newVar.symbol || 'Z' } as IndirectVariable, series)) }} />
            </div>
          )}
        </div>
        <div className="md:col-span-1">
          <button onClick={handleAddOrUpdate} className="w-full p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-95 flex items-center justify-center">
            {editingId ? <ArrowUp size={20} /> : <Plus size={20} />}
          </button>
        </div>
      </div>
      <p className="text-[9px] text-slate-400 mt-4 ml-2 font-medium">
        * Use los símbolos definidos de las variables inde/dep y variables extra. Funciones soportadas: sqrt, sin, cos, tan, log, ln, ^.
        La incertidumbre se calculará automáticamente usando derivadas numéricas de acuerdo a la ecuación mostrada.
      </p>
    </div>
  );
};

const App: React.FC = () => {


  const [report, setReport] = useState<LabReport>(() => {
    const saved = localStorage.getItem('physics_report_umng_v14.0');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: If no dataSeries, create one from legacy fields
        if (!parsed.dataSeries || !Array.isArray(parsed.dataSeries)) {
          const migratedSeries: DataSeries = {
            id: 'migrated-legacy',
            name: 'Serie 1',
            precisionX: parsed.precisionX ?? 3,
            precisionY: parsed.precisionY ?? 3,
            numMeasurements: parsed.numMeasurements || 10,
            numRepetitionsDep: parsed.numRepetitionsDep || 3,
            numRepetitionsIndep: parsed.numRepetitionsIndep || 5,
            varDep: parsed.varDep || INITIAL_SERIES.varDep,
            varIndep: parsed.varIndep || INITIAL_SERIES.varIndep,
            extraVariables: [],
            measurements: (Array.isArray(parsed.measurements) ? parsed.measurements : INITIAL_SERIES.measurements).map((m: any) => ({ ...m, others: m.others || {} })),
            indirectVariables: Array.isArray(parsed.indirectVariables) ? parsed.indirectVariables.map((iv: any) => ({ ...iv, precision: iv.precision ?? 3 })) : []
          };
          return {
            ...INITIAL_REPORT,
            ...parsed,
            dataSeries: [migratedSeries],
            activeSeriesIndex: 0,
            evaluations: Array.isArray(parsed.evaluations) ? parsed.evaluations : [],
            images: parsed.images || {},
            rubric: (Array.isArray(parsed.rubric) ? parsed.rubric : DEFAULT_RUBRIC).map((crit: any) => {
              if (Object.values(FormStep).includes(crit.section)) return crit;
              const def = DEFAULT_RUBRIC.find(dc => dc.title === crit.title);
              return { ...crit, section: def ? def.section : FormStep.General };
            })
          };
        }

        // Fix existing series if they miss new fields
        const fixedSeries = parsed.dataSeries.map((s: any) => ({
          ...s,
          extraVariables: s.extraVariables || [],
          measurements: s.measurements.map((m: any) => ({ ...m, others: m.others || {} })),
          indirectVariables: (s.indirectVariables || []).map((iv: any) => ({ ...iv, precision: iv.precision ?? 3 }))
        }));

        return {
          ...INITIAL_REPORT,
          ...parsed,
          hypothesis: parsed.hypothesis || '',
          dataSeries: fixedSeries,
          evaluations: Array.isArray(parsed.evaluations) ? parsed.evaluations : [],
          images: parsed.images || {},
          rubric: (Array.isArray(parsed.rubric) ? parsed.rubric : DEFAULT_RUBRIC).map((crit: any) => {
            if (Object.values(FormStep).includes(crit.section)) return crit;
            const def = DEFAULT_RUBRIC.find(dc => dc.title === crit.title);
            return { ...crit, section: def ? def.section : FormStep.General };
          })
        };
      } catch (e) {
        return INITIAL_REPORT;
      }
    }
    return INITIAL_REPORT;
  });
  const [currentStep, setCurrentStep] = useState<FormStep>(FormStep.General);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTableRotated, setIsTableRotated] = useState(false);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [isDocente, setIsDocente] = useState(false);
  const [evaluatingCriterion, setEvaluatingCriterion] = useState<RubricCriterion | null>(null);
  const [isManagingRubric, setIsManagingRubric] = useState(false);
  const [editingCriterion, setEditingCriterion] = useState<RubricCriterion | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<MaterialRow | null>(null);

  // Material Section State
  const [materialsTab, setMaterialsTab] = useState<'LIST' | 'GALLERY'>('LIST');
  const [showMatDesc, setShowMatDesc] = useState(true);

  // Backup Modal State

  const handleSaveMaterial = () => {
    if (!editingMaterial) return;
    const isNew = !report.materials.some(m => m.id === editingMaterial.id);
    let newMaterials;
    if (isNew) {
      newMaterials = [...report.materials, editingMaterial];
    } else {
      newMaterials = report.materials.map(m => m.id === editingMaterial.id ? editingMaterial : m);
    }
    updateReport({ materials: newMaterials });
    setEditingMaterial(null);
  };

  const hiddenRenderRef = useRef<HTMLDivElement>(null);
  const lastFetchedDesmosId = useRef<string>("");

  useEffect(() => {
    localStorage.setItem('physics_report_umng_v14.0', JSON.stringify(report));
  }, [report]);

  // Safe accessor for active series
  const activeSeries = report.dataSeries[report.activeSeriesIndex] || { ...INITIAL_SERIES, extraVariables: [] };
  // Ensure extraVariables exists even if fallback failed (though migration should handle it)
  if (!activeSeries.extraVariables) activeSeries.extraVariables = [];

  useEffect(() => {
    const syncDesmos = async () => {
      const link = report.desmosLink || "";
      const match = link.match(/([a-z0-9]{10})/i);
      const graphId = match ? match[1] : null;
      if (graphId && graphId !== lastFetchedDesmosId.current) {
        setIsLoadingGraph(true);
        lastFetchedDesmosId.current = graphId;
        const thumbUrl = `https://grapher.desmos.com/calc_thumbnails/${graphId}`;
        try {
          const b64 = await imageToBase64(thumbUrl);
          updateReport({ graphImageUrl: b64 });
        } catch (e) {
          updateReport({ graphImageUrl: `https://images.weserv.nl/?url=grapher.desmos.com/calc_thumbnails/${graphId}` });
        } finally {
          setIsLoadingGraph(false);
        }
      } else if (!graphId && link === "") {
        updateReport({ graphImageUrl: "" });
        lastFetchedDesmosId.current = "";
      }
    };
    const timer = setTimeout(syncDesmos, 400);
    return () => clearTimeout(timer);
  }, [report.desmosLink]);

  const updateReport = (updates: Partial<LabReport>) => {
    setReport(prev => {
      const updated = { ...prev, ...updates };
      if (updates.varIndep?.uncertainty !== undefined) {
        updated.measurements = updated.measurements.map(m => ({ ...m, dX: updates.varIndep!.uncertainty.toString() }));
      }
      if (updates.varDep?.uncertainty !== undefined) {
        updated.measurements = updated.measurements.map(m => ({ ...m, dY: updates.varDep!.uncertainty.toString() }));
      }
      if (updates.numMeasurements !== undefined) {
        const currentCount = prev.measurements.length;
        const newCount = updates.numMeasurements;
        if (newCount > currentCount) {
          const extra = Array(newCount - currentCount).fill(null).map((_, i) => ({
            n: currentCount + i + 1, d: Array(10).fill(''), i: Array(10).fill(''),
            dX: updated.varIndep.uncertainty.toString(), dY: updated.varDep.uncertainty.toString()
          }));
          updated.measurements = [...prev.measurements, ...extra];
        } else if (newCount < currentCount) {
          updated.measurements = prev.measurements.slice(0, newCount);
        }
      }
      return updated;
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof LabReport) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => updateReport({ [field]: ev.target?.result as string });
      reader.readAsDataURL(file);
    }
  };

  const sanitizeFilename = (name: string) => {
    console.log("Sanitizing input:", name);
    const sanitized = name.replace(/[^a-z0-9áéíóúñü \-_]/gi, '_').trim() || 'Desconocido';
    console.log("Sanitized output:", sanitized);
    return sanitized;
  };

  const handleExportJSON = () => {
    try {
      console.log("Iniciando exportación JSON...");
      if (!report) throw new Error("El reporte está vacío");

      const dataStr = JSON.stringify(report, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", url);

      const rawName = report.practiceNo || 'Backup';
      const safeName = sanitizeFilename(rawName);
      const fileName = `Informe_Fisica_UMNG_${safeName}.json`;

      console.log("Filename generated:", fileName); // DEBUG
      downloadAnchorNode.setAttribute("download", fileName);

      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();

      // Extended timeout for debugging
      setTimeout(() => {
        document.body.removeChild(downloadAnchorNode);
        URL.revokeObjectURL(url);
        console.log("Exportación finalizada. Anchor removido.");
      }, 500);

    } catch (err) {
      console.error("Error exportando JSON:", err);
      alert(`Error al exportar: ${(err as Error).message}`);
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const imported = JSON.parse(ev.target?.result as string);
          const safeReport: LabReport = {
            ...INITIAL_REPORT,
            ...imported,
            evaluations: Array.isArray(imported.evaluations) ? imported.evaluations : [],
            rubric: Array.isArray(imported.rubric) ? imported.rubric : DEFAULT_RUBRIC,
            measurements: Array.isArray(imported.measurements) ? imported.measurements : INITIAL_REPORT.measurements,
            materials: Array.isArray(imported.materials) ? imported.materials : INITIAL_REPORT.materials
          };
          setReport(safeReport);
          lastFetchedDesmosId.current = "";
          alert("Informe cargado correctamente.");
        } catch (err) { alert("Error al cargar el archivo JSON. Formato incompatible."); }
      };
      reader.readAsText(file);
    }
  };

  const handleResetReport = () => {
    const confirmReset = window.confirm("¿Estás seguro de que deseas borrar todo el informe? Esta acción no se puede deshacer.");
    if (confirmReset) {
      setReport({
        ...INITIAL_REPORT,
        dateDev: new Date().toISOString().split('T')[0]
      });
      lastFetchedDesmosId.current = "";
      alert("Informe reiniciado correctamente.");
    }
  };

  const captureSectionBox = async (htmlContent: string, width: number): Promise<{ data: string, height: number } | null> => {
    if (!hiddenRenderRef.current) return null;
    hiddenRenderRef.current.innerHTML = `
      <div id="capture-container" style="padding: 25px; background: white; width: ${width * 3}px; height: auto; min-height: 50px; font-size: 14px; color: #1e293b; line-height: 1.6;
                  border: 2px solid #004b87; box-sizing: border-box;
                  background-image: linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px);
                  background-size: 15px 15px;">
        <div class="latex-content">${htmlContent}</div>
      </div>`;

    await new Promise(r => setTimeout(r, 200));
    const container = hiddenRenderRef.current?.querySelector('#capture-container') as HTMLElement;
    if (!container) return null;

    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });
      const ratio = canvas.height / canvas.width;
      return {
        data: canvas.toDataURL('image/png'),
        height: (width) * ratio
      };
    } catch (e) {
      console.error("Error in html2canvas:", e);
      return null;
    }
  };

  /* ---------------------- HELPER FOR UPDATES ---------------------- */
  const updateActiveSeries = (updates: Partial<DataSeries>) => {
    setReport(prev => {
      const newSeriesList = [...prev.dataSeries];
      const currentIndex = prev.activeSeriesIndex;
      const current = newSeriesList[currentIndex];

      const updated = { ...current, ...updates };

      if (updates.numMeasurements !== undefined) {
        const currentCount = current.measurements.length;
        const newCount = updates.numMeasurements;
        if (newCount > currentCount) {
          const extra = Array(newCount - currentCount).fill(null).map((_, i) => ({
            n: currentCount + i + 1,
            d: Array(10).fill(''),
            i: Array(10).fill(''),
            dX: updated.varIndep.uncertainty.toString(),
            dY: updated.varDep.uncertainty.toString(),
            others: {}
          }));
          updated.measurements = [...current.measurements, ...extra];
        } else if (newCount < currentCount) {
          updated.measurements = current.measurements.slice(0, newCount);
        }
      }

      if (updates.varIndep?.uncertainty !== undefined) {
        updated.measurements = updated.measurements.map(m => ({ ...m, dX: updates.varIndep!.uncertainty.toString() }));
      }
      if (updates.varDep?.uncertainty !== undefined) {
        updated.measurements = updated.measurements.map(m => ({ ...m, dY: updates.varDep!.uncertainty.toString() }));
      }

      newSeriesList[currentIndex] = updated;
      return { ...prev, dataSeries: newSeriesList };
    });
  };

  /* ---------------------- DROP HANDLER FOR VARIABLES ---------------------- */
  const handleVarDrop = (e: React.DragEvent, targetRole: 'indep' | 'dep') => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('sourceId');
    if (!sourceId) return;

    // Deep clone activeSeries to mutate safely
    const series = JSON.parse(JSON.stringify(activeSeries)) as DataSeries;

    const extraIdx = series.extraVariables.findIndex(v => v.id === sourceId);
    const indirectIdx = series.indirectVariables.findIndex(v => v.id === sourceId);

    if (extraIdx === -1 && indirectIdx === -1) return; // Not found

    // 1. Identify Target Config & key
    const targetConfig = targetRole === 'indep' ? series.varIndep : series.varDep;
    const targetKey = targetRole === 'indep' ? 'i' : 'd';
    const targetReps = targetRole === 'indep' ? series.numRepetitionsIndep : series.numRepetitionsDep;

    // 2. Backup Target -> New Extra Variable
    const backupExtra: VariableConfig = {
      ...targetConfig,
      id: crypto.randomUUID(), // New unique ID
      isCalculated: false, // Stored data is never calculated by formula
      formula: undefined,
      numRepetitions: targetReps
    };
    // Move data from i/d to others
    series.measurements = series.measurements.map(row => {
      const newOthers = { ...row.others };
      const vals = (row as any)[targetKey] as string[];
      for (let k = 0; k < targetReps; k++) {
        newOthers[`${backupExtra.id}_${k}`] = vals[k] || '';
      }
      if (targetReps === 1) newOthers[backupExtra.id] = vals[0] || '';
      return { ...row, others: newOthers };
    });
    series.extraVariables.push(backupExtra);

    // 3. Promote Source -> Target
    let newConfig: VariableConfig;

    if (extraIdx !== -1) {
      // --- Extra Variable Source ---
      const sourceExtra = series.extraVariables[extraIdx];
      newConfig = {
        ...sourceExtra,
        isCalculated: false,
        formula: undefined
      };
      // Move data from others to i/d
      const newReps = sourceExtra.numRepetitions || 1;
      series.measurements = series.measurements.map(row => {
        const newVals: string[] = [];
        for (let k = 0; k < newReps; k++) {
          // Try getting value from others
          const val = row.others[`${sourceExtra.id}_${k}`] !== undefined ? row.others[`${sourceExtra.id}_${k}`] : (k === 0 ? (row.others[sourceExtra.id] || '') : '');
          newVals.push(val);
          // Cleanup from others
          delete row.others[`${sourceExtra.id}_${k}`];
        }
        if (newReps === 1) delete row.others[sourceExtra.id];

        if (targetRole === 'indep') return { ...row, i: newVals };
        else return { ...row, d: newVals };
      });

      // Update Repetitions
      if (targetRole === 'indep') series.numRepetitionsIndep = newReps;
      else series.numRepetitionsDep = newReps;

      // Remove from Extra List
      series.extraVariables.splice(extraIdx, 1);

    } else {
      // --- Indirect Variable Source ---
      const sourceIndirect = series.indirectVariables[indirectIdx];
      newConfig = {
        id: sourceIndirect.id,
        name: sourceIndirect.name,
        symbol: sourceIndirect.symbol,
        unit: sourceIndirect.unit,
        multiplier: 1,
        uncertainty: 0,
        precision: sourceIndirect.precision,
        isCalculated: true,
        formula: sourceIndirect.formula
      };

      // Indirects usually single value? Or per row?
      // We'll assume 1 repetition for calculated vars
      if (targetRole === 'indep') series.numRepetitionsIndep = 1;
      else series.numRepetitionsDep = 1;

      // Initialize i/d with calculated values?
      // We need to run calculation once here to populate initial view
      series.measurements = series.measurements.map(row => {
        if (targetRole === 'indep') return { ...row, i: [''] };
        else return { ...row, d: [''] };
      });

      // Remove from Indirect List
      series.indirectVariables.splice(indirectIdx, 1);
    }

    // 4. Apply New Config to Target
    if (targetRole === 'indep') series.varIndep = newConfig;
    else series.varDep = newConfig;

    updateActiveSeries(series);
  };


  const handleDownloadPDF = async () => {
    setIsGenerating(true);
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const iBlue = [0, 75, 135] as [number, number, number];
    const iRed = [158, 27, 50] as [number, number, number];
    const pageBottomLimit = pageHeight - 15;

    try {
      const addSafeImage = async (data: string | undefined, x: number, y: number, w: number, h: number) => {
        if (!data) return;
        try {
          let finalData = data;
          if (!data.startsWith('data:')) { try { finalData = await imageToBase64(data); } catch (e) { } }
          let format = 'PNG'; if (finalData.startsWith('data:image/jpeg')) format = 'JPEG';
          doc.addImage(finalData, format, x, y, w, h, undefined, 'FAST');
        } catch (e) { console.error(e); }
      };

      const drawSectionHeader = (title: string, y: number) => {
        doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(...iBlue);
        doc.text(title.toUpperCase(), margin + 2, y);
        doc.setDrawColor(...iRed); doc.setLineWidth(1.2); doc.line(margin + 1, y + 2, margin + 26, y + 2);
        return y + 6;
      };

      if (report.logoUrl) await addSafeImage(report.logoUrl, margin, 10, 20, 20);
      doc.setFont("helvetica", "bold"); doc.setTextColor(...iBlue); doc.setFontSize(14);
      doc.text('Universidad Militar Nueva Granada', pageWidth / 2, 16, { align: 'center' });
      doc.setFontSize(9); doc.setFont("helvetica", "normal");
      doc.text('Facultad de Ciencias Básicas y Aplicadas - Departamento de Física', pageWidth / 2, 21, { align: 'center' });

      doc.setDrawColor(...iBlue); doc.setLineWidth(0.4); doc.rect(margin, 32, pageWidth - 2 * margin, 25);
      doc.setTextColor(0, 0, 0); doc.setFontSize(9);
      doc.text(`Práctica No: ${report.practiceNo}`, margin + 4, 38);
      doc.text(`Título: ${report.title}`, margin + 4, 43);
      doc.text(`Docente: ${report.teacher}`, margin + 4, 48);
      const names = [report.leader, report.int2, report.int3, report.int4].map(formatStudentName).filter(Boolean).join('; ');
      doc.text(`Integrantes: ${names}`, margin + 4, 53);

      const addBoxedSec = async (title: string, rawText: string, y: number) => {
        if (!rawText) return y;

        // 1. Dividir contenido en fragmentos (Texto vs Figuras LaTeX)
        const chunks: string[] = [];
        const regex = /\\begin(?:\[.*?\])?\{figure\}(?:\[.*?\])?([\s\S]*?)\\end\{figure\}/g;
        let lastIdx = 0;
        let match;

        while ((match = regex.exec(rawText)) !== null) {
          const textBefore = rawText.substring(lastIdx, match.index).trim();
          if (textBefore) chunks.push(textBefore);
          chunks.push(match[0]);
          lastIdx = regex.lastIndex;
        }
        const remainingText = rawText.substring(lastIdx).trim();
        if (remainingText) chunks.push(remainingText);

        if (chunks.length === 0) return y;

        // 2. Encabezado de sección
        if (y + 25 > pageBottomLimit) {
          doc.addPage();
          y = 20;
        }
        let currentY = drawSectionHeader(title, y);

        // 3. Procesar fragmentos con saltos de página inteligentes
        for (const chunk of chunks) {
          const html = renderLatexToHtml(chunk, report.images);
          const capture = await captureSectionBox(html, pageWidth - 2 * margin);
          if (!capture) continue;

          // Si el fragmento no cabe, saltamos de hoja
          if (currentY + capture.height > pageBottomLimit) {
            doc.addPage();
            currentY = 20;
          }

          await addSafeImage(capture.data, margin, currentY, pageWidth - 2 * margin, capture.height);
          currentY += capture.height + 5;
        }

        return currentY + 10;
      };

      let currentY = 65;
      currentY = await addBoxedSec('RESUMEN', report.abstract, currentY);
      currentY = await addBoxedSec('INTRODUCCIÓN', report.introduction, currentY);
      currentY = await addBoxedSec('OBJETIVO GENERAL', report.objectiveGeneral, currentY);
      currentY = await addBoxedSec('OBJETIVOS ESPECÍFICOS', report.objectivesSpecific, currentY);
      if (report.hypothesis && report.hypothesis.trim()) {
        currentY = await addBoxedSec('HIPÓTESIS', report.hypothesis, currentY);
      }

      // Marco Conceptual suele ser largo, verificamos espacio
      if (currentY + 40 > pageBottomLimit) { doc.addPage(); currentY = 20; }
      currentY = await addBoxedSec('MARCO CONCEPTUAL', report.marcoConceptual, currentY);

      currentY = await addBoxedSec('MONTAJE EXPERIMENTAL', report.montajeText, currentY);
      if (report.setupImageUrl) {
        if (currentY + 65 > pageBottomLimit) { doc.addPage(); currentY = 20; }
        await addSafeImage(report.setupImageUrl, margin + 30, currentY, 130, 60);
        currentY += 70;
      }

      // Materiales
      const matLab = report.materials.filter(m => m.category === 'LABORATORY');
      const matStu = report.materials.filter(m => m.category === 'STUDENT');

      // Helper to generate table HTML
      const genMatTable = (items: MaterialRow[], title: string) => {
        if (items.length === 0) return '';
        return `<div style="margin-bottom: 15px;">
            <div style="background: #004b87; color: white; padding: 4px 8px; font-weight: bold; font-size: 9px; text-transform: uppercase;">${title}</div>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
              <tr style="background: #f1f5f9; color: #334155;">
                <th style="padding: 4px 8px; border: 1px solid #e2e8f0; width: 75%; text-align: left;">Ítem / Descripción</th>
                <th style="padding: 4px 8px; border: 1px solid #e2e8f0; text-align: center; width: 25%;">Cant.</th>
              </tr>
              ${items.map(m => `<tr>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0;">
                    <div style="font-weight: bold; color: #004b87; margin-bottom: 2px;">${m.item}</div>
                    ${m.description ? `<div style="font-size: 8px; color: #64748b; line-height: 1.2; font-style: italic;">${m.description}</div>` : ''}
                </td>
                <td style="padding: 4px 8px; border: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #475569;">${m.qty}</td>
              </tr>`).join('')}
            </table>
          </div>`;
      };

      const materialsHtml = `
        ${genMatTable(matLab, 'MATERIAL DE LABORATORIO (INSTITUCIONAL)')}
        ${genMatTable(matStu, 'MATERIAL DEL ESTUDIANTE')}
      `;

      if (matLab.length + matStu.length > 0) {
        const matCapture = await captureSectionBox(materialsHtml, pageWidth - 2 * margin);
        if (matCapture) {
          if (currentY + matCapture.height + 10 > pageBottomLimit) { doc.addPage(); currentY = 20; }
          let startMatY = drawSectionHeader('MATERIALES Y EQUIPOS', currentY);
          await addSafeImage(matCapture.data, margin, startMatY, pageWidth - 2 * margin, matCapture.height);
          currentY = startMatY + matCapture.height + 10;
        }
      }

      currentY = await addBoxedSec('PROCEDIMIENTO', report.procedimiento, currentY);

      // Iterate over each data series
      for (const [idx, series] of report.dataSeries.entries()) {
        const isMulti = report.dataSeries.length > 1;

        // Series Header
        if (currentY + 20 > pageBottomLimit) { doc.addPage(); currentY = 20; }
        const seriesTitle = isMulti ? `SERIE ${idx + 1}: ${series.name.toUpperCase()}` : 'REGISTRO DE DATOS Y MEDIDAS';
        const startStatsY = drawSectionHeader(seriesTitle, currentY);
        currentY = startStatsY;

        // --- Data Table ---
        const indirectHeaders = series.indirectVariables.map(iv =>
          `<th style="padding: 4px; border: 1px solid #ddd; background: #7e22ce;">${iv.symbol} [${iv.unit}]</th><th style="padding: 4px; border: 1px solid #ddd; background: #6b21a8;">Δ${iv.symbol}</th>`
        ).join('');

        const extraHeaders = series.extraVariables.map(ev =>
          `<th style="padding: 4px; border: 1px solid #ddd; background: #064e3b;" colSpan="${(ev.numRepetitions || 1) + 1}">${ev.symbol} [${ev.unit}]</th><th style="padding: 4px; border: 1px solid #ddd; background: #065f46;">Δ${ev.symbol}</th>`
        ).join('');

        const dataHtml = `<table style="width: 100%; border-collapse: collapse; font-size: 8px;">
        <tr style="background: #004b87; color: white;">
            <th style="padding: 4px; border: 1px solid #ddd;">#</th>
            ${extraHeaders}
            <th style="padding: 4px; border: 1px solid #ddd;" colSpan="${series.numRepetitionsIndep}">${series.varIndep.name}</th>
            <th style="padding: 4px; border: 1px solid #ddd; background: #065f46;">ΔX</th>
            <th style="padding: 4px; border: 1px solid #ddd; background: #059669;">PROM X</th>
            <th style="padding: 4px; border: 1px solid #ddd;" colSpan="${series.numRepetitionsDep}">${series.varDep.name}</th>
            <th style="padding: 4px; border: 1px solid #ddd; background: #1e40af;">ΔY</th>
            <th style="padding: 4px; border: 1px solid #ddd; background: #2563eb;">PROM Y</th>
            ${indirectHeaders}
        </tr>
        ${series.measurements.map((r, i) => {
          const avgs = calculateRowAvgs(r, series);
          const indirects = calculateIndirectValues(r, series);
          const indCols = indirects.map(iv => `
                <td style="text-align:center; border:1px solid #ddd; background:#f3e8ff;">${isNaN(iv.value) ? '-' : iv.value.toExponential(3)}</td>
                <td style="text-align:center; border:1px solid #ddd; background:#fae8ff; font-weight:bold;">${isNaN(iv.error) ? '-' : iv.error.toExponential(1)}</td>
            `).join('');

          const extraCols = series.extraVariables.map(ev => {
            const reps = ev.numRepetitions || 1;
            const repCells = Array.from({ length: reps }).map((_, k) => {
              const val = r.others[`${ev.id}_${k}`] !== undefined ? r.others[`${ev.id}_${k}`] : (k === 0 ? (r.others[ev.id] || '') : '');
              return `<td style="text-align:center; border:1px solid #ddd; background:#ecfdf5;">${val}</td>`;
            }).join('');
            const avgVal = (avgs as any).getExtraAvg ? (avgs as any).getExtraAvg(ev.id) : 0;
            return `${repCells}
                     <td style="text-align:center; border:1px solid #ddd; background:#d1fae5; font-weight:bold;">${typeof avgVal === 'number' ? avgVal.toFixed(ev.precision ?? 2) : '0.00'}</td>
                     <td style="text-align:center; border:1px solid #ddd; background:#bef264; font-size:9px;">${ev.uncertainty}</td>`;
          }).join('');

          return `<tr>
                <td style="text-align:center; border:1px solid #ddd;">${i + 1}</td>
                ${extraCols}
                ${r.i.slice(0, series.numRepetitionsIndep).map(v => `<td style="text-align:center; border:1px solid #ddd;">${v}</td>`).join('')}
                <td style="text-align:center; border:1px solid #ddd; background:#ecfdf5; font-weight:bold;">${r.dX}</td>
                <td style="text-align:center; border:1px solid #ddd; background:#d1fae5; font-weight:bold;">${avgs.iAvgRaw.toFixed(series.precisionX)}</td>
                ${r.d.slice(0, series.numRepetitionsDep).map(v => `<td style="text-align:center; border:1px solid #ddd;">${v}</td>`).join('')}
                <td style="text-align:center; border:1px solid #ddd; background:#eff6ff; font-weight:bold;">${r.dY}</td>
                <td style="text-align:center; border:1px solid #ddd; background:#dbeafe; font-weight:bold;">${avgs.dAvgRaw.toFixed(series.precisionY)}</td>
                ${indCols}
            </tr>`;
        }).join('')}</table>`;

        if (isTableRotated) {
          // --- LANDSCAPE TABLE MODE ---
          // Capture with Landscape width (297mm - 2*margin)
          const landscapeWidth = 297 - 2 * margin;
          const dataCapture = await captureSectionBox(dataHtml, landscapeWidth);
          if (dataCapture) {
            doc.addPage('a4', 'l'); // Add Landscape Page
            let lY = 20;
            drawSectionHeader(isMulti ? `SERIE ${idx + 1}: ${series.name.toUpperCase()}` : 'REGISTRO DE DATOS Y MEDIDAS', lY);
            lY += 6;
            await addSafeImage(dataCapture.data, margin, lY, landscapeWidth, dataCapture.height);
            // Return to Portrait for next content
            doc.addPage('a4', 'p');
            currentY = 20;
          }
        } else {
          // --- STANDARD PORTRAIT MODE ---
          const dataCapture = await captureSectionBox(dataHtml, pageWidth - 2 * margin);
          if (dataCapture) {
            if (currentY + dataCapture.height + 10 > pageBottomLimit) { doc.addPage(); currentY = 20; }
            // Header was already drawn or managed above
            await addSafeImage(dataCapture.data, margin, currentY, pageWidth - 2 * margin, dataCapture.height);
            currentY += dataCapture.height + 10;
          }
        }

        // --- Regression Table ---
        const regData = getRegressionData(series);
        const regHtml = `<table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <tr style="background: #004b87; color: white;">
                <th style="padding: 5px; border: 1px solid #ddd;">X (${renderLatexToHtml(series.varIndep.unit)})</th>
                <th style="padding: 5px; border: 1px solid #ddd;">Y (${renderLatexToHtml(series.varDep.unit)})</th>
            </tr>
            ${regData.map(r => `<tr>
                <td style="text-align:center; border: 1px solid #ddd;">${r.x.toExponential(4)}</td>
                <td style="text-align:center; border: 1px solid #ddd;">${r.y.toExponential(4)}</td>
            </tr>`).join('')}
        </table>`;

        const regCapture = await captureSectionBox(regHtml, pageWidth - 2 * margin);
        if (regCapture) {
          if (currentY + regCapture.height + 10 > pageBottomLimit) { doc.addPage(); currentY = 20; }
          drawSectionHeader(isMulti ? `REGRESIÓN (Serie ${idx + 1})` : 'DATOS PROMEDIO PARA REGRESIÓN', currentY);
          currentY += 6;
          await addSafeImage(regCapture.data, margin, currentY, pageWidth - 2 * margin, regCapture.height);
          currentY += regCapture.height + 10;
        }

        // --- Stats ---
        const stats = calculateStats(regData);
        if (stats) {
          const estHtmlRaw = `<div style="display:grid; grid-template-cols: repeat(2, 1fr); gap: 10px; font-size: 11px;">
                <div>
                    <p>$n = ${stats.n}$</p>
                    <p>$\\sum x_i = ${stats.sumX.toExponential(4)}$</p>
                    <p>$\\sum y_i = ${stats.sumY.toExponential(4)}$</p>
                    <p>$\\sum x_i^2 = ${stats.sumX2.toExponential(4)}$</p>
                    <p>$\\Delta = n \\sum x_i^2 - (\\sum x_i)^2 = ${stats.delta.toExponential(4)}$</p>
                </div>
                <div>
                    <p>$M = ${stats.m.toExponential(4)}$</p>
                    <p>$B = ${stats.b.toExponential(4)}$</p>
                    <p>$\\sigma_M = ${stats.sigmaM.toExponential(4)}$</p>
                    <p>$\\sigma_B = ${stats.sigmaB.toExponential(4)}$</p>
                    <p>$r^2 = ${stats.r2.toFixed(6)}$</p>
                </div>
            </div>
            <div style="text-align: center; margin-top: 10px; border-top: 1px solid #ddd; padding-top: 5px;">
                <p style="font-weight: bold; font-size: 12px;">$y = (${stats.m.toExponential(3)})x + (${stats.b.toExponential(3)})$</p>
            </div>`;

          const estCapture = await captureSectionBox(renderLatexToHtml(estHtmlRaw), pageWidth - 2 * margin);
          if (estCapture) {
            if (currentY + estCapture.height + 10 > pageBottomLimit) { doc.addPage(); currentY = 20; }
            drawSectionHeader(isMulti ? `PARÁMETROS (Serie ${idx + 1})` : 'ESTIMACIÓN DE PARÁMETROS', currentY);
            currentY += 6;
            await addSafeImage(estCapture.data, margin, currentY, pageWidth - 2 * margin, estCapture.height);
            currentY += estCapture.height + 10;
          }
        }
      }

      currentY = await addBoxedSec('ANÁLISIS DE RESULTADOS', report.analysis, currentY);

      if (report.graphImageUrl) {
        if (currentY + 110 > pageBottomLimit) { doc.addPage(); currentY = 20; }
        drawSectionHeader('REPRESENTACIÓN GRÁFICA', currentY);
        await addSafeImage(report.graphImageUrl, margin + 5, currentY + 8, pageWidth - 2 * margin - 10, 100);
        if (report.desmosLink) {
          doc.setFontSize(8); doc.setTextColor(100, 100, 100);
          doc.text(`Link interactivo: ${report.desmosLink}`, margin + 5, currentY + 112);
        }
        currentY += 120;
      }

      currentY = await addBoxedSec('CONCLUSIONES', report.conclusions, currentY);
      currentY = await addBoxedSec('BIBLIOGRAFÍA', report.bibliography, currentY);

      doc.save(`Informe_Fisica_UMNG_${sanitizeFilename(report.practiceNo || 'Lab')}.pdf`);
    } catch (e) { console.error(e); alert("Error al generar PDF."); }
    setIsGenerating(false);
  };

  const handleEvaluate = (levelIndex: number) => {
    if (!evaluatingCriterion) return;
    const level = evaluatingCriterion.levels[levelIndex];
    if (!level) return;
    const newEval: Evaluation = {
      criterionId: evaluatingCriterion.id,
      selectedLevelIndex: levelIndex,
      levelLabel: level.label,
      score: level.points
    };
    const currentEvaluations = Array.isArray(report.evaluations) ? report.evaluations : [];
    const updatedEvals = [...currentEvaluations.filter(e => e.criterionId !== evaluatingCriterion.id), newEval];
    updateReport({ evaluations: updatedEvals });
    setEvaluatingCriterion(null);
  };

  const handleSaveCriterion = (crit: RubricCriterion) => {
    const isNew = !report.rubric.some(c => c.id === crit.id);
    let newRubric;
    if (isNew) {
      newRubric = [...report.rubric, crit];
    } else {
      newRubric = report.rubric.map(c => c.id === crit.id ? crit : c);
    }
    updateReport({ rubric: newRubric });
    setEditingCriterion(null);
  };

  const handleDeleteCriterion = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta competencia? Se perderán las evaluaciones asociadas.")) {
      const newRubric = report.rubric.filter(c => c.id !== id);
      const newEvals = (report.evaluations || []).filter(e => e.criterionId !== id);
      updateReport({ rubric: newRubric, evaluations: newEvals });
    }
  };

  const calculateCurrentGrade = () => {
    let total = 0;
    const evaluations = Array.isArray(report.evaluations) ? report.evaluations : [];
    const rubric = Array.isArray(report.rubric) ? report.rubric : DEFAULT_RUBRIC;
    rubric.forEach(crit => {
      const evaluation = evaluations.find(e => e.criterionId === crit.id);
      if (evaluation && evaluation.selectedLevelIndex !== null && evaluation.selectedLevelIndex !== undefined) {
        if (crit.levels && Array.isArray(crit.levels) && crit.levels[evaluation.selectedLevelIndex]) {
          total += crit.levels[evaluation.selectedLevelIndex].points;
        }
      }
    });
    return total.toFixed(2);
  };





  const addSeries = () => {
    setReport(prev => {
      const newSeries: DataSeries = {
        ...INITIAL_SERIES,
        id: `series-${Date.now()}`,
        name: `Serie ${prev.dataSeries.length + 1}`
      };
      return {
        ...prev,
        dataSeries: [...prev.dataSeries, newSeries],
        activeSeriesIndex: prev.dataSeries.length
      };
    });
  };

  const deleteSeries = (index: number) => {
    if (report.dataSeries.length <= 1) return;
    if (confirm("¿Eliminar esta serie de datos? Permanentemente.")) {
      setReport(prev => {
        const newSeries = prev.dataSeries.filter((_, i) => i !== index);
        const newIndex = index >= newSeries.length ? newSeries.length - 1 : index;
        return { ...prev, dataSeries: newSeries, activeSeriesIndex: newIndex };
      });
    }
  };

  const checkEvaluated = (stepId: FormStep) => {
    const rubric = Array.isArray(report.rubric) ? report.rubric : DEFAULT_RUBRIC;
    const criterion = rubric.find(c => c.section === stepId);
    const evaluations = Array.isArray(report.evaluations) ? report.evaluations : [];
    return evaluations.some(e => e.criterionId === criterion?.id && e.selectedLevelIndex !== null && e.selectedLevelIndex !== undefined);
  };

  const renderStep = () => {
    const rubric = Array.isArray(report.rubric) ? report.rubric : DEFAULT_RUBRIC;
    const criterion = rubric.find(c => c.section === currentStep);
    const isEvaluated = checkEvaluated(currentStep);
    const stepInfo = steps.find(s => s.id === currentStep);

    const header = (
      <StepHeader
        title={stepInfo?.label || ''}
        icon={stepInfo?.icon}
        criterion={criterion}
        isDocente={isDocente}
        onEdit={setEditingCriterion}
        onEvaluate={setEvaluatingCriterion}
        isEvaluated={isEvaluated}
      />
    );

    switch (currentStep) {
      case FormStep.General:
        return (
          <div className="space-y-10">
            {header}
            <div className="flex gap-10">
              <div className="w-48 h-48 border-2 border-dashed rounded-[3rem] flex items-center justify-center relative bg-white shadow-xl hover:border-blue-500 transition-all cursor-pointer overflow-hidden group hover:scale-105 active:scale-95">
                {report.logoUrl ? <img src={report.logoUrl} className="w-full h-full object-contain p-4" /> : <div className="text-center"><Upload className="mx-auto text-slate-300 mb-2" size={32} /><span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">LOGO</span></div>}
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, 'logoUrl')} />
              </div>
              <div className="flex-1 grid grid-cols-2 gap-6">
                <Input label="Práctica #" value={report.practiceNo} onChange={v => updateReport({ practiceNo: v })} />
                <Input label="Título de la Práctica" value={report.title} onChange={v => updateReport({ title: v })} />
                <Input label="Docente de Cátedra" value={report.teacher} onChange={v => updateReport({ teacher: v })} />
                <Input label="Fecha de Entrega" type="date" value={report.dateDelivery} onChange={v => updateReport({ dateDelivery: v })} />
              </div>
            </div>
            <div className="bg-blue-50/50 p-10 rounded-[4rem] border-2 border-blue-100/50 grid grid-cols-2 gap-6 relative shadow-inner">
              <div className="absolute top-[-12px] left-10 bg-blue-100 px-4 py-1 rounded-full text-[9px] font-black text-blue-600 uppercase tracking-[0.2em]">Identificación de Estudiantes</div>
              {['leader', 'int2', 'int3', 'int4'].map(k => (
                <div key={k} className="space-y-1">
                  <label className="text-[9px] font-black text-blue-800 uppercase ml-4 tracking-widest">{k === 'leader' ? 'Líder de Equipo' : 'Integrante'}</label>
                  <input className="w-full p-4 rounded-3xl border-none shadow-sm text-sm focus:ring-2 focus:ring-blue-300 bg-white" placeholder="Nombre completo" value={(report as any)[k]} onChange={e => updateReport({ [k]: e.target.value })} />
                </div>
              ))}
            </div>
            <Section title="Resumen (Abstract)" value={report.abstract} onChange={v => updateReport({ abstract: v })} help="Resuma brevemente la metodología y resultados clave." rows={6} report={report} updateReport={updateReport} />
          </div>
        );
      case FormStep.TextContent:
        return (
          <div className="space-y-12">
            {header}
            <Section title="Introducción Teórica" value={report.introduction} onChange={v => updateReport({ introduction: v })} help="Describa el fenómeno físico a estudiar." report={report} updateReport={updateReport} />
            <Section title="Objetivo General" value={report.objectiveGeneral} onChange={v => updateReport({ objectiveGeneral: v })} rows={3} report={report} updateReport={updateReport} />
            <Section title="Objetivos Específicos" value={report.objectivesSpecific} onChange={v => updateReport({ objectivesSpecific: v })} rows={5} report={report} updateReport={updateReport} />
            <Section title="Hipótesis" value={report.hypothesis} onChange={v => updateReport({ hypothesis: v })} help="Opcional: Describa la hipótesis de la práctica si aplica." rows={3} report={report} updateReport={updateReport} />
            <Section title="Marco Conceptual / Mapa Mental" value={report.marcoConceptual} onChange={v => updateReport({ marcoConceptual: v })} help="Puede incluir imágenes o diagramas usando Markdown." rows={8} report={report} updateReport={updateReport} />
          </div>
        );
      case FormStep.Experimental:
        return (
          <div className="space-y-12">
            {header}
            <div className="grid grid-cols-1 gap-10">
              <Section title="Descripción del Montaje" value={report.montajeText} onChange={v => updateReport({ montajeText: v })} report={report} updateReport={updateReport} />

              <div className="space-y-6">
                <h4 className="text-[10px] font-black text-[#004b87] uppercase tracking-[0.2em] border-b-2 border-[#9e1b32] pb-3 flex items-center justify-center">
                  <ImageIcon size={18} className="mr-3 text-[#9e1b32]" /> Esquema Experimental
                </h4>
                <div className="w-full max-w-5xl mx-auto aspect-video border-4 border-dashed border-[#004b87]/10 rounded-[3rem] bg-white flex items-center justify-center relative overflow-hidden group shadow-2xl hover:border-[#004b87]/30 transition-all">
                  {report.setupImageUrl ? <img src={report.setupImageUrl} className="w-full h-full object-contain p-4" /> : <div className="text-center group-hover:scale-110 transition-transform"><ImageIcon size={80} className="mx-auto text-slate-100 mb-4" /><span className="text-xs font-black text-slate-300 uppercase tracking-widest block">Arrastre o Clic para Subir Imagen</span></div>}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => handleImageUpload(e, 'setupImageUrl')} />
                </div>
              </div>
            </div>
            <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-2 border-slate-50 space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-[#9e1b32] pb-4 gap-4">
                <h3 className="text-sm font-black text-[#004b87] uppercase flex items-center tracking-[0.2em]"><Layers className="mr-3 w-5 h-5 text-[#9e1b32]" /> Materiales y Equipos</h3>

                <div className="flex items-center gap-4">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setMaterialsTab('LIST')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center ${materialsTab === 'LIST' ? 'bg-white text-[#004b87] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      <TableIcon size={14} className="mr-2" /> Listado
                    </button>
                    <button onClick={() => setMaterialsTab('GALLERY')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center ${materialsTab === 'GALLERY' ? 'bg-white text-[#004b87] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                      <ImageIcon size={14} className="mr-2" /> Galería
                    </button>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors">
                    <input type="checkbox" checked={showMatDesc} onChange={() => setShowMatDesc(!showMatDesc)} className="w-4 h-4 rounded border-slate-300 text-[#004b87] focus:ring-[#004b87]" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wide">Ver Detalles</span>
                  </label>

                  <button onClick={() => setEditingMaterial({ id: `mat-${Date.now()}`, item: '', qty: '1', category: 'LABORATORY', description: '' })} className="bg-[#004b87] text-white px-5 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-800 transition-all shadow-lg flex items-center"><Plus size={14} className="mr-2" /> AGREGAR</button>
                </div>
              </div>

              {materialsTab === 'LIST' ? (
                <div className="space-y-8">
                  {/* LABORATORY LIST */}
                  <div className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 overflow-hidden">
                    <div className="bg-slate-100/50 px-8 py-4 border-b border-slate-200 flex items-center">
                      <FlaskConical size={14} className="mr-3 text-slate-500" />
                      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Material de Laboratorio</h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {report.materials.filter(m => m.category === 'LABORATORY').map(m => (
                        <div key={m.id} className="p-4 hover:bg-white transition-colors group flex items-start gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {m.imageUrl ? <img src={m.imageUrl} className="w-full h-full object-cover" /> : <Settings size={18} className="text-slate-300" />}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex justify-between items-start mb-1">
                              <h5 className="font-black text-[#004b87] text-xs uppercase truncate pr-4">{m.item}</h5>
                              <span className="bg-slate-200 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-md">{m.qty}</span>
                            </div>
                            {showMatDesc && m.description && <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">{m.description}</p>}
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingMaterial(m)} className="p-1.5 text-blue-400 hover:bg-blue-50 rounded-lg"><Edit3 size={14} /></button>
                            <button onClick={() => updateReport({ materials: report.materials.filter(x => x.id !== m.id) })} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                      {report.materials.filter(m => m.category === 'LABORATORY').length === 0 && <div className="p-8 text-center text-[10px] text-slate-300 italic">No hay ítems registrados.</div>}
                    </div>
                  </div>

                  {/* STUDENT LIST */}
                  <div className="bg-emerald-50/30 rounded-[2.5rem] border border-emerald-100/50 overflow-hidden">
                    <div className="bg-emerald-100/30 px-8 py-4 border-b border-emerald-100/50 flex items-center">
                      <Users size={14} className="mr-3 text-emerald-600" />
                      <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Material del Estudiante</h4>
                    </div>
                    <div className="divide-y divide-emerald-100/50">
                      {report.materials.filter(m => m.category === 'STUDENT').map(m => (
                        <div key={m.id} className="p-4 hover:bg-emerald-50/20 transition-colors group flex items-start gap-4">
                          <div className="w-12 h-12 bg-white rounded-xl border border-emerald-100/50 flex-shrink-0 flex items-center justify-center overflow-hidden">
                            {m.imageUrl ? <img src={m.imageUrl} className="w-full h-full object-cover" /> : <Users size={18} className="text-emerald-200" />}
                          </div>
                          <div className="flex-1 min-w-0 pt-1">
                            <div className="flex justify-between items-start mb-1">
                              <h5 className="font-black text-emerald-800 text-xs uppercase truncate pr-4">{m.item}</h5>
                              <span className="bg-emerald-100 text-emerald-700 text-[9px] font-bold px-2 py-0.5 rounded-md">{m.qty}</span>
                            </div>
                            {showMatDesc && m.description && <p className="text-[10px] text-slate-500 leading-tight line-clamp-2">{m.description}</p>}
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setEditingMaterial(m)} className="p-1.5 text-emerald-500 hover:bg-emerald-100 rounded-lg"><Edit3 size={14} /></button>
                            <button onClick={() => updateReport({ materials: report.materials.filter(x => x.id !== m.id) })} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                      {report.materials.filter(m => m.category === 'STUDENT').length === 0 && <div className="p-8 text-center text-[10px] text-emerald-300 italic">No hay ítems registrados.</div>}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Institutional Cards (Gallery Mode) */}
                  <div className="bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center"><FlaskConical size={14} className="mr-2" /> Material de Laboratorio</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {report.materials.filter(m => m.category === 'LABORATORY').map(m => (
                        <div key={m.id} className="bg-white p-5 rounded-[2rem] border-2 border-slate-50 shadow-sm hover:border-blue-100 transition-all group relative">
                          <div className="absolute top-4 right-4 bg-slate-100 text-slate-500 font-bold text-[10px] px-2 py-1 rounded-lg">{m.qty}x</div>
                          <div className="w-16 h-16 bg-blue-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                            {m.imageUrl ? <img src={m.imageUrl} className="w-full h-full object-cover" /> : <Settings size={24} className="text-blue-200" />}
                          </div>
                          <h5 className="font-black text-[#004b87] text-xs uppercase mb-1">{m.item}</h5>
                          {showMatDesc && <p className="text-[10px] text-slate-500 leading-tight mb-4 min-h-[2.5em]">{m.description || 'Sin descripción'}</p>}
                          <div className="flex gap-2">
                            <button onClick={() => setEditingMaterial(m)} className="flex-1 bg-slate-50 text-blue-600 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-blue-50 transition-colors">Editar</button>
                            <button onClick={() => updateReport({ materials: report.materials.filter(x => x.id !== m.id) })} className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                      {report.materials.filter(m => m.category === 'LABORATORY').length === 0 && <p className="text-[10px] text-slate-300 italic p-4 text-center col-span-full">No hay materiales de laboratorio registrados.</p>}
                    </div>
                  </div>

                  {/* Student Cards (Gallery Mode) */}
                  <div className="bg-emerald-50/30 p-6 rounded-[2.5rem] border border-emerald-100/50">
                    <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-4 flex items-center"><Users size={14} className="mr-2" /> Material del Estudiante</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {report.materials.filter(m => m.category === 'STUDENT').map(m => (
                        <div key={m.id} className="bg-white p-5 rounded-[2rem] border-2 border-emerald-50/50 shadow-sm hover:border-emerald-100 transition-all group relative">
                          <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-600 font-bold text-[10px] px-2 py-1 rounded-lg">{m.qty}x</div>
                          <div className="w-16 h-16 bg-emerald-50 rounded-2xl mb-4 flex items-center justify-center overflow-hidden">
                            {m.imageUrl ? <img src={m.imageUrl} className="w-full h-full object-cover" /> : <Users size={24} className="text-emerald-200" />}
                          </div>
                          <h5 className="font-black text-emerald-800 text-xs uppercase mb-1">{m.item}</h5>
                          {showMatDesc && <p className="text-[10px] text-slate-500 leading-tight mb-4 min-h-[2.5em]">{m.description || 'Sin descripción'}</p>}
                          <div className="flex gap-2">
                            <button onClick={() => setEditingMaterial(m)} className="flex-1 bg-slate-50 text-emerald-600 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-50 transition-colors">Editar</button>
                            <button onClick={() => updateReport({ materials: report.materials.filter(x => x.id !== m.id) })} className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                      {report.materials.filter(m => m.category === 'STUDENT').length === 0 && <p className="text-[10px] text-slate-300 italic p-4 text-center col-span-full">No hay materiales de estudiante registrados.</p>}
                    </div>
                  </div>
                </>
              )}
            </div>
            <Section title="Procedimiento Experimental" value={report.procedimiento} onChange={v => updateReport({ procedimiento: v })} report={report} updateReport={updateReport} />
          </div>
        );
      case FormStep.Data:
        return (
          <div className="space-y-10">
            {header}
            {/* Series Management UI */}
            <div className="flex items-center space-x-4 mb-2 overflow-x-auto pb-4 px-2">
              {report.dataSeries.map((s, idx) => (
                <button
                  key={s.id}
                  onClick={() => updateReport({ activeSeriesIndex: idx })}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap border-2 ${report.activeSeriesIndex === idx
                    ? 'bg-[#004b87] text-white border-[#004b87] shadow-lg scale-105'
                    : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200 hover:text-blue-500'
                    }`}
                >
                  <span>{s.name}</span>
                  {report.dataSeries.length > 1 && (
                    <span
                      onClick={(e) => { e.stopPropagation(); deleteSeries(idx); }}
                      className="ml-2 p-1 hover:bg-red-100/20 rounded-full hover:text-red-200 transition-colors"
                    >
                      <Trash2 size={12} />
                    </span>
                  )}
                </button>
              ))}
              <button onClick={addSeries} className="bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl hover:bg-emerald-100 transition-colors border-2 border-emerald-100 shadow-sm active:scale-95">
                <Plus size={20} />
              </button>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border-2 border-slate-50 mb-0 flex items-center space-x-4">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">NOMBRE DE SERIE:</span>
              <input
                className="flex-1 text-lg font-black text-[#004b87] outline-none border-b-2 border-transparent focus:border-blue-100 transition-all placeholder-slate-200"
                value={activeSeries.name}
                onChange={(e) => updateActiveSeries({ name: e.target.value })}
                placeholder="Ej: Experimento 1"
              />
            </div>

            <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-2 border-slate-50 grid grid-cols-2 gap-12">
              <VarConfig title="Variable Independiente (X)" config={activeSeries.varIndep} onChange={v => updateActiveSeries({ varIndep: v })} reps={activeSeries.numRepetitionsIndep} onRepsChange={r => updateActiveSeries({ numRepetitionsIndep: r })} />
              <VarConfig title="Variable Dependiente (Y)" config={activeSeries.varDep} onChange={v => updateActiveSeries({ varDep: v })} reps={activeSeries.numRepetitionsDep} onRepsChange={r => updateActiveSeries({ numRepetitionsDep: r })} />
            </div>

            {/* Extra Variables Panel */}
            <ExtraVarPanel series={activeSeries} onUpdate={vars => updateActiveSeries({ extraVariables: vars })} />

            <IndirectVarPanel series={activeSeries} onUpdate={vars => updateActiveSeries({ indirectVariables: vars })} />

            <div className="bg-white rounded-[4rem] shadow-2xl border-4 border-[#004b87]/5 overflow-hidden p-2 relative">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-[10px] border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="bg-[#004b87] text-white font-black uppercase text-center border-b-4 border-[#9e1b32]">
                      <th className="p-5 border-r border-white/10">#</th>
                      {/* Extra Vars Headers */}
                      {activeSeries.extraVariables.map(ev => (
                        <React.Fragment key={ev.id}>
                          <th
                            draggable={true}
                            onDragStart={(e) => { e.dataTransfer.setData('sourceId', ev.id); e.dataTransfer.effectAllowed = 'move'; }}
                            className="p-5 border-r border-white/10 cursor-move hover:bg-white/10 transition-colors active:cursor-grabbing"
                            colSpan={ev.numRepetitions || 1}>
                            <div className="flex flex-col items-center">
                              <span dangerouslySetInnerHTML={{ __html: renderLatexToHtml(`$${ev.symbol} [${ev.unit}]$`) }} />
                            </div>
                          </th>
                          {/* Always show Average Column for consistency */}
                          <th className="p-5 bg-emerald-800 border-r border-white/10">
                            <div className="flex flex-col items-center">
                              <span dangerouslySetInnerHTML={{ __html: renderLatexToHtml(`$PROM \\bar{${ev.symbol}}$`) }} />
                              <div className="flex gap-2 mt-2">
                                <button onClick={() => { const updated = activeSeries.extraVariables.map(v => v.id === ev.id ? { ...v, precision: Math.max(0, (v.precision ?? 2) - 1) } : v); updateActiveSeries({ extraVariables: updated }); }} className="hover:text-red-300 transition-colors"><MinusCircle size={14} /></button>
                                <span className="text-[9px] bg-emerald-900/50 px-2 py-0.5 rounded-full font-black border border-emerald-600">{ev.precision ?? 2} d.</span>
                                <button onClick={() => { const updated = activeSeries.extraVariables.map(v => v.id === ev.id ? { ...v, precision: Math.min(6, (v.precision ?? 2) + 1) } : v); updateActiveSeries({ extraVariables: updated }); }} className="hover:text-green-300 transition-colors"><PlusCircle size={14} /></button>
                              </div>
                            </div>
                          </th>
                          <th className="p-5 bg-emerald-700 border-r border-white/10">
                            <div className="flex flex-col items-center">
                              <span dangerouslySetInnerHTML={{ __html: renderLatexToHtml(`$\\Delta ${ev.symbol}$`) }} />
                              <span className="text-[9px] font-normal opacity-70">Inherit: {ev.uncertainty}</span>
                            </div>
                          </th>
                        </React.Fragment>
                      ))}

                      {/* Independent Variable */}
                      <th
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                        onDrop={(e) => handleVarDrop(e, 'indep')}
                        className="p-5 border-r border-white/10 transition-all border-dashed border-2 border-transparent hover:border-emerald-400 hover:bg-emerald-900/40"
                        colSpan={activeSeries.numRepetitionsIndep}>Independiente ({activeSeries.varIndep.name})</th>
                      <th className="p-5 bg-emerald-800 border-r border-white/10">
                        <div className="flex flex-col items-center">
                          <span dangerouslySetInnerHTML={{ __html: renderLatexToHtml(`$PROM \\bar{I} [${activeSeries.varIndep.unit}]$`) }} />
                          <div className="flex gap-3 mt-2">
                            <button onClick={() => updateActiveSeries({ precisionX: Math.max(0, activeSeries.precisionX - 1) })} className="hover:text-red-300 transition-colors"><MinusCircle size={16} /></button>
                            <span className="text-[9px] bg-emerald-900/50 px-3 py-0.5 rounded-full font-black border border-emerald-600">{activeSeries.precisionX} d.</span>
                            <button onClick={() => updateActiveSeries({ precisionX: Math.min(6, activeSeries.precisionX + 1) })} className="hover:text-green-300 transition-colors"><PlusCircle size={16} /></button>
                          </div>
                        </div>
                      </th>
                      <th className="p-5 bg-emerald-700 border-r border-white/10">ΔX</th>

                      {/* Dependent Variable */}
                      <th
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                        onDrop={(e) => handleVarDrop(e, 'dep')}
                        className="p-5 border-r border-white/10 transition-all border-dashed border-2 border-transparent hover:border-blue-400 hover:bg-blue-900/40"
                        colSpan={activeSeries.numRepetitionsDep}>Dependiente ({activeSeries.varDep.name})</th>
                      <th className="p-5 bg-blue-800 border-r border-white/10">
                        <div className="flex flex-col items-center">
                          <span dangerouslySetInnerHTML={{ __html: renderLatexToHtml(`$PROM \\bar{D} [${activeSeries.varDep.unit}]$`) }} />
                          <div className="flex gap-3 mt-2">
                            <button onClick={() => updateActiveSeries({ precisionY: Math.max(0, activeSeries.precisionY - 1) })} className="hover:text-red-300 transition-colors"><MinusCircle size={16} /></button>
                            <span className="text-[9px] bg-blue-900/50 px-3 py-0.5 rounded-full font-black border border-blue-600">{activeSeries.precisionY} d.</span>
                            <button onClick={() => updateActiveSeries({ precisionY: Math.min(6, activeSeries.precisionY + 1) })} className="hover:text-green-300 transition-colors"><PlusCircle size={16} /></button>
                          </div>
                        </div>
                      </th>
                      <th className="p-5 bg-blue-700 border-r border-white/10">ΔY</th>

                      {/* Indirect Variables Headers */}
                      {activeSeries.indirectVariables.map(iv => (
                        <React.Fragment key={iv.id}>
                          <th
                            draggable={true}
                            onDragStart={(e) => { e.dataTransfer.setData('sourceId', iv.id); e.dataTransfer.effectAllowed = 'move'; }}
                            className="p-5 bg-purple-700 border-r border-white/10 cursor-move hover:bg-purple-600 transition-colors active:cursor-grabbing">
                            <div className="flex flex-col items-center">
                              <span dangerouslySetInnerHTML={{ __html: renderLatexToHtml(`$${iv.symbol} [${iv.unit}]$`) }} />
                            </div>
                          </th>
                          <th className="p-5 bg-purple-800 border-r border-white/10" dangerouslySetInnerHTML={{ __html: renderLatexToHtml(`$\\Delta ${iv.symbol}$`) }} />
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activeSeries.measurements.map((row, idx) => {
                      const { dAvgRaw, iAvgRaw, getExtraAvg } = calculateRowAvgs(row, activeSeries);
                      const indirectVals = calculateIndirectValues(row, activeSeries);

                      const fmtX = formatMeasure(iAvgRaw, parseNum(row.dX) || activeSeries.varIndep.uncertainty);
                      const fmtY = formatMeasure(dAvgRaw, parseNum(row.dY) || activeSeries.varDep.uncertainty);

                      return (
                        <tr key={idx} className="border-b-2 border-slate-50 hover:bg-slate-50 transition-colors group">
                          <td className="p-4 text-center bg-slate-50/50 font-black text-slate-400 border-r-2 border-slate-50">{idx + 1}</td>

                          {/* Extra Vars Inputs omitted for brevity, keeping same logic */}
                          {activeSeries.extraVariables.map(ev => {
                            const val = getExtraAvg(ev.id);
                            const unc = parseFloat(row.others[`${ev.id}_unc`] || ev.uncertainty.toString() || '0');
                            const fmt = formatMeasure(val / (ev.multiplier || 1), unc / (ev.multiplier || 1));
                            return (
                              <React.Fragment key={ev.id}>
                                {Array.from({ length: ev.numRepetitions || 1 }).map((_, rIdx) => (
                                  <td key={`${ev.id}-${rIdx}`} className="p-0 border-r border-slate-100 min-w-[80px]">
                                    <input className="w-full p-4 text-center bg-transparent focus:bg-white focus:ring-4 focus:ring-emerald-100 outline-none font-medium transition-all"
                                      value={row.others[`${ev.id}_${rIdx}`] !== undefined ? row.others[`${ev.id}_${rIdx}`] : (rIdx === 0 ? (row.others[ev.id] || '') : '')}
                                      placeholder={`${ev.symbol}${rIdx + 1}`}
                                      onChange={e => {
                                        const nr = activeSeries.measurements.map((m, i) => i === idx ? { ...m, others: { ...m.others, [`${ev.id}_${rIdx}`]: e.target.value } } : m);
                                        updateActiveSeries({ measurements: nr });
                                      }} />
                                  </td>
                                ))}
                                <td className="p-4 text-center bg-emerald-100/30 font-black text-emerald-900 text-xs border-r-2 border-slate-100">
                                  {fmt.val}
                                </td>
                                <td className="p-0 border-r border-slate-100 bg-emerald-50/20">
                                  <input className="w-full p-4 text-center bg-transparent focus:bg-white focus:ring-4 focus:ring-emerald-100 outline-none font-bold text-emerald-700 transition-all text-[10px]"
                                    value={row.others[`${ev.id}_unc`] || ''}
                                    placeholder={`±${ev.uncertainty}`}
                                    onChange={e => {
                                      const nr = activeSeries.measurements.map((m, i) => i === idx ? { ...m, others: { ...m.others, [`${ev.id}_unc`]: e.target.value } } : m);
                                      updateActiveSeries({ measurements: nr });
                                    }} />
                                </td>
                              </React.Fragment>
                            );
                          })}

                          {/* Independent Data */}
                          {Array.from({ length: activeSeries.numRepetitionsIndep }).map((_, i) => (
                            <td key={`i-${i}`} className="p-0 border-r border-slate-100">
                              <input className={`w-full p-4 text-center bg-transparent focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none font-medium transition-all ${activeSeries.varIndep.isCalculated ? 'bg-purple-50 text-purple-700 font-bold cursor-not-allowed' : ''}`} disabled={activeSeries.varIndep.isCalculated} value={row.i[i]} onChange={e => { const nr = [...activeSeries.measurements]; const newI = [...nr[idx].i]; newI[i] = e.target.value; nr[idx].i = newI; updateActiveSeries({ measurements: nr }); }} />
                            </td>
                          ))}
                          <td className="p-4 text-center bg-emerald-100/30 font-black text-emerald-900 text-xs border-r-2 border-slate-100 group-hover:bg-emerald-100 transition-all">{fmtX.val}</td>
                          <td className="p-0 bg-emerald-50/20 border-r-2 border-slate-100 table-cell-delta">
                            <input className="w-full p-4 text-center font-black text-emerald-800 focus:bg-white outline-none" value={row.dX} onChange={e => { const nr = [...activeSeries.measurements]; nr[idx].dX = e.target.value; updateActiveSeries({ measurements: nr }); }} />
                          </td>

                          {/* Dependent Data */}
                          {Array.from({ length: activeSeries.numRepetitionsDep }).map((_, i) => (
                            <td key={`d-${i}`} className="p-0 border-r border-slate-100">
                              <input className={`w-full p-4 text-center bg-transparent focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none font-medium transition-all ${activeSeries.varDep.isCalculated ? 'bg-purple-50 text-purple-700 font-bold cursor-not-allowed' : ''}`} disabled={activeSeries.varDep.isCalculated} value={row.d[i]} onChange={e => { const nr = [...activeSeries.measurements]; const newD = [...nr[idx].d]; newD[i] = e.target.value; nr[idx].d = newD; updateActiveSeries({ measurements: nr }); }} />
                            </td>
                          ))}
                          <td className="p-4 text-center bg-blue-100/30 font-black text-blue-900 text-xs border-r-2 border-slate-100 group-hover:bg-blue-100 transition-all">{fmtY.val}</td>
                          <td className="p-0 bg-blue-50/20 border-r-2 border-slate-100 table-cell-delta">
                            <input className="w-full p-4 text-center font-black text-blue-800 focus:bg-white outline-none" value={row.dY} onChange={e => { const nr = [...activeSeries.measurements]; nr[idx].dY = e.target.value; updateActiveSeries({ measurements: nr }); }} />
                          </td>

                          {/* Indirect Variables Cells */}
                          {indirectVals.map(iv => {
                            const fmt = formatMeasure(iv.value, iv.error);
                            return (
                              <React.Fragment key={iv.id}>
                                <td className="p-4 text-center bg-purple-50/30 font-black text-purple-900 text-xs border-r-2 border-slate-100 group-hover:bg-purple-100 transition-all">
                                  {fmt.val}
                                </td>
                                <td className="p-4 text-center bg-purple-100/50 font-black text-purple-800 text-[10px] border-r-2 border-slate-100 group-hover:bg-purple-200 transition-all">
                                  {fmt.unc}
                                </td>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="flex items-center space-x-6 bg-white px-10 py-5 rounded-[2.5rem] shadow-2xl border-4 border-slate-50">
                <span className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Número de Filas:</span>
                <div className="flex items-center space-x-4">
                  <button onClick={() => updateActiveSeries({ numMeasurements: Math.max(1, activeSeries.numMeasurements - 1) })} className="text-slate-200 hover:text-red-500 transition-colors"><MinusCircle size={24} /></button>
                  <input type="number" className="w-24 p-3 rounded-2xl border-2 border-slate-100 font-black text-center text-xl text-[#004b87] focus:ring-4 focus:ring-[#004b87]/10 outline-none" value={activeSeries.numMeasurements} onChange={e => updateActiveSeries({ numMeasurements: parseInt(e.target.value) || 1 })} />
                  <button onClick={() => updateActiveSeries({ numMeasurements: Math.min(500, activeSeries.numMeasurements + 1) })} className="text-slate-200 hover:text-green-500 transition-colors"><PlusCircle size={24} /></button>
                </div>
              </div>
            </div>
          </div >
        );
      case FormStep.Analysis:
        return (
          <div className="space-y-16">
            {header}
            <EstimationPanel series={activeSeries} />

            <div className="space-y-12">
              <div className="bg-white p-12 rounded-[3.5rem] shadow-xl border-4 border-slate-50">
                <RegressionTable series={activeSeries} />
              </div>

              <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border-2 border-slate-50 space-y-6 relative overflow-hidden group max-w-5xl mx-auto">
                <div className="flex justify-between items-center border-b-2 border-[#9e1b32] pb-3 relative">
                  <label className="text-[10px] font-black text-[#004b87] uppercase flex items-center tracking-widest"><LinkIcon size={14} className="mr-2 text-[#9e1b32]" /> GRÁFICA INTERACTIVA</label>
                  {/* Optional: We can still keep an external link if needed, but the main interaction is now embedded */}
                </div>

                {/* Desmos Graph Component (Nuevo con barra y modal) */}
                <DesmosGraph
                  data={getRegressionData(activeSeries)}
                  regressionParams={calculateStats(getRegressionData(activeSeries)) || undefined}
                  onExport={(base64) => updateReport({ graphImageUrl: base64 })}
                  height="800px" // Aumentado altura para dar espacio a herramientas completas
                />

                {/* PREVIEW SECTION: Show captured image clearly */}
                {report.graphImageUrl && (
                  <div className="mt-8 border-t-2 border-slate-100 pt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center justify-center mb-4">
                      <span className="bg-green-100 text-green-800 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-2">
                        <Check size={12} /> Imagen Capturada Exitosamente
                      </span>
                    </div>
                    <div className="relative group max-w-2xl mx-auto border-8 border-white shadow-2xl rounded-xl overflow-hidden transform transition-all hover:scale-[1.02]">
                      <img src={report.graphImageUrl} className="w-full h-auto object-contain bg-white" alt="Gráfica Capturada" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                        <button onClick={() => updateReport({ graphImageUrl: "" })} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-600 flex items-center gap-2">
                          <Trash2 size={16} /> Eliminar Captura
                        </button>
                      </div>
                    </div>
                    <p className="text-center text-[10px] text-slate-400 mt-2 uppercasestracking-widest">Esta imagen se incluirá en el informe final</p>
                  </div>
                )}
              </div>
            </div>
            <Section title="Análisis de Resultados" value={report.analysis} onChange={v => updateReport({ analysis: v })} help="Compare los valores teóricos vs experimentales." report={report} updateReport={updateReport} />
            <Section title="Conclusiones" value={report.conclusions} onChange={v => updateReport({ conclusions: v })} report={report} updateReport={updateReport} />
            <Section title="Bibliografía" value={report.bibliography} onChange={v => updateReport({ bibliography: v })} report={report} updateReport={updateReport} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-24 font-sans text-slate-900">
      {/* HELP / MANUAL MODAL */}
      {showHelp && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/80 backdrop-blur-lg p-6">
          <div className="bg-white rounded-[4rem] w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in duration-300 border-4 border-[#004b87]">
            <div className="bg-[#004b87] p-10 flex justify-between items-center border-b-4 border-[#9e1b32]">
              <h2 className="text-white text-3xl font-black uppercase tracking-tighter flex items-center"><BookOpen size={32} className="mr-4 text-emerald-400" /> MANUAL DE USUARIO & RESUMEN</h2>
              <button onClick={() => setShowHelp(false)} className="text-white hover:rotate-90 transition-transform"><X size={32} /></button>
            </div>
            <div className="p-16 overflow-y-auto space-y-12 bg-white text-slate-700 custom-scrollbar">
              <section className="space-y-4">
                <h3 className="text-2xl font-black text-[#004b87] uppercase tracking-tighter flex items-center"><Info className="mr-3 text-[#9e1b32]" /> Resumen del Sistema</h3>
                <p className="text-lg leading-relaxed font-medium">PhysicsLab UMNG es un generador de informes de alta precisión. Permite la serialización de datos en formato <span className="text-blue-600 font-bold">JSON</span> para almacenamiento local y la exportación de documentos científicos <span className="text-red-600 font-bold">PDF</span> con renderizado LaTeX de alta fidelidad.</p>
              </section>
              <div className="grid grid-cols-2 gap-10">
                <div className="bg-blue-50 p-8 rounded-[3rem] border-2 border-blue-100">
                  <h4 className="font-black text-blue-900 uppercase tracking-widest text-xs mb-4 flex items-center"><PlusCircle className="mr-2" size={16} /> Para el Estudiante</h4>
                  <ul className="space-y-3 text-sm font-semibold text-blue-800 list-disc pl-5">
                    <li>Carga de datos experimentales con promedios automáticos.</li>
                    <li>Incertidumbres dinámicas por fila de medición.</li>
                    <li>Integración de gráficas Desmos vía ID único.</li>
                    <li>Guardado local para evitar pérdida de progreso.</li>
                  </ul>
                </div>
                <div className="bg-emerald-50 p-8 rounded-[3rem] border-2 border-emerald-100">
                  <h4 className="font-black text-emerald-900 uppercase tracking-widest text-xs mb-4 flex items-center"><TrendingUp className="mr-2" size={16} /> Para el Docente</h4>
                  <ul className="space-y-3 text-sm font-semibold text-emerald-800 list-disc pl-5">
                    <li>Sistema de rúbricas parametrizables al 100%.</li>
                    <li>Edición de pesos porcentuales por competencia.</li>
                    <li>Calificación visual con retroalimentación inmediata.</li>
                    <li>Visualización de regresión lineal rigurosa.</li>
                  </ul>
                </div>
              </div>
              <section className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100">
                <h4 className="font-black text-[#004b87] uppercase tracking-widest text-xs mb-4">Uso de LaTeX</h4>
                <p className="text-sm font-medium leading-relaxed">Utilice <code className="bg-white px-2 py-1 rounded-lg border text-blue-600 font-bold">$...$</code> para fórmulas en línea. Ejemplo: <code className="bg-white px-2 py-1 rounded-lg border text-blue-600 font-bold">$\sum F = ma$</code>. Para listas use <code className="bg-white px-2 py-1 rounded-lg border text-blue-600 font-bold">\begin{"{itemize}"} \item ... \end{"{itemize}"}</code>.</p>
              </section>
            </div>
            <div className="p-8 bg-slate-50 border-t-2 border-slate-100 flex justify-center">
              <button onClick={() => setShowHelp(false)} className="bg-[#004b87] text-white px-12 py-4 rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all">Entendido, cerrar manual</button>
            </div>
          </div>
        </div>
      )}

      {/* EVALUATION MODAL */}
      {evaluatingCriterion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[4rem] shadow-2xl border-4 border-[#004b87] w-full max-w-4xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-[#004b87] p-8 flex justify-between items-center border-b-4 border-[#9e1b32]">
              <div>
                <span className="text-[9px] font-black text-blue-200 uppercase tracking-[0.3em] mb-1 block">{evaluatingCriterion.category}</span>
                <h3 className="text-white font-black text-xl uppercase tracking-tighter">{evaluatingCriterion.title}</h3>
              </div>
              <button onClick={() => setEvaluatingCriterion(null)} className="text-white hover:rotate-90 transition-transform"><X size={32} /></button>
            </div>
            <div className="p-12 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 gap-4">
                {Array.isArray(evaluatingCriterion.levels) && evaluatingCriterion.levels.map((level, idx) => {
                  const evaluations = Array.isArray(report.evaluations) ? report.evaluations : [];
                  const isSelected = evaluations.find(e => e.criterionId === evaluatingCriterion.id)?.selectedLevelIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleEvaluate(idx)}
                      className={`text-left p-6 rounded-[2.5rem] border-4 transition-all group ${isSelected ? 'bg-blue-50 border-[#004b87] scale-[1.02]' : 'bg-slate-50 border-transparent hover:border-slate-200 hover:bg-slate-100'}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest ${isSelected ? 'bg-[#004b87] text-white' : 'bg-slate-200 text-slate-500'}`}>{level.label}</span>
                        <span className="text-lg font-mono font-black text-[#004b87]">{level.points.toFixed(2)} pts</span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium leading-relaxed">{level.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t-2 border-slate-100 flex justify-end items-center space-x-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso en nota final: {evaluatingCriterion.weight}%</span>
              <button onClick={() => setEvaluatingCriterion(null)} className="bg-slate-200 text-slate-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* RUBRIC MANAGER MODAL */}
      {isManagingRubric && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-6">
          <div className="bg-white rounded-[4rem] w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="bg-[#004b87] p-10 flex justify-between items-center rounded-t-[4rem] border-b-4 border-[#9e1b32]">
              <h2 className="text-white text-3xl font-black uppercase tracking-tighter flex items-center"><Settings2 size={32} className="mr-4" /> GESTIÓN DE RÚBRICA</h2>
              <button onClick={() => setIsManagingRubric(false)} className="text-white hover:rotate-90 transition-transform"><X size={32} /></button>
            </div>
            <div className="p-12 overflow-y-auto flex-1 space-y-8 bg-[#f8fafc] custom-scrollbar">
              <div className="flex justify-between items-center">
                <p className="text-slate-500 text-sm font-medium">Configure los criterios de evaluación y sus pesos porcentuales.</p>
                <button onClick={() => setEditingCriterion({ id: 'crit-' + Date.now(), title: '', category: 'NUEVA CATEGORÍA', section: FormStep.General, weight: 0, levels: [{ label: 'EXCELENTE', points: 0, description: '' }] })} className="bg-emerald-500 text-white px-8 py-4 rounded-3xl font-black uppercase text-xs flex items-center tracking-widest hover:bg-emerald-600 shadow-xl transition-all active:scale-95"><Plus size={18} className="mr-3" /> AGREGAR COMPETENCIA</button>
              </div>
              <div className="grid gap-4">
                {report.rubric.map(crit => (
                  <div key={crit.id} className="p-8 bg-white rounded-[3rem] border-4 border-slate-50 shadow-sm flex justify-between items-center group hover:border-[#004b87]/20 transition-all">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-[8px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest border border-blue-100">{crit.category}</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{steps.find(s => s.id === crit.section)?.label}</span>
                      </div>
                      <h4 className="text-xl font-black text-[#004b87] uppercase tracking-tighter">{crit.title}</h4>

                      <p className="text-[11px] font-bold text-slate-400 mt-2">PESO: {crit.weight}% | {crit.levels.length} NIVELES</p>
                    </div>
                    <div className="flex space-x-3">
                      <button onClick={() => setEditingCriterion(crit)} className="p-4 bg-blue-50 text-blue-500 rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-sm"><Edit3 size={20} /></button>
                      <button onClick={() => handleDeleteCriterion(crit.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={20} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CRITERION EDITOR MODAL */}
      {editingCriterion && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[4rem] w-full max-w-4xl p-12 space-y-8 shadow-2xl border-4 border-[#004b87] animate-in slide-in-from-bottom duration-300">
            <h3 className="text-3xl font-black text-[#004b87] uppercase tracking-tighter flex items-center"><Edit3 className="mr-4" /> EDITAR COMPETENCIA</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <Input label="Título de la Competencia" value={editingCriterion.title} onChange={v => setEditingCriterion({ ...editingCriterion, title: v })} />
                <Input label="Categoría Académica" value={editingCriterion.category} onChange={v => setEditingCriterion({ ...editingCriterion, category: v })} />
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em]">Asociar a Sección</label>
                  <select
                    className="w-full p-5 rounded-[2.5rem] border-4 border-slate-50 shadow-lg bg-slate-50 font-black text-xs uppercase text-[#004b87] outline-none"
                    value={editingCriterion.section}
                    onChange={e => setEditingCriterion({ ...editingCriterion, section: e.target.value as FormStep })}
                  >
                    {steps.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <Input label="Peso Porcentual (%)" type="number" value={editingCriterion.weight} onChange={v => setEditingCriterion({ ...editingCriterion, weight: parseInt(v) || 0 })} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center border-b-2 border-slate-100 pb-3">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Niveles de Desempeño</label>
                <button onClick={() => setEditingCriterion({ ...editingCriterion, levels: [...editingCriterion.levels, { label: 'NUEVO NIVEL', points: 0, description: '' }] })} className="bg-[#004b87] text-white px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center"><Plus size={12} className="mr-2" /> AGREGAR NIVEL</button>
              </div>
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
                {editingCriterion.levels.map((level, lIdx) => (
                  <div key={lIdx} className="bg-slate-50 p-6 rounded-[2.5rem] border-2 border-slate-100 flex gap-4 items-start shadow-inner">
                    <div className="space-y-1 shrink-0">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Etiqueta</label>
                      <input className="w-32 p-3 bg-white rounded-xl border-none text-[10px] font-black uppercase shadow-sm" value={level.label} onChange={e => { const nl = [...editingCriterion.levels]; nl[lIdx].label = e.target.value; setEditingCriterion({ ...editingCriterion, levels: nl }); }} />
                    </div>
                    <div className="space-y-1 shrink-0">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Puntos</label>
                      <input type="number" step="0.01" className="w-24 p-3 bg-white rounded-xl border-none text-[10px] font-black shadow-sm" value={level.points} onChange={e => { const nl = [...editingCriterion.levels]; nl[lIdx].points = parseFloat(e.target.value) || 0; setEditingCriterion({ ...editingCriterion, levels: nl }); }} />
                    </div>
                    <div className="space-y-1 flex-1">
                      <label className="text-[8px] font-black uppercase text-slate-400 ml-2">Descripción del Logro</label>
                      <textarea className="w-full p-3 bg-white rounded-xl border-none text-[10px] font-medium shadow-sm resize-none" rows={2} value={level.description} onChange={e => { const nl = [...editingCriterion.levels]; nl[lIdx].description = e.target.value; setEditingCriterion({ ...editingCriterion, levels: nl }); }} />
                    </div>
                    <button onClick={() => { const nl = editingCriterion.levels.filter((_, idx) => idx !== lIdx); setEditingCriterion({ ...editingCriterion, levels: nl }); }} className="mt-6 text-red-200 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button onClick={() => setEditingCriterion(null)} className="px-10 py-4 bg-slate-100 text-slate-500 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200">Cancelar</button>
              <button onClick={() => handleSaveCriterion(editingCriterion)} className="px-10 py-4 bg-[#004b87] text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-blue-800 flex items-center"><SaveIcon size={18} className="mr-3" /> GUARDAR CAMBIOS</button>
            </div>
          </div>
        </div>
      )}

      {/* MATERIAL EDITOR MODAL */}
      {editingMaterial && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 space-y-8 shadow-2xl border-4 border-[#004b87] animate-in zoom-in duration-300">
            <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4">
              <h3 className="text-2xl font-black text-[#004b87] uppercase tracking-tighter flex items-center"><Layers className="mr-3" /> {report.materials.some(m => m.id === editingMaterial.id) ? 'EDITAR MATERIAL' : 'NUEVO MATERIAL'}</h3>
              <button onClick={() => setEditingMaterial(null)} className="text-slate-300 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Input label="Nombre del Ítem" value={editingMaterial.item} onChange={v => setEditingMaterial({ ...editingMaterial, item: v })} />
                <div className="grid grid-cols-2 gap-4">
                  <InputMini label="Cantidad" value={editingMaterial.qty} onChange={v => setEditingMaterial({ ...editingMaterial, qty: v })} />
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase ml-3 tracking-[0.1em]">Categoría</label>
                    <select className="w-full p-4 rounded-[1.5rem] border-2 border-slate-50 shadow-inner bg-slate-50/50 text-xs font-black outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 text-[#004b87]"
                      value={editingMaterial.category} onChange={e => setEditingMaterial({ ...editingMaterial, category: e.target.value as any })}>
                      <option value="LABORATORY">LABORATORIO</option>
                      <option value="STUDENT">ESTUDIANTE</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em]">Imagen (Opcional)</label>
                <div className="w-full aspect-square bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200 flex items-center justify-center relative overflow-hidden group hover:border-blue-200 transition-colors">
                  {editingMaterial.imageUrl ? <img src={editingMaterial.imageUrl} className="w-full h-full object-cover" /> : <div className="text-center"><ImageIcon size={32} className="mx-auto text-slate-200 mb-2" /><span className="text-[8px] font-black text-slate-300 uppercase">Click para subir</span></div>}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setEditingMaterial({ ...editingMaterial, imageUrl: ev.target?.result as string });
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em]">Descripción Breve</label>
              <textarea className="w-full p-5 rounded-[2rem] border-2 border-slate-50 bg-slate-50/50 text-xs font-medium focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none resize-none" rows={3} placeholder="Ej: Precisión 0.05mm" value={editingMaterial.description || ''} onChange={e => setEditingMaterial({ ...editingMaterial, description: e.target.value })} />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-50">
              <button onClick={() => setEditingMaterial(null)} className="px-8 py-3 rounded-2xl bg-slate-100 text-slate-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200">Cancelar</button>
              <button onClick={handleSaveMaterial} className="px-8 py-3 rounded-2xl bg-[#004b87] text-white font-black text-[10px] uppercase tracking-widest hover:bg-blue-800 shadow-xl transition-transform active:scale-95">Guardar Material</button>
            </div>
          </div>
        </div>
      )}

      <header className="bg-[#004b87] px-12 py-5 text-white shadow-2xl sticky top-0 z-50 flex items-center justify-between border-b-4 border-[#9e1b32]">
        <div className="flex items-center space-x-6">
          <div className="w-16 h-16 bg-white rounded-[1.5rem] flex items-center justify-center p-3 shadow-inner group hover:rotate-6 transition-transform">
            <img src={report.logoUrl || "https://picsum.photos/seed/umng/100/100"} className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none flex items-center">PHYSICSLAB UMNG <CheckCircle2 size={16} className="ml-2 text-emerald-400" /></h1>
            <p className="text-[10px] font-black text-blue-200 uppercase tracking-[0.4em] mt-2 opacity-80">V14.0 RESTORATION PURE</p>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <button onClick={() => setShowHelp(true)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all group" title="Manual y Ayuda">
            <HelpCircle className="text-white group-hover:rotate-12 transition-transform" />
          </button>

          <div className="flex items-center bg-blue-900/40 p-1.5 rounded-full border border-blue-400/20 shadow-inner">
            <label className="flex items-center cursor-pointer">
              <span className={`text-[9px] font-black px-4 uppercase transition-colors ${!isDocente ? 'text-white' : 'text-blue-400'}`}>Estudiante</span>
              <div className="relative inline-block w-12 h-6 align-middle select-none">
                <input type="checkbox" className="absolute block w-6 h-6 rounded-full bg-white border-4 border-transparent appearance-none cursor-pointer checked:right-0 right-6 duration-200 transition-all shadow-xl" checked={isDocente} onChange={() => setIsDocente(!isDocente)} />
                <label className="block h-6 overflow-hidden bg-blue-800 rounded-full cursor-pointer"></label>
              </div>
              <span className={`text-[9px] font-black px-4 uppercase transition-colors ${isDocente ? 'text-white' : 'text-blue-400'}`}>Docente</span>
            </label>
          </div>

          {isDocente && (
            <div className="flex items-center bg-emerald-500/10 border-2 border-emerald-500/50 px-6 py-2 rounded-2xl animate-pulse">
              <TrendingUp size={16} className="text-emerald-400 mr-3" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Nota Estimada</span>
                <span className="text-xl font-mono font-black text-white">{calculateCurrentGrade()}/5.0</span>
              </div>
            </div>
          )}

          <div className="h-10 w-[1px] bg-white/10 mx-2"></div>

          <label className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-black text-[10px] cursor-pointer transition-all flex items-center uppercase tracking-widest border border-white/5 group active:scale-95">
            <FolderOpen size={16} className="mr-3 text-blue-300 group-hover:text-white" /> ABRIR
            <input type="file" className="hidden" accept=".json" onChange={handleImportJSON} />
          </label>
          <button onClick={handleExportJSON} className="bg-white/10 hover:bg-white/20 px-6 py-3 rounded-2xl font-black text-[10px] flex items-center transition-all uppercase tracking-widest border border-white/5 group active:scale-95">
            <Save size={16} className="mr-3 text-emerald-300 group-hover:text-white" /> GUARDAR
          </button>
          <button onClick={handleResetReport} className="bg-white/10 hover:bg-red-500/20 px-6 py-3 rounded-2xl font-black text-[10px] flex items-center transition-all uppercase tracking-widest border border-white/5 group active:scale-95">
            <Trash2 size={16} className="mr-3 text-red-300 group-hover:text-white" /> REINICIAR
          </button>


          <label className="flex items-center cursor-pointer mr-4" title="Rotar tabla de datos en hoja horizontal independiente">
            <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
              <input type="checkbox" className="absolute block w-5 h-5 rounded-full bg-white border-4 border-transparent appearance-none cursor-pointer checked:right-0 right-5 duration-200 transition-all shadow-sm" checked={isTableRotated} onChange={() => setIsTableRotated(!isTableRotated)} />
              <label className={`block h-5 overflow-hidden rounded-full cursor-pointer transition-colors ${isTableRotated ? 'bg-purple-500' : 'bg-slate-400'}`}></label>
            </div>
            <span className="ml-2 text-[9px] font-black text-white uppercase tracking-widest">{isTableRotated ? 'ROTAR TABLA' : 'TABLA NORMAL'}</span>
          </label>
          <button onClick={handleDownloadPDF} disabled={isGenerating} className="bg-[#9e1b32] text-white px-8 py-3 rounded-2xl font-black shadow-2xl hover:bg-[#8b182d] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center uppercase tracking-[0.1em] text-[11px] border-b-4 border-black/20">
            {isGenerating ? <Loader2 className="animate-spin mr-3" /> : <Download className="mr-3" />}
            {isGenerating ? "PROCESANDO..." : "EXPORTAR PDF"}
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto mt-12 px-10 flex gap-12">
        <aside className="w-72 space-y-4 shrink-0">
          <div className="bg-white p-2 rounded-[3.5rem] shadow-2xl space-y-2 border-2 border-white">
            {steps.map(s => {
              const rubric = Array.isArray(report.rubric) ? report.rubric : DEFAULT_RUBRIC;
              const criterion = rubric.find(c => c.section === s.id);
              const evaluations = Array.isArray(report.evaluations) ? report.evaluations : [];
              const isEvaluated = evaluations.some(e => e.criterionId === criterion?.id && e.selectedLevelIndex !== null && e.selectedLevelIndex !== undefined);

              return (
                <div key={s.id} className="relative flex items-center group/nav">
                  <button
                    onClick={() => setCurrentStep(s.id)}
                    className={`w-full p-5 rounded-[2.8rem] flex items-center space-x-5 transition-all duration-300 group relative overflow-hidden ${currentStep === s.id ? 'bg-[#004b87] text-white shadow-xl translate-x-3 scale-105' : 'bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                  >
                    {currentStep === s.id && <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-transparent pointer-events-none" />}
                    <div className={`p-3 rounded-2xl transition-all duration-500 shadow-sm ${currentStep === s.id ? 'bg-blue-900 rotate-12' : 'bg-slate-100 group-hover:rotate-6'}`}>{s.icon}</div>
                    <span className="font-black text-[11px] uppercase tracking-[0.2em]">{s.label}</span>
                  </button>

                  {isDocente && criterion && (
                    <div className="absolute right-4 flex items-center space-x-2 z-[60]">
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentStep(s.id); setEditingCriterion(criterion); }}
                        className="p-1.5 rounded-lg bg-blue-500/10 text-[#004b87] hover:bg-[#004b87] hover:text-white transition-all shadow-sm opacity-60 hover:opacity-100 border border-blue-200"
                        title="Editar definición"
                      >
                        <Settings size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setCurrentStep(s.id); setEvaluatingCriterion(criterion); }}
                        className={`p-2 rounded-xl transition-all shadow-md ${isEvaluated ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 hover:text-[#004b87] hover:scale-110 active:scale-90'}`}
                        title="Evaluar"
                      >
                        <Star size={14} className={isEvaluated ? 'fill-white' : ''} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {isDocente && (
            <button
              onClick={() => setIsManagingRubric(true)}
              className="w-full bg-white border-4 border-dashed border-slate-100 p-6 rounded-[3.5rem] font-black uppercase text-[10px] tracking-widest flex items-center justify-center text-slate-400 hover:text-[#004b87] hover:border-[#004b87]/30 transition-all shadow-sm group"
            >
              <Settings2 size={18} className="mr-3 group-hover:rotate-90 transition-transform" /> GESTIONAR RÚBRICA
            </button>
          )}

          <div className="bg-[#9e1b32] p-8 rounded-[4rem] text-white shadow-2xl mt-12 relative overflow-hidden border-b-8 border-black/20">
            <div className="absolute top-[-20px] right-[-20px] opacity-10 rotate-12"><Calculator size={140} /></div>
            <p className="text-[10px] font-black uppercase mb-3 tracking-[0.3em] opacity-60 font-mono">Análisis de Datos</p>
            <p className="text-[11px] font-medium leading-relaxed relative z-10">
              El ajuste por <strong>mínimos cuadrados</strong> permite encontrar la relación matemática óptima entre variables, reduciendo el error estadístico.
              <br /><br />
              Aunque este módulo se enfoca en regresión lineal, puedes usar <strong>Desmos</strong> para cualquier modelo no lineal e importar la gráfica directamente.
            </p>
          </div>
        </aside>

        <div className="flex-1 bg-white rounded-[5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border-4 border-white p-20 min-h-[900px] flex flex-col relative">
          <div className="flex flex-col mb-20 relative">
            <h2 className="text-6xl font-black text-[#004b87] tracking-tighter uppercase leading-none">{steps.find(s => s.id === currentStep)?.label}</h2>
            <div className="h-2.5 bg-[#9e1b32] w-32 mt-6 rounded-full shadow-lg"></div>
          </div>
          <div className="flex-1 relative z-10">{renderStep()}</div>
          <div className="mt-24 flex justify-between pt-12 border-t-2 border-slate-50 relative z-10">
            <button disabled={steps.findIndex(s => s.id === currentStep) === 0} onClick={() => { const idx = steps.findIndex(s => s.id === currentStep); if (idx > 0) setCurrentStep(steps[idx - 1].id); }} className="flex items-center text-slate-300 font-black hover:text-[#004b87] disabled:opacity-0 transition-all uppercase text-[10px] tracking-widest"><ChevronLeft className="mr-3" /> ANTERIOR</button>
            <div className="flex space-x-2">
              {steps.map(s => <div key={s.id} className={`w-3 h-1.5 rounded-full transition-all duration-500 ${currentStep === s.id ? 'w-10 bg-[#9e1b32]' : 'bg-slate-100'}`} />)}
            </div>
            <button disabled={steps.findIndex(s => s.id === currentStep) === steps.length - 1} onClick={() => { const idx = steps.findIndex(s => s.id === currentStep); if (idx < steps.length - 1) setCurrentStep(steps[idx + 1].id); }} className="flex items-center text-slate-300 font-black hover:text-[#004b87] disabled:opacity-0 transition-all uppercase text-[10px] tracking-widest">SIGUIENTE <ChevronRight className="ml-3" /></button>
          </div>
        </div>
      </main>
      <div ref={hiddenRenderRef} style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} />
    </div>
  );
};

const VarConfig = ({ title, config, onChange, reps, onRepsChange }: any) => (
  <div className="space-y-6">
    <h4 className="text-[10px] font-black text-[#004b87] uppercase tracking-[0.2em] border-b-2 border-[#9e1b32] pb-3 flex items-center"><Layers size={18} className="mr-3 text-[#9e1b32]" /> {title}</h4>
    <div className="grid grid-cols-6 gap-5">
      <div className="col-span-2">
        <InputMini label="Nombre de Variable" value={config.name} onChange={v => onChange({ ...config, name: v })} />
      </div>
      <div className="col-span-1">
        <InputMini label="Símbolo" value={config.symbol || (title.includes('Independiente') ? 'x' : 'y')} onChange={v => onChange({ ...config, symbol: v })} />
      </div>
      <div className="col-span-1">
        <InputMini label="Unidad" value={config.unit} onChange={v => onChange({ ...config, unit: v })} />
      </div>
      <div className="col-span-1">
        <SmartNumberInput label="Factor" value={config.multiplier} onChange={(v: number) => onChange({ ...config, multiplier: v || 1 })} />
      </div>
      <div className="col-span-1">
        <SmartNumberInput label="Incertidumbre Δ" value={config.uncertainty} onChange={(v: number) => onChange({ ...config, uncertainty: v || 0 })} />
      </div>
    </div>
    <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Repeticiones:</span>
      <div className="flex items-center space-x-3">
        <button onClick={() => onRepsChange(Math.max(1, reps - 1))} className="text-slate-300 hover:text-red-500 transition-colors"><MinusCircle size={18} /></button>
        <input type="number" min="1" max="10" className="w-16 p-2 rounded-xl border-2 border-slate-100 text-center font-black text-[#004b87] focus:ring-4 focus:ring-blue-100 outline-none transition-all" value={reps} onChange={e => onRepsChange(parseInt(e.target.value) || 1)} />
        <button onClick={() => onRepsChange(Math.min(10, reps + 1))} className="text-slate-300 hover:text-green-500 transition-colors"><PlusCircle size={18} /></button>
      </div>
    </div>
  </div>
);

const EstimationPanel = ({ series }: { series: DataSeries }) => {
  const regressionData = getRegressionData(series);
  const stats = calculateStats(regressionData);
  if (!stats) return null;

  const fmtM = formatMeasure(stats.m, stats.sigmaM);
  const fmtB = formatMeasure(stats.b, stats.sigmaB);

  const toLatexSci = (num: number) => {
    if (Math.abs(num) < 0.01 || Math.abs(num) >= 10000) {
      const exp = num.toExponential(4);
      const [m, e] = exp.split('e');
      return `${m} \\times 10^{${parseInt(e)}}`;
    }
    return num.toFixed(4);
  };

  const FormulaItem = ({ formula, value, displayStyle = "small" }: { formula: string, value: string | number, displayStyle?: "small" | "medium" | "large" }) => (
    <div className="flex items-center space-x-4">
      <div className={`overflow-x-auto ${displayStyle === 'large' ? 'min-w-[150px]' : displayStyle === 'medium' ? 'min-w-[120px]' : 'min-w-[80px]'}`}>
        <div className="text-blue-900/90 font-medium whitespace-nowrap" dangerouslySetInnerHTML={{ __html: renderMathOnly(`$${formula}$`) }} />
      </div>
      <div className="bg-white border-2 border-slate-200 px-4 py-2.5 rounded-xl shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] text-[#004b87] font-mono font-black text-[12px] min-w-[140px] text-center">
        {value}
      </div>
    </div>
  );

  const SubstitutionCard = ({ title, formula, sub, result }: { title: string, formula: string, sub: string, result: string }) => (
    <div className="bg-white p-6 rounded-[2.5rem] border-2 border-slate-100 shadow-sm space-y-3 group hover:border-[#004b87]/20 transition-all">
      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
        <span className="text-[9px] font-black text-[#004b87] uppercase tracking-widest">{title}</span>
        <span className="text-[10px] font-mono font-black text-[#9e1b32]">{result}</span>
      </div>
      <div className="space-y-2">
        <div className="text-xs text-slate-400 font-medium" dangerouslySetInnerHTML={{ __html: renderMathOnly(`$${formula}$`) }} />
        <div className="text-[10px] text-[#004b87] font-mono whitespace-normal leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity" dangerouslySetInnerHTML={{ __html: renderMathOnly(`$\\approx ${sub}$`) }} />
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-[3rem] shadow-2xl border-4 border-[#004b87] overflow-hidden mb-16 relative">
      <div className="bg-[#004b87] px-12 py-5 flex justify-between items-center border-b-4 border-[#9e1b32]">
        <h3 className="text-white font-black uppercase text-[11px] tracking-[0.3em] flex items-center">
          <Calculator size={20} className="mr-4 text-blue-300" /> AJUSTE DE CURVA (MÍNIMOS CUADRADOS)
        </h3>
        <div className="bg-[#9e1b32] text-white text-[10px] px-5 py-2 rounded-full font-black shadow-xl tracking-widest border-b-2 border-black/20">N = {stats.n}</div>
      </div>

      <div className="p-16 grid-bg bg-white relative">
        <div className="grid grid-cols-12 gap-y-10 items-start">
          <div className="col-span-4 space-y-6">
            <FormulaItem formula="n =" value={stats.n} />
            <FormulaItem formula={"\\sum_{i=1}^n x_i ="} value={stats.sumX.toExponential(4)} />
            <FormulaItem formula={"\\sum_{i=1}^n y_i ="} value={stats.sumY.toExponential(4)} />
            <FormulaItem formula={"\\sum_{i=1}^n x_i^2 ="} value={stats.sumX2.toExponential(4)} />
            <FormulaItem formula={"\\sum_{i=1}^n x_iy_i ="} value={stats.sumXY.toExponential(4)} />
            <FormulaItem formula={"\\Delta = n \\sum x_i^2 - (\\sum x_i)^2 ="} value={stats.delta.toExponential(4)} displayStyle="large" />
          </div>

          <div className="col-span-8 space-y-8 pl-10 border-l-4 border-slate-100">
            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
              <FormulaItem formula="M =" value={fmtM.val} displayStyle="medium" />
              <FormulaItem formula={"\\sigma_M ="} value={fmtM.unc} displayStyle="medium" />
              <FormulaItem formula="B =" value={fmtB.val} displayStyle="medium" />
              <FormulaItem formula={"\\sigma_B ="} value={fmtB.unc} displayStyle="medium" />
              <FormulaItem formula={"\\sigma_y ="} value={stats.sigmaY.toExponential(4)} displayStyle="medium" />
              <FormulaItem formula="r^2 =" value={stats.r2.toFixed(6)} displayStyle="medium" />
            </div>

            <div className="mt-10 pt-10 border-t-2 border-slate-100 text-center">
              <div className="inline-block px-10 py-2 bg-slate-100 rounded-full text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-6 border-2 border-slate-200">Modelo Matemático Resultante</div>
              <div className="bg-blue-50/50 p-8 rounded-[3.5rem] border-4 border-blue-100/50 font-mono text-[#004b87] font-black text-3xl shadow-2xl backdrop-blur-md inline-block min-w-[500px]">
                <div dangerouslySetInnerHTML={{ __html: renderMathOnly(`$y = (${fmtM.val} \\pm ${fmtM.unc})x + (${fmtB.val} \\pm ${fmtB.unc})$`) }} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-12 border-t-4 border-slate-50">
          <div className="flex items-center space-x-4 mb-8">
            <div className="h-px bg-slate-200 flex-1"></div>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Desglose de Parámetros</span>
            <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          <div className="grid grid-cols-2 gap-6">
            <SubstitutionCard
              title="Pendiente (M)"
              formula="M = \frac{n \sum xy - \sum x \sum y}{\Delta}"
              sub={`\frac{${stats.n}(${toLatexSci(stats.sumXY)}) - (${toLatexSci(stats.sumX)})(${toLatexSci(stats.sumY)})}{${toLatexSci(stats.delta)}}`}
              result={fmtM.val}
            />
            <SubstitutionCard
              title="Intercepto (B)"
              formula="B = \frac{\sum x^2 \sum y - \sum x \sum xy}{\Delta}"
              sub={`\frac{(${toLatexSci(stats.sumX2)})(${toLatexSci(stats.sumY)}) - (${toLatexSci(stats.sumX)})(${toLatexSci(stats.sumXY)})}{${toLatexSci(stats.delta)}}`}
              result={fmtB.val}
            />
            <SubstitutionCard
              title="Error Pendiente (\sigma_M)"
              formula="\sigma_M = \sigma_y \sqrt{\frac{n}{\Delta}}"
              sub={` ${toLatexSci(stats.sigmaY)} \sqrt{\frac{${stats.n}}{${toLatexSci(stats.delta)}}}`}
              result={fmtM.unc}
            />
            <SubstitutionCard
              title="Error Intercepto (\sigma_B)"
              formula="\sigma_B = \sigma_y \sqrt{\frac{\sum x^2}{\Delta}}"
              sub={` ${toLatexSci(stats.sigmaY)} \sqrt{\frac{${toLatexSci(stats.sumX2)}}{${toLatexSci(stats.delta)}}}`}
              result={fmtB.unc}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const SmartNumberInput = ({ value, onChange, ...props }: any) => {
  const [str, setStr] = useState(value?.toString() || '');
  useEffect(() => {
    const currentParsed = parseNum(str);
    if (typeof value === 'number' && !isNaN(value) && Math.abs(value - currentParsed) > 1e-9) {
      setStr(value.toString());
    }
  }, [value]);
  const handleChange = (val: string) => {
    setStr(val);
    const num = parseNum(val);
    if (!isNaN(num)) { onChange(num); }
  };
  return <InputMini {...props} value={str} onChange={handleChange} />;
};

const InputMini = ({ label, value, onChange, type = "text", ...props }: any) => (
  <div className="space-y-1">
    <label className="text-[9px] font-black text-slate-400 uppercase ml-3 tracking-[0.1em]">{label}</label>
    <input type={type} step="any" className="w-full p-4 rounded-[1.5rem] border-2 border-slate-50 shadow-inner bg-slate-50/50 text-xs font-black outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-[#004b87]" value={value} onChange={e => onChange(e.target.value)} {...props} />
  </div>
);

const Input = ({ label, value, onChange, type = "text" }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em]">{label}</label>
    <input type={type} className="w-full p-5 rounded-[2.5rem] border-4 border-slate-50 shadow-lg bg-slate-50/50 text-sm font-black outline-none transition-all focus:bg-white focus:ring-8 focus:ring-blue-500/5 text-[#004b87]" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const StepHeader = ({ title, icon, criterion, isDocente, onEdit, onEvaluate, isEvaluated }: any) => (
  <div className="flex items-center justify-between mb-8 border-b-4 border-[#004b87]/10 pb-4">
    <div className="flex items-center gap-4">
      <div className="p-3 bg-[#004b87] text-white rounded-2xl shadow-lg">{icon}</div>
      <h2 className="text-2xl font-black text-[#004b87] uppercase tracking-tighter">{title}</h2>
    </div>
    {isDocente && criterion && (
      <div className="flex gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(criterion); }}
          className="p-2 rounded-xl bg-blue-50 text-[#004b87] hover:bg-[#004b87] hover:text-white transition-all shadow-sm group"
          title="Editar definición"
        >
          <Settings size={18} className="group-hover:rotate-90 transition-transform" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEvaluate(criterion); }}
          className={`p-2 rounded-xl transition-all shadow-md flex items-center gap-2 px-4 ${isEvaluated ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 hover:text-[#004b87] ring-2 ring-slate-100 hover:ring-[#004b87]/20'}`}
          title="Evaluar"
        >
          <Star size={18} fill={isEvaluated ? "currentColor" : "none"} />
          <span className="text-[10px] font-black uppercase tracking-widest">{isEvaluated ? 'Evaluado' : 'Evaluar'}</span>
        </button>
      </div>
    )}
  </div>
);

const Section = ({ title, value, onChange, rows = 4, help, report, updateReport }: any) => {
  const previewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (previewRef.current) previewRef.current.innerHTML = renderLatexToHtml(value, report?.images) || '<span class="text-slate-100 italic font-black uppercase tracking-[0.3em] text-[10px]">Esperando entrada...</span>';
  }, [value, report?.images]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && textareaRef.current) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target?.result as string;
        const imgId = `fig-${Date.now()}`;

        // Ask for metadata
        const caption = prompt("Ingrese el pie de foto (Caption):") || "";
        const label = prompt("Ingrese la etiqueta (Label), ej: fig:montaje:") || imgId;

        // Update images dictionary at App level
        updateReport({ images: { ...(report?.images || INITIAL_REPORT.images), [imgId]: base64 } });

        const latexBlock = `\n\\begin{figure}[h!t]\n  \\includegraphics[width=0.8\\linewidth]{${imgId}}\n  \\caption{${caption}}\n  \\label{${label}}\n\\end{figure}\n`;

        const start = textareaRef.current!.selectionStart;
        const end = textareaRef.current!.selectionEnd;
        const newValue = value.substring(0, start) + latexBlock + value.substring(end);
        onChange(newValue);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 flex-1">
      <div className="flex justify-between items-center border-b-2 border-[#9e1b32] pb-3 ml-2">
        <div className="flex items-center space-x-4">
          <label className="text-[11px] font-black text-[#004b87] uppercase tracking-[0.25em]">{title}</label>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-blue-50 text-[#004b87] hover:bg-[#004b87] hover:text-white rounded-xl transition-all shadow-sm group border border-blue-100"
            title="Subir imagen"
          >
            <ImageIcon size={14} className="group-hover:scale-110 transition-transform" />
          </button>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
        </div>
        {help && <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-5 py-2 rounded-full uppercase tracking-tighter shadow-sm border border-emerald-100">{help}</span>}
      </div>
      <div className="grid grid-cols-2 gap-12">
        <textarea
          ref={textareaRef}
          className="w-full p-12 border-none rounded-[4rem] bg-slate-50 shadow-inner font-mono text-xs focus:bg-white outline-none ring-8 ring-slate-100/30 transition-all text-slate-700 leading-relaxed"
          rows={rows}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Escriba aquí..."
        />
        <div ref={previewRef} className="p-16 border-4 border-[#004b87]/5 rounded-[4rem] bg-white text-[14px] leading-[1.8] latex-content overflow-auto min-h-[200px] grid-bg shadow-xl relative custom-scrollbar" />
      </div>
    </div>
  );
};

const renderLatexToHtml = (text: string, images: Record<string, string> = {}) => {
  if (!text) return '';
  let p = text.replace(/\\\\/g, '<br/>');

  // Figure environment: \begin{figure} ... \includegraphics{...} \caption{...} \label{...} \end\{figure\}
  p = p.replace(/\\begin\s*(?:\[.*?\])?\s*\{figure\}\s*(?:\[.*?\])?([\s\S]*?)\\end\{figure\}/g, (_, content) => {
    const captionMatch = content.match(/\\caption\s*\{([\s\S]*?)\}/);
    const labelMatch = content.match(/\\label\s*\{([\s\S]*?)\}/);
    const imgMatch = content.match(/\\includegraphics\s*(?:\[(.*?)\])?\s*\{([\s\S]*?)\}/);

    const caption = captionMatch ? captionMatch[1] : '';
    const label = labelMatch ? labelMatch[1] : '';
    const options = imgMatch ? (imgMatch[1] || '') : '';
    const imgSrc = imgMatch ? (imgMatch[2] || '') : '';
    const finalSrc = images[imgSrc] || imgSrc;

    let imgStyle = "max-width: 100%; max-height: 9cm; object-fit: contain; border-radius: 1rem;";
    if (options) {
      const widthMatch = options.match(/width\s*=\s*([\d.]+)\s*(\\linewidth|\\textwidth|cm|mm|px|%|in|pt)?/);
      if (widthMatch) {
        const val = widthMatch[1];
        const unit = widthMatch[2] || '';
        if (unit === '\\linewidth' || unit === '\\textwidth') {
          imgStyle = `width: ${parseFloat(val) * 100}%; max-height: 9cm; object-fit: contain; border-radius: 1rem;`;
        } else if (unit) {
          imgStyle = `width: ${val + unit}; max-height: 9cm; object-fit: contain; border-radius: 1rem;`;
        } else if (val.includes('%') || val.includes('px')) {
          imgStyle = `width: ${val}; max-height: 9cm; object-fit: contain; border-radius: 1rem;`;
        }
      }
    }

    return `
      <div class="my-10 flex flex-col items-center">
        <div class="bg-white p-4 rounded-[2rem] shadow-xl border-2 border-slate-50 relative overflow-hidden flex justify-center">
          <img src="${finalSrc}" alt="${caption}" style="${imgStyle}" />
        </div>
        ${caption ? `<p class="mt-4 text-[11px] font-bold text-slate-500 text-center px-10 leading-relaxed uppercase tracking-widest"><span class="text-[#004b87] font-black">${label ? `Figura (${label}):` : 'Figura:'}</span> ${caption}</p>` : ''}
      </div>
    `;
  });

  p = p.replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, c) => `<ol>${c.split('\\item').filter((i: any) => i.trim()).map((i: any) => `<li>${renderMathOnly(i.trim())}</li>`).join('')}</ol>`);
  p = p.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, c) => `<ul>${c.split('\\item').filter((i: any) => i.trim()).map((i: any) => `<li>${renderMathOnly(i.trim())}</li>`).join('')}</ul>`);

  // Image Markdown support (backwards compat)
  p = p.replace(/!\[(.*?)\]\((.*?)\)/g, (_, alt, src) => {
    const finalSrc = images[src] || src;
    return `<div class="my-6 flex justify-center"><img src="${finalSrc}" alt="${alt}" style="max-width: 100%; max-height: 9cm; object-fit: contain; border-radius: 1rem; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);" /></div>`;
  });

  return renderMathOnly(p);
};

const renderMathOnly = (text: string) => text.replace(/\$([^$]+)\$/g, (_, f) => {
  try {
    return katex.renderToString(f, {
      throwOnError: false,
      displayMode: false,
      strict: false,
      trust: true
    });
  } catch (e) {
    return f;
  }
});

const RegressionTable = ({ series }: { series: DataSeries }) => {
  const regressionData = getRegressionData(series);
  const stats = calculateStats(regressionData);
  if (!stats) return null;

  const fmtM = formatMeasure(stats.m, stats.sigmaM);
  const fmtB = formatMeasure(stats.b, stats.sigmaB);

  return (
    <div className="space-y-10">
      <div className="flex items-center space-x-3 border-b-2 border-[#9e1b32] pb-3 ml-2">
        <label className="text-[11px] font-black text-[#004b87] uppercase tracking-[0.25em]">DATOS PARA ANÁLISIS DE REGRESIÓN</label>
      </div>
      <div className="overflow-hidden rounded-[4rem] border-4 border-[#004b87]/5 shadow-2xl bg-white p-2">
        <table className="w-full text-[11px] border-collapse">
          <thead className="bg-[#004b87] text-white font-black uppercase tracking-widest">
            <tr>
              <th className="p-6 border-r border-white/10">#</th>
              <th className="p-6 border-r border-white/10" dangerouslySetInnerHTML={{ __html: renderLatexToHtml(`X (${series.varIndep.unit})`) }} />
              <th className="p-6 border-r border-white/10" dangerouslySetInnerHTML={{ __html: renderLatexToHtml(`Y (${series.varDep.unit})`) }} />
              <th className="p-6 border-r border-white/10">XY</th>
              <th className="p-6">X²</th>
            </tr>
          </thead>
          <tbody>
            {regressionData.map((row, i) => {
              const formatSci = (num: number) => {
                const str = num.toExponential(4);
                const [base, exp] = str.split('e');
                const cleanExp = exp ? parseInt(exp, 10) : 0;
                return `${base} \\cdot 10^{${cleanExp}}`;
              };
              return (
                <tr key={i} className="text-center font-black text-[#004b87] even:bg-slate-50/50 border-b last:border-0 hover:bg-blue-50 transition-colors">
                  <td className="p-5 border-r border-slate-100 text-slate-400 font-bold">{row.n}</td>
                  <td className="p-5 border-r border-slate-100" dangerouslySetInnerHTML={{ __html: renderMathOnly(`$${formatSci(row.x)}$`) }} />
                  <td className="p-5 border-r border-slate-100" dangerouslySetInnerHTML={{ __html: renderMathOnly(`$${formatSci(row.y)}$`) }} />
                  <td className="p-5 border-r border-slate-100" dangerouslySetInnerHTML={{ __html: renderMathOnly(`$${formatSci(row.xy)}$`) }} />
                  <td className="p-5" dangerouslySetInnerHTML={{ __html: renderMathOnly(`$${formatSci(row.x2)}$`) }} />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {stats && (
        <div className="grid grid-cols-2 gap-8 pt-4">
          <StatBox label={`PENDIENTE AJUSTADA (M)`} value={fmtM.val} sub={`Incertidumbre: ±${fmtM.unc}`} color="text-[#9e1b32]" icon={<BarChart size={24} />} />
          <StatBox label="BONDAD DE AJUSTE (R²)" value={stats.r2.toFixed(6)} sub="Coeficiente de determinación" color="text-[#004b87]" icon={<LinkIcon size={24} />} />
        </div>
      )}
    </div>
  );
};

const StatBox = ({ label, value, sub, color, icon }: any) => (
  <div className="p-10 bg-white border-4 border-slate-50 rounded-[3.5rem] shadow-xl relative group overflow-hidden">
    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform">{icon}</div>
    <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-slate-50 pb-2 ml-1">{label}</div>
    <div className={`text-4xl font-mono font-black tracking-tighter ${color || 'text-slate-900'}`}>{value}</div>
    {sub && <div className="text-[10px] font-black text-slate-300 mt-4 uppercase tracking-widest bg-slate-50/50 inline-block px-4 py-1.5 rounded-full">{sub}</div>}
  </div>
);

export default App;
