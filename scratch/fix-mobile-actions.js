const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all CSS modules in src
const files = execSync('dir /s /b "C:\\Users\\LENOVO\\Desktop\\TECHNEXT CRM SOFT\\src\\*.module.css"').toString().split('\r\n').filter(Boolean);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  
  // If the file has a .formActions class
  if (content.includes('.formActions {')) {
    // And if it has a mobile media query
    if (content.includes('@media (max-width: 640px) {')) {
      // Check if we already injected our fix
      if (!content.includes('flex-direction: column-reverse;')) {
        const replacement = `@media (max-width: 640px) {
  .formActions {
    flex-direction: column-reverse;
    padding-bottom: 40px; /* Avoid FAB overlap */
  }
  .formActions > * {
    width: 100%;
    justify-content: center;
  }`;
        content = content.replace('@media (max-width: 640px) {', replacement);
        fs.writeFileSync(file, content);
        console.log('Fixed:', file);
      }
    }
  }
});
