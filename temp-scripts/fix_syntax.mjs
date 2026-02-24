import fs from 'fs';
const file = 'c:/Users/nelso/Documents/A_UMNG/FUNCIONALES DE AISTUDIO/bitacora-rubrica-informe/BitacoraRubrica/App.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    /return updated;\r?\n    \}\);\r?\n  \};\r?\n\r?\n  const handleImageUpload/,
    "return updated;\n    });\n  }, []);\n\n  const handleImageUpload"
);

// I should also check if App(641) had an error too.
// App.tsx(641,4): error TS1005: ')' expected.
// Wait! `updateActiveSeries` lines 645-647:
content = content.replace(
    /return \{ \.\.\.prev, dataSeries: newSeriesList \};\r?\n    \}\);\r?\n  \};/,
    "return { ...prev, dataSeries: newSeriesList };\n    });\n  }, []);"
);

fs.writeFileSync(file, content);
console.log('Fixed syntax errors successfully!');
