const fs = require('fs');
let code = fs.readFileSync('__tests__/unit/components/LeftSidebar.test.jsx', 'utf8');

code = code.replace(
  "const searchInput = screen.getByPlaceholderText('Buscar chats...');",
  "const searchBtn = screen.getByLabelText('Buscar chats');\nfاتireEvent.click(searchBtn);\nconst searchInput = await screen.findByPlaceholderText('Buscar chats...');"
);
fs.writeFileSync('__tests__/unit/components/LeftSidebar.test.jsx', code);
