
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';

import katex from 'katex';

import Prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import {
  FileText, Users, Settings, Table as TableIcon, BarChart, Download,
  Upload, X, Link as LinkIcon, RefreshCw, Save, FolderOpen, Plus, Trash2,
  Layers, Info, ArrowUp, ChevronLeft, ChevronRight, ImageIcon, ExternalLink, Loader2, Calculator,
  MinusCircle, PlusCircle, CheckCircle2, Star, Edit3, Save as SaveIcon, AlertCircle, TrendingUp, Settings2, BookOpen, HelpCircle, FlaskConical, Check,
  Database, Copy, Code, AlignLeft, ListChecks, Paperclip
} from 'lucide-react';
import {
  LabReport, FormStep, MeasurementRow, MaterialRow, RegressionRow, RubricCriterion, Evaluation, RubricLevel,
  DataSeries, IndirectVariable, VariableConfig
} from './types';

import { formatStudentName } from './utils/formatters';
import { DesmosGraph } from './components/DesmosGraph';
import { CodeEditor } from './components/CodeEditor';
import { CirkitEmbed } from './components/CirkitEmbed';
import { PinoutViewer } from './components/PinoutViewer';
import { ExtraVarPanel } from './components/ExtraVarPanel';
import { IndirectVarPanel } from './components/IndirectVarPanel';
import { EstimationPanel } from './components/EstimationPanel';
import { MeasurementTableRow } from './components/MeasurementTableRow';
import { InputMini, SmartNumberInput, VarConfig } from './components/SharedUI';
import { calculateRowAvgs, evaluateFormula, calculateIndirectValues, getRegressionData, calculateStats, parseNum, applyRuleOfGold, formatMeasure } from './utils/calculations';
import { renderLatexToHtml, renderMathOnly, renderErrorFormula } from './utils/latexUtils';





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
  { id: FormStep.Appendices, label: 'APÉNDICES', icon: <Paperclip size={18} /> },
];


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


