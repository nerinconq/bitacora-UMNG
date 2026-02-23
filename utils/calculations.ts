import { RegressionRow, MeasurementRow, DataSeries, IndirectVariable } from '../types';

export const parseNum = (v: string | number | undefined | null): number => {
  if (typeof v === 'number') return v;
  if (!v) return NaN;
  const str = v.toString().trim();
  if (str === '') return NaN;
  return parseFloat(str.replace(',', '.'));
};

export const calculateStats = (data: RegressionRow[]) => {
  const n = data.length;
  if (n < 2) return null;

  const sumX = data.reduce((acc, row) => acc + row.x, 0);
  const sumY = data.reduce((acc, row) => acc + row.y, 0);
  const sumX2 = data.reduce((acc, row) => acc + (row.x ** 2), 0);
  const sumY2 = data.reduce((acc, row) => acc + (row.y ** 2), 0);
  const sumXY = data.reduce((acc, row) => acc + (row.x * row.y), 0);

  const delta = n * sumX2 - (sumX ** 2);
  if (Math.abs(delta) < 1e-15) return null;

  const m = (n * sumXY - sumX * sumY) / delta;
  const b = (sumX2 * sumY - sumX * sumXY) / delta;

  let sumSqResiduals = 0;
  data.forEach(row => {
    sumSqResiduals += (m * row.x + b - row.y) ** 2;
  });

  const sigmaY = Math.sqrt(sumSqResiduals / (n - 2));
  const sigmaM = sigmaY * Math.sqrt(n / delta);
  const sigmaB = sigmaY * Math.sqrt(sumX2 / delta);

  const rNum = (n * sumXY - sumX * sumY) ** 2;
  const rDen = delta * (n * sumY2 - (sumY ** 2));
  const r2 = rDen !== 0 ? rNum / rDen : 0;

  return {
    n,
    sumX,
    sumY,
    sumX2,
    sumY2,
    sumXY,
    delta,
    m,
    b,
    sigmaY,
    sigmaM,
    sigmaB,
    r2
  };
};

/**
 * REGLA DE ORO DE REDONDEO DE INCERTIDUMBRES:
 * 1. Si la primera cifra significativa es '1', se conservan DOS cifras significativas.
 * 2. En cualquier otro caso, se conserva UNA sola cifra significativa.
 */
export const applyRuleOfGold = (uncertainty: number) => {
  if (uncertainty === 0 || isNaN(uncertainty)) return { value: 0, decimals: 0 };

  const absUnc = Math.abs(uncertainty);
  const exponent = Math.floor(Math.log10(absUnc));
  const firstDigit = Math.floor(absUnc / Math.pow(10, exponent));

  const sigDigits = firstDigit === 1 ? 2 : 1;
  const multiplier = Math.pow(10, exponent - (sigDigits - 1));
  const roundedUnc = Math.ceil(absUnc / multiplier) * multiplier;

  // Calcular cuántos decimales se necesitan para mostrar esas cifras significativas
  const decimals = Math.max(0, -Math.floor(Math.log10(roundedUnc)) + (sigDigits - 1));

  return {
    value: roundedUnc,
    decimals: decimals,
    formatted: roundedUnc.toFixed(decimals)
  };
};

/**
 * Formatea un par (Valor Central, Incertidumbre) asegurando consistencia decimal.
 * Basado en la Regla de Oro.
 */
export const formatMeasure = (value: number, uncertainty: number) => {
  if (isNaN(value)) return { val: '-', unc: '-' };
  if (uncertainty === 0 || isNaN(uncertainty)) return { val: value.toString(), unc: '0' };

  const { value: roundedUnc, decimals } = applyRuleOfGold(uncertainty);

  return {
    val: value.toFixed(decimals),
    unc: roundedUnc.toFixed(decimals)
  };
};

export const calculateRowAvgs = (row: MeasurementRow, series: DataSeries) => {
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

export const evaluateFormula = (formula: string, values: Record<string, number>): number => {
  try {
    let parsed = formula.includes('=') ? formula.split('=').pop()! : formula;
    const keys = Object.keys(values).sort((a, b) => b.length - a.length);

    keys.forEach(sym => {
      parsed = parsed.replace(new RegExp(`\\b${sym}\\b`, 'g'), values[sym].toString());
    });

    parsed = parsed.replace(/\bsqrt\b/g, 'Math.sqrt')
      .replace(/\bsin\b/g, 'Math.sin')
      .replace(/\bcos\b/g, 'Math.cos')
      .replace(/\btan\b/g, 'Math.tan')
      .replace(/\blog\b/g, 'Math.log10')
      .replace(/\bln\b/g, 'Math.log')
      .replace(/\^/g, '**')
      .replace(/\bpi\b/g, 'Math.PI')
      .replace(/\be\b/g, 'Math.E');

    if (!/^[\d\.\+\-\*\/\(\)\sMath\.\w]+$/.test(parsed)) return NaN;

    return new Function(`return (${parsed})`)();
  } catch (e) {
    return NaN;
  }
};

export const calculateIndirectValues = (row: MeasurementRow, series: DataSeries) => {
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

export const getRegressionData = (series: DataSeries): RegressionRow[] => {
  return series.measurements.map(r => {
    const avgs = calculateRowAvgs(r, series);
    const x = avgs.iAvg;
    const y = avgs.dAvg;

    return {
      n: r.n,
      x, y,
      x2: x * x,
      y2: y * y,
      xy: x * y
    };
  }).filter(r => (r.y !== 0 || r.x !== 0) && !isNaN(r.y) && !isNaN(r.x));
};
