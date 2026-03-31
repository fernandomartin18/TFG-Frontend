const fs = require('fs');
const lines = fs.readFileSync('coverage/lcov-report/index.html', 'utf8').split('\\n');
let overall = '';
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Statements')) {
    overall = lines[i-1].match(/>([^<]+)%/)[1];
    console.log('Overall statements coverage:', overall + '%');
    break;
  }
}
