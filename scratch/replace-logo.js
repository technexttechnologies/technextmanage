const fs = require('fs');
const path = require('path');

const OLD_URL = "https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1781198231/technext_ort9yj.png";
const NEW_URL = "https://res.cloudinary.com/dwzerbhuj/image/upload/q_auto/f_auto/v1776917252/Untitled-2_gx7mta.png";

const filesToUpdate = [
  "src/app/login/page.tsx",
  "src/app/page.tsx",
  "src/app/support/page.tsx",
  "src/app/track/[id]/page.tsx",
  "src/components/layout/MobileHeader.tsx",
  "src/components/layout/Sidebar.tsx"
];

filesToUpdate.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    if (content.includes(OLD_URL)) {
      content = content.split(OLD_URL).join(NEW_URL);
      fs.writeFileSync(fullPath, content);
      console.log("Updated: " + file);
    }
  }
});
