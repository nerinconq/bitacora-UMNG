import fs from 'fs';
const file = 'c:/Users/nelso/Documents/A_UMNG/FUNCIONALES DE AISTUDIO/bitacora-rubrica-informe/BitacoraRubrica/App.tsx';
let content = fs.readFileSync(file, 'utf8');
let lines = content.split('\n');

const toRemove = [];
// calculateRowAvgs to getRegressionData
for (let i = 147; i < 278; i++) toRemove.push(i);
// ExtraVarPanel to InputMini (including renderErrorFormula, IndirectVarPanel, VarConfig, EstimationPanel, SmartNumberInput)
for (let i = 301; i < 727; i++) toRemove.push(i);
// renderLatexToHtml and renderMathOnly
for (let i = 825; i < 897; i++) toRemove.push(i);

let newLines = lines.filter((_, i) => !toRemove.includes(i));
content = newLines.join('\n');

const imports = `import { ExtraVarPanel } from './components/ExtraVarPanel';
import { IndirectVarPanel } from './components/IndirectVarPanel';
import { EstimationPanel } from './components/EstimationPanel';
import { InputMini, SmartNumberInput, VarConfig } from './components/SharedUI';
import { calculateRowAvgs, evaluateFormula, calculateIndirectValues, getRegressionData, calculateStats, parseNum, applyRuleOfGold, formatMeasure } from './utils/calculations';
import { renderLatexToHtml, renderMathOnly, renderErrorFormula } from './utils/latexUtils';
`;
content = content.replace("import { PinoutViewer } from './components/PinoutViewer';", "import { PinoutViewer } from './components/PinoutViewer';\n" + imports);

content = content.replace("import { calculateStats, parseNum, applyRuleOfGold, formatMeasure } from './utils/calculations';", "");

fs.writeFileSync(file, content);
console.log("Deleted exact lines!");
