import fs from 'fs';
const file = 'c:/Users/nelso/Documents/A_UMNG/FUNCIONALES DE AISTUDIO/bitacora-rubrica-informe/BitacoraRubrica/App.tsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('captureSectionBox')) {
        console.log(`Found captureSectionBox at line ${i + 1}`);
    }
    if (lines[i].includes('jsPDF')) {
        console.log(`Found jsPDF at line ${i + 1}`);
    }
    if (lines[i].includes('html2canvas')) {
        console.log(`Found html2canvas at line ${i + 1}`);
    }
}
