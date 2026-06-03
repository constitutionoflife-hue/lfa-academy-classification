const fs = require('fs');
let content = fs.readFileSync('src/AcademyRegistry.tsx', 'utf8');

content = content.replace(/\{\(record\?\.files\?\.profilePhoto\?\.downloadURL \|\| record\?\.files\?\.profilePhoto\?\.url \|\| \{\(record\?\.files\?\.profilePhoto\?\.downloadURL \|\| record\?\.files\?\.profilePhoto\?\.url \|\| record\?\.files\?\.profilePhoto\?\.preview\)\}\)\} \? \(/g, '{(record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url || record?.files?.profilePhoto?.preview) ? (');

fs.writeFileSync('src/AcademyRegistry.tsx', content);
