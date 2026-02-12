
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '../DatosPrueba.json');

try {
    console.log(`Reading file from: ${filePath}`);
    const raw = fs.readFileSync(filePath, 'utf8');
    let data;
    try {
        data = JSON.parse(raw);
    } catch (parseError) {
        console.error("Error parsing existing JSON:", parseError);
        process.exit(1);
    }

    // Define new Masa variable
    const masaVar = {
        id: `ev-${Date.now()}`,
        name: "Masa",
        symbol: "m",
        unit: "mg",
        multiplier: 1,
        uncertainty: 0.1,
        numRepetitions: 1
    };

    if (!data.dataSeries || !Array.isArray(data.dataSeries)) {
        console.log("Migrating legacy format to dataSeries...");
        const series = {
            id: 'migrated-series',
            name: 'Serie 1',
            precisionX: data.precisionX || 3,
            precisionY: data.precisionY || 3,
            numMeasurements: data.numMeasurements || 10,
            numRepetitionsDep: data.numRepetitionsDep || 3,
            numRepetitionsIndep: data.numRepetitionsIndep || 5,
            varDep: data.varDep || { id: 'vd', name: 'Y', symbol: 'y', unit: '', multiplier: 1, uncertainty: 0 },
            varIndep: data.varIndep || { id: 'vi', name: 'X', symbol: 'x', unit: '', multiplier: 1, uncertainty: 0 },
            measurements: data.measurements || [],
            // Inject Masa here
            extraVariables: [masaVar],
            indirectVariables: data.indirectVariables || []
        };
        data.dataSeries = [series];
    } else {
        console.log("dataSeries exists. Checking for Masa...");
        if (!data.dataSeries[0].extraVariables) {
            data.dataSeries[0].extraVariables = [];
        }
        const hasMasa = data.dataSeries[0].extraVariables.some(v => v.name === 'Masa');
        if (!hasMasa) {
            console.log("Adding Masa to existing series...");
            data.dataSeries[0].extraVariables.push(masaVar);
        } else {
            console.log("Masa already exists.");
        }
    }

    // Save back
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log("DatosPrueba.json updated successfully with ESM script.");

} catch (e) {
    console.error("Error updating JSON:", e);
}
