const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(process.cwd(), 'src');

const files = fs.readdirSync(SRC_DIR).filter(f => f.startsWith('Classification') && f.endsWith('.tsx'));
files.push('AcademyRegistry.tsx');

for (const file of files) {
  const filePath = path.join(SRC_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the broken `setData` block. 
  // We want to replace `{ type: "file", name: file.name, ..., uploaded: true }` with `fileData`
  // But ONLY inside `setData` or `updateSection` or `setter` etc.

  content = content.replace(/const fileData = await uploadFileAndReturnMetadata\(file, user\.uid, "classification-axes"\);setData\(\(prev\) => \{\s*const newData = \{\s*\.\.\.prev,\s*\[id\]:\s*\{[^\}]+\}\s*(?:\}\s*)?,\s*\};\s*saveProgress\(newData\);\s*return newData;\s*\}\);/gms, `const fileData = await uploadFileAndReturnMetadata(file, user.uid, "classification-axes");
        setData((prev) => {
          const newData = { ...prev, [id]: fileData };
          saveProgress(newData);
          return newData;
        });`);

  content = content.replace(/const fileData = await uploadFileAndReturnMetadata\(file, user\.uid, "classification-axes"\);\s*setter\(fileData as any\);\s*handleUpdate\(\{\s*\[fieldName\]:\s*fileData\s*\}\);/gms, `const fileData = await uploadFileAndReturnMetadata(file, user.uid, "classification-axes");
        setter(fileData);
        handleUpdate({ [fieldName]: fileData });`);

  content = content.replace(/const fileData = await uploadFileAndReturnMetadata\(file, user\.uid, "classification-axes"\);updateSection\(([^,]+),\s*([^,]+),\s*\{[^\}]+\}\s*\);/gms, `const fileData = await uploadFileAndReturnMetadata(file, user.uid, "classification-axes");
        updateSection($1, $2, fileData);`);

  fs.writeFileSync(filePath, content);
}
console.log("Fixed syntax");
