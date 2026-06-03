const fs = require('fs');
const files = [
  'src/AcademyRegistry.tsx', 
  'src/ClassificationBOrganization.tsx',
  'src/ClassificationAOrganization.tsx',
  'src/ClassificationASocialMedia.tsx',
  'src/ClassificationAHealth.tsx',
  'src/ClassificationBTechnical.tsx'
];

files.forEach(f => {
   if (!fs.existsSync(f)) return;
   let content = fs.readFileSync(f, 'utf8');
   
   // A catch-all pattern matching for person?.files...
   content = content.replace(/person\?\.files\?\.profilePhoto\?\.preview \|\| person\?\.files\?\.profilePhoto\?\.url(\s+)\|\| person\?\.files\?\.profilePhoto\?\.preview/g, 
     "person?.files?.profilePhoto?.preview || person?.files?.profilePhoto?.downloadURL || person?.files?.profilePhoto?.url");

   content = content.replace(/p\?\.files\?\.profilePhoto\?\.preview \|\| p\?\.files\?\.profilePhoto\?\.url(\s+)\|\| p\?\.files\?\.profilePhoto\?\.preview/g, 
     "p?.files?.profilePhoto?.preview || p?.files?.profilePhoto?.downloadURL || p?.files?.profilePhoto?.url");
   
   fs.writeFileSync(f, content);
});
console.log("Patched again");
