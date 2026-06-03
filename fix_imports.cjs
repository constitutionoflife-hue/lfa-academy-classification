const fs = require('fs');

let files = fs.readdirSync('src').filter(f => f.endsWith('.tsx'));

for (let file of files) {
  let content = fs.readFileSync(`src/${file}`, 'utf8');
  if (content.includes('UploadTrigger') && !content.includes('import UploadTrigger')) {
     content = `import UploadTrigger from "./components/UploadTrigger";\n` + content;
     fs.writeFileSync(`src/${file}`, content);
  }
}
