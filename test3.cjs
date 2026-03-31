const fs = require('fs');
const content = fs.readFileSync('/Users/fer/Desktop/Uni/4 Curso/x TFG/app/frontend/src/components/UserProfileModal.jsx', 'utf-8');
console.log(content.split('\n').slice(50, 150).join('\n'));
