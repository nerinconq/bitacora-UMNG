const fs = require('fs');
const file = 'c:/Users/nelso/Documents/A_UMNG/FUNCIONALES DE AISTUDIO/bitacora-rubrica-informe/BitacoraRubrica/App.tsx';
let content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

const newLines = [];
let i = 0;
let addedImports = false;

while (i < lines.length) {
    if (lines[i].includes("import { calculateStats, parseNum, applyRuleOfGold, formatMeasure } from './utils/calculations';") && !addedImports) {
        newLines.push("import { calculateRowAvgs, evaluateFormula, calculateIndirectValues, getRegressionData, calculateStats, parseNum, applyRuleOfGold, formatMeasure } from './utils/calculations';");
        newLines.push("import { renderLatexToHtml, renderMathOnly, renderErrorFormula } from './utils/latexUtils';");
        newLines.push("import { InputMini, SmartNumberInput, VarConfig } from './components/SharedUI';");
        newLines.push("import { ExtraVarPanel } from './components/ExtraVarPanel';");
        newLines.push("import { IndirectVarPanel } from './components/IndirectVarPanel';");
        newLines.push("import { EstimationPanel } from './components/EstimationPanel';");
        addedImports = true;
        i++;
        continue;
    }

    if (lines[i].startsWith("const calculateRowAvgs = ")) {
        while (i < lines.length && !lines[i].startsWith("const imageToBase64 = ")) {
            i++;
        }
        continue;
    }

    if (lines[i].startsWith("const ExtraVarPanel = ")) {
        while (i < lines.length && !lines[i].startsWith("const Input = ")) {
            i++;
        }
        continue;
    }

    if (lines[i].startsWith("const renderLatexToHtml = ")) {
        while (i < lines.length && !lines[i].startsWith("const RegressionTable = ")) {
            i++;
        }
        continue;
    }

    newLines.push(lines[i]);
    i++;
}

fs.writeFileSync(file, newLines.join('\n'));
console.log('App.tsx transformed successfully!');
