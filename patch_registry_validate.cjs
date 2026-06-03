const fs = require('fs');

let content = fs.readFileSync('src/AcademyRegistry.tsx', 'utf8');

const validationTarget = `    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE_MB = 5;`;

const validationReplacement = `    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'profilePhoto' && !file.type.startsWith('image/')) {
       alert("يرجى رفع صورة فقط بصيغة JPG أو PNG أو WEBP");
       e.target.value = '';
       return;
    }

    const MAX_FILE_SIZE_MB = 5;`;

if(content.includes(validationTarget)) {
    content = content.replace(validationTarget, validationReplacement);
    fs.writeFileSync('src/AcademyRegistry.tsx', content);
    console.log("Patched AcademyRegistry.tsx validation");
} else {
    console.log("Could not find validationTarget");
}
