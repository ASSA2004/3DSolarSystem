import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
for (const tier of ['lite','standard']) {
 await mkdir(`textures/${tier}`, {recursive:true});
 for (const file of (await readdir('textures')).filter(f=>/\.(jpg|png)$/.test(f))) {
  await sharp(`textures/${file}`).resize({width:tier==='lite'?512:1024,withoutEnlargement:true}).webp({quality:tier==='lite'?65:78}).toFile(`textures/${tier}/${file.replace(/\.(jpg|png)$/,'.webp')}`);
 }
}
await mkdir('images/webp',{recursive:true});
for(const file of (await readdir('images')).filter(f=>f.endsWith('.png'))) await sharp(`images/${file}`).resize({width:640,withoutEnlargement:true}).webp({quality:80}).toFile(`images/webp/${file.replace('.png','.webp')}`);
