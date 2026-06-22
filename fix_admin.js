const fs = require('fs');
const file = 'src/components/Admin.js';
let content = fs.readFileSync(file, 'utf8');

// I know that my fix_color script did:
// start = content.indexOf("tab === 'registro'");
// end = content.indexOf("tab === 'usuarios'");
// and then content = slice(0, start) + slice(end);
// This means the file is: A + B + B + C
// where A is slice(0, end)
// B is slice(end, start)
// C is slice(start, length)

// Let's just find the first B and the second B and delete the second one.
// The easiest way is to read the file, and look for where B repeats.
// The first "tab === 'usuarios'" is at B start.
// The second "tab === 'usuarios'" is at the second B start!
// So let's find all occurrences of "tab === 'usuarios'"
let indices = [];
let idx = content.indexOf("tab === 'usuarios'");
while (idx !== -1) {
  indices.push(idx);
  idx = content.indexOf("tab === 'usuarios'", idx + 1);
}

// indices[0] is the first occurrence.
// indices[1] is the second occurrence (which starts the duplicated block!)
// So the duplicated block starts exactly at indices[1].
// And how long is the duplicated block? It's exactly indices[1] - indices[0] long!
// So we just need to delete from indices[1] for a length of (indices[1] - indices[0]).

if (indices.length >= 2) {
    const len = indices[1] - indices[0];
    const restored = content.slice(0, indices[1]) + content.slice(indices[1] + len);
    fs.writeFileSync(file, restored);
    console.log('Restored Admin.js');
} else {
    console.log('Could not find duplicated blocks');
}
