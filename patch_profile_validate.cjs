const fs = require('fs');

let content = fs.readFileSync('src/AcademyProfile.tsx', 'utf8');

const validationTarget = `const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);`;

const validationReplacement = `const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
       alert("يرجى رفع صورة فقط بصيغة JPG أو PNG أو WEBP");
       e.target.value = '';
       return;
    }

    setIsLoading(true);`;


if(content.includes(validationTarget)) {
    content = content.replace(validationTarget, validationReplacement);
    fs.writeFileSync('src/AcademyProfile.tsx', content);
    console.log("Patched AcademyProfile.tsx validation");
} else {
    console.log("Could not find validationTarget in profile");
}
