import React, { useState } from 'react';
import { Settings, Edit3, Plus, Trash2 } from 'lucide-react';
import { DataSeries, VariableConfig } from '../types';
import { InputMini, SmartNumberInput } from './SharedUI';

export const ExtraVarPanel = ({ series, onUpdate }: { series: DataSeries, onUpdate: (vars: VariableConfig[]) => void }) => {
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
                    <InputMini label="Nombre (ej. Masa)" value={newVar.name} onChange={(v: string) => setNewVar({ ...newVar, name: v })} />
                </div>
                <div className="col-span-2">
                    <InputMini label="Símbolo (ej. \rho)" value={newVar.symbol} onChange={(v: string) => setNewVar({ ...newVar, symbol: v })} />
                    <span className="text-[9px] text-slate-400 block mt-1">Usa LaTeX: \rho, \theta, \Delta</span>
                </div>
                <div className="col-span-2">
                    <InputMini label="Unidad (kg)" value={newVar.unit} onChange={(v: string) => setNewVar({ ...newVar, unit: v })} />
                </div>
                <div className="col-span-2">
                    <SmartNumberInput label="Factor" value={newVar.multiplier} onChange={(v: number) => setNewVar({ ...newVar, multiplier: v || 1 })} />
                </div>
                <div className="col-span-1">
                    <InputMini label="Reps" type="number" value={newVar.numRepetitions || 1} onChange={(v: string) => setNewVar({ ...newVar, numRepetitions: parseInt(v) || 1 })} />
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
