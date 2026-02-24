import fs from 'fs';
const file = 'c:/Users/nelso/Documents/A_UMNG/FUNCIONALES DE AISTUDIO/bitacora-rubrica-informe/BitacoraRubrica/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Remove static imports
content = content.replace("import { jsPDF } from 'jspdf';", "");
content = content.replace("import html2canvas from 'html2canvas';", "");

// 2. Modify captureSectionBox
const captureRegex = /const canvas = await html2canvas\(container, { scale: 2, useCORS: true, logging: false }\);/;
if (content.match(captureRegex)) {
    content = content.replace(captureRegex, `const html2canvasModule = await import('html2canvas');
      const html2canvas = html2canvasModule.default;
      const canvas = await html2canvas(container, { scale: 2, useCORS: true, logging: false });`);
}

// 3. Modify handleDownloadPDF
const exportRegex = /const handleDownloadPDF = async \(\) => {[\s\S]*?setIsGenerating\(true\);\n?\n?\s*const doc = new jsPDF\(\{ orientation: 'p', unit: 'mm', format: 'a4' \}\);/;
if (content.match(exportRegex)) {
    content = content.replace(exportRegex, `const handleDownloadPDF = async () => {
    setIsGenerating(true);
    // Dinamically import jsPDF
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.jsPDF;
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });`);
}

fs.writeFileSync(file, content);
console.log('App.tsx lazy loading implemented successfully!');
