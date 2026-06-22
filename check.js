const fs = require('fs');
const lines = fs.readFileSync('src/components/Admin.js', 'utf8').split('\n');
console.log('Total lines:', lines.length);

// Let's find the first `tab === 'registro'`
let reg1 = lines.findIndex(l => l.includes("tab === 'registro'"));
console.log("First registro at:", reg1);

let reg2 = lines.findIndex((l, i) => i > reg1 && l.includes("tab === 'registro'"));
console.log("Second registro at:", reg2);

// Let's find the first `tab === 'usuarios'`
let usr1 = lines.findIndex(l => l.includes("tab === 'usuarios' || tab === 'unidades'"));
console.log("First usuarios at:", usr1);

let usr2 = lines.findIndex((l, i) => i > usr1 && l.includes("tab === 'usuarios' || tab === 'unidades'"));
console.log("Second usuarios at:", usr2);
