import katex from 'katex';
import { DataSeries, IndirectVariable } from '../types';
import { calculateRowAvgs, calculateIndirectValues, evaluateFormula } from './calculations';

export const renderMathOnly = (text: string) => text.replace(/\$([^$]+)\$/g, (_, f) => {
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

export const renderLatexToHtml = (text: string, images: Record<string, string> = {}) => {
    if (!text) return '';
    let p = text.replace(/\\\\/g, '<br />');

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
                    // Force width to be exact percentage of container
                    imgStyle = `width: ${parseFloat(val) * 100}%; max-width: none; height: auto; border-radius: 1rem;`;
                } else if (unit) {
                    imgStyle = `width: ${val + unit}; max-width: 100%; height: auto; border-radius: 1rem;`;
                } else if (val.includes('%')) {
                    imgStyle = `width: ${val}; max-width: none; height: auto; border-radius: 1rem;`;
                } else {
                    // Default to px if no unit
                    imgStyle = `width: ${val}px; max-width: 100%; height: auto; border-radius: 1rem;`;
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

export const renderErrorFormula = (iv: IndirectVariable, series: DataSeries) => {
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
