import fs from 'fs';
const file = 'c:/Users/nelso/Documents/A_UMNG/FUNCIONALES DE AISTUDIO/bitacora-rubrica-informe/BitacoraRubrica/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Fix RegressionTable's tbody
const brokenTbodyRegex = /<tbody>\s*\{regData\.map\(\(r, idx\) => \(\s*<tr[\s\S]*?<\/tbody>/m;
const formatSciFunc = `const formatSci = (num: number) => {
    if (Math.abs(num) < 0.01 || Math.abs(num) >= 10000) return num.toExponential(4);
    return num.toFixed(4);
  };`;
const fixedTbody = `<tbody>
            {regressionData.map((r, idx) => {
              ${formatSciFunc}
              return (
              <tr key={idx} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors">
                <td className="p-4 text-center font-bold text-slate-400 border-r border-slate-50">{idx + 1}</td>
                <td className="p-4 text-center font-mono text-[#004b87] border-r border-slate-50">{formatSci(r.x)}</td>
                <td className="p-4 text-center font-mono text-[#004b87] border-r border-slate-50">{formatSci(r.y)}</td>
                <td className="p-4 text-center font-mono text-[#9e1b32] border-r border-slate-50">{formatSci(r.xy)}</td>
                <td className="p-4 text-center font-mono text-slate-600">{formatSci(r.x2)}</td>
              </tr>
            )})}
          </tbody>`;

content = content.replace(brokenTbodyRegex, fixedTbody);

// 2. Fix FormStep.Data's tbody
const dataTbodyStart = content.indexOf(`<tbody>\r\n                    {activeSeries.measurements.map((row, idx) => {`);
if (dataTbodyStart === -1 && content.indexOf(`<tbody>\n                    {activeSeries.measurements.map((row, idx) => {`) === -1) {
    // try finding the huge map manually
    const regex = /<tbody>\s*\{activeSeries\.measurements\.map\(\(row, idx\) => \{\s*const \{ dAvgRaw, iAvgRaw, getExtraAvg \} = calculateRowAvgs\(row, activeSeries\);[\s\S]*?<\/tbody>/;
    const match = regex.exec(content);
    if (match) {
        content = content.replace(regex, `<tbody>
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
}

fs.writeFileSync(file, content);
console.log('Fixed Tables successfully!');
