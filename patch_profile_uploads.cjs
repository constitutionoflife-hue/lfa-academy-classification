const fs = require('fs');

let content = fs.readFileSync('src/AcademyProfile.tsx', 'utf8');
let hasChanges = false;

// Profile photo upload
// <label className="flex flex-col items-center justify-center p-6 bg-[#FFFDF7] border-2 border-dashed border-[#E5DED0] rounded-3xl cursor-pointer hover:border-[#064E3B] hover:bg-[#F6F1E7] transition-all group">
//   <div className="w-12 h-12 bg-[#064E3B]/5 rounded-full flex items-center justify-center text-[#064E3B] group-hover:scale-110 transition-transform mb-3">
//     <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
//   </div>
//   <p className="text-sm font-bold text-[#064E3B] mb-1">اضغط لرفع الشعار</p>
//   <p className="text-xs text-[#64748B]">PNG, JPG (الحد الأقصى 2MB)</p>
//   <input type="file" className="hidden" accept="image/*" onChange={handleLogoChange} />
// </label>

content = content.replace(
  /<label className="(flex flex-col items-center justify-center p-6 bg-\[#FFFDF7\] border-2 border-dashed border-\[#E5DED0\] rounded-3xl cursor-pointer hover:border-\[#064E3B\] hover:bg-\[#F6F1E7\] transition-all group)">([\s\S]*?)<input type="file" className="hidden" accept="(.*?)" onChange=\{handleLogoChange\} \/>\s*<\/label>/gs,
  (match, className, inner, accept) => {
    hasChanges = true;
    return `<UploadTrigger className="${className}" accept="${accept}" onFileSelect={handleLogoChange}>${inner}</UploadTrigger>`;
  }
);


if (hasChanges && !content.includes('UploadTrigger')) {
  content = `import UploadTrigger from "./components/UploadTrigger";\n` + content;
}

fs.writeFileSync('src/AcademyProfile.tsx', content);
