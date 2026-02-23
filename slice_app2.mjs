import fs from 'fs';
const file = 'c:/Users/nelso/Documents/A_UMNG/FUNCIONALES DE AISTUDIO/bitacora-rubrica-informe/BitacoraRubrica/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add useCallback, useMemo to React import
content = content.replace(
  "import React, { useState, useEffect, useRef } from 'react';",
  "import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';"
);

// 2. Add MeasurementTableRow import
content = content.replace(
  "import { EstimationPanel } from './components/EstimationPanel';",
  "import { EstimationPanel } from './components/EstimationPanel';\nimport { MeasurementTableRow } from './components/MeasurementTableRow';"
);

// 3. Wrap updateReport with useCallback correctly
content = content.replace(
  "const updateReport = (updates: Partial<LabReport>) => {",
  "const updateReport = useCallback((updates: Partial<LabReport>) => {"
);
content = content.replace(
  /return updated;\r?\n    \}\);\r?\n  \};\r?\n\r?\n  const handleImageUpload/,
  "return updated;\n    });\n  }, []);\n\n  const handleImageUpload"
);

// 4. Wrap updateActiveSeries and add handleRowChange
content = content.replace(
  "const updateActiveSeries = (updates: Partial<DataSeries>) => {",
  "const updateActiveSeries = useCallback((updates: Partial<DataSeries>) => {"
);
content = content.replace(
  /return \{ \.\.\.prev, dataSeries: newSeriesList \};\r?\n    \}\);\r?\n  \};/,
  `return { ...prev, dataSeries: newSeriesList };
    });
  }, []);

  const handleRowChange = useCallback((idx: number, updatedRow: any) => {
    setReport(prev => {
      const newSeriesList = [...prev.dataSeries];
      const currentIndex = prev.activeSeriesIndex;
      const current = newSeriesList[currentIndex];
      const nr = [...current.measurements];
      nr[idx] = updatedRow;
      const updated = { ...current, measurements: nr };
      newSeriesList[currentIndex] = updated;
      return { ...prev, dataSeries: newSeriesList };
    });
  }, []);`
);

// 5. Replace FormStep.Data tbody content with MeasurementTableRow
const dataTRegex = /<tbody>\s*\{activeSeries\.measurements\.map\(\(row, idx\) => \{\s*const \{ dAvgRaw, iAvgRaw, getExtraAvg \} = calculateRowAvgs\(row, activeSeries\);[\s\S]*?<\/tbody>/;
const match = dataTRegex.exec(content);
if (match) {
  content = content.replace(dataTRegex, `<tbody>
                    {activeSeries.measurements.map((row, idx) => (
                      <MeasurementTableRow 
                        key={idx} 
                        row={row} 
                        idx={idx} 
                        series={activeSeries} 
                        onChange={handleRowChange} 
                      />
                    ))}
                  </tbody>`);
} else {
  console.error("Could not find FormStep.Data tbody!");
}

fs.writeFileSync(file, content);
console.log('App.tsx memoization transformed successfully!');
