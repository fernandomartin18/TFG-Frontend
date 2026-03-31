const fs = require('fs');
const content = fs.readFileSync('__tests__/unit/components/Chat.test.jsx', 'utf-8');
const fixed = content.replace(/\}\);\s*\n*  test\('calls onInputClear/g, '  test(\'calls onInputClear');
fs.writeFileSync('__tests__/unit/components/Chat.test.jsx', fixed + '\n});\n');
