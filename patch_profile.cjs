const fs = require('fs');
let content = fs.readFileSync('src/AcademyProfile.tsx', 'utf8');

const target = `const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, academyLogo: file }));
      setIsLoading(true);
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          try {
            const compressed = await compressImage(base64, 400, 400, 0.6);
            setLogoPreview(compressed);
          } catch (err) {
            console.error("Compression failed, using original", err);
            setLogoPreview(base64);
          }
          setIsLoading(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setIsLoading(false);
        console.error("Local preview generation failed:", err);
      }
    }
  };`;

const replacement = `const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const { waitForAuth, getCurrentSession } = await import("./lib/auth");
      const { uploadFileAndReturnMetadata } = await import("./lib/fileUpload");
      
      const user = await waitForAuth();
      const session = getCurrentSession();
      const uid = user ? user.uid : (session ? session.accountId : "anonymous");
      
      const fileData = await uploadFileAndReturnMetadata(file, uid, "academy-logo");
      
      // Save full file object to form data, so we don't just save a blob or base64.
      setFormData(prev => ({ ...prev, academyLogo: fileData }));
      setLogoPreview(fileData.downloadURL || fileData.url);
      
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      console.error("Logo upload failed:", err);
      alert("تعذر رفع الصورة. يرجى المحاولة مرة أخرى.");
    }
  };`;

if (content.includes("compressImage(base64")) {
  content = content.replace(target, replacement);

  // In `handleSubmit`, we should not use `logoPreview` as the object value. We should use `formData.academyLogo`!
  // Wait, if `formData.academyLogo` was a `File`, now it's an object with `downloadURL`.
  // Wait, let's see where logoPreview is used: `academyLogo: logoPreview`
  content = content.replace('academyLogo: logoPreview', 'academyLogo: typeof formData.academyLogo === "object" && !(formData.academyLogo instanceof File) ? formData.academyLogo : (logoPreview || null)');
  
  fs.writeFileSync('src/AcademyProfile.tsx', content);
  console.log("Patched AcademyProfile handleLogoChange");
} else {
  console.log("Target not found. It might have been already patched or differs.");
}
