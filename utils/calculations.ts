
import { RegressionRow } from '../types';

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
