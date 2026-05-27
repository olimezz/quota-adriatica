const fs = require('fs');
const content = fs.readFileSync('fonts.css', 'utf8');

// Parse @font-face blocks
const blocks = [];
let currentBlock = '';
let isInside = false;
let currentComment = '';

const lines = content.split('\n');
for (let line of lines) {
    if (line.trim().startsWith('/*')) {
        currentComment = line.trim();
    }
    if (line.includes('@font-face {')) {
        isInside = true;
        currentBlock = currentComment + '\n' + line + '\n';
        continue;
    }
    if (isInside) {
        currentBlock += line + '\n';
        if (line.includes('}')) {
            isInside = false;
            blocks.push({
                comment: currentComment,
                content: currentBlock
            });
            currentBlock = '';
        }
    }
}

// Filter for latin and latin-ext
const filtered = blocks.filter(b => b.comment.includes('latin') || b.comment.includes('latin-ext'));
const output = filtered.map(b => b.content).join('\n');

fs.writeFileSync('scratch/extracted.css', output);
console.log(`Extracted ${filtered.length} font-face blocks.`);
