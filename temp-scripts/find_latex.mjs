import fs from 'fs';
const file = 'c:/Users/nelso/Documents/A_UMNG/FUNCIONALES DE AISTUDIO/bitacora-rubrica-informe/BitacoraRubrica/App.tsx';
const content = fs.readFileSync(file, 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('const renderLatexToHtml')) {
        console.log(`Found renderLatexToHtml at ${i + 1}`);
    }
    if (lines[i].includes('const renderMathOnly')) {
        console.log(`Found renderMathOnly at ${i + 1}`);
    }
}
