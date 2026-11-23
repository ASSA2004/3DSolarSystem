import sharp from 'sharp';
import {readdir,writeFile} from 'node:fs/promises';
const rows=[];
async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const path=dir+'/'+e.name;if(e.isDirectory())await walk(path);else if(/\.(webp|png|jpg)$/i.test(e.name)){const m=await sharp(path).metadata();rows.push(`| ${path} | ${m.width} × ${m.height} | ${dir.includes('textures')?'Solar surface / suitable gateway planet':'Solar illustration'} |`);}}}
await walk('textures');await walk('images');await writeFile('docs/ASSETS.md','# Asset inventory\n\nInherited image provenance is documented in ../ASSETS.md. Do not relicense inherited textures. New lab equipment and geometry use procedural materials; no missing files are assumed.\n\n| File | Resolution | Use |\n|---|---|---|\n'+rows.join('\n')+'\n');
