import fs from 'fs';
const windsurf = 'C:\\Users\\nelso\\AppData\\Roaming\\Windsurf\\User\\History';
if (fs.existsSync(windsurf)) {
    console.log("Found Windsurf history!");
} else {
    console.log("No Windsurf history.");
}
