import React, { useState } from 'react';
import { Calculator, Trash2, Info, ArrowUp, Plus } from 'lucide-react';
import { DataSeries, IndirectVariable } from '../types';
import { renderLatexToHtml, renderErrorFormula } from '../utils/latexUtils';

export const IndirectVarPanel: React.FC<{ series: DataSeries; onUpdate: (vars: IndirectVariable[]) => void }> = ({ series, onUpdate }) => {
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
