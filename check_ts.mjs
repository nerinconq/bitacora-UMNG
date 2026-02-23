import { exec } from 'child_process';
import fs from 'fs';
exec('npx tsc --noEmit', (err, stdout, stderr) => {
    fs.writeFileSync('errors.txt', stdout + stderr);
});
