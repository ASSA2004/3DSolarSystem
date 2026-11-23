// Fonts are checked in: no font download is required to build or run.
// Source: google/fonts OFL variable TTFs (see docs/ASSETS.md).
// Regenerate with fontTools subset + Brotli, preserving variation tables:
// python -m fontTools.subset input.ttf --unicodes=U+0000-00FF,U+2000-206F,U+20AC --flavor=woff2 --output-file=public/fonts/body.woff2
import { stat } from "node:fs/promises";
for (const name of ["body", "display", "mono"]) {
  console.log(name, (await stat(`public/fonts/${name}.woff2`)).size, "bytes");
}
