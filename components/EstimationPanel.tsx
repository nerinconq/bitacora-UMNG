import React from 'react';
import { Calculator } from 'lucide-react';
import { DataSeries } from '../types';
import { getRegressionData } from '../utils/calculations';
import { calculateStats, formatMeasure } from '../utils/calculations';
import { renderMathOnly } from '../utils/latexUtils';

export const EstimationPanel = ({ series }: { series: DataSeries }) => {
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
                            sub={`\\frac{${stats.n}(${toLatexSci(stats.sumXY)}) - (${toLatexSci(stats.sumX)})(${toLatexSci(stats.sumY)})}{${toLatexSci(stats.delta)}}`}
                            result={fmtM.val}
                        />
                        <SubstitutionCard
                            title="Intercepto (B)"
                            formula="B = \frac{\sum x^2 \sum y - \sum x \sum xy}{\Delta}"
                            sub={`\\frac{(${toLatexSci(stats.sumX2)})(${toLatexSci(stats.sumY)}) - (${toLatexSci(stats.sumX)})(${toLatexSci(stats.sumXY)})}{${toLatexSci(stats.delta)}}`}
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
