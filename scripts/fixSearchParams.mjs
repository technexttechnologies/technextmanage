import fs from 'fs';
import path from 'path';

const files = [
  'src/app/aronium/page.tsx',
  'src/app/follow-ups/page.tsx',
  'src/app/leads/page.tsx',
  'src/app/projects/page.tsx',
  'src/app/quotations/page.tsx',
  'src/app/renewals/page.tsx',
  'src/app/settings/templates/page.tsx',
  'src/app/tasks/page.tsx'
];

for (const file of files) {
  const p = path.resolve(file);
  let content = fs.readFileSync(p, 'utf-8');

  // Regex to match searchParams destructuring and type
  // Example: 
  // searchParams,
  // }: {
  //   searchParams: { filter?: string };
  // }) {
  // const currentFilter = searchParams.filter || "ALL";

  // This script will just manually do regex replacements for the specific patterns we have.
  content = content.replace(/searchParams\s*:\s*\{\s*([a-zA-Z0-9_?]+)\s*:\s*string\s*\}\s*/g, 'searchParams: Promise<{ $1: string }>');
  
  // replace await searchParams resolution
  // If there's `searchParams.filter`, it should become `(await searchParams).filter`
  content = content.replace(/searchParams\.([a-zA-Z0-9_]+)/g, '(await searchParams).$1');

  // Special case for settings/templates/page.tsx
  content = content.replace(/searchParams\s*:\s*\{\s*id\?\s*:\s*string\s*\}/g, 'searchParams: Promise<{ id?: string }>');

  fs.writeFileSync(p, content);
  console.log(`Updated ${file}`);
}
