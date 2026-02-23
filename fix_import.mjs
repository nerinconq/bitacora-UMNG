import fs from 'fs';
const file = 'c:/Users/nelso/Documents/A_UMNG/FUNCIONALES DE AISTUDIO/bitacora-rubrica-informe/BitacoraRubrica/App.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import { MeasurementTableRow }")) {
    content = content.replace(
        "import { EstimationPanel } from './components/EstimationPanel';",
        "import { EstimationPanel } from './components/EstimationPanel';\nimport { MeasurementTableRow } from './components/MeasurementTableRow';"
    );
    fs.writeFileSync(file, content);
    console.log("Added import!");
} else {
    console.log("Import already exists?");
}
