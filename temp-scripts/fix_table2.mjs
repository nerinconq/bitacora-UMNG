import fs from 'fs';
const file = 'c:/Users/nelso/Documents/A_UMNG/FUNCIONALES DE AISTUDIO/bitacora-rubrica-informe/BitacoraRubrica/App.tsx';
let content = fs.readFileSync(file, 'utf8');

const t = "};\n\n  const regressionData = getRegressionData(series);";
const t2 = "};\n\nconst RegressionTable = ({ series }: { series: DataSeries }) => {\n  const regressionData = getRegressionData(series);";

const t_win = "};\r\n\r\n  const regressionData = getRegressionData(series);";
const t2_win = "};\r\n\r\nconst RegressionTable = ({ series }: { series: DataSeries }) => {\r\n  const regressionData = getRegressionData(series);";

if (content.includes(t)) {
    content = content.replace(t, t2);
    fs.writeFileSync(file, content);
    console.log("Fixed (LF)!");
} else if (content.includes(t_win)) {
    content = content.replace(t_win, t2_win);
    fs.writeFileSync(file, content);
    console.log("Fixed (CRLF)!");
} else {
    // maybe single newline?
    const t3 = "};\n  const regressionData = getRegressionData(series);";
    const t3r = "};\n\nconst RegressionTable = ({ series }: { series: DataSeries }) => {\n  const regressionData = getRegressionData(series);";
    const t3w = "};\r\n  const regressionData = getRegressionData(series);";
    const t3wr = "};\r\n\r\nconst RegressionTable = ({ series }: { series: DataSeries }) => {\r\n  const regressionData = getRegressionData(series);";
    if (content.includes(t3)) {
        content = content.replace(t3, t3r);
        fs.writeFileSync(file, content);
        console.log("Fixed (1 LF)!");
    } else if (content.includes(t3w)) {
        content = content.replace(t3w, t3wr);
        fs.writeFileSync(file, content);
        console.log("Fixed (1 CRLF)!");
    } else {
        console.log("Could not match the exact string!");
    }
}
