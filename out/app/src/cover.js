/* Palm Fever — GTA-style multi-panel cover renderer (canvas, no libraries). */

export const GRADES = {
  sunset: { tint1: 'rgba(255, 102, 0, .20)', tint2: 'rgba(255, 0, 128, .18)', glow: '#ff6a00', letterA: '#ffd166', letterB: '#ff2d78', line: '#120a06' },
  neon:   { tint1: 'rgba(130, 0, 255, .22)', tint2: 'rgba(0, 200, 255, .16)', glow: '#b46cff', letterA: '#7df9ff', letterB: '#ff2d78', line: '#0c0618' },
  gold:   { tint1: 'rgba(255, 174, 0, .20)', tint2: 'rgba(160, 40, 0, .16)',  glow: '#ffae00', letterA: '#ffe9a8', letterB: '#c96a00', line: '#160d02' },
};

export const PANEL_ROLES = ['THE DRIVER', 'THE INSIDER', 'THE RIDER', 'THE BOSS', 'THE COURIER'];

/* Classic montage geometry: big center panel + four corners, all tilted a few degrees. */
const LAYOUT_1080 = [
  // FULL-BLEED mosaic: left 3, center 2 tall, right 3 — no background visible anywhere
  { x: 0,   y: 0,   w: 360, h: 368, rot: 0 },
  { x: 360, y: 0,   w: 360, h: 544, rot: 0 },
  { x: 720, y: 0,   w: 360, h: 368, rot: 0 },
  { x: 0,   y: 368, w: 360, h: 368, rot: 0 },
  { x: 0,   y: 736, w: 360, h: 344, rot: 0 },
  { x: 360, y: 544, w: 360, h: 536, rot: 0 },   // center bottom tile behind lettering
  { x: 720, y: 368, w: 360, h: 368, rot: 0 },
  { x: 720, y: 736, w: 360, h: 344, rot: 0 },
];

