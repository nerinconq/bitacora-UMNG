import React, { memo } from 'react';
import { MeasurementRow, DataSeries } from '../types';
import { calculateRowAvgs, calculateIndirectValues, formatMeasure, parseNum } from '../utils/calculations';

interface MeasurementTableRowProps {
    row: MeasurementRow;
    idx: number;
    series: DataSeries;
    onChange: (idx: number, updatedRow: MeasurementRow) => void;
}

const areEqual = (prevProps: MeasurementTableRowProps, nextProps: MeasurementTableRowProps) => {
    // If the row data hasn't changed, and the configurations affecting calculation/display haven't changed, skip re-render.
    return (
        prevProps.row === nextProps.row &&
        prevProps.idx === nextProps.idx &&
        prevProps.series.varIndep === nextProps.series.varIndep &&
        prevProps.series.varDep === nextProps.series.varDep &&
        prevProps.series.extraVariables === nextProps.series.extraVariables &&
        prevProps.series.indirectVariables === nextProps.series.indirectVariables &&
        prevProps.series.precisionX === nextProps.series.precisionX &&
        prevProps.series.precisionY === nextProps.series.precisionY &&
        prevProps.series.numRepetitionsIndep === nextProps.series.numRepetitionsIndep &&
        prevProps.series.numRepetitionsDep === nextProps.series.numRepetitionsDep
    );
};

export const MeasurementTableRow = memo(({ row, idx, series, onChange }: MeasurementTableRowProps) => {
    const { dAvgRaw, iAvgRaw, getExtraAvg } = calculateRowAvgs(row, series);
    const indirectVals = calculateIndirectValues(row, series);

    const fmtX = formatMeasure(iAvgRaw, parseNum(row.dX) || series.varIndep.uncertainty);
    const fmtY = formatMeasure(dAvgRaw, parseNum(row.dY) || series.varDep.uncertainty);

    return (
        <tr className="border-b-2 border-slate-50 hover:bg-slate-50 transition-colors group">
            <td className="p-4 text-center bg-slate-50/50 font-black text-slate-400 border-r-2 border-slate-50">{idx + 1}</td>

            {/* Extra Vars Inputs */}
            {series.extraVariables.map(ev => {
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
                                        const newRow = { ...row, others: { ...row.others, [`${ev.id}_${rIdx}`]: e.target.value } };
                                        onChange(idx, newRow);
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
                                    const newRow = { ...row, others: { ...row.others, [`${ev.id}_unc`]: e.target.value } };
                                    onChange(idx, newRow);
                                }} />
                        </td>
                    </React.Fragment>
                );
            })}

            {/* Independent Data */}
            {Array.from({ length: series.numRepetitionsIndep }).map((_, i) => (
                <td key={`i-${i}`} className="p-0 border-r border-slate-100">
                    <input className={`w-full p-4 text-center bg-transparent focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none font-medium transition-all ${series.varIndep.isCalculated ? 'bg-purple-50 text-purple-700 font-bold cursor-not-allowed' : ''}`}
                        disabled={series.varIndep.isCalculated}
                        value={row.i[i]}
                        onChange={e => {
                            const newI = [...row.i];
                            newI[i] = e.target.value;
                            onChange(idx, { ...row, i: newI });
                        }} />
                </td>
            ))}
            <td className="p-4 text-center bg-emerald-100/30 font-black text-emerald-900 text-xs border-r-2 border-slate-100 group-hover:bg-emerald-100 transition-all">{fmtX.val}</td>
            <td className="p-0 bg-emerald-50/20 border-r-2 border-slate-100 table-cell-delta">
                <input className="w-full p-4 text-center font-black text-emerald-800 focus:bg-white outline-none"
                    value={row.dX}
                    onChange={e => {
                        onChange(idx, { ...row, dX: e.target.value });
                    }} />
            </td>

            {/* Dependent Data */}
            {Array.from({ length: series.numRepetitionsDep }).map((_, i) => (
                <td key={`d-${i}`} className="p-0 border-r border-slate-100">
                    <input className={`w-full p-4 text-center bg-transparent focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none font-medium transition-all ${series.varDep.isCalculated ? 'bg-purple-50 text-purple-700 font-bold cursor-not-allowed' : ''}`}
                        disabled={series.varDep.isCalculated}
                        value={row.d[i]}
                        onChange={e => {
                            const newD = [...row.d];
                            newD[i] = e.target.value;
                            onChange(idx, { ...row, d: newD });
                        }} />
                </td>
            ))}
            <td className="p-4 text-center bg-blue-100/30 font-black text-blue-900 text-xs border-r-2 border-slate-100 group-hover:bg-blue-100 transition-all">{fmtY.val}</td>
            <td className="p-0 bg-blue-50/20 border-r-2 border-slate-100 table-cell-delta">
                <input className="w-full p-4 text-center font-black text-blue-800 focus:bg-white outline-none"
                    value={row.dY}
                    onChange={e => {
                        onChange(idx, { ...row, dY: e.target.value });
                    }} />
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
}, areEqual);
