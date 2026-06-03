const fs = require('fs');

let content = fs.readFileSync('src/AcademyRegistry.tsx', 'utf8');

// Stop fallback in handleFileUpload
const fallbackMatch = /catch \(err\) \{\n\s*console\.warn\("Storage upload failed, using local fallback", err\);\n\s*\/\/ Fallback to base64[\s\S]*?reader\.readAsDataURL\(file\);\n\s*\}/g;

content = content.replace(fallbackMatch, `catch (err) {
      console.error("Upload failed", err);
      alert("تعذر رفع الصورة. يرجى المحاولة مرة أخرى.");
      e.target.value = '';
      return;
    }`);

// When uploading is successful: replace `preview: previewUrl,` correctly
content = content.replace(/preview: previewUrl,/g, 'preview: (typeof fileData !== "undefined" && fileData ? fileData.downloadURL : previewUrl),');

// Replace usages of `.preview` for img tags to ALSO check `.downloadURL` or `.url`.
// Example: src={record.files.profilePhoto.preview} -> src={record.files.profilePhoto.downloadURL || record.files.profilePhoto.url || record.files.profilePhoto.preview}
content = content.replace(/\{?record\.?files\?\.profilePhoto\?\.preview\}?/g, '{(record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url || record?.files?.profilePhoto?.preview)}');
content = content.replace(/\{?record\?\.?files\?\.profilePhoto\?\.preview\}?/g, '{(record?.files?.profilePhoto?.downloadURL || record?.files?.profilePhoto?.url || record?.files?.profilePhoto?.preview)}');

// Also fix `currentFile.preview` in renderProfilePhotoField
content = content.replace(/currentFile\?\.preview/g, '(currentFile?.downloadURL || currentFile?.url || currentFile?.preview)');
content = content.replace(/currentFile\.preview/g, '(currentFile.downloadURL || currentFile.url || currentFile.preview)');

// Fix `p.files?.profilePhoto`... oh wait that's in ClassificationASocialMedia!

fs.writeFileSync('src/AcademyRegistry.tsx', content);