function drawPanel(ctx, img, box, zoom, pan, grade, role) {
  ctx.save();
  ctx.translate(box.x + box.w / 2, box.y + box.h / 2);
  ctx.rotate((box.rot * Math.PI) / 180);
  // gold frame + dark cut-out
  ctx.fillStyle = '#050308';
  ctx.fillRect(-box.w / 2 - 12, -box.h / 2 - 12, box.w + 24, box.h + 24);
  ctx.save();
  ctx.beginPath();
  ctx.rect(-box.w / 2, -box.h / 2, box.w, box.h);
  ctx.clip();
  // photo, cover-fit with user zoom/pan
  const iw = img.width, ih = img.height;
  const scale = Math.max(box.w / iw, box.h / ih) * zoom;
  const dw = iw * scale, dh = ih * scale;
  ctx.filter = 'contrast(1.85) saturate(1.9) brightness(0.95)';
  ctx.drawImage(img, -dw / 2 + pan.x, -dh / 2 + pan.y, dw, dh);
  ctx.filter = 'none';
  // vice-grade tints
  const g = ctx.createLinearGradient(0, -box.h / 2, 0, box.h / 2);
  g.addColorStop(0, grade.tint1);
  g.addColorStop(1, grade.tint2);
  ctx.fillStyle = g;
  ctx.fillRect(-box.w / 2, -box.h / 2, box.w, box.h);
  ctx.fillStyle = g; // double-pass duotone
  ctx.fillRect(-box.w / 2, -box.h / 2, box.w, box.h);
  // halftone dots
  ctx.globalAlpha = .24;
  ctx.fillStyle = '#000';
  for (let y = -box.h / 2; y < box.h / 2; y += 10) {
    for (let x = -box.w / 2; x < box.w / 2; x += 10) {
      ctx.beginPath();
      ctx.arc(x + 5, y + 5, 1.6, 0, 7);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  // role ribbon
  const rw = box.w * 0.78, rh = 34;
  ctx.fillStyle = '#0e0a14';
  ctx.fillRect(-rw / 2, box.h / 2 - rh - 6, rw, rh);
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 2;
  ctx.strokeRect(-rw / 2, box.h / 2 - rh - 6, rw, rh);
  ctx.fillStyle = '#ffd166';
  ctx.font = '700 17px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(role, 0, box.h / 2 - rh / 2 - 6);
  ctx.restore();
}

function lettering(ctx, W, caption, sub, grade) {
  const y = W > 1200 ? 940 : 890;
  // main 3D block letters
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `900 ${W > 1200 ? 112 : 92}px system-ui, sans-serif`;
  const cx = W / 2;
  // heavy black outline (comic sticker look)
  ctx.lineWidth = W > 1200 ? 26 : 22;
  ctx.strokeStyle = '#0a0710';
  ctx.lineJoin = 'round';
  ctx.strokeText(caption, cx, y);
  ctx.lineWidth = W > 1200 ? 10 : 8;
  ctx.strokeStyle = '#ffffff';
  ctx.strokeText(caption, cx, y);
  // sunset gradient face
  const g = ctx.createLinearGradient(0, y - 90, 0, y + 14);
  g.addColorStop(0, grade.letterA);
  g.addColorStop(1, grade.letterB);
  ctx.fillStyle = g;
  ctx.fillText(caption, cx, y);
  // neon script sub-line BELOW, its own zone
  ctx.save();
  ctx.translate(cx, y + 84);
  ctx.rotate(-0.04);
  ctx.font = `italic 700 ${W > 1200 ? 56 : 48}px Georgia, serif`;
  ctx.shadowColor = grade.letterB;
  ctx.shadowBlur = 26;
  ctx.fillStyle = '#ff6ec7';
  ctx.fillText(sub, 0, 0);
  ctx.shadowBlur = 0;
  ctx.restore();
}

function masthead(ctx, W, H) {
  ctx.fillStyle = '#0e0a14';
  ctx.fillRect(24, 24, W - 48, 54);
  ctx.strokeStyle = '#d9a441';
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, W - 48, 54);
  ctx.fillStyle = '#ffd166';
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('★★★★★  “PURE GOLDEN-HOUR MAYHEM” — THE HARBOR GAZETTE', 42, 52);
  ctx.textAlign = 'right';
  ctx.fillText('VOL. 1', W - 42, 52);
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(255,255,255,.85)';
  ctx.font = '600 15px system-ui, sans-serif';
  ctx.fillText('A ONE-PAGE SUMMER CRIME SPECIAL', 42, 96);
}

export function renderCover(canvas, opts) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const grade = GRADES[opts.grade];
  ctx.clearRect(0, 0, W, H);
  // sunset backdrop
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#2b0a4e');
  sky.addColorStop(.45, '#a1267c');
  sky.addColorStop(.75, '#ff7a3c');
  sky.addColorStop(1, '#ffd166');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  // sun + scanlines
  ctx.fillStyle = 'rgba(255, 240, 180, .9)';
  ctx.beginPath();
  ctx.arc(W / 2, H * .62, Math.min(W, H) * .22, 0, 7);
  ctx.fill();
  ctx.globalAlpha = .22;
  ctx.fillStyle = '#1a0630';
  for (let y = H * .5; y < H * .78; y += 26) ctx.fillRect(0, y, W, 9);
  ctx.globalAlpha = 1;
  // panels (scaled to canvas)
  const s = W / 1080;
  const layout = LAYOUT_1080.map(b => ({ ...b, x: b.x * s, y: b.y * s, w: b.w * s, h: b.h * s }));
  // wide format: scale panels into a letterboxed middle band
  if (W > H) {
    const band = H * 0.66;
    layout.forEach((b, i) => {
      const k = band / (LAYOUT_1080[1].h * 540 / 540); // fit band
      b.x = b.x * (W / 1080) * .92;
      b.y = b.y * (H / 1080) * .72 + 60;
      b.w *= (W / 1080) * .92;
      b.h *= (H / 1080) * .72;
    });
  }
  opts.photos.forEach((p, i) => {
    const b = layout[i % layout.length];
    if (p.img) drawPanel(ctx, p.img, b, p.zoom, p.pan, grade, PANEL_ROLES[i % 5]);
  });
  masthead(ctx, W, H);
  lettering(ctx, W, opts.caption, opts.sub, grade);
  // film grain vignette
  const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .35, W / 2, H / 2, Math.max(W, H) * .75);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,.42)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, W, H);
}
