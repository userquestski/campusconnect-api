const fs = require('fs');
const path = require('path');
const dotenvPath = path.join(__dirname, '.env');
const content = fs.readFileSync(dotenvPath, 'utf8');

console.log('--- ENV CONTENT CHECK ---');
for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const code = content.charCodeAt(i);
    if (code === 13) {
        console.log(`Pos ${i}: CR (\\r)`);
    } else if (code === 10) {
        console.log(`Pos ${i}: LF (\\n)`);
    }
}

const lines = content.split(/\r?\n/);
lines.forEach((line, index) => {
    if (line.includes('PORT=')) {
        console.log(`Line ${index + 1}: [${line}] - Length: ${line.length}`);
        if (line.endsWith('\r')) console.log('  --> Ends with \\r');
    }
});
