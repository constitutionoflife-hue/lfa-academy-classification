const fs = require('fs');

let content = fs.readFileSync('src/Profile.tsx', 'utf8');
let hasChanges = false;

// <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#C9A227] text-[#022C22] rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform border-4 border-[#064E3B]">
//   <span className="material-symbols-outlined text-xl">photo_camera</span>
//   <input 
//     type="file" 
//     className="hidden" 
//     accept="image/*"
//     onChange={handleLogoUpload}
//   />
// </label>

content = content.replace(
  /<label className="(absolute -bottom-2 -right-2 w-10 h-10 bg-\[#C9A227\] text-\[#022C22\] rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:scale-110 transition-transform border-4 border-\[#064E3B\])">\s*<span className="(.*?)">(.*?)<\/span>\s*<input\s*type="file"\s*className="hidden"\s*accept="(.*?)"\s*onChange=\{handleLogoUpload\}\s*\/>\s*<\/label>/gs,
  (match, className, spanClass, icon, accept) => {
    hasChanges = true;
    return `<UploadTrigger className="${className}" accept="${accept}" onFileSelect={handleLogoUpload}><span className="${spanClass}">${icon}</span></UploadTrigger>`;
  }
);


if (hasChanges && !content.includes('UploadTrigger')) {
  content = `import UploadTrigger from "./components/UploadTrigger";\n` + content;
}

if(hasChanges) fs.writeFileSync('src/Profile.tsx', content);
