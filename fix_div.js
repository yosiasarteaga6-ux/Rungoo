const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Admin.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Insert the missing </div> right after line 594 (index 594)
lines.splice(594, 0, '            </div>');

fs.writeFileSync(filePath, lines.join('\n'));
console.log('Inserted missing closing div.');
