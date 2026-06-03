const fs = require('fs');

let content = fs.readFileSync('src/AcademyRegistry.tsx', 'utf8');
let hasChanges = false;

// 1. Profile photo big upload
content = content.replace(
  /<label className="(absolute inset-0 cursor-pointer flex flex-col items-center justify-center p-4)">\s*<input\s*type="file"\s*className="hidden"\s*accept="(.*?)"\s*onChange=\{\(e\) => handleFileUpload\("profilePhoto",\s*e\)\}\s*\/>([\s\S]*?)<\/label>/gs,
  (match, className, accept, inner) => {
    hasChanges = true;
    return `<UploadTrigger className="${className}" accept="${accept}" onFileSelect={(e) => handleFileUpload("profilePhoto", e)}>${inner}</UploadTrigger>`;
  }
);

// 2. Profile photo edit
content = content.replace(
  /<label className="(p-2 bg-white text-\[#064E3B\] rounded-full cursor-pointer hover:bg-gray-100 transition-all shadow-lg)" title="(.*?)">\s*<span className="(.*?)">(.*?)<\/span>\s*<input\s*type="file"\s*className="hidden"\s*accept="(.*?)"\s*onChange=\{\(e\) => handleFileUpload\("profilePhoto",\s*e\)\}\s*\/>\s*<\/label>/gs,
  (match, className, title, spanClass, icon, accept) => {
    hasChanges = true;
    return `<UploadTrigger className="${className}" accept="${accept}" onFileSelect={(e) => handleFileUpload("profilePhoto", e)}><span className="${spanClass}" title="${title}">${icon}</span></UploadTrigger>`;
  }
);

// 3. Regular file upload edit
content = content.replace(
  /<label className="(text-\[10px\] font-bold text-\[#064E3B\] cursor-pointer hover:underline flex items-center gap-1)">\s*<span className="(.*?)">(.*?)<\/span>\s*تعديل الملف\s*<input type="file" className="hidden" accept="(.*?)" onChange=\{\(e\) => handleFileUpload\((.*?),\s*e\)\} \/>\s*<\/label>/gs,
  (match, className, spanClass, icon, accept, field) => {
    hasChanges = true;
    return `<UploadTrigger className="${className}" accept="${accept}" onFileSelect={(e) => handleFileUpload(${field}, e)}><span className="${spanClass}">${icon}</span>تعديل الملف</UploadTrigger>`;
  }
);

// 4. Regular file upload missing file (line 613-619)
// It is an un-wrapped <input>.
// Let's wrap it!
content = content.replace(
  /\{!currentFile\?\.uploaded && \(\s*<input\s*type="file"\s*className="absolute inset-0 opacity-0 cursor-pointer z-10"\s*accept="(.*?)"\s*onChange=\{\(e\) => handleFileUpload\((.*?),\s*e\)\}\s*\/>\s*\)\}/gs,
  (match, accept, field) => {
    hasChanges = true;
    return `{!currentFile?.uploaded && (<UploadTrigger className="absolute inset-0 opacity-0 cursor-pointer z-10 block" accept="${accept}" onFileSelect={(e) => handleFileUpload(${field}, e)}><div></div></UploadTrigger>)}`;
  }
);


if (hasChanges && !content.includes('UploadTrigger')) {
  content = `import UploadTrigger from "./components/UploadTrigger";\n` + content;
}

fs.writeFileSync('src/AcademyRegistry.tsx', content);
