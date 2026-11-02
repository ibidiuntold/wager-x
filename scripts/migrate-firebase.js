// Migration script to update Firebase imports
const fs = require('fs');
const path = require('path');

const searchAndReplace = (content) => {
  // Replace direct firebase-config imports
  content = content.replace(
    /import\s*{\s*(?:db|auth).*}\s*from\s*['"]@\/lib\/firebase-config['"];?/g,
    `import { useFirestore } from '@/hooks/useFirestore';`
  );
  
  // Replace db usage with hook
  content = content.replace(
    /const\s*{\s*db\s*}\s*=\s*useFirestore\(\);/g,
    'const { db } = useFirestore();'
  );
  
  return content;
};

const processFile = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');
  const updatedContent = searchAndReplace(content);
  if (content !== updatedContent) {
    fs.writeFileSync(filePath, updatedContent);
    console.log(`Updated ${filePath}`);
  }
};

const walkDir = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !filePath.includes('node_modules')) {
      walkDir(filePath);
    } else if (
      stat.isFile() && 
      (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) &&
      !filePath.includes('.d.ts')
    ) {
      processFile(filePath);
    }
  });
};

// Start migration
console.log('Starting Firebase migration...');
walkDir('.');
console.log('Migration complete!');
