const fs = require('fs');
let content = fs.readFileSync('src/AcademyRegistry.tsx', 'utf8');

content = content.replace(/\{\(\(?(record\?\.files\?\.profilePhoto\?\.downloadURL[\s\S]*?) \? \(/g, '{($1 ? (');
content = content.replace(/\)\}\} \? \(/g, ') ? (');

fs.writeFileSync('src/AcademyRegistry.tsx', content);

let files = fs.readdirSync('src').filter(f => f.startsWith('Classification'));
for(const file of files) {
   let c = fs.readFileSync(`src/${file}`, 'utf8');
   c = c.replace(/\{\(\(?(p|person|supPerson|ownerPerson|techPerson|adminDirector|medicalPerson|financePerson|mediaPerson|coachPerson)(\?\.files[\s\S]*?) \? \(/g, '{($1$2 ? (');
   c = c.replace(/\)\}\} \? \(/g, ') ? (');
   fs.writeFileSync(`src/${file}`, c);
}
