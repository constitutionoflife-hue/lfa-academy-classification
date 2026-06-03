const fs = require('fs');

let files = fs.readdirSync('src');
for (const file of files) {
  if (file.endsWith('.tsx')) {
    let content = fs.readFileSync(`src/${file}`, 'utf8');
    let hasChanges = false;
    
    // Pattern 1: Classification type label
    // <label className="text-xs text-[#064E3B] font-bold underline cursor-pointer">
    //   تعديل
    //   <input
    //     type="file"
    //     className="hidden"
    //     accept=".pdf,.png,.jpg,.jpeg"
    //     onChange={(e) => handleFileUpload(id, e)}
    //   />
    // </label>
    
    content = content.replace(
      /<label className="(text-xs text-\[#064E3B\] font-bold underline cursor-pointer)">\s*تعديل\s*<input\s*type="file"\s*className="hidden"\s*accept="(.*?)"\s*onChange=\{\(e\) => handleFileUpload\((.*?),\s*e\)\}\s*\/>\s*<\/label>/gs,
      (match, className, accept, id) => {
        hasChanges = true;
        return `<UploadTrigger className="${className}" accept="${accept}" onFileSelect={(e) => handleFileUpload(${id}, e)}>تعديل</UploadTrigger>`;
      }
    );

    // Pattern 2: Upload box
    // <label className="flex flex-col items-center justify-center gap-2 bg-[#FFFDF7] border-2 border-dashed border-[#E5DED0] text-[#64748B] p-4 rounded-2xl cursor-pointer hover:border-[#064E3B] hover:bg-[#F6F1E7] transition-all group">
    //   ... elements ...
    //   <input
    //     type="file"
    //     className="hidden"
    //     accept=".pdf,.png,.jpg,.jpeg"
    //     onChange={(e) => handleFileUpload(id, e)}
    //   />
    // </label>
    // We can replace the outer <label and </label> with <UploadTrigger and it works conceptually, but we need to pass accept and onFileSelect.
    
    content = content.replace(
      /<label className="([^"]*?cursor-pointer[^"]*?)">([\s\S]*?)<input\s*type="file"\s*className="hidden"\s*accept="(.*?)"\s*onChange=\{\(e\) => handleFileUpload\((.*?),\s*e\)\}\s*\/>\s*<\/label>/gs,
      (match, className, inner, accept, id) => {
        hasChanges = true;
        return `<UploadTrigger className="${className}" accept="${accept}" onFileSelect={(e) => handleFileUpload(${id}, e)}>${inner}</UploadTrigger>`;
      }
    );

    // Add import if needed
    if (hasChanges && !content.includes('UploadTrigger')) {
      content = `import UploadTrigger from "./components/UploadTrigger";\n` + content;
    }

    if (hasChanges) {
      fs.writeFileSync(`src/${file}`, content);
    }
  }
}
