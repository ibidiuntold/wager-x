import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export function getTermsContent() {
  const termsPath = path.join(process.cwd(), './components/terms.md');
  const fileContents = fs.readFileSync(termsPath, 'utf8');
  const { content } = matter(fileContents);
  
  return content;
}