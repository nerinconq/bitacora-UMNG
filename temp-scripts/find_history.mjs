import fs from 'fs';
import path from 'path';

const historyDir = 'C:\\Users\\nelso\\AppData\\Roaming\\Code\\User\\History';
if (!fs.existsSync(historyDir)) {
    console.log('History folder not found.');
    process.exit(1);
}

function searchFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            searchFiles(fullPath);
        } else if (file === 'entries.json') {
            const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
            if (content.resource && content.resource.includes('App.tsx')) {
                console.log('Found App.tsx history in:', dir);
                console.log('Resource:', content.resource);
                // List the actual backup files in this dir
                const backups = fs.readdirSync(dir).filter(f => f.length > 5 && f !== 'entries.json');
                for (const b of backups) {
                    const stats = fs.statSync(path.join(dir, b));
                    console.log(` - ${b} (${stats.mtime})`);
                }
            }
        }
    }
}

searchFiles(historyDir);
