const fs = require('fs');
const files = fs.readdirSync('src').filter(f => f.startsWith('Classification') && f.endsWith('.tsx')).map(f => 'src/' + f);
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    const pattern = /[ \t]*<div className="flex-1 w-full max-w-md">[\s\S]*?<span className="text-\[#64748B\]">نسبة الإنجاز<\/span>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/g;
    const matches = content.match(pattern);
    if (matches) {
        console.log('Matched in ' + file);
        content = content.replace(pattern, '');
        fs.writeFileSync(file, content, 'utf8');
    } else {
        console.log('No match in ' + file);
    }
});
