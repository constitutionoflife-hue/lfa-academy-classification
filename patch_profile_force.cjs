const fs = require('fs');
let content = fs.readFileSync('src/AcademyProfile.tsx', 'utf8');

const regex = /const handleLogoChange = async[\s\S]*?console\.error\("Local preview generation failed:", err\);\n\s*\}\n\s*\}\n\s*\};/;

const replacement = `const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
       alert("يرجى رفع صورة فقط بصيغة JPG أو PNG أو WEBP");
       e.target.value = '';
       return;
    }

    setIsLoading(true);
    try {
      const { waitForAuth, getCurrentSession } = await import("./lib/auth");
      const { uploadFileAndReturnMetadata } = await import("./lib/fileUpload");
      
      const user = await waitForAuth();
      const session = getCurrentSession();
      const uid = user ? user.uid : (session ? session.accountId : "anonymous");
      
      const fileData = await uploadFileAndReturnMetadata(file, uid, "academy-logo");
      
      setFormData(prev => ({ ...prev, academyLogo: fileData }));
      setLogoPreview(fileData.downloadURL || fileData.url);
      
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.error("Logo upload failed:", err);
      alert("تعذر رفع الصورة. يرجى المحاولة مرة أخرى.");
    }
  };`;

content = content.replace(regex, replacement);

if(content.includes('typeof formData.academyLogo === "object"')) {
    console.log("Already updated handleSubmit");
} else {
    content = content.replace('academyLogo: logoPreview', 'academyLogo: typeof formData.academyLogo === "object" && formData.academyLogo !== null && !Array.isArray(formData.academyLogo) && formData.academyLogo.downloadURL ? formData.academyLogo : (logoPreview || null)');
}

fs.writeFileSync('src/AcademyProfile.tsx', content);
console.log("Forced patch AcademyProfile handleLogoChange");
