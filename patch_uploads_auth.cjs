const fs = require('fs');

function findAndReplace() {
  const dir = './src';
  const files = fs.readdirSync(dir).filter(f => f.startsWith('Classification'));
  
  for (const file of files) {
    const fullPath = `${dir}/${file}`;
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Replace:
    // const { waitForAuth } = await import("./lib/auth");
    // const user = await waitForAuth();
    // if (!user) return;
    // const fileData = await uploadFileAndReturnMetadata(file, user.uid, ...
    
    let changed = false;
    
    if (content.includes('waitForAuth') && content.includes('if (!user) return;')) {
        content = content.replace(
        /const \{ waitForAuth \} = await import\("\.\/lib\/auth"\);\s*const user = await waitForAuth\(\);\s*if \(\!user\) return;\s*/g,
        'const { waitForAuth, getCurrentSession } = await import("./lib/auth");\n        const user = await waitForAuth();\n        const session = getCurrentSession();\n        const uid = user ? user.uid : (session ? session.accountId : "anonymous");\n        '
        );
        
        content = content.replace(/uploadFileAndReturnMetadata\(file, user\.uid,/g, 'uploadFileAndReturnMetadata(file, uid,');
        
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${file}`);
    }
  }
}

findAndReplace();
