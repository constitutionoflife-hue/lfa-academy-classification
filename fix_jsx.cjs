const fs = require('fs');
let content = fs.readFileSync('src/AcademyRegistry.tsx', 'utf8');

// For `<img src={record.files.profilePhoto.preview}` wait, the regex above screwed the ternary condition:
// `{(record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url || record?.files?.profilePhoto?.preview)} ? (`
// Let's replace `{(...)}` back to `((...))` or just remove the outer curly braces so it works as JSX, wait, the curly braces are needed for JSX, but the ternary operator works inside them. So it should be `{(record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url || record?.files?.profilePhoto?.preview) ? (`

content = content.replace(/\{\(record\?\.files\?\.profilePhoto\?\.downloadURL \|\| record\?\.files\?\.profilePhoto\?\.url \|\| record\?\.files\?\.profilePhoto\?\.preview\)\} \? \(/g, '{(record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url || record?.files?.profilePhoto?.preview) ? (');

// Wait what about the `img src` itself?
content = content.replace(/<img src=\{record\.files\.profilePhoto\.preview\} /g, '<img src={record.files.profilePhoto.downloadURL || record.files.profilePhoto.url || record.files.profilePhoto.preview} ');
content = content.replace(/<img src=\{record\.files\?\.profilePhoto\.preview\} /g, '<img src={record.files?.profilePhoto.downloadURL || record.files?.profilePhoto.url || record.files?.profilePhoto.preview} ');

fs.writeFileSync('src/AcademyRegistry.tsx', content);

let files = fs.readdirSync('src').filter(f => f.startsWith('Classification'));
for(const file of files) {
   let c = fs.readFileSync(`src/${file}`, 'utf8');
   c = c.replace(/\{\((p|person|supPerson|ownerPerson|techPerson|adminDirector|medicalPerson|financePerson|mediaPerson|coachPerson)\?\.files\?\.profilePhoto\?\.downloadURL \|\| \1\?\.files\?\.profilePhoto\?\.url \|\| \1\?\.files\?\.profilePhoto\?\.preview\)\} \? \(/g, '{($1?.files?.profilePhoto?.downloadURL || $1?.files?.profilePhoto?.url || $1?.files?.profilePhoto?.preview) ? (');
   fs.writeFileSync(`src/${file}`, c);
}
