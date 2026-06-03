import * as fs from 'fs';
import * as path from 'path';

const SRC_DIR = path.join(process.cwd(), 'src');

const files = fs.readdirSync(SRC_DIR).filter(f => f.startsWith('Classification') && f.endsWith('.tsx'));
files.push('AcademyRegistry.tsx');

for (const file of files) {
  const filePath = path.join(SRC_DIR, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace import if needed
  if (!content.includes('from "./lib/fileUpload"') && content.includes('uploadFileToStorage')) {
      if (content.includes('import { appStorage } from "./lib/appStorage"')) {
         content = content.replace('import { appStorage } from "./lib/appStorage";', 'import { appStorage } from "./lib/appStorage";\nimport { uploadFileAndReturnMetadata } from "./lib/fileUpload";');
      } else {
         content = 'import { uploadFileAndReturnMetadata } from "./lib/fileUpload";\n' + content;
      }
  }

  // Replace old block with new helper:
  // Find block starting with `const storagePath = ...` up to `uploaded: true };`
  // We will replace it using regex.
  
  content = content.replace(/const storagePath = `(?:academy-uploads|users)\/\$\{user\.uid\}\/[^`]+`.*?uploaded: true\s*\};.*?$/ms, (match) => {
    // wait regex is too complex to reliably match.
    return match;
  });

  fs.writeFileSync(filePath, content);
}
console.log("Done");