const Input = ({ label, value, onChange, type = "text" }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-[0.2em]">{label}</label>
    <input type={type} className="w-full p-5 rounded-[2.5rem] border-4 border-slate-50 shadow-lg bg-slate-50/50 text-sm font-black outline-none transition-all focus:bg-white focus:ring-8 focus:ring-blue-500/5 text-[#004b87]" value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

const StepHeader = ({ title, icon, criterion, isDocente, onEdit, onEvaluate, isEvaluated }: any) => (
  <div className="flex items-center justify-end mb-8 border-b-4 border-[#004b87]/10 pb-4 min-h-[50px]">
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
          <label className="text-xl font-black text-[#004b87] uppercase tracking-[0.15em]">{title}</label>
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

const RegressionTable = ({ series }: { series: DataSeries }) => {
  const regressionData = getRegressionData(series);
  const stats = calculateStats(regressionData);
  if (!stats) return null;

  const fmtM = formatMeasure(stats.m, stats.sigmaM);
  const fmtB = formatMeasure(stats.b, stats.sigmaB);

  return (
    <div className="space-y-10">
      <div className="flex items-center space-x-3 border-b-2 border-[#9e1b32] pb-3 ml-2">
        <label className="text-xl font-black text-[#004b87] uppercase tracking-[0.25em]">DATOS PARA ANÁLISIS DE REGRESIÓN</label>
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

const App: React.FC = () => {


  const [activeTab, setActiveTab] = useState<'fisico' | 'esquematico' | 'codigo' | 'pines'>('fisico');
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

  const updateReport = useCallback((updates: Partial<LabReport>) => {
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
  }, []);

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
      const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
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
  const updateActiveSeries = useCallback((updates: Partial<DataSeries>) => {
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
  }, []);

  const handleRowChange = useCallback((idx: number, updatedRow: any) => {
    setReport(prev => {
      const newSeriesList = [...prev.dataSeries];
      const currentIndex = prev.activeSeriesIndex;
      const current = newSeriesList[currentIndex];
      const nr = [...current.measurements];
      nr[idx] = updatedRow;
      const updated = { ...current, measurements: nr };
      newSeriesList[currentIndex] = updated;
      return { ...prev, dataSeries: newSeriesList };
    });
  }, []);

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
    // Dinamically import jsPDF
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.jsPDF;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const iBlue = [0, 75, 135] as [number, number, number];
    const iRed = [158, 27, 50] as [number, number, number];
    const pageBottomLimit = pageHeight - 15;

    try {
      const addSafeImage = async (data: string | undefined, x: number, y: number, w: number, h: number): Promise<number> => {
        if (!data) return 0;
        try {
          let finalData = data;
          if (!data.startsWith('data:')) {
            try {
              finalData = await imageToBase64(data);
            } catch (e) {
              console.warn('Skipping image due to load error:', data, e);
              return 0;
            }
          }
          // Validate format before adding
          if (!finalData.match(/^data:image\/(png|jpeg|jpg);base64,/)) {
            console.warn('Skipping invalid image format:', finalData.substring(0, 50));
            return 0;
          }

          let format = 'PNG';
          if (finalData.startsWith('data:image/jpeg')) format = 'JPEG';

          // Load image to get true dimensions for aspect ratio
          const imgProps = await new Promise<{ width: number, height: number }>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = reject;
            img.src = finalData;
          });

          const ratio = imgProps.width / imgProps.height;
          // We have a target box w x h. We want to fit inside this box preserving aspect ratio.
          // However, for appendices, we explicitly passed w = 130*scale, h = 80*scale.
          // The user complains about Y compression. 
          // If we prioritize width:
          const calculatedH = w / ratio;

          // If calculated height exceeds our max h (if we want to limit), we scale down.
          // But here, let's prioritize aspect ratio based on width, as 130mm is our column constraint.

          doc.addImage(finalData, format, x, y, w, calculatedH, undefined, 'FAST');
          return calculatedH;
        } catch (e) {
          console.error('Error adding image to PDF:', e);
          return 0; // Return 0 height on error
        }
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
        let currentY = y;
        if (title) {
          if (y + 25 > pageBottomLimit) {
            doc.addPage();
            y = 20;
          }
          currentY = drawSectionHeader(title, y);
        } else {
          if (y + 10 > pageBottomLimit) { // Check space for text start
            doc.addPage();
            currentY = 20;
          }
        }

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

        const scale = (report.setupImageScale || 100) / 100;
        const imgW = 130 * scale;
        const imgX = margin + (pageWidth - 2 * margin - imgW) / 2;

        const h = await addSafeImage(report.setupImageUrl, imgX, currentY, imgW, 0);

        if (report.setupImageCaption) {
          doc.setFontSize(9);
          doc.setTextColor(100, 100, 100);
          const captionWidth = doc.getTextWidth(`Figura 1. ${report.setupImageCaption}`);
          const captionX = margin + (pageWidth - 2 * margin - captionWidth) / 2;
          doc.text(`Figura 1. ${report.setupImageCaption}`, captionX, currentY + h + 5);
          currentY += h + 15;
        } else {
          currentY += h + 10;
        }
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
                    ${(showMatDesc && m.description) ? `<div style="font-size: 8px; color: #64748b; line-height: 1.2; font-style: italic;">${m.description}</div>` : ''}
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

      // --- APÉNDICES ---
      if (report.appendices) {
        // APÉNDICE A: CÓDIGO INTEGENTE
        if (report.appendices.codeContent) {
          if (currentY + 40 > pageBottomLimit) { doc.addPage(); currentY = 20; }
          currentY = drawSectionHeader('APÉNDICE A: CÓDIGO / PSEUDOCÓDIGO', currentY);

          if (report.appendices.codeDescription) {
            currentY = await addBoxedSec('', report.appendices.codeDescription, currentY);
            currentY += 5;
          }


          // Determine language for highlighting
          const currentBoard = (report.appendices.selectedBoard || 'arduino').toLowerCase();
          let grammar = Prism.languages.clike;
          if (currentBoard.includes('python')) grammar = Prism.languages.python;
          else if (currentBoard.includes('script') || currentBoard.includes('js')) grammar = Prism.languages.javascript;
          else if (currentBoard.includes('arduino') || currentBoard.includes('cpp')) grammar = Prism.languages.cpp;

          const highlightedCode = Prism.highlight(
            String(report.appendices.codeContent || ''),
            grammar,
            currentBoard
          );

          // Render Code as HTML for capture with Prism classes
          const codeHtml = `
            <div style="background: #1e293b; color: #f8f8f2; padding: 16px; border-radius: 8px; font-family: 'Fira Code', monospace; font-size: 10px; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word; border: 1px solid #334155;">
              <div style="color: #94a3b8; font-size: 9px; margin-bottom: 8px; border-bottom: 1px solid #334155; padding-bottom: 4px;">
                ${(report.appendices.selectedBoard || 'Código').toUpperCase()}
              </div>
              <div class="code-highlight content">${highlightedCode}</div>
            </div>
            <style>
              .token.comment, .token.prolog, .token.doctype, .token.cdata { color: #8292a2; }
              .token.punctuation { color: #f8f8f2; }
              .token.namespace { opacity: .7; }
              .token.property, .token.tag, .token.constant, .token.symbol, .token.deleted { color: #f92672; }
              .token.boolean, .token.number { color: #ae81ff; }
              .token.selector, .token.attr-name, .token.string, .token.char, .token.builtin, .token.inserted { color: #a6e22e; }
              .token.operator, .token.entity, .token.url, .language-css .token.string, .style .token.string, .token.variable { color: #f8f8f2; }
              .token.atrule, .token.attr-value, .token.function, .token.class-name { color: #e6db74; }
              .token.keyword { color: #66d9ef; }
              .token.regex, .token.important { color: #fd971f; }
              .token.important, .token.bold { font-weight: bold; }
              .token.italic { font-style: italic; }
            </style>
          `;

          const codeCapture = await captureSectionBox(codeHtml, pageWidth - 2 * margin);
          if (codeCapture) {
            const h = await addSafeImage(codeCapture.data, margin, currentY, pageWidth - 2 * margin, codeCapture.height);
            currentY += h + 10;
          }
        }

        // APÉNDICE B: ESQUEMÁTICO
        if (report.appendices.cirkitSchematicImage) {
          if (currentY + 100 > pageBottomLimit) { doc.addPage(); currentY = 20; }
          currentY = drawSectionHeader('APÉNDICE B: ESQUEMÁTICO DEL CIRCUITO', currentY);

          if (report.appendices.schematicDescription) {
            currentY = await addBoxedSec('', report.appendices.schematicDescription, currentY);
            currentY += 5;
          }

          const schemScale = (report.appendices.schematicScale || 100) / 100;
          const h = await addSafeImage(report.appendices.cirkitSchematicImage, margin + 10, currentY, 130 * schemScale, 80 * schemScale);
          currentY += (h + 10);
        }

        // APÉNDICE C: CONFIGURACIÓN DE PINES
        if (report.appendices.pinoutBoardImage) {
          if (currentY + 100 > pageBottomLimit) { doc.addPage(); currentY = 20; }
          currentY = drawSectionHeader('APÉNDICE C: CONFIGURACIÓN DE PINES', currentY);

          if (report.appendices.pinoutDescription) {
            currentY = await addBoxedSec('', report.appendices.pinoutDescription, currentY);
            currentY += 5;
          }

          const pinScale = (report.appendices.pinoutScale || 100) / 100;
          const h = await addSafeImage(report.appendices.pinoutBoardImage, margin + 10, currentY, 130 * pinScale, 80 * pinScale);

          if (report.appendices.pinoutBoardName) {
            doc.setFontSize(9);
            doc.setTextColor(100, 100, 100);
            doc.text(`Placa: ${report.appendices.pinoutBoardName}`, margin + 10, currentY + h + 5);
          }
          currentY += (h + 15);
        }
      }

      doc.save(`Informe_Fisica_UMNG_${sanitizeFilename(report.practiceNo || 'Lab')}.pdf`);
    } catch (e) {
      console.error('Error generating PDF:', e);
      alert(`Error al generar PDF: ${e instanceof Error ? e.message : 'Error desconocido'}`);
    } finally {
      // CRITICAL: Always restore button state, even if generation fails
      setIsGenerating(false);
    }
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

            {/* I. DESCRIPCIÓN GRÁFICA (TABS) */}
            <div className="bg-white p-6 rounded-[3rem] shadow-xl border-4 border-slate-50">
              <div className="flex items-center space-x-3 mb-6 border-b-2 border-slate-100 pb-3 pl-6 pt-4">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><ImageIcon size={20} /></div>
                <h3 className="font-black text-[#004b87] uppercase tracking-widest text-xl">I. DESCRIPCIÓN GRÁFICA DEL MONTAJE</h3>
              </div>

              {/* Tabs Nav */}
              <div className="flex space-x-2 bg-slate-100 p-2 rounded-2xl mb-6 overflow-x-auto mx-6">
                {[
                  { id: 'fisico', label: 'A) MONTAJE FÍSICO', icon: <ImageIcon size={16} /> },
                  { id: 'esquematico', label: 'B) ESQUEMÁTICO', icon: <Layers size={16} /> },
                  { id: 'codigo', label: 'C) CÓDIGO', icon: <Code size={16} /> },
                  { id: 'pines', label: 'D) PINES', icon: <Database size={16} /> }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id
                      ? 'bg-[#004b87] text-white shadow-lg scale-105'
                      : 'bg-white text-slate-400 hover:bg-white/80'
                      }`}
                  >
                    <span className="mr-2">{tab.icon}</span> {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENTS */}
              <div className="px-6 pb-6">
                {/* A) MONTAJE FÍSICO */}
                <div className={activeTab === 'fisico' ? 'block' : 'hidden'}>
                  <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-8 text-center hover:border-blue-300 transition-all group relative overflow-hidden min-h-[400px] flex items-center justify-center">
                    {report.setupImageUrl ? (
                      <img src={report.setupImageUrl} className="w-full h-full object-contain" />
                    ) : (
                      <div className="space-y-4">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm"><ImageIcon size={32} className="text-slate-300" /></div>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Arrastra o haz click para subir foto del montaje</p>
                      </div>
                    )}
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => handleImageUpload(e, 'setupImageUrl')} />
                    {report.setupImageUrl && (
                      <button onClick={(e) => { e.stopPropagation(); updateReport({ setupImageUrl: '' }) }} className="absolute top-4 right-4 p-3 bg-red-100 text-red-500 rounded-xl hover:bg-red-200 transition-colors z-10 shadow-sm"><Trash2 size={20} /></button>
                    )}
                  </div>

                  {/* Image Options */}
                  {report.setupImageUrl && (
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div>
                        <Input
                          label="Descripción de la Imagen (Caption)"
                          value={report.setupImageCaption || ''}
                          onChange={(v: string) => updateReport({ setupImageCaption: v })}
                          placeholder="Ej: Montaje con sensor de movimiento..."
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                          Escala en PDF: {report.setupImageScale || 100}%
                        </label>
                        <input
                          type="range"
                          min="30"
                          max="100"
                          value={report.setupImageScale || 100}
                          onChange={(e) => updateReport({ setupImageScale: parseInt(e.target.value) })}
                          className="w-full accent-[#004b87] h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">Suba una foto clara de la disposición de equipos en el laboratorio</p>
                </div>

                {/* B) ESQUEMÁTICO */}
                <div className={activeTab === 'esquematico' ? 'block' : 'hidden'}>
                  <CirkitEmbed
                    projectUrl={report.appendices?.cirkitProjectId || ''}
                    imageUrl={report.appendices?.cirkitSchematicImage || ''}
                    onUpdate={(data: { projectUrl?: string; imageUrl?: string }) => {
                      updateReport({
                        appendices: {
                          ...(report.appendices || {}),
                          cirkitSchematicImage: data.imageUrl || report.appendices?.cirkitSchematicImage,
                          cirkitProjectId: data.projectUrl || report.appendices?.cirkitProjectId
                        }
                      });
                    }}
                  />
                </div>

                {/* C) CÓDIGO */}
                <div className={activeTab === 'codigo' ? 'block' : 'hidden'}>
                  <CodeEditor
                    initialCode={report.appendices?.codeContent || ''}
                    selectedBoard={report.appendices?.selectedBoard || 'arduino'}
                    onUpdate={(code: string, language: string) => {
                      updateReport({
                        appendices: {
                          ...(report.appendices || {}),
                          codeContent: code, // Now guaranteed to be a string
                          selectedBoard: language
                        }
                      });
                    }}
                  />
                </div>

                {/* D) PINES */}
                <div className={activeTab === 'pines' ? 'block' : 'hidden'}>
                  <PinoutViewer
                    selectedBoardId={report.appendices?.selectedBoardId}
                    onSelectBoard={(boardId: string) => {
                      updateReport({
                        appendices: {
                          ...(report.appendices || {}),
                          selectedBoardId: boardId
                        }
                      });
                    }}
                    onExportToAppendix={(boardName: string, imageUrl: string) => {
                      updateReport({
                        appendices: {
                          ...(report.appendices || {}),
                          pinoutBoardName: boardName,
                          pinoutBoardImage: imageUrl
                        }
                      });
                    }}
                  />
                </div>
              </div>
            </div>

            {/* II. DESCRIPCIÓN TEXTUAL */}
            <Section
              title="II. DESCRIPCIÓN DEL MONTAJE"
              value={report.montajeText}
              onChange={(v: string) => updateReport({ montajeText: v })}
              startIcon={<AlignLeft size={22} className="text-purple-300" />}
              gradient="from-slate-700 to-slate-900"
              help="Describa experimentalmente cómo se realizó el montaje y la conexión de los equipos."
              report={report}
              updateReport={updateReport}
            />

            {/* III. MATERIALES */}
            <div className="bg-white p-12 rounded-[4rem] shadow-2xl border-2 border-slate-50 space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center border-b-2 border-[#9e1b32] pb-4 gap-4">
                <h3 className="text-xl font-black text-[#004b87] uppercase flex items-center tracking-[0.2em]"><Layers className="mr-3 w-6 h-6 text-[#9e1b32]" /> III. Materiales y Equipos</h3>

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
                            <button onClick={() => setEditingMaterial(m)} className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-100 transition-colors">Editar</button>
                            <button onClick={() => updateReport({ materials: report.materials.filter(x => x.id !== m.id) })} className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </div>
                      ))}
                      {report.materials.filter(m => m.category === 'STUDENT').length === 0 && <p className="text-[10px] text-emerald-300 italic p-4 text-center col-span-full">No hay materiales de estudiante registrados.</p>}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* IV. PROCEDIMIENTO */}
            <Section
              title="IV. PROCEDIMIENTO"
              value={report.procedimiento}
              onChange={(v: string) => updateReport({ procedimiento: v })}
              startIcon={<ListChecks size={22} className="text-emerald-300" />}
              help="Describa paso a paso el procedimiento, puede incluir fotos."
              report={report}
              updateReport={updateReport}
            />

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
              <span className="text-xl font-black text-slate-300 uppercase tracking-widest">NOMBRE DE SERIE:</span>
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
                    {activeSeries.measurements.map((row, idx) => (
                      <MeasurementTableRow
                        key={idx}
                        row={row}
                        idx={idx}
                        series={activeSeries}
                        onChange={handleRowChange}
                      />
                    ))}
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
                  <label className="text-xl font-black text-[#004b87] uppercase flex items-center tracking-widest"><LinkIcon size={20} className="mr-2 text-[#9e1b32]" /> GRÁFICA INTERACTIVA</label>
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
      case FormStep.Appendices:
        return (
          <div className="space-y-12">
            {header}

            {/* APÉNDICE A: CÓDIGO */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-slate-50">
              <div className="flex items-center space-x-3 mb-6 border-b-2 border-slate-100 pb-3">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><Code size={20} /></div>
                <h3 className="font-black text-[#004b87] uppercase tracking-widest text-xl">APÉNDICE A: CÓDIGO FUENTE</h3>
              </div>

              <div className="mb-8">
                <Section
                  title="Descripción del Código"
                  value={report.appendices?.codeDescription || ''}
                  onChange={(v: string) => updateReport({ appendices: { ...report.appendices, codeDescription: v } })}
                  help="Explique el funcionamiento del código."
                  report={report}
                  updateReport={updateReport} // Pass as is, Section handles images internally via updateReport
                />
              </div>

              {report.appendices?.codeContent ? (
                <div className="bg-slate-900 rounded-2xl p-6 overflow-x-auto">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-2">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">PLATAFORMA: {report.appendices.selectedBoard || 'N/A'}</span>
                  </div>
                  <pre className="text-xs font-mono text-emerald-400 leading-relaxed">
                    {report.appendices.codeContent}
                  </pre>
                </div>
              ) : (
                <div className="text-center p-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <Code size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sin código registrado</p>
                  <p className="text-[9px] text-slate-300 mt-1">Vaya a la sección MONTAJE -&gt; Pestaña Código</p>
                </div>
              )}
            </div>

            {/* APÉNDICE B: ESQUEMÁTICO */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-slate-50">
              <div className="flex items-center space-x-3 mb-6 border-b-2 border-slate-100 pb-3">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><Layers size={20} /></div>
                <h3 className="font-black text-[#004b87] uppercase tracking-widest text-xl">APÉNDICE B: ESQUEMÁTICO</h3>
              </div>

              <div className="mb-8">
                <Section
                  title="Descripción del Esquemático"
                  value={report.appendices?.schematicDescription || ''}
                  onChange={(v: string) => updateReport({ appendices: { ...report.appendices, schematicDescription: v } })}
                  help="Describa el circuito y sus conexiones."
                  report={report}
                  updateReport={updateReport}
                />
              </div>

              {report.appendices?.cirkitSchematicImage ? (
                <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-4 px-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vista Previa</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-slate-400">ESCALA PDF: {(report.appendices.schematicScale || 100)}%</span>
                      <input
                        type="range"
                        min="20"
                        max="150"
                        step="10"
                        value={report.appendices.schematicScale || 100}
                        onChange={(e) => updateReport({ appendices: { ...report.appendices, schematicScale: parseInt(e.target.value) } })}
                        className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-sm relative group w-full">
                    <img src={report.appendices.cirkitSchematicImage} className="w-full h-auto object-contain bg-white" />
                    <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="bg-black/50 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Vista Previa</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <Layers size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sin esquemático capturado</p>
                  <p className="text-[9px] text-slate-300 mt-1">Vaya a la sección MONTAJE -&gt; Pestaña Esquemático</p>
                </div>
              )}
            </div>

            {/* APÉNDICE C: PINES */}
            <div className="bg-white p-8 rounded-[3rem] shadow-xl border-4 border-slate-50">
              <div className="flex items-center space-x-3 mb-6 border-b-2 border-slate-100 pb-3">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-600"><Database size={20} /></div>
                <h3 className="font-black text-[#004b87] uppercase tracking-widest text-xl">APÉNDICE C: PINES</h3>
              </div>

              <div className="mb-8">
                <Section
                  title="Descripción del Pinout"
                  value={report.appendices?.pinoutDescription || ''}
                  onChange={(v: string) => updateReport({ appendices: { ...report.appendices, pinoutDescription: v } })}
                  help="Detalle la configuración de pines utilizada."
                  report={report}
                  updateReport={updateReport}
                />
              </div>

              {report.appendices?.pinoutBoardImage ? (
                <div className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col items-center">
                  <div className="w-full flex justify-between items-center mb-4 px-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Vista Previa</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-slate-400">ESCALA PDF: {(report.appendices.pinoutScale || 100)}%</span>
                      <input
                        type="range"
                        min="20"
                        max="150"
                        step="10"
                        value={report.appendices.pinoutScale || 100}
                        onChange={(e) => updateReport({ appendices: { ...report.appendices, pinoutScale: parseInt(e.target.value) } })}
                        className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="rounded-[2rem] overflow-hidden border-2 border-slate-100 shadow-sm relative group w-full">
                    <img src={report.appendices.pinoutBoardImage} className="w-full h-auto object-contain bg-white" />
                    {report.appendices.pinoutBoardName && (
                      <div className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 rounded-lg text-[10px] font-black text-[#004b87] uppercase tracking-widest shadow-sm">
                        {report.appendices.pinoutBoardName}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-12 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <Database size={32} className="mx-auto text-slate-300 mb-2" />
                  <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sin pinout exportado</p>
                  <p className="text-[9px] text-slate-300 mt-1">Vaya a la sección MONTAJE -&gt; Pestaña Pines y haga click en 'Añadir al Reporte'</p>
                </div>
              )}
            </div>
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
                    <li><strong className="text-blue-900">ABRIR / GUARDAR:</strong> Importa o exporta tu trabajo actual en formato JSON (menú lateral).</li>
                    <li><strong className="text-blue-900">REINICIAR:</strong> Borra todo el progreso para empezar un nuevo reporte.</li>
                    <li><strong className="text-blue-900">ROTAR TABLA:</strong> Activa esta opción para que la tabla de datos genere una hoja en formato horizontal independiente en el PDF.</li>
                    <li>Carga de datos experimentales con promedios y errores automáticos.</li>
                    <li>Integración de gráficas vía enlace único de Desmos.</li>
                    <li>Integración de código para Arduino y visualizador interactivo de pines (Pinout).</li>
                  </ul>
                </div>
                <div className="bg-emerald-50 p-8 rounded-[3rem] border-2 border-emerald-100">
                  <h4 className="font-black text-emerald-900 uppercase tracking-widest text-xs mb-4 flex items-center"><TrendingUp className="mr-2" size={16} /> Para el Docente</h4>
                  <ul className="space-y-3 text-sm font-semibold text-emerald-800 list-disc pl-5">
                    <li><strong className="text-emerald-900">Alternar Modo:</strong>  Activa el "Modo Docente" en el encabezado.</li>
                    <li><strong className="text-emerald-900">Rúbricas:</strong> Sistema 100% parametrizable (Gestor en menú lateral).</li>
                    <li><strong className="text-emerald-900">Calificación:</strong> Opción para otorgar puntajes directos por cada ítem.</li>
                    <li>Evalúa análisis de gráficas y visualiza la nota estimada en vivo.</li>
                  </ul>
                </div>
              </div>

              <section className="space-y-6">
                <h3 className="text-2xl font-black text-[#004b87] uppercase tracking-tighter flex items-center"><Layers className="mr-3 text-[#9e1b32]" /> Funciones por Sección</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl">
                    <h4 className="font-black text-[#004b87] uppercase tracking-widest text-xs mb-3 flex items-center"><Users size={16} className="mr-2" /> 1. GENERAL Y TEORÍA</h4>
                    <p className="text-sm font-medium text-slate-600 mb-3">En "General" se llenan los datos básicos de los estudiantes y el nombre del profesor. El resumen es aconsejable dejarlo para el final del desarrollo de la bitácora.</p>
                    <p className="text-sm font-medium text-slate-600 mb-3">En "Teoría" se redacta la introducción teórica y el marco conceptual. Puedes insertar <strong className="text-[#004b87]">imágenes</strong> con el icono junto a los títulos y ajustar su diagrama. La hipótesis solo se escribe si aplica al experimento.</p>
                    <p className="text-sm font-medium text-slate-600"><strong>Nota:</strong> Cualquier imagen insertada se ajustará automáticamente, y cuentas con soporte LaTeX.</p>
                  </div>

                  <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl">
                    <h4 className="font-black text-[#004b87] uppercase tracking-widest text-xs mb-3 flex items-center"><Settings size={16} className="mr-2" /> 2. MONTAJE</h4>
                    <p className="text-sm font-medium text-slate-600 mb-2">Posee 4 pestañas interactivas:</p>
                    <ul className="text-xs font-medium text-slate-600 space-y-2 list-disc pl-5">
                      <li><strong>Físico:</strong> Imagen del montaje en el laboratorio. Ingresa la descripción en el <em>caption</em> detallando cada componente.</li>
                      <li><strong>Esquemático:</strong> Gráfica o esquema de circuitos implementados (ej. usando Cirkit).</li>
                      <li><strong>Código:</strong> Editor integrado (ej. C++ a adecuarse en Python), incluye autoconversor.</li>
                      <li><strong>Pines:</strong> Señalización interactiva de pines usados (ej. en ESP32/micro).</li>
                    </ul>
                    <p className="text-xs font-medium text-slate-600 mt-3">Además, gestiona los "Materiales" de laborario/estudiante. Su descripción se puede mostrar u ocultar con el botón "VER DETALLES".</p>
                  </div>

                  <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl">
                    <h4 className="font-black text-[#004b87] uppercase tracking-widest text-xs mb-3 flex items-center"><TableIcon size={16} className="mr-2" /> 3. DATOS</h4>
                    <p className="text-sm font-medium text-slate-600 mb-2">Dividido en tres secciones claves para reportar <strong className="text-red-500">mínimo 5 datos</strong>:</p>
                    <ul className="text-xs font-medium text-slate-600 space-y-2 list-disc pl-5">
                      <li><strong>Variables Principales:</strong> Crea la dependiente e independiente, con sus repeticiones, promedios e incertidumbres según la precisión del instrumento.</li>
                      <li><strong>Variables Extra:</strong> Para medidas únicas que no cambian en la tabla (ej. masa) pero afectan al experimento.</li>
                      <li><strong>Indirectas (Calculadas):</strong> Magnitudes obtenidas de operar las principales (ej. velocidad a partir de posición y tiempo).</li>
                    </ul>
                    <p className="text-xs font-medium text-slate-600 mt-2">Puedes arrastrar variables para intercambiarlas y crear nuevas series desde la cabecera.</p>
                  </div>

                  <div className="p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl">
                    <h4 className="font-black text-[#004b87] uppercase tracking-widest text-xs mb-3 flex items-center"><BarChart size={16} className="mr-2" /> 4. RESULTADOS Y APÉNDICES</h4>
                    <p className="text-sm font-medium text-slate-600 mb-2">Incluye ajuste por <strong>mínimos cuadrados</strong> para comportamientos lineales.</p>
                    <p className="text-xs font-medium text-slate-600 mb-2"><em>💡 Tip para evaluar linealidad:</em> Si tu función no es lineal (ej. Fuerza vs inverso de r²), desliza la variable al panel Indirecto, aplica el inverso y reemplázala como Dependiente o Independiente para linealizarla, o aplícale logaritmo.</p>
                    <ul className="text-xs font-medium text-slate-600 space-y-2 list-disc pl-5">
                      <li>Gráfica interactiva vía <strong>Desmos</strong> si no es linealizable por código.</li>
                      <li>Incertidumbre, m, y R² calculados automáticamente.</li>
                      <li>Análisis de resultados y conclusiones con inserción de imágenes.</li>
                      <li><strong>Apéndices:</strong> Abarca esquemáticos, códigos y pinout. Exclusivo para la exportación.</li>
                    </ul>
                  </div>

                </div>
              </section>

              <section className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100 mb-8">
                <h4 className="font-black text-emerald-700 uppercase tracking-widest text-lg mb-4 flex items-center"><Download size={24} className="mr-3" /> EXPORTACIÓN Y TRABAJO EN EQUIPO</h4>
                <div className="space-y-4 text-sm font-medium leading-relaxed text-slate-700">
                  <p>
                    <strong className="text-blue-700">Compartir Progreso (JSON):</strong> Usa el botón <strong className="text-[#004b87]">GUARDAR</strong> para exportar un archivo <code>.json</code>. Puedes compartir este archivo con tus compañeros de grupo para que lo importen con <strong className="text-[#004b87]">ABRIR</strong> y puedan seguir complementando el trabajo desde donde lo dejaste, o consolidar las partes de cada integrante.
                  </p>
                  <p>
                    <strong className="text-red-700">Documento Final (PDF):</strong> Una vez llenado el informe y revisado por todo el equipo, recuerda siempre utilizar la opción <strong className="text-[#9e1b32]">EXPORTAR PDF</strong> en la parte superior derecha. Esto generará un documento limpio con gráficos, código renderizado e imágenes en su lugar correspondiente, ideal para imprimir o cargar como evidencia formal de tu trabajo.
                  </p>
                </div>
              </section>

              <section className="bg-slate-50 p-8 rounded-[3rem] border-2 border-slate-100">
                <h4 className="font-black text-[#004b87] uppercase tracking-widest text-xs mb-4">Uso de LaTeX Avanzado</h4>
                <p className="text-sm font-medium leading-relaxed mb-4">
                  Puedes utilizar comandos LaTeX en toda el área de texto.
                  Usa <code className="bg-white px-2 py-1 rounded-lg border text-blue-600 font-bold">$...$</code> para fórmulas en línea. Ejemplo: <code className="bg-white px-2 py-1 rounded-lg border text-blue-600 font-bold">$\sum F = ma$</code>.<br />
                  Para ecuaciones en bloque, puedes usar <code className="bg-white px-2 py-1 rounded-lg border text-blue-600 font-bold">$$...$$</code> o bien <code className="bg-white px-2 py-1 rounded-lg border text-blue-600 font-bold" dangerouslySetInnerHTML={{ __html: '\\begin{equation}...\\end{equation}' }}></code>.
                </p>
                <div className="bg-white p-4 rounded-2xl border border-blue-100 text-xs text-slate-600">
                  <strong className="text-[#004b87] block mb-2">🖼️ Dimensionar Imágenes:</strong>
                  Al insertar una imagen con el botón de la cámara, se generará un bloque LaTeX. Para cambiar su tamaño, simplemente modifica el valor multiplicador de <code className="bg-slate-100 px-1 rounded text-red-600">width=0.8\linewidth</code>.
                  <br />Por ejemplo, usa <code>0.5</code> para la mitad de ancho o <code>1.0</code> para el ancho total de la página.
                </div>
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
            <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.4em] mt-2 opacity-80">Departamento de Física</p>
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

          <div className="bg-white p-2 rounded-[3.5rem] shadow-2xl space-y-2 border-2 border-white">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center py-2">Opciones de Archivo</h3>

            <label className="w-full p-5 rounded-[2.8rem] flex items-center space-x-5 transition-all duration-300 cursor-pointer bg-transparent text-slate-400 hover:bg-slate-50 hover:text-slate-600 group">
              <div className="p-3 rounded-2xl transition-all duration-500 shadow-sm bg-slate-100 group-hover:rotate-6"><FolderOpen size={18} /></div>
              <span className="font-black text-[11px] uppercase tracking-[0.2em]">ABRIR</span>
              <input type="file" className="hidden" accept=".json" onChange={handleImportJSON} />
            </label>

            <button onClick={handleExportJSON} className="w-full p-5 rounded-[2.8rem] flex items-center space-x-5 transition-all duration-300 bg-transparent text-slate-400 hover:bg-slate-50 hover:text-emerald-500 group text-left">
              <div className="p-3 rounded-2xl transition-all duration-500 shadow-sm bg-slate-100 group-hover:rotate-6"><Save size={18} /></div>
              <span className="font-black text-[11px] uppercase tracking-[0.2em]">GUARDAR</span>
            </button>

            <button onClick={handleResetReport} className="w-full p-5 rounded-[2.8rem] flex items-center space-x-5 transition-all duration-300 bg-transparent text-slate-400 hover:bg-red-50 hover:text-red-600 group text-left">
              <div className="p-3 rounded-2xl transition-all duration-500 shadow-sm bg-slate-100 group-hover:rotate-6"><Trash2 size={18} /></div>
              <span className="font-black text-[11px] uppercase tracking-[0.2em]">REINICIAR</span>
            </button>
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



export default App;
