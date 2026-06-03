const fs = require('fs');

const dir = './src';
const files = fs.readdirSync(dir).filter(f => f.startsWith('Classification'));

for (const file of files) {
  const fullPath = `${dir}/${file}`;
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  if (content.includes('.preview')) {
    content = content.replace(/\{(p|person|supPerson|ownerPerson|techPerson|adminDirector|medicalPerson|financePerson|mediaPerson|coachPerson)\.?files\?\.profilePhoto\?\.preview\}/g, '{($1?.files?.profilePhoto?.downloadURL || $1?.files?.profilePhoto?.url || $1?.files?.profilePhoto?.preview)}');
    content = content.replace(/\{(p|person|supPerson|ownerPerson|techPerson|adminDirector|medicalPerson|financePerson|mediaPerson|coachPerson)\?\.?files\?\.profilePhoto\?\.preview\}/g, '{($1?.files?.profilePhoto?.downloadURL || $1?.files?.profilePhoto?.url || $1?.files?.profilePhoto?.preview)}');
    content = content.replace(/\{(p|person|supPerson|ownerPerson|techPerson|adminDirector|medicalPerson|financePerson|mediaPerson|coachPerson)\.files\.profilePhoto\.preview\}/g, '{($1?.files?.profilePhoto?.downloadURL || $1?.files?.profilePhoto?.url || $1?.files?.profilePhoto?.preview)}');
    changed = true;
  }

  // Also remove fake uploaded states or fix logic if needed

  if (changed) {
    fs.writeFileSync(fullPath, content);
    console.log(`Patched ${file}`);
  }
}
