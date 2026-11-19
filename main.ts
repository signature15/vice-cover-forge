// Palm Fever — an offline, GTA-style multi-panel cover studio (Node 22, standard library only). The app itself lives
// in the app/ folder next to this file: plain static files a desktop browser loads with no server, no library, and no
// network request — app/index.html plus its ES modules. Drop in a photo, type a caption, and it composes Vice City
// cover art on a canvas: a mosaic of 8 photo panels tiled into the classic box-art grid, run through an ink-comic
// grade (posterized color, hard blacks, warm neon cast), with bold gradient lettering and a heavy outline laid over
// the top. Three export sizes at the click of a button: 1080 x 1080 square, 1080 x 1350 portrait, 1920 x 1080 wide.
// The two photos in app/samples/ were generated for make.fun with an image model and are free to use.
//
// This file is the packaging step, not the art: it copies app/ and screenshots/ from beside this file into /output
// and writes /output/dossier.json, the summary the judge reads, via the vendored make.fun library. Put your 3 or 4
// PNG or JPEG screenshots in screenshots/ (the first by name is the cover) before running.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB of app
// files, in all, or a path under app/ over 1000 bytes: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
