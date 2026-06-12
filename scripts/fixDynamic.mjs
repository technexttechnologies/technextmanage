import fs from 'fs';
import path from 'path';

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src/app', function(filePath) {
  if (filePath.endsWith('page.tsx')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    // Only modify if it imports prisma and doesn't already have force-dynamic
    if (content.includes('prisma') && !content.includes('force-dynamic')) {
      content = 'export const dynamic = "force-dynamic";\n' + content;
      fs.writeFileSync(filePath, content);
      console.log('Added force-dynamic to', filePath);
    }
  }
});
