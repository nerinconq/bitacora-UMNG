import fs from 'fs';
const file = 'c:/Users/nelso/Documents/A_UMNG/FUNCIONALES DE AISTUDIO/bitacora-rubrica-informe/BitacoraRubrica/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
const signaturesToRemove = [
    "const calculateRowAvgs =",
    "const evaluateFormula =",
    "const calculateIndirectValues =",
    "const getRegressionData =",
    "const ExtraVarPanel =",
    "const renderErrorFormula =",
    "const IndirectVarPanel: React.FC",
    "const VarConfig =",
    "const EstimationPanel =",
    "const SmartNumberInput =",
    "const InputMini =",
    "const renderLatexToHtml =",
    "const renderMathOnly ="
];

let newLines = [];
let skip = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!skip) {
        let matched = false;
        for (const sig of signaturesToRemove) {
            if (line.startsWith(sig) || (line.trim().startsWith(sig))) {
                matched = true;
                break;
            }
        }
        if (matched) {
            skip = true;
            // Count braces avoiding simple string literals if possible, but let's hope it's not needed.
            braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
            if (braceCount === 0 && line.trim().endsWith("};")) {
                skip = false;
            }
            continue;
        }
        newLines.push(line);
    } else {
        braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        if (braceCount <= 0 && line.trim().endsWith("};")) {
            skip = false;
            braceCount = 0;
        }
    }
}

content = newLines.join('\n');

const imports = `import { ExtraVarPanel } from './components/ExtraVarPanel';
import { IndirectVarPanel } from './components/IndirectVarPanel';
import { EstimationPanel } from './components/EstimationPanel';
import { InputMini, SmartNumberInput, VarConfig } from './components/SharedUI';
`;
content = content.replace("import { PinoutViewer } from './components/PinoutViewer';", "import { PinoutViewer } from './components/PinoutViewer';\n" + imports);

fs.writeFileSync(file, content);
console.log("Extraction complete!");
