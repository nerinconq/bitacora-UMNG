import React, { useState, useEffect } from 'react';
import { Layers, MinusCircle, PlusCircle } from 'lucide-react';
import { parseNum } from '../utils/calculations';

export const InputMini = ({ label, value, onChange, type = "text", ...props }: any) => (
    <div className="space-y-1">
        <label className="text-[9px] font-black text-slate-400 uppercase ml-3 tracking-[0.1em]">{label}</label>
        <input type={type} step="any" className="w-full p-4 rounded-[1.5rem] border-2 border-slate-50 shadow-inner bg-slate-50/50 text-xs font-black outline-none focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all text-[#004b87]" value={value} onChange={e => onChange(e.target.value)} {...props} />
    </div>
);

export const SmartNumberInput = ({ value, onChange, ...props }: any) => {
    const [str, setStr] = useState(value?.toString() || '');
    useEffect(() => {
        const currentParsed = parseNum(str);
        if (typeof value === 'number' && !isNaN(value) && Math.abs(value - currentParsed) > 1e-9) {
            setStr(value.toString());
        }
    }, [value, str]);
    const handleChange = (val: string) => {
        setStr(val);
        const num = parseNum(val);
        if (!isNaN(num)) { onChange(num); }
    };
    return <InputMini {...props} value={str} onChange={handleChange} />;
};

export const VarConfig = ({ title, config, onChange, reps, onRepsChange }: any) => (
    <div className="space-y-6">
        <h4 className="text-[10px] font-black text-[#004b87] uppercase tracking-[0.2em] border-b-2 border-[#9e1b32] pb-3 flex items-center"><Layers size={18} className="mr-3 text-[#9e1b32]" /> {title}</h4>
        <div className="grid grid-cols-6 gap-5">
            <div className="col-span-2">
                <InputMini label="Nombre de Variable" value={config.name} onChange={(v: any) => onChange({ ...config, name: v })} />
            </div>
            <div className="col-span-1">
                <InputMini label="Símbolo" value={config.symbol || (title.includes('Independiente') ? 'x' : 'y')} onChange={(v: any) => onChange({ ...config, symbol: v })} />
            </div>
            <div className="col-span-1">
                <InputMini label="Unidad" value={config.unit} onChange={(v: any) => onChange({ ...config, unit: v })} />
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
