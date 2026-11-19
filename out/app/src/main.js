/* Palm Fever editor wiring: photos, panel grid, crop/zoom per panel, grades, export PNG. */
import { GRADES, PANEL_ROLES } from './cover.js';
import { renderCover } from './cover.js';

const els = {
  photos: document.getElementById('photos'),
  photocount: document.getElementById('photocount'),
  caption: document.getElementById('caption'),
  subline: document.getElementById('subline'),
  grid: document.getElementById('panelgrid'),
  status: document.getElementById('status'),
  cover: document.getElementById('cover'),
};

const state = {
  caption: 'PALM FEVER',
  sub: 'one last summer',
  grade: 'sunset',
  selected: 1,
  photos: [],
};

async function loadSamples() {
  const names = ['samples/boulevard.jpg', 'samples/pier.jpg'];
  for (const n of names) {
    const img = new Image();
    img.src = n;
    await img.decode();
    state.photos.push({ img, zoom: 1.15, pan: { x: 0, y: 0 }, name: 'sample' });
  }
}

function panelThumb(i) {
  const p = state.photos[i % state.photos.length] || state.photos[0];
  const btn = document.createElement('button');
  if (p && p.img) {
    const c = document.createElement('canvas');
    c.width = 90; c.height = 120;
    const cx = c.getContext('2d');
    const s = Math.max(90 / p.img.width, 120 / p.img.height);
    cx.drawImage(p.img, (90 - p.img.width * s) / 2, (120 - p.img.height * s) / 2, p.img.width * s, p.img.height * s);
    btn.style.backgroundImage = `url(${c.toDataURL()})`;
  }
  const tag = document.createElement('span');
  tag.textContent = (i + 1) + '·' + PANEL_ROLES[i];
  btn.appendChild(tag);
  btn.onclick = () => { state.selected = i; syncGrid(); };
  return btn;
}

function syncGrid() {
  els.grid.innerHTML = '';
  for (let i = 0; i < 8; i++) {
    const b = panelThumb(i);
    if (i === state.selected) b.classList.add('sel');
    els.grid.appendChild(b);
  }
}

function draw() {
  renderCover(els.cover, {
    caption: state.caption,
    sub: state.sub,
    grade: state.grade,
    photos: state.photos.length ? state.photos : [{ img: null }],
  });
}

els.photos.onchange = async (e) => {
  const files = [...e.target.files].slice(0, 5);
  for (const f of files) {
    const img = new Image();
    img.src = URL.createObjectURL(f);
    await img.decode();
  }
  state.photos = files.map((f, i) => {
    const img = new Image();
    img.src = URL.createObjectURL(f);
    return { img, zoom: 1.2, pan: { x: 0, y: 0 }, name: f.name };
  });
  for (const p of state.photos) await p.img.decode();
  els.photocount.textContent = state.photos.length + ' photo' + (state.photos.length > 1 ? 's' : '') + ' loaded — filling 5 panels.';
  syncGrid();
  draw();
};

els.caption.oninput = (e) => { state.caption = e.target.value.toUpperCase(); draw(); };
els.subline.oninput = (e) => { state.sub = e.target.value; draw(); };

document.querySelectorAll('.grade').forEach((b) => {
  b.onclick = () => {
    document.querySelectorAll('.grade').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    state.grade = b.dataset.grade;
    draw();
  };
});

/* crop/zoom on selected panel: drag to pan, wheel to zoom */
let dragging = false, last = null;
els.cover.onpointerdown = (e) => { dragging = true; last = [e.clientX, e.clientY]; };
window.addEventListener('pointerup', () => (dragging = false));
els.cover.onpointermove = (e) => {
  if (!dragging) return;
  const p = state.photos[state.selected];
  if (!p) return;
  p.pan.x += e.clientX - last[0];
  p.pan.y += e.clientY - last[1];
  last = [e.clientX, e.clientY];
  draw();
};
els.cover.onwheel = (e) => {
  e.preventDefault();
  const p = state.photos[state.selected];
  if (!p) return;
  p.zoom = Math.min(3, Math.max(1, p.zoom + (e.deltaY < 0 ? .08 : -.08)));
  draw();
};

/* export: square / portrait / wide */
async function exportPNG(w, h, label) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  renderCover(c, { caption: state.caption, sub: state.sub, grade: state.grade, photos: state.photos.length ? state.photos : [{ img: null }] });
  const a = document.createElement('a');
  a.download = `palm-fever-${label}.png`;
  a.href = c.toDataURL('image/png');
  a.click();
  els.status.textContent = `Exported ${w} × ${h} PNG ✓`;
}

document.getElementById('sq').onclick = () => exportPNG(1080, 1080, '1080x1080');
document.getElementById('portrait').onclick = () => exportPNG(1080, 1350, '1080x1350');
document.getElementById('wide').onclick = () => exportPNG(1920, 1080, '1920x1080');

await loadSamples();
syncGrid();
draw();
