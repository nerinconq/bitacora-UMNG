import fs from 'fs';
const file = 'c:/Users/nelso/Documents/A_UMNG/FUNCIONALES DE AISTUDIO/bitacora-rubrica-informe/BitacoraRubrica/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// The exact strings to remove. We match them using indexOf and slice out the block.
function extractBlock(startStr, endStr) {
    const startObj = content.indexOf(startStr);
    if (startObj !== -1) {
        // Find the matching endStr AFTER startStr
        const endObj = content.indexOf(endStr, startObj);
        if (endObj !== -1) {
            content = content.substring(0, startObj) + content.substring(endObj + endStr.length);
        } else {
            console.log("Could not find end for", startStr.substring(0, 30));
        }
    } else {
        console.log("Could not find start for", startStr.substring(0, 30));
    }
}

// 1. calculateRowAvgs
extractBlock(
    "const calculateRowAvgs = (row: MeasurementRow, series: DataSeries) => {",
    "  return results;\n};\n\n"
);
// Wait, calculateRowAvgs ends with `return results;\n};\n`?
// Let's look at calculations.ts to see how it ends. No, it returns an object.
// We're safer replacing them via Regex but carefully.
