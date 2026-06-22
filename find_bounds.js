const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Admin.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Find the start of the Actualizar button to replace everything from there
// Let's just find the indexes safely.
let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('onClick={fetchHomeStats}')) {
    // Start replacing from the <div style={{ display: 'flex', ... }}> containing the button
    // It's a few lines above.
    for (let j = i; j >= 0; j--) {
      if (lines[j].includes('display: \'flex\', justifyContent: \'flex-end\'') || 
          lines[j].includes('display: \'flex\', justifyContent: \'space-between\'')) {
         startIndex = j;
         break;
      }
    }
  }
  if (lines[i].includes('{/* ── Actividad Reciente ── */}')) {
    endIndex = i;
  }
}

if (startIndex === -1 || endIndex === -1) {
  // Try another approach if the first fails
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{loadingHome ? \'⏳\' : \'🔄\'} Actualizar')) {
      startIndex = i - 12; // approximate start of the header block
    }
    if (lines[i].includes('{/* ── Actividad Reciente ── */}')) {
      endIndex = i;
    }
  }
}

// Ensure we don't delete too much if the heuristic fails
console.log("Start: ", startIndex, " End: ", endIndex);
