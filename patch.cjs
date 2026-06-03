const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(process.cwd(), 'src');

const files = fs.readdirSync(SRC_DIR).filter(f => f.startsWith('Classification') && f.endsWith('.tsx'));
files.push('AcademyRegistry.tsx');

for (const file of files) {
  const filePath = path.join(SRC_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  let modified = false;

  // Add import if needed
  if (!content.includes('uploadFileAndReturnMetadata') && content.includes('uploadFileToStorage')) {
      if (content.includes('import { appStorage } from "./lib/appStorage"')) {
         content = content.replace('import { appStorage } from "./lib/appStorage";', 'import { appStorage } from "./lib/appStorage";\nimport { uploadFileAndReturnMetadata } from "./lib/fileUpload";');
      } else {
         content = 'import { uploadFileAndReturnMetadata } from "./lib/fileUpload";\n' + content;
      }
      modified = true;
  }

  // General regex to replace the complex inline file generation
  // We look for: `const storagePath = ...` followed by `const downloadURL = await uploadFileToStorage(...)`
  // And we replace it with our new helper.
  const regex = /const storagePath = `[^`]+`;\s*const downloadURL = await uploadFileToStorage\(file, storagePath\);\s*(?:const fileData = \{[^\}]+uploaded: true\s*\};)?/gms;

  content = content.replace(regex, (match) => {
    modified = true;
    return `const fileData = await uploadFileAndReturnMetadata(file, user.uid, "classification-axes");`;
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
  }
}
console.log("Done patching");
