const fs = require('fs');

function fixFile(file) {
  let content = fs.readFileSync(`src/${file}`, 'utf8');

  // Fix the block
  // <input
  //   type="file"
  //   className="hidden"
  //   accept=".pdf,.png,.jpg,.jpeg"
  //   onChange={(e) => handleFileUpload(req.id, e)}>
  // تعديل
  // {req.proofType === "file" && (
  //   </UploadTrigger>

  content = content.replace(
    /<input\s*type="file"\s*className="hidden"\s*accept="\.pdf,\.png,\.jpg,\.jpeg"\s*onChange=\{\(e\) => handleFileUpload\(req\.id,\s*e\)\}>\s*تعديل\s*\{req\.proofType === "file" && \(\s*<\/UploadTrigger>/gs,
    `<input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => handleFileUpload(req.id, e)} />\n</label>\n`
  );

  fs.writeFileSync(`src/${file}`, content);
}

fixFile('ClassificationALeadership.tsx');
fixFile('ClassificationASafeguarding.tsx');
fixFile('ClassificationBLeadership.tsx');

