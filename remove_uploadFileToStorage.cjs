const fs = require('fs');

const files = fs.readdirSync('./src').filter(file => file.startsWith('Classification') && file.endsWith('.tsx'));

for (const file of files) {
  const filePath = './src/' + file;
  let code = fs.readFileSync(filePath, 'utf8');
  code = code.replace(/const \{ uploadFileToStorage \} = await import\("\.\/lib\/appStorage"\);\n/g, '');
  fs.writeFileSync(filePath, code);
}
