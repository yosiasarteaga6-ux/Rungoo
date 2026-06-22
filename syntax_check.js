const fs = require('fs');
const acorn = require('acorn');
const jsx = require('acorn-jsx');

const Parser = acorn.Parser.extend(jsx());
const content = fs.readFileSync('src/components/Admin.js', 'utf8');

try {
  Parser.parse(content, { sourceType: 'module', ecmaVersion: 2020 });
  console.log('Syntax is OK');
} catch (e) {
  console.error('Syntax error:', e.message);
}
