import { readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIR = join(import.meta.dirname, '..', 'project_ymls');
const OUT = join(DIR, 'index.json');

const files = (await readdir(DIR))
  .filter(f => f.endsWith('.yaml') || f.endsWith('.yml'))
  .sort();

await writeFile(OUT, JSON.stringify(files, null, 2) + '\n', 'utf8');
console.log(`index.json aggiornato: ${files.length} file(s)\n${files.map(f => '  ' + f).join('\n')}`);
