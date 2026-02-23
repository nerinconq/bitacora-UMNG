import fs from 'fs';
import path from 'path';

const historyDir = 'C:\\Users\\nelso\\AppData\\Roaming\\Code\\User\\History';
if (!fs.existsSync(historyDir)) {
    console.log('History folder not found.');
    process.exit(1);
}

let out = '';
function searchFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchFiles(fullPath);
        } else if (file === 'entries.json') {
            const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            if (content.resource && content.resource.includes('App.tsx')) {
                out += 'Found App.tsx history in: ' + dir + '\n';
                out += 'Resource: ' + content.resource + '\n';
                const backups = fs.readdirSync(dir).filter(f => f.length > 5 && f !== 'entries.json');
                for (const b of backups) {
                    const stats = fs.statSync(path.join(dir, b));
                    out += ` - ${b} (${stats.mtime})\n`;
                }
            }
        }
    }
}

searchFiles(historyDir);
fs.writeFileSync('history_output.txt', out, 'utf8');
console.log('Done');
