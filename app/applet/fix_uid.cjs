const fs = require('fs');

let files = fs.readdirSync('src').filter(f => f.startsWith('Classification'));

for(const file of files) {
  if (file === 'ClassificationBPlanning.tsx') continue;
  let text = fs.readFileSync(`src/${file}`, 'utf8');
  text = text.replace(/uploadFileAndReturnMetadata\(file, uid, "classification-axes"\)/g, 'uploadFileAndReturnMetadata(file, user.uid, "classification-axes")');
  fs.writeFileSync(`src/${file}`, text);
}

let profile = fs.readFileSync('src/AcademyProfile.tsx', 'utf8');
profile = profile.replace(/academyLogo: null as File \| null/g, 'academyLogo: null as any');
profile = profile.replace(/typeof formData\.academyLogo === "object" && !\(formData\.academyLogo instanceof File\)/g, 'typeof formData.academyLogo === "object" && formData.academyLogo !== null && !Array.isArray(formData.academyLogo) && formData.academyLogo.downloadURL');
fs.writeFileSync('src/AcademyProfile.tsx', profile);
