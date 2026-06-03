const fs = require('fs');

let content = fs.readFileSync('src/AcademyRegistry.tsx', 'utf8');

// fix lines 530+
content = content.replace(
  /<UploadTrigger className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center p-4" accept="\.png,\.jpg,\.jpeg" onFileSelect=\{\(e\) => handleFileUpload\("profilePhoto", e\)\} \n              \/>\n(.*?)<\/label>/gs,
  `<UploadTrigger className="absolute inset-0 cursor-pointer flex flex-col items-center justify-center p-4" accept=".png,.jpg,.jpeg" onFileSelect={(e) => handleFileUpload("profilePhoto", e)}>\n$1</UploadTrigger>`
);

content = content.replace(
  /<label className="p-2 bg-white text-\[#064E3B\] rounded-full cursor-pointer hover:bg-gray-100 transition-all shadow-lg" title="تغيير الصورة">\s*<span className="material-symbols-outlined text-\[20px\]">photo_camera<\/span>\s*<input\s*type="file"\s*className="hidden"\s*accept="\.png,\.jpg,\.jpeg"\s*onChange=\{\(e\) => handleFileUpload\("profilePhoto", e\)\}>\s*<\/UploadTrigger>/gs,
  `<UploadTrigger className="p-2 bg-white text-[#064E3B] rounded-full cursor-pointer hover:bg-gray-100 transition-all shadow-lg" accept=".png,.jpg,.jpeg" onFileSelect={(e) => handleFileUpload("profilePhoto", e)}>\n<span className="material-symbols-outlined text-[20px]" title="تغيير الصورة">photo_camera</span>\n</UploadTrigger>`
);

fs.writeFileSync('src/AcademyRegistry.tsx', content);
