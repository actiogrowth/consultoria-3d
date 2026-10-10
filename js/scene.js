// =====================================================================
//  Escena 3D: diorama de la tienda, personas, monedas y transiciones
//  de cada área. Lee el estado de la simulación cada cuadro.
// =====================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { L, ANCLAS, VISTAS } from './layout.js';
import { EST } from './sim.js';
import { TEXTOS } from './config.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));

// ---------------------------------------------------------------------
// Materiales compartidos
// ---------------------------------------------------------------------
const matCache = new Map();
function mat(color, opts = {}) {
  const key = color + JSON.stringify(opts);
  if (!matCache.has(key)) matCache.set(key, new THREE.MeshLambertMaterial({ color, flatShading: true, ...opts }));
  return matCache.get(key);
}

const C = {
  pasto: '#9CC08A', pastoOsc: '#86AE76', tierra: '#D9C7A3', base: '#6E5A45', baseOsc: '#5B4A39',
  asfalto: '#59626A', vereda: '#D7D4CC', linea: '#F3F1EA', piso: '#EDE3D2', pisoBodega: '#D6CBB8',
  muro: '#F4EEE3', muroOsc: '#E3D9C8', zocalo: '#1F5E3A', madera: '#B07A4E', maderaOsc: '#8C5E3A',
  caja: '#C99A62', cinta: '#A97A45', metal: '#7D8C86', metalOsc: '#4E5B56', oro: '#E8B931',
  verde: '#1F5E3A', verdeOsc: '#004225', verdeMed: '#4C6B47', blanco: '#FFFFFF', tronco: '#7A5536',
  hoja: '#5E9E5A', hoja2: '#4C8A4E', hoja3: '#77AD62',
};

function box(w, h, d, color, x = 0, y = 0, z = 0, parent, opts) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === 'string' ? mat(color, opts) : color);
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  if (parent) parent.add(m);
  return m;
}

// ---------------------------------------------------------------------
// Texturas dibujadas en canvas (propias, sin recursos externos)
// ---------------------------------------------------------------------
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const texCara = (feliz) => canvasTex(128, 128, (g) => {
  g.fillStyle = feliz ? '#2E9E5B' : '#E0533D';
  g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill();
  g.lineWidth = 6; g.strokeStyle = '#ffffff'; g.stroke();
  g.fillStyle = '#ffffff';
  if (feliz) {
    g.beginPath(); g.arc(44, 52, 7, 0, Math.PI * 2); g.arc(84, 52, 7, 0, Math.PI * 2); g.fill();
    g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.arc(64, 66, 26, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  } else {
    g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.moveTo(32, 40); g.lineTo(54, 50); g.moveTo(96, 40); g.lineTo(74, 50); g.stroke();
    g.beginPath(); g.arc(44, 58, 6, 0, Math.PI * 2); g.arc(84, 58, 6, 0, Math.PI * 2); g.fill();
    g.lineWidth = 8;
    g.beginPath(); g.arc(64, 104, 24, 1.2 * Math.PI, 1.8 * Math.PI); g.stroke();
  }
});

const texBurbuja = () => canvasTex(128, 128, (g) => {
  g.fillStyle = '#ffffff';
  roundRect(g, 10, 12, 108, 80, 24); g.fill();
  g.beginPath(); g.moveTo(40, 88); g.lineTo(34, 118); g.lineTo(64, 90); g.fill();
  g.fillStyle = '#2E9E5B';
  g.beginPath();
  const cx = 64, cy = 54;
  g.moveTo(cx, cy + 22);
  g.bezierCurveTo(cx - 34, cy, cx - 22, cy - 26, cx, cy - 10);
  g.bezierCurveTo(cx + 22, cy - 26, cx + 34, cy, cx, cy + 22);
  g.fill();
});

const texLetrero = () => canvasTex(512, 128, (g, w, h) => {
  g.fillStyle = '#004225';
  roundRect(g, 0, 0, w, h, 26); g.fill();
  g.fillStyle = '#FFE7A8';
  g.font = '800 72px "Segoe UI", system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(TEXTOS.escena.letrero, w / 2, h / 2 + 4);
});

const texValla = () => canvasTex(512, 288, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, h);
  gr.addColorStop(0, '#1F5E3A'); gr.addColorStop(1, '#004225');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = 'rgba(255,255,255,.10)';
  g.beginPath(); g.arc(w - 70, 60, 120, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#E8B931';
  g.beginPath(); g.arc(90, h / 2, 52, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#004225';
  g.font = '800 54px "Segoe UI", system-ui, sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('★', 90, h / 2 + 2);
  g.fillStyle = '#ffffff';
  g.textAlign = 'left';
  g.font = '800 58px "Segoe UI", system-ui, sans-serif';
  g.fillText(TEXTOS.escena.vallaTitulo, 165, h / 2 - 26);
  g.font = '600 30px "Segoe UI", system-ui, sans-serif';
  g.fillStyle = '#CFE6D6';
  g.fillText(TEXTOS.escena.vallaBajada, 167, h / 2 + 34);
});

// ---------------------------------------------------------------------
// Personitas (geometría propia, colores variados)
// ---------------------------------------------------------------------
const PAL = {
  camisa: ['#E07A5F', '#3D85C6', '#F2CC8F', '#81B29A', '#9B5DE5', '#F28482', '#4D908E', '#E9C46A', '#577590', '#C9ADA7', '#E76F51', '#6D9DC5'],
  piel: ['#F1C27D', '#E0AC69', '#C68642', '#8D5524', '#FFDBAC'],
  pelo: ['#2B1D14', '#4A3222', '#A0522D', '#D9B26F', '#1B1B1B', '#8A8A8A'],
  pantalon: ['#2F3E46', '#3C4A5C', '#5B4636', '#264653', '#6B705C'],
};

const torsoCache = new Map();
const G_PIERNA = new THREE.BoxGeometry(0.12, 0.36, 0.13).translate(0, -0.18, 0);
const G_BRAZO = new THREE.BoxGeometry(0.09, 0.34, 0.09).translate(0, -0.15, 0);
const G_PAQUETE = new THREE.BoxGeometry(0.3, 0.24, 0.24);
const G_SOMBRA = new THREE.CircleGeometry(0.3, 10).rotateX(-Math.PI / 2);
const M_SOMBRA = new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.16, depthWrite: false });

function colorize(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  const c = new THREE.Color(color);
  const n = g.attributes.position.count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  g.deleteAttribute('uv');
  return g;
}

function torsoGeo(camisa, piel, pelo, staff) {
  const key = camisa + piel + pelo + (staff ? 's' : '');
  if (torsoCache.has(key)) return torsoCache.get(key);
  const parts = [];
  parts.push(colorize(new THREE.CylinderGeometry(0.17, 0.23, 0.5, 7).translate(0, 0.61, 0), camisa));
  parts.push(colorize(new THREE.IcosahedronGeometry(0.17, 0).translate(0, 0.99, 0), piel));
  parts.push(colorize(new THREE.SphereGeometry(0.182, 7, 4, 0, Math.PI * 2, 0, Math.PI * 0.55).translate(0, 1.01, -0.02), pelo));
  parts.push(colorize(new THREE.BoxGeometry(0.035, 0.05, 0.02).translate(-0.06, 1.0, 0.155), '#1d1d1d'));
  parts.push(colorize(new THREE.BoxGeometry(0.035, 0.05, 0.02).translate(0.06, 1.0, 0.155), '#1d1d1d'));
  if (staff) {
    // delantal y gorra de la tienda
    parts.push(colorize(new THREE.BoxGeometry(0.3, 0.36, 0.05).translate(0, 0.56, 0.2), '#F4EEE3'));
    parts.push(colorize(new THREE.CylinderGeometry(0.19, 0.19, 0.07, 8).translate(0, 1.13, 0), '#004225'));
    parts.push(colorize(new THREE.BoxGeometry(0.2, 0.03, 0.14).translate(0, 1.11, 0.17), '#004225'));
  }
  const g = mergeGeometries(parts);
  g.computeVertexNormals();
  torsoCache.set(key, g);
  return g;
}

const M_VERTEX = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });

function crearPersonita(seed, staff = false) {
  const r = (i) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 233280;
    return x - Math.floor(x);
  };
  const pick = (arr, i) => arr[Math.floor(r(i) * arr.length)];
  const camisa = staff ? '#1F5E3A' : pick(PAL.camisa, 1);
  const piel = pick(PAL.piel, 2);
  const pelo = pick(PAL.pelo, 3);
  const pantalon = staff ? '#22302A' : pick(PAL.pantalon, 4);
  const g = new THREE.Group();
  const cuerpo = new THREE.Group();
  g.add(cuerpo);
  const torso = new THREE.Mesh(torsoGeo(camisa, piel, pelo, staff), M_VERTEX);
  torso.castShadow = true;
  cuerpo.add(torso);
  const pi = new THREE.Mesh(G_PIERNA, mat(pantalon)); pi.position.set(-0.085, 0.38, 0);
  const pd = new THREE.Mesh(G_PIERNA, mat(pantalon)); pd.position.set(0.085, 0.38, 0);
  const bi = new THREE.Mesh(G_BRAZO, mat(camisa)); bi.position.set(-0.235, 0.8, 0);
  const bd = new THREE.Mesh(G_BRAZO, mat(camisa)); bd.position.set(0.235, 0.8, 0);
  cuerpo.add(pi, pd, bi, bd);
  const sombra = new THREE.Mesh(G_SOMBRA, M_SOMBRA);
  sombra.position.y = 0.02;
  g.add(sombra);
  const alto = staff ? 1.0 : 0.86 + r(5) * 0.28;
  const ancho = 0.92 + r(6) * 0.16;
  cuerpo.scale.set(ancho, alto, ancho);
  g.userData = { cuerpo, pi, pd, bi, bd, fase: r(7) * 10, alto, sprite: null, paquete: null, burbuja: null };
  return g;
}

function animarPersonita(g, dt, mueve, vel, reducido, trabajando = false) {
  const u = g.userData;
  if (mueve) u.fase += dt * vel * 6.2;
  const s = mueve ? Math.sin(u.fase) : 0;
  const amp = reducido ? 0.25 : 0.65;
  u.pi.rotation.x = s * amp;
  u.pd.rotation.x = -s * amp;
  u.bi.rotation.x = -s * amp * 0.8;
  u.bd.rotation.x = s * amp * 0.8;
  if (trabajando && !mueve) {
    u.fase += dt * 5;
    u.bd.rotation.x = -0.9 + Math.sin(u.fase) * 0.35;
    u.bi.rotation.x = -0.6 + Math.cos(u.fase) * 0.25;
  }
  if (reducido) { u.cuerpo.position.y = 0; u.cuerpo.rotation.z = 0; return; }
  u.cuerpo.position.y = mueve ? Math.abs(Math.sin(u.fase)) * 0.055 : 0;
  u.cuerpo.rotation.z = mueve ? Math.sin(u.fase) * 0.07 : 0;
}

// ---------------------------------------------------------------------
// Escena
// ---------------------------------------------------------------------
export class Escena {
  constructor(canvas, { movil, reducido }) {
    this.movil = movil;
    this.reducido = reducido;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: !movil, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, movil ? 1.5 : 1.75));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = !movil;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#E9F0EA');
    this.scene.fog = new THREE.Fog('#E9F0EA', 70, 140);

    this.camera = new THREE.PerspectiveCamera(40, 1, 0.5, 300);
    this.controls = new OrbitControls(this.camera, canvas);
    Object.assign(this.controls, {
      enableDamping: true, dampingFactor: 0.08, rotateSpeed: 0.6, zoomSpeed: 0.9, panSpeed: 0.7,
      screenSpacePanning: false, minDistance: 6.5, maxDistance: 60, minPolarAngle: 0.28, maxPolarAngle: 1.22,
    });
    // un dedo: giro propio (más sensible, con inercia); dos dedos: acercar y desplazar
    this.controls.touches = { ONE: null, TWO: THREE.TOUCH.DOLLY_PAN };
    this.controls.addEventListener('change', () => this.limitarObjetivo());
    this.toques = new Map();
    this.arrastre = null;
    this.inercia = 0;
    this.velGiro = 0;
    this.muros = [];
    this.giroTactil(canvas);

    this.f = { marketing: 0, ventas: 0, operaciones: 0, finanzas: 0 };
    this.fObj = { marketing: 0, ventas: 0, operaciones: 0, finanzas: 0 };
    this.brilloAds = 0.7; this.brilloOrg = 0.7;
    this.personas = new Map();
    this.hits = [];
    this.vuelo = null;
    this.offset = { x: 0, y: 0, tx: 0, ty: 0 };
    this.t = 0;
    this.nivelVisual = 0;

    this.texFeliz = texCara(true);
    this.texMolesto = texCara(false);
    this.matFeliz = new THREE.SpriteMaterial({ map: this.texFeliz, depthTest: false });
    this.matMolesto = new THREE.SpriteMaterial({ map: this.texMolesto, depthTest: false });
    this.matBurbuja = new THREE.SpriteMaterial({ map: texBurbuja(), depthTest: false });

    this.luces();
    this.construirBase();
    this.construirEntradas();
    this.construirTienda();
    this.construirVentas();
    this.construirBodega();
    this.construirFinanzas();
    this.construirCofre();
    this.construirMonedas();
    this.construirStaff();
    this.construirDecorado();

    this.resize();
  }

  // ----- luces -----
  luces() {
    const hemi = new THREE.HemisphereLight('#FFFFFF', '#B9C9B4', 1.35);
    this.scene.add(hemi);
    const sol = new THREE.DirectionalLight('#FFF4E2', 1.9);
    sol.position.set(-10, 22, 14);
    sol.castShadow = true;
    sol.shadow.mapSize.set(2048, 2048);
    const s = sol.shadow.camera;
    s.left = -20; s.right = 20; s.top = 14; s.bottom = -14; s.near = 1; s.far = 60;
    sol.shadow.bias = -0.0006;
    sol.shadow.normalBias = 0.02;
    this.scene.add(sol);
  }

  // ----- base del diorama, calle, vereda -----
  construirBase() {
    const b = L.base;
    const w = b.x1 - b.x0, d = b.z1 - b.z0, cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
    const tierra = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 1.4, d + 0.6), mat(C.base));
    tierra.position.set(cx, -0.72, cz);
    tierra.receiveShadow = true;
    this.scene.add(tierra);
    const franja = new THREE.Mesh(new THREE.BoxGeometry(w + 0.64, 0.3, d + 0.64), mat(C.baseOsc));
    franja.position.set(cx, -1.3, cz);
    this.scene.add(franja);
    const pasto = new THREE.Mesh(new THREE.BoxGeometry(w, 0.1, d), mat(C.pasto));
    pasto.position.set(cx, -0.05, cz);
    pasto.receiveShadow = true;
    this.scene.add(pasto);

    // calle
    const c = L.calle;
    const asf = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, c.z1 - c.z0), mat(C.asfalto));
    asf.position.set(cx, 0.0, (c.z0 + c.z1) / 2);
    asf.receiveShadow = true;
    this.scene.add(asf);
    for (let x = b.x0 + 1; x < b.x1; x += 2.4) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.07, 0.12), mat(C.linea));
      l.position.set(x, 0.01, (c.z0 + c.z1) / 2);
      this.scene.add(l);
    }
    // pasos peatonales
    for (const xp of [-3.25, 4.4]) {
      for (let i = 0; i < 6; i++) {
        const s = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.075, 0.26), mat(C.linea));
        s.position.set(xp, 0.012, c.z0 + 0.3 + i * 0.45);
        this.scene.add(s);
      }
    }
    // veredas
    const v = L.vereda;
    const ver = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, v.z1 - v.z0), mat(C.vereda));
    ver.position.set(cx, 0.02, (v.z0 + v.z1) / 2);
    ver.receiveShadow = true;
    this.scene.add(ver);
    const ver2 = new THREE.Mesh(new THREE.BoxGeometry(w, 0.14, b.z1 - c.z1), mat(C.vereda));
    ver2.position.set(cx, 0.02, (c.z1 + b.z1) / 2);
    ver2.receiveShadow = true;
    this.scene.add(ver2);
  }

  // ----- entradas: valla (ads) y sendero (orgánico) -----
  construirEntradas() {
    // Valla publicitaria
    const v = L.valla;
    const g = new THREE.Group();
    g.position.set(v.x, 0, v.z);
    g.rotation.y = v.rot;
    this.valla = g;
    box(0.18, 2.2, 0.18, C.metalOsc, -1.3, 0, 0, g);
    box(0.18, 2.2, 0.18, C.metalOsc, 1.3, 0, 0, g);
    box(3.9, 2.3, 0.22, C.metalOsc, 0, 2.05, -0.06, g);
    const tex = texValla();
    this.matValla = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.8 });
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.02), this.matValla);
    panel.position.set(0, 3.2, 0.06);
    g.add(panel);
    // focos de la valla
    this.focosValla = [];
    for (const x of [-1.1, 0, 1.1]) {
      const brazo = box(0.06, 0.06, 0.5, C.metalOsc, x, 4.38, 0.2, g);
      brazo.castShadow = false;
      const foco = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), new THREE.MeshBasicMaterial({ color: '#FFF3C4' }));
      foco.position.set(x, 4.36, 0.46);
      g.add(foco);
      this.focosValla.push(foco);
    }
    this.luzValla = new THREE.PointLight('#FFF0C8', 0, 7, 1.6);
    this.luzValla.position.set(0, 3.4, 1.4);
    g.add(this.luzValla);
    this.scene.add(g);

    // Sendero orgánico: piedras planas siguiendo la ruta
    const pts = [...L.rutaOrg, L.decision].map((p) => new THREE.Vector3(p.x, 0, p.z));
    const curva = new THREE.CatmullRomCurve3(pts);
    const n = 34;
    for (let i = 0; i <= n; i++) {
      const p = curva.getPoint(i / n);
      if (p.z > L.vereda.z0 - 0.2) continue;
      const piedra = new THREE.Mesh(new THREE.CylinderGeometry(0.42 + (i % 3) * 0.05, 0.46, 0.08, 7), mat(C.tierra));
      piedra.position.set(p.x + Math.sin(i * 2.3) * 0.12, 0.02, p.z + Math.cos(i * 1.7) * 0.12);
      piedra.rotation.y = i;
      piedra.receiveShadow = true;
      this.scene.add(piedra);
    }
    // faroles del sendero
    this.faroles = [];
    for (const [x, z] of [[-14.5, -6.0], [-12.8, -3.6], [-11.9, -0.6], [-10.0, 1.6]]) {
      const fg = new THREE.Group();
      fg.position.set(x - 0.75, 0, z + 0.3);
      box(0.08, 1.5, 0.08, C.metalOsc, 0, 0, 0, fg);
      const bulbo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), new THREE.MeshStandardMaterial({ color: '#FFF6D8', emissive: '#FFD27A', emissiveIntensity: 0.8 }));
      bulbo.position.y = 1.62;
      fg.add(bulbo);
      box(0.3, 0.05, 0.3, C.metalOsc, 0, 1.78, 0, fg);
      this.scene.add(fg);
      this.faroles.push(bulbo);
    }
    // cartelito con corazón al inicio del sendero
    const cart = new THREE.Group();
    cart.position.set(-14.6, 0, -7.4);
    box(0.08, 0.9, 0.08, C.maderaOsc, 0, 0, 0, cart);
    const tabla = box(0.8, 0.5, 0.06, C.madera, 0, 0.75, 0, cart);
    tabla.castShadow = false;
    const corazon = new THREE.Sprite(this.matBurbuja);
    corazon.scale.set(0.55, 0.55, 1);
    corazon.position.set(0, 1.0, 0.1);
    cart.add(corazon);
    this.scene.add(cart);
  }

  // ----- tienda (piso, muros, vitrina) -----
  construirTienda() {
    const t = L.tienda;
    const w = t.x1 - t.x0, d = t.z1 - t.z0;
    const piso = new THREE.Mesh(new THREE.BoxGeometry(w, 0.16, d), mat(C.piso));
    piso.position.set((t.x0 + t.x1) / 2, 0.02, (t.z0 + t.z1) / 2);
    piso.receiveShadow = true;
    this.scene.add(piso);
    // baldosas sutiles
    for (let x = t.x0 + 1.2; x < L.tabique.x; x += 1.2) {
      const l = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.005, d - 0.2), mat(C.muroOsc));
      l.position.set(x, 0.105, (t.z0 + t.z1) / 2);
      this.scene.add(l);
    }
    const bod = L.bodega;
    const pb = new THREE.Mesh(new THREE.BoxGeometry(t.x1 - L.tabique.x, 0.17, d), mat(C.pisoBodega));
    pb.position.set((L.tabique.x + t.x1) / 2, 0.025, (t.z0 + t.z1) / 2);
    pb.receiveShadow = true;
    this.scene.add(pb);

    // muros: fondo alto, izquierdo alto, derecho bajo (bodega), frente bajo
    const H = 2.6;
    this.registrarMuro([
      box(w + 0.3, H, 0.3, C.muro, (t.x0 + t.x1) / 2, 0.1, t.z0 - 0.15, this.scene),
      box(w + 0.32, 0.18, 0.34, C.zocalo, (t.x0 + t.x1) / 2, 0.1 + H, t.z0 - 0.15, this.scene),
    ], 0, -1);
    this.registrarMuro([
      box(0.3, H, d, C.muro, t.x0 - 0.15, 0.1, (t.z0 + t.z1) / 2, this.scene),
      box(0.34, 0.18, d + 0.02, C.zocalo, t.x0 - 0.15, 0.1 + H, (t.z0 + t.z1) / 2, this.scene),
    ], -1, 0);
    this.registrarMuro([box(0.3, 1.0, d, C.muroOsc, t.x1 + 0.15, 0.1, (t.z0 + t.z1) / 2, this.scene)], 1, 0);
    // frente bajo (entre puerta de entrada y puerta de salida)
    box(L.puertaSalida.x0 - L.puerta.x1, 0.6, 0.26, C.muro, (L.puerta.x1 + L.puertaSalida.x0) / 2, 0.1, t.z1, this.scene);
    box(L.puertaSalida.x0 - L.puerta.x1, 0.08, 0.3, C.zocalo, (L.puerta.x1 + L.puertaSalida.x0) / 2, 0.7, t.z1, this.scene);
    // frente de bodega (bajo)
    box(t.x1 - L.puertaSalida.x1, 1.0, 0.26, C.muroOsc, (L.puertaSalida.x1 + t.x1) / 2, 0.1, t.z1, this.scene);
    // marcos de puertas
    for (const [x0, x1] of [[L.puerta.x0, L.puerta.x1], [L.puertaSalida.x0, L.puertaSalida.x1]]) {
      box(0.14, 2.2, 0.3, C.verde, x0, 0.1, t.z1, this.scene);
      box(0.14, 2.2, 0.3, C.verde, x1, 0.1, t.z1, this.scene);
      box(x1 - x0 + 0.14, 0.14, 0.3, C.verde, (x0 + x1) / 2, 2.3, t.z1, this.scene);
      const tapete = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0 - 0.1, 0.02, 0.7), mat('#6E8F6B'));
      tapete.position.set((x0 + x1) / 2, 0.11, t.z1 - 0.2);
      this.scene.add(tapete);
    }
    // muro entre vitrina y puerta
    box(L.puerta.x0 - L.vitrina.x1 - 0.07, 2.2, 0.26, C.muro, (L.vitrina.x1 + L.puerta.x0) / 2, 0.1, t.z1, this.scene);

    // tabique entre tienda y bodega con ventana de entrega
    const tb = L.tabique;
    this.registrarMuro([
      box(0.24, 1.7, tb.ventana[0] - t.z0, C.muroOsc, tb.x, 0.1, (t.z0 + tb.ventana[0]) / 2, this.scene),
      box(0.24, 1.7, t.z1 - tb.ventana[1], C.muroOsc, tb.x, 0.1, (tb.ventana[1] + t.z1) / 2, this.scene),
    ], 1, 0, true);
    box(0.7, 1.05, tb.ventana[1] - tb.ventana[0], C.madera, tb.x, 0.1, (tb.ventana[0] + tb.ventana[1]) / 2, this.scene);
    box(0.8, 0.06, tb.ventana[1] - tb.ventana[0] + 0.1, C.maderaOsc, tb.x, 1.15, (tb.ventana[0] + tb.ventana[1]) / 2, this.scene);
    // alfombra zona de entrega
    const alf = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.02, 3.6), mat('#CFE0CF'));
    alf.position.set(1.8, 0.11, -0.6);
    alf.receiveShadow = true;
    this.scene.add(alf);

    this.construirVitrina();
  }

  construirVitrina() {
    const v = L.vitrina;
    const g = new THREE.Group();
    const ancho = v.x1 - v.x0;
    g.position.set((v.x0 + v.x1) / 2, 0.1, v.z);
    // base y marco
    box(ancho + 0.2, 0.5, 0.9, C.verdeOsc, 0, 0, 0, g);
    box(ancho + 0.2, 0.12, 0.95, C.verdeOsc, 0, v.alto, 0, g);
    box(0.12, v.alto, 0.9, C.verdeOsc, -ancho / 2 - 0.04, 0, 0, g);
    box(0.12, v.alto, 0.9, C.verdeOsc, ancho / 2 + 0.04, 0, 0, g);
    // fondo interior (se ilumina)
    this.matFondoVitrina = new THREE.MeshStandardMaterial({ color: '#5A5A55', emissive: '#FFD58A', emissiveIntensity: 0.0, roughness: 0.9 });
    const fondo = new THREE.Mesh(new THREE.BoxGeometry(ancho, v.alto - 0.5, 0.06), this.matFondoVitrina);
    fondo.position.set(0, 0.5 + (v.alto - 0.5) / 2, -0.4);
    g.add(fondo);
    // productos en exhibición
    this.productos = [];
    const colores = ['#E07A5F', '#3D85C6', '#E9C46A', '#81B29A', '#9B5DE5'];
    for (let i = 0; i < 5; i++) {
      const alto = 0.25 + (i % 3) * 0.12;
      const m = new THREE.MeshStandardMaterial({ color: colores[i], emissive: colores[i], emissiveIntensity: 0, roughness: 0.6 });
      const p = new THREE.Mesh(i % 2 ? new THREE.CylinderGeometry(0.13, 0.13, alto, 8) : new THREE.BoxGeometry(0.26, alto, 0.26), m);
      p.position.set(-ancho / 2 + 0.35 + i * (ancho - 0.7) / 4, 0.5 + alto / 2, -0.05 + (i % 2) * -0.15);
      p.castShadow = true;
      g.add(p);
      this.productos.push(p);
    }
    // vidrio
    this.matVidrio = new THREE.MeshStandardMaterial({ color: '#BFD9E6', transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0.1, emissive: '#FFE3A8', emissiveIntensity: 0 });
    const vidrio = new THREE.Mesh(new THREE.PlaneGeometry(ancho, v.alto - 0.5), this.matVidrio);
    vidrio.position.set(0, 0.5 + (v.alto - 0.5) / 2, 0.42);
    g.add(vidrio);
    // toldo a rayas
    for (let i = 0; i < 7; i++) {
      const franja = new THREE.Mesh(new THREE.BoxGeometry((ancho + 0.3) / 7, 0.06, 0.8), mat(i % 2 ? '#FFFFFF' : C.verde));
      franja.position.set(-(ancho + 0.3) / 2 + (i + 0.5) * (ancho + 0.3) / 7, v.alto + 0.28, 0.62);
      franja.rotation.x = 0.35;
      franja.castShadow = true;
      g.add(franja);
    }
    // letrero
    const tex = texLetrero();
    this.matLetrero = new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: '#ffffff', emissiveIntensity: 0.08, roughness: 0.8 });
    const letrero = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.58), this.matLetrero);
    letrero.position.set(0, v.alto + 0.82, 0.25);
    g.add(letrero);
    box(2.42, 0.68, 0.08, C.verdeOsc, 0, v.alto + 0.48, 0.19, g);
    // halo cálido en la vereda cuando la vitrina está encendida
    const halo = canvasTex(128, 128, (g2) => {
      const gr = g2.createRadialGradient(64, 64, 4, 64, 64, 62);
      gr.addColorStop(0, 'rgba(255,214,140,0.9)'); gr.addColorStop(1, 'rgba(255,214,140,0)');
      g2.fillStyle = gr; g2.fillRect(0, 0, 128, 128);
    });
    this.matHalo = new THREE.MeshBasicMaterial({ map: halo, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    const haloM = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.6).rotateX(-Math.PI / 2), this.matHalo);
    haloM.position.set(0, 0.08, 1.35);
    g.add(haloM);
    this.luzVitrina = new THREE.PointLight('#FFD99A', 0, 6, 1.5);
    this.luzVitrina.position.set(0, 1.2, 0.9);
    g.add(this.luzVitrina);
    this.scene.add(g);
    this.hitBox(this.scene, 'marketing', 3.6, 3.4, 2.2, -7.0, 0, 2.9);
  }

  // ----- ventas: mostrador, cajas registradoras, separadores de fila -----
  construirVentas() {
    const m = L.mostrador;
    box(m.x1 - m.x0, 0.7, 0.7, C.madera, (m.x0 + m.x1) / 2, 0.1, m.z, this.scene);
    box(m.x1 - m.x0 + 0.1, 0.07, 0.8, C.maderaOsc, (m.x0 + m.x1) / 2, 0.8, m.z, this.scene);
    box(m.x1 - m.x0 - 0.2, 0.36, 0.04, C.verde, (m.x0 + m.x1) / 2, 0.28, m.z + 0.36, this.scene);
    // tarima del personal detrás del mostrador
    box(m.x1 - m.x0, 0.14, 1.1, C.maderaOsc, (m.x0 + m.x1) / 2, 0.1, m.z - 0.85, this.scene);
    this.cajasReg = [];
    L.cajeros.forEach((c, i) => {
      const g = new THREE.Group();
      g.position.set(c.x, 0.87, m.z);
      box(0.5, 0.22, 0.4, '#2F3A36', 0, 0, 0, g);
      const pantalla = box(0.36, 0.26, 0.05, '#2F3A36', 0, 0.26, -0.08, g);
      pantalla.rotation.x = -0.3;
      const luz = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.17, 0.01), new THREE.MeshBasicMaterial({ color: '#7FD39B' }));
      luz.position.set(0, 0.4, -0.05);
      luz.rotation.x = -0.3;
      g.add(luz);
      this.scene.add(g);
      if (i === 1) g.scale.setScalar(0.001);
      this.cajasReg.push(g);
    });
    // separadores de la fila (postes y cinta)
    const postes = [[-2.1, -0.68], [-4.5, -0.68], [-7.0, -0.68], [-8.0, -0.68]];
    for (const [x, z] of postes) {
      box(0.08, 0.85, 0.08, C.metal, x, 0.1, z, this.scene);
      const tope = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), mat(C.metal));
      tope.position.set(x, 0.98, z);
      this.scene.add(tope);
    }
    const cinta = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.08, 0.03), mat('#B23A3A'));
    cinta.position.set(-4.55, 0.84, -0.68);
    this.scene.add(cinta);
    this.hitBox(this.scene, 'ventas', 7.2, 2.6, 4.6, -4.4, 0, -1.6);
  }

  // ----- bodega: estantes y cajas -----
  construirBodega() {
    const g = this.scene;
    // estante del fondo
    const estantes = [];
    const est = (x0, z, largo, rot) => {
      const e = new THREE.Group();
      e.position.set(x0, 0.1, z);
      e.rotation.y = rot;
      for (const y of [0.05, 0.75, 1.45]) box(largo, 0.06, 0.6, C.maderaOsc, 0, y, 0, e);
      for (const x of [-largo / 2, largo / 2]) box(0.07, 1.6, 0.6, C.maderaOsc, x, 0, 0, e);
      g.add(e);
      estantes.push(e);
      return e;
    };
    est(5.4, -4.6, 2.8, 0);
    est(6.65, -1.7, 2.6, Math.PI / 2);
    // posiciones de cajas en estantes (mundo)
    this.slotsEstante = [];
    for (const y of [0.18, 0.88, 1.58]) {
      for (const x of [4.45, 5.4, 6.35]) this.slotsEstante.push(new THREE.Vector3(x, y + 0.23, -4.6));
    }
    for (const y of [0.18, 0.88]) {
      for (const z of [-2.6, -1.7, -0.8]) this.slotsEstante.push(new THREE.Vector3(6.65, y + 0.23, z));
    }
    // posiciones desordenadas en el piso
    const piso = [
      [4.5, -3.6, 0.5], [5.3, -3.1, 1.1], [6.0, -3.7, 0.2], [4.8, -2.4, 0.9], [5.7, -1.9, 2.0],
      [4.4, -0.9, 0.3], [5.2, -0.4, 1.4], [6.0, -0.9, 0.8], [4.7, 0.9, 2.4], [5.6, 1.2, 0.6],
      [6.2, 0.4, 1.9], [5.0, 1.8, 0.1], [4.6, 1.6, 1.0], [6.3, 1.7, 2.7], [5.5, 0.4, 0.4],
    ];
    this.cajas = [];
    const geo = new THREE.BoxGeometry(0.46, 0.4, 0.46);
    const cintaGeo = new THREE.BoxGeometry(0.47, 0.06, 0.12);
    for (let i = 0; i < this.slotsEstante.length; i++) {
      const c = new THREE.Mesh(geo, mat(C.caja));
      c.castShadow = true;
      c.receiveShadow = true;
      const ci = new THREE.Mesh(cintaGeo, mat(C.cinta));
      ci.position.y = 0.2;
      c.add(ci);
      const [x, z, r] = piso[i % piso.length];
      c.userData = {
        piso: new THREE.Vector3(x, 0.3, z), rotPiso: new THREE.Euler(i % 3 === 0 ? 0.5 : 0, r, i % 4 === 1 ? 1.57 : 0),
        estante: this.slotsEstante[i],
      };
      g.add(c);
      this.cajas.push(c);
    }
    this.hitBox(this.scene, 'operaciones', 5.2, 2.6, 7.2, 4.6, 0, -1.3);
  }

  // ----- finanzas: caja fuerte con grieta -----
  construirFinanzas() {
    const cf = L.cajaFuerte;
    const g = new THREE.Group();
    g.position.set(cf.x, 0, cf.z);
    // tarima
    box(2.6, 0.12, 2.4, '#C9C2B4', 0, 0, 0.2, g);
    box(1.6, 1.8, 1.4, C.metalOsc, 0, 0.12, 0, g);
    box(1.68, 0.12, 1.48, '#3E4945', 0, 1.92, 0, g);
    const puerta = box(1.3, 1.45, 0.06, C.metal, 0, 0.3, 0.72, g);
    puerta.castShadow = false;
    // perilla
    const perilla = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 10), mat('#C9D1CD'));
    perilla.rotation.x = Math.PI / 2;
    perilla.position.set(-0.2, 1.05, 0.78);
    g.add(perilla);
    this.perilla = perilla;
    box(0.36, 0.06, 0.06, '#C9D1CD', 0.3, 0.95, 0.77, g);
    // ranura superior por donde entran las monedas
    box(0.6, 0.04, 0.12, '#1d1d1d', 0, 1.98, 0, g);
    // grieta (forma quebrada)
    const sh = new THREE.Shape();
    const pts = [[0, 0.62], [0.09, 0.4], [-0.04, 0.24], [0.1, 0.02], [-0.02, -0.2], [0.12, -0.42], [0.04, -0.6], [0.0, -0.6], [0.07, -0.42], [-0.07, -0.2], [0.05, 0.02], [-0.09, 0.24], [0.04, 0.4], [-0.04, 0.62]];
    sh.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts.slice(1)) sh.lineTo(p[0], p[1]);
    const grieta = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: '#111111' }));
    grieta.position.set(0.5, 1.0, 0.76);
    grieta.scale.set(1.3, 1, 1);
    g.add(grieta);
    this.grieta = grieta;
    // parche (aparece al sellar)
    const parche = new THREE.Group();
    const placa = box(0.42, 1.36, 0.05, '#B8C4BF', 0, -0.68, 0, parche);
    placa.castShadow = false;
    for (const y of [-0.55, -0.15, 0.25, 0.55]) for (const x of [-0.14, 0.14]) {
      const r = new THREE.Mesh(new THREE.SphereGeometry(0.03, 5, 4), mat('#6D7A75'));
      r.position.set(x, y, 0.04);
      parche.add(r);
    }
    parche.position.set(0.52, 1.0, 0.79);
    parche.scale.setScalar(0.001);
    g.add(parche);
    this.parche = parche;
    // luz de estado
    this.matEstadoCF = new THREE.MeshBasicMaterial({ color: '#E0533D' });
    const luz = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 6), this.matEstadoCF);
    luz.position.set(-0.55, 1.75, 0.76);
    g.add(luz);
    this.scene.add(g);
    this.hitBox(this.scene, 'finanzas', 3.0, 3.2, 3.2, cf.x + 0.3, 0, cf.z + 0.4);
  }

  // ----- cofre de ganancias -----
  construirCofre() {
    const c = L.cofre;
    const g = new THREE.Group();
    g.position.set(c.x, 0.05, c.z);
    g.rotation.y = -0.35;
    const W = 1.8, H = 0.9, D = 1.2, e = 0.12;
    box(W, e, D, C.maderaOsc, 0, 0, 0, g);
    box(W, H, e, C.madera, 0, 0, -D / 2 + e / 2, g);
    box(W, H, e, C.madera, 0, 0, D / 2 - e / 2, g);
    box(e, H, D, C.madera, -W / 2 + e / 2, 0, 0, g);
    box(e, H, D, C.madera, W / 2 - e / 2, 0, 0, g);
    for (const x of [-0.6, 0.6]) {
      box(0.12, H + 0.02, D + 0.04, '#C9A227', x, 0, 0, g, { emissive: '#000' });
    }
    // montón de oro (sube según el ritmo)
    this.pila = new THREE.Group();
    const pilaBase = new THREE.Mesh(new THREE.BoxGeometry(W - 2 * e - 0.02, 0.9, D - 2 * e - 0.02), new THREE.MeshStandardMaterial({ color: C.oro, metalness: 0.55, roughness: 0.35, emissive: '#7A5200', emissiveIntensity: 0.25, flatShading: true }));
    pilaBase.position.y = -0.45;
    this.pila.add(pilaBase);
    const monton = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 0), pilaBase.material);
    monton.scale.set(1.15, 0.45, 0.75);
    this.pila.add(monton);
    this.pila.position.y = 0.05;
    g.add(this.pila);
    // tapa abierta (bisagra atrás)
    const tapa = new THREE.Group();
    tapa.position.set(0, H, -D / 2);
    const t1 = box(W, 0.12, D, C.madera, 0, 0, D / 2, tapa);
    t1.position.y = 0.06;
    box(0.12, 0.13, D + 0.02, '#C9A227', -0.6, 0, D / 2, tapa).position.y = 0.065;
    box(0.12, 0.13, D + 0.02, '#C9A227', 0.6, 0, D / 2, tapa).position.y = 0.065;
    tapa.rotation.x = -1.35;
    g.add(tapa);
    this.tapa = tapa;
    this.luzCofre = new THREE.PointLight('#FFD36B', 0, 5, 1.5);
    this.luzCofre.position.set(0, 1.6, 0.4);
    g.add(this.luzCofre);
    this.cofre = g;
    this.scene.add(g);
    this.hitBox(this.scene, 'cofre', 2.6, 2.4, 2.2, c.x, 0, c.z);
  }

  // ----- monedas (InstancedMesh) -----
  construirMonedas() {
    const geo = new THREE.CylinderGeometry(0.13, 0.13, 0.045, 10).rotateX(Math.PI / 2);
    const m = new THREE.MeshStandardMaterial({ color: C.oro, metalness: 0.6, roughness: 0.3, emissive: '#6B4A00', emissiveIntensity: 0.35 });
    this.monedas = new THREE.InstancedMesh(geo, m, 140);
    this.monedas.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.monedas.count = 0;
    this.monedas.frustumCulled = false;
    this.scene.add(this.monedas);
    this.dummy = new THREE.Object3D();
    // chispas del cofre rebosando
    this.chispas = [];
    for (let i = 0; i < 18; i++) this.chispas.push({ x: 0, y: -10, z: 0, vx: 0, vy: 0, vz: 0, vida: 0 });
  }

  // ----- personal de la tienda -----
  construirStaff() {
    this.cajerosM = L.cajeros.map((c, i) => {
      const p = crearPersonita(0.13 + i * 0.41, true);
      p.position.set(c.x, 0.24, c.z);
      p.rotation.y = 0;
      if (i === 1) p.scale.setScalar(0.001);
      this.scene.add(p);
      return p;
    });
    this.encargadosM = L.encargados.map((c, i) => {
      const p = crearPersonita(0.71 + i * 0.29, true);
      p.position.set(c.x, 0.1, c.z);
      if (i === 1) p.scale.setScalar(0.001);
      const caja = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.28, 0.3), mat(C.caja));
      caja.position.set(0, 0.72, 0.3);
      caja.visible = false;
      p.add(caja);
      p.userData.caja = caja;
      this.scene.add(p);
      return p;
    });
  }

  // ----- decorado (árboles, bancas, arbustos) -----
  construirDecorado() {
    const arbol = (x, z, s = 1) => {
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      g.scale.setScalar(s);
      box(0.22, 0.9, 0.22, C.tronco, 0, 0, 0, g);
      const cols = [C.hoja, C.hoja2, C.hoja3];
      const a = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), mat(cols[Math.abs(Math.round(x * 3 + z)) % 3]));
      a.position.y = 1.35;
      a.castShadow = true;
      g.add(a);
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), mat(cols[(Math.abs(Math.round(x + z * 2)) + 1) % 3]));
      b.position.set(0.25, 1.85, 0.1);
      b.castShadow = true;
      g.add(b);
      this.scene.add(g);
    };
    const arbusto = (x, z, s = 1) => {
      const a = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4 * s, 0), mat(C.hoja2));
      a.position.set(x, 0.25 * s, z);
      a.scale.y = 0.75;
      a.castShadow = true;
      this.scene.add(a);
    };
    [[-15.2, -4.2, 1.1], [-13.9, -1.2, 0.9], [-10.2, -6.6, 1.2], [-9.4, -3.5, 0.85], [-15.3, 1.8, 0.9],
      [-3, -7.3, 1.1], [1.5, -7.6, 1.3], [6.5, -7.2, 1.0], [9.2, -6.8, 1.2], [13.8, -5.8, 1.1], [15.2, -2.2, 0.9],
      [14.9, 2.0, 0.8], [9.0, 2.4, 0.75]].forEach(([x, z, s]) => arbol(x, z, s));
    [[-11.5, -7.8], [-8.2, -6.6], [-5.5, -6.5], [4.2, -6.4], [11.8, -4.3], [15.3, -0.2], [8.3, -3.8], [-13.3, 2.4], [11.5, 2.6]].forEach(([x, z]) => arbusto(x, z, 1));
    // banca frente a la tienda
    const banca = new THREE.Group();
    banca.position.set(-0.8, 0.1, 3.35);
    box(1.6, 0.08, 0.4, C.madera, 0, 0.42, 0, banca);
    box(1.6, 0.35, 0.06, C.madera, 0, 0.55, -0.2, banca);
    for (const x of [-0.7, 0.7]) box(0.06, 0.42, 0.36, C.metalOsc, x, 0, 0, banca);
    this.scene.add(banca);
    // macetas en la puerta
    for (const x of [-5.75, -3.85]) {
      box(0.36, 0.38, 0.36, '#B5653D', x, 0.1, 3.05, this.scene);
      const pl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 0), mat(C.hoja));
      pl.position.set(x, 0.75, 3.05);
      this.scene.add(pl);
    }
    // senda hacia la caja fuerte y el cofre (baldosas)
    for (let i = 0; i < 6; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.05, 0.7), mat('#CFC6B4'));
      b.position.set(8.2 + i * 0.85, 0.01, 2.0 - i * 0.05);
      b.rotation.y = i * 0.3;
      b.receiveShadow = true;
      this.scene.add(b);
    }
  }

  hitBox(parent, id, w, h, d, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.set(x, y + h / 2, z);
    m.userData.area = id;
    parent.add(m);
    this.hits.push(m);
  }

  // =================================================================
  //  Cámara
  // =================================================================
  get angosta() {
    return this.aspecto < 0.85;
  }

  get azBase() {
    return this.angosta ? Math.PI / 2 : 0;
  }

  // distancia para que todo el diorama quepa en pantalla
  radioGeneral() {
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const tanH = Math.tan(vfov / 2) * this.aspecto;
    // alto útil: descuenta la franja que tapan cabecera y panel inferior
    const H = Math.max(1, window.innerHeight);
    const util = clamp((H - (this.reservaV || 0)) / H, 0.45, 1);
    const tanV = Math.tan(vfov / 2) * util;
    // en angosta el eje largo del diorama queda vertical
    const anchoMedio = this.angosta ? 9.6 : 16.6;
    const altoMedio = this.angosta ? 14.5 : 8.6;
    return clamp(Math.max(anchoMedio / tanH, altoMedio / tanV) * 1.07, 16, 80);
  }

  aplicarLimites() {
    // giro horizontal libre (360°); se mantienen ángulo vertical y distancia
    this.controls.minAzimuthAngle = -Infinity;
    this.controls.maxAzimuthAngle = Infinity;
    this.controls.maxDistance = this.radioGeneral() * 1.25;
  }

  limitarObjetivo() {
    const t = this.controls.target;
    t.x = clamp(t.x, -14, 14);
    t.z = clamp(t.z, -6.5, 6.5);
    t.y = clamp(t.y, 0, 2.5);
  }

  vistaDe(id) {
    const v = VISTAS[id] || VISTAS.general;
    const r = id === 'general' ? this.radioGeneral() : v.r * (this.angosta ? 1.35 : 1);
    const target = new THREE.Vector3(...v.target);
    return { target, r, polar: this.angosta ? Math.min(v.polar, 0.78) : v.polar, az: this.azBase + v.az };
  }

  volarA(id, instantaneo = false) {
    const dest = this.vistaDe(id);
    const off = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    const sph = new THREE.Spherical().setFromVector3(off);
    const desde = { target: this.controls.target.clone(), r: sph.radius, polar: sph.phi, az: sph.theta };
    if (instantaneo || this.reducido) {
      this.ponerCamara(dest);
      this.vuelo = null;
      return;
    }
    // ruta más corta en azimut
    let daz = dest.az - desde.az;
    while (daz > Math.PI) daz -= Math.PI * 2;
    while (daz < -Math.PI) daz += Math.PI * 2;
    dest.az = desde.az + daz;
    this.vuelo = { desde, dest, t: 0, dur: 1.15, azActual: desde.az };
    this.controls.enabled = false;
    this.inercia = 0;
  }

  // Estado actual de la cámara (durante un vuelo, en el mismo marco de azimut del vuelo)
  estadoCamara() {
    const sph = new THREE.Spherical().setFromVector3(new THREE.Vector3().subVectors(this.camera.position, this.controls.target));
    return { target: this.controls.target.clone(), r: sph.radius, polar: sph.phi, az: this.vuelo ? this.vuelo.azActual : sph.theta };
  }

  // Botones de girar: pasos de 45° con animación suave (salto directo con reduced-motion)
  girar(sentido) {
    const paso = sentido * (Math.PI / 4);
    this.inercia = 0;
    const actual = this.estadoCamara();
    const base = this.vuelo ? this.vuelo.dest : actual;
    const dest = { target: base.target.clone(), r: base.r, polar: base.polar, az: base.az + paso };
    if (this.reducido) {
      this.vuelo = null;
      this.ponerCamara(dest);
      this.controls.enabled = true;
      return;
    }
    this.vuelo = { desde: actual, dest, t: 0, dur: 0.55, azActual: actual.az };
    this.controls.enabled = false;
  }

  rotarCamara(dAz, dPol) {
    const t = this.controls.target;
    const sph = new THREE.Spherical().setFromVector3(new THREE.Vector3().subVectors(this.camera.position, t));
    sph.theta += dAz;
    sph.phi = clamp(sph.phi + dPol, this.controls.minPolarAngle, this.controls.maxPolarAngle);
    this.camera.position.copy(t).add(new THREE.Vector3().setFromSpherical(sph));
    this.camera.lookAt(t);
  }

  // Giro con un dedo: una vuelta completa = 85 % del ancho de pantalla, con inercia suave
  giroTactil(canvas) {
    const fin = (e) => {
      if (e.pointerType !== 'touch') return;
      this.toques.delete(e.pointerId);
      const a = this.arrastre;
      if (a && a.id === e.pointerId) {
        const reciente = performance.now() - a.t < 120;
        this.inercia = !this.reducido && reciente ? clamp(this.velGiro, -4, 4) : 0;
        this.arrastre = null;
      }
    };
    canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      this.toques.set(e.pointerId, true);
      this.inercia = 0;
      if (this.toques.size === 1) {
        this.arrastre = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now() };
        this.velGiro = 0;
        if (this.vuelo) { this.vuelo = null; this.controls.enabled = true; }
      } else {
        this.arrastre = null; // con dos dedos manda OrbitControls (acercar / desplazar)
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'touch' || !this.toques.has(e.pointerId) || this.toques.size !== 1) return;
      const ahora = performance.now();
      const a = this.arrastre;
      if (!a || a.id !== e.pointerId) {
        this.arrastre = { id: e.pointerId, x: e.clientX, y: e.clientY, t: ahora };
        return;
      }
      const dx = e.clientX - a.x, dy = e.clientY - a.y;
      const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
      const dAz = (-dx * Math.PI * 2) / (0.85 * w);
      const dPol = (-dy * 1.8) / h;
      this.rotarCamara(dAz, dPol);
      const dt = Math.max(0.008, (ahora - a.t) / 1000);
      this.velGiro = this.velGiro * 0.6 + (dAz / dt) * 0.4;
      a.x = e.clientX; a.y = e.clientY; a.t = ahora;
    });
    canvas.addEventListener('pointerup', fin);
    canvas.addEventListener('pointercancel', fin);
  }

  // Muros que se vuelven semitransparentes cuando quedan entre la cámara y el interior
  registrarMuro(meshes, nx, nz, doble = false) {
    const c = new THREE.Vector3();
    for (const m of meshes) {
      m.material = m.material.clone();
      c.add(m.position);
    }
    c.divideScalar(meshes.length);
    this.muros.push({ meshes, nx, nz, doble, c, op: 1 });
  }

  actualizarMuros(dt) {
    const cam = this.camera.position;
    for (const m of this.muros) {
      let dx = cam.x - m.c.x, dz = cam.z - m.c.z;
      const len = Math.hypot(dx, dz) || 1;
      dx /= len; dz /= len;
      let s = m.nx * dx + m.nz * dz;
      if (m.doble) s = Math.abs(s);
      const k = clamp((s - 0.12) / 0.33, 0, 1);
      const obj = 1 - 0.78 * k * k * (3 - 2 * k);
      m.op = this.reducido ? obj : damp(m.op, obj, 6, dt);
      if (Math.abs(m.op - obj) < 0.002) m.op = obj;
      const transp = m.op < 0.995;
      for (const mesh of m.meshes) {
        const mt = mesh.material;
        if (mt.transparent !== transp) {
          mt.transparent = transp;
          mt.depthWrite = !transp;
          mt.needsUpdate = true;
        }
        mt.opacity = m.op;
      }
    }
  }

  ponerCamara({ target, r, polar, az }) {
    this.controls.target.copy(target);
    const off = new THREE.Vector3().setFromSpherical(new THREE.Spherical(r, polar, az));
    this.camera.position.copy(target).add(off);
    this.camera.lookAt(target);
    this.controls.update();
  }

  // Corrimiento de la vista para que el área no quede tapada por la tarjeta
  setCorrimiento(px, py, instantaneo = false) {
    this.offset.tx = px;
    this.offset.ty = py;
    if (instantaneo) {
      this.offset.x = px;
      this.offset.y = py;
      this.aplicarOffset();
    }
  }

  resize() {
    const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
    const eraAngosta = this.aspecto !== undefined ? this.angosta : null;
    this.aspecto = window.innerWidth > 0 && window.innerHeight > 0 ? w / h : 16 / 9;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = this.aspecto;
    this.camera.fov = this.angosta ? 50 : this.aspecto < 1.3 ? 46 : 40;
    this.aplicarOffset();
    this.aplicarLimites();
    // la valla mira hacia donde está la cámara base
    if (this.valla) this.valla.rotation.y = this.angosta ? 1.15 : L.valla.rot;
    return eraAngosta !== null && eraAngosta !== this.angosta;
  }

  aplicarOffset() {
    const w = Math.max(1, window.innerWidth), h = Math.max(1, window.innerHeight);
    if (Math.abs(this.offset.x) < 0.5 && Math.abs(this.offset.y) < 0.5) this.camera.clearViewOffset();
    else this.camera.setViewOffset(w, h, this.offset.x, this.offset.y, w, h);
    this.camera.updateProjectionMatrix();
  }

  // =================================================================
  //  Áreas
  // =================================================================
  setFixed(area, v, instantaneo = false) {
    this.fObj[area] = v ? 1 : 0;
    if (instantaneo || this.reducido) this.f[area] = this.fObj[area];
  }

  setBrillo(fuente, on, nivel) {
    const val = on ? [0.35, 0.75, 1.25][nivel] : 0;
    if (fuente === 'ads') this.brilloAdsObj = val;
    else this.brilloOrgObj = val;
  }

  // =================================================================
  //  Actualización por cuadro
  // =================================================================
  update(dt, sim) {
    this.t += dt;
    const red = this.reducido;

    // vuelo de cámara
    if (this.vuelo) {
      const v = this.vuelo;
      v.t += dt;
      const k = ease(clamp(v.t / v.dur, 0, 1));
      this.ponerCamara({
        target: v.desde.target.clone().lerp(v.dest.target, k),
        r: lerp(v.desde.r, v.dest.r, k),
        polar: lerp(v.desde.polar, v.dest.polar, k),
        az: (v.azActual = lerp(v.desde.az, v.dest.az, k)),
      });
      if (v.t >= v.dur) { this.vuelo = null; this.controls.enabled = true; }
    } else {
      // inercia del giro con el dedo
      if (!this.arrastre && Math.abs(this.inercia) > 0.004) {
        this.rotarCamara(this.inercia * dt, 0);
        this.inercia *= Math.exp(-4.5 * dt);
      }
      this.controls.update();
    }
    this.actualizarMuros(dt);
    // corrimiento suave por la tarjeta
    const o = this.offset;
    if (o.x !== o.tx || o.y !== o.ty) {
      o.x = red || Math.abs(o.tx - o.x) < 0.5 ? o.tx : damp(o.x, o.tx, 6, dt);
      o.y = red || Math.abs(o.ty - o.y) < 0.5 ? o.ty : damp(o.y, o.ty, 6, dt);
      this.aplicarOffset();
    }

    // transiciones de áreas
    for (const a in this.f) this.f[a] = red ? this.fObj[a] : damp(this.f[a], this.fObj[a], 3.2, dt);
    const f = this.f;

    // --- entradas ---
    this.brilloAds = damp(this.brilloAds, this.brilloAdsObj ?? 0.75, 4, dt);
    this.brilloOrg = damp(this.brilloOrg, this.brilloOrgObj ?? 0.75, 4, dt);
    this.matValla.emissiveIntensity = 0.04 + this.brilloAds * 0.75;
    this.luzValla.intensity = this.brilloAds * 9;
    for (const fo of this.focosValla) fo.material.color.setScalar(0.35 + Math.min(1, this.brilloAds) * 0.65);
    for (const fa of this.faroles) fa.material.emissiveIntensity = 0.05 + this.brilloOrg * 1.1;

    // --- marketing: vitrina ---
    // letrero fundido: casi siempre apagado, con chispazos breves
    let chispazo = 0;
    if (f.marketing < 0.5 && !red) {
      const s = Math.sin(this.t * 13) + Math.sin(this.t * 7.3) + Math.sin(this.t * 2.1);
      chispazo = s > 2.1 ? 1 : 0;
    }
    const fm = f.marketing;
    this.matLetrero.color.setScalar(lerp(0.32 + chispazo * 0.3, 1, fm));
    this.matLetrero.emissiveIntensity = lerp(0.02 + chispazo * 0.35, 1.05, fm);
    this.matFondoVitrina.emissiveIntensity = lerp(0, 0.75, fm);
    this.matFondoVitrina.color.setRGB(lerp(0.3, 1, fm), lerp(0.3, 0.92, fm), lerp(0.29, 0.78, fm));
    this.matVidrio.emissiveIntensity = lerp(0, 0.3, fm);
    this.matVidrio.opacity = lerp(0.78, 0.22, fm);
    this.matVidrio.color.setRGB(lerp(0.22, 0.75, fm), lerp(0.26, 0.85, fm), lerp(0.27, 0.9, fm));
    this.matHalo.opacity = fm * 0.85;
    this.luzVitrina.intensity = fm * 10;
    for (const p of this.productos) p.material.emissiveIntensity = fm * 0.35;

    // --- ventas: segundo cajero ---
    const c2 = sim.cajeros[1];
    const presente2 = c2.activo || c2.cliente ? 1 : 0;
    this.c2 = red ? presente2 : damp(this.c2 ?? 0, presente2, 5, dt);
    const s2 = Math.max(0.001, this.c2);
    this.cajerosM[1].scale.setScalar(s2);
    this.cajasReg[1].scale.setScalar(s2);
    this.cajerosM.forEach((m, i) => {
      const atiende = sim.cajeros[i].cliente && sim.cajeros[i].cliente.estado === EST.ATENDIDO;
      animarPersonita(m, dt, false, 1, red, atiende);
    });

    // --- operaciones: cajas al estante + encargados ---
    const fo = ease(clamp(f.operaciones, 0, 1));
    this.cajas.forEach((c, i) => {
      const u = c.userData;
      const k = clamp(fo * 1.4 - (i / this.cajas.length) * 0.4, 0, 1);
      c.position.lerpVectors(u.piso, u.estante, k);
      c.position.y += Math.sin(k * Math.PI) * 0.8;
      c.rotation.set(u.rotPiso.x * (1 - k), u.rotPiso.y * (1 - k), u.rotPiso.z * (1 - k));
    });
    sim.encargados.forEach((e, i) => {
      const m = this.encargadosM[i];
      const presente = e.activo || e.pedido ? 1 : 0;
      m.userData.pres = red ? presente : damp(m.userData.pres ?? (i === 0 ? 1 : 0), presente, 5, dt);
      m.scale.setScalar(Math.max(0.001, m.userData.pres));
      const casa = new THREE.Vector3(e.casa.x, 0.1, e.casa.z);
      let pos = casa, mueve = false, carga = false, dir = Math.PI / 2;
      if (e.pedido) {
        const u = clamp(e.t / e.dur, 0, 1);
        const caja = this.cajas[e.objetivo % this.cajas.length];
        const obj = new THREE.Vector3(caja.position.x - 0.45, 0.1, caja.position.z + (caja.position.z < -4 ? 0.6 : 0));
        if (caja.position.x > 6.3) obj.x = 6.0;
        obj.x = clamp(obj.x, 4.0, 6.4); obj.z = clamp(obj.z, -4.0, 2.0);
        if (u < 0.4) { pos = casa.clone().lerp(obj, ease(u / 0.4)); mueve = true; dir = Math.atan2(obj.x - casa.x, obj.z - casa.z); }
        else if (u < 0.6) { pos = obj; dir = Math.atan2(caja.position.x - obj.x, caja.position.z - obj.z); }
        else { pos = obj.clone().lerp(casa, ease((u - 0.6) / 0.4)); mueve = true; carga = true; dir = Math.atan2(casa.x - obj.x, casa.z - obj.z); }
      }
      m.position.copy(pos);
      m.rotation.y = dir;
      m.userData.caja.visible = carga;
      animarPersonita(m, dt, mueve, 1.6, red, e.pedido && !mueve);
    });

    // --- finanzas: grieta / parche ---
    const ff = ease(clamp(f.finanzas, 0, 1));
    this.grieta.scale.set(1.3 * (1 - ff) + 0.001, 1 - ff + 0.001, 1);
    this.parche.scale.setScalar(Math.max(0.001, ff));
    this.matEstadoCF.color.set(ff > 0.5 ? '#3DBE6E' : '#E0533D');
    this.perilla.rotation.z = this.t * (0.2 + ff);

    // --- ganancias: nivel del cofre ---
    const nivel = sim.nivelCofre;
    this.nivelVisual = damp(this.nivelVisual, nivel, 1.5, dt);
    const nv = clamp(this.nivelVisual, 0, 1.25);
    this.pila.position.y = lerp(0.12, 1.02, Math.min(1, nv)) + Math.max(0, nv - 1) * 0.4;
    const todos = sim.areasArregladas === 4;
    const rebosa = todos && nv > 0.85;
    this.luzCofre.intensity = damp(this.luzCofre.intensity, rebosa ? 6 + Math.sin(this.t * 4) * 1.5 : nv * 2, 3, dt);
    this.rebosa = rebosa;

    // --- monedas ---
    this.dibujarMonedas(sim, dt, rebosa);

    // --- personas ---
    this.dibujarPersonas(sim, dt);
  }

  dibujarMonedas(sim, dt, rebosa) {
    const d = this.dummy;
    let n = 0;
    for (const m of sim.monedas) {
      if (m.fase === 'espera') continue;
      if (n >= this.monedas.instanceMatrix.count) break;
      d.position.set(m.x, m.y, m.z);
      if (m.fase === 'suelo') {
        d.rotation.set(Math.PI / 2, 0, m.giro * 0.1);
        d.scale.setScalar(Math.min(1, m.vida / 0.6));
      } else {
        d.rotation.set(0, m.giro, 0);
        d.scale.setScalar(1);
      }
      d.updateMatrix();
      this.monedas.setMatrixAt(n++, d.matrix);
    }
    // chispas: monedas que saltan del cofre cuando rebosa
    const c = L.cofre;
    for (const s of this.chispas) {
      if (s.vida <= 0) {
        if (rebosa && !this.reducido && Math.random() < dt * 3) {
          Object.assign(s, { x: c.x + (Math.random() - 0.5) * 1.0, y: 1.25, z: c.z + (Math.random() - 0.5) * 0.6, vx: (Math.random() - 0.5) * 2.2, vy: 2 + Math.random() * 1.6, vz: 0.4 + Math.random() * 1.4, vida: 1.6 });
        } else continue;
      }
      s.vida -= dt;
      s.vy -= 8 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
      if (s.y < 0.06) { s.y = 0.06; s.vx *= 0.5; s.vz *= 0.5; s.vy = 0; }
      if (n >= this.monedas.instanceMatrix.count) break;
      d.position.set(s.x, s.y, s.z);
      d.rotation.set(s.vida * 6, s.vida * 4, 0);
      d.scale.setScalar(Math.min(1, s.vida / 0.4));
      d.updateMatrix();
      this.monedas.setMatrixAt(n++, d.matrix);
    }
    this.monedas.count = n;
    this.monedas.instanceMatrix.needsUpdate = true;
  }

  dibujarPersonas(sim, dt) {
    const vistos = new Set();
    for (const p of sim.personas) {
      vistos.add(p.id);
      let g = this.personas.get(p.id);
      if (!g) {
        g = crearPersonita(p.seed);
        g.rotation.y = p.dir;
        this.scene.add(g);
        this.personas.set(p.id, g);
      }
      const u = g.userData;
      g.position.set(p.x, 0.1, p.z);
      // giro suave hacia la dirección
      let dr = p.dir - g.rotation.y;
      while (dr > Math.PI) dr -= Math.PI * 2;
      while (dr < -Math.PI) dr += Math.PI * 2;
      g.rotation.y += dr * Math.min(1, dt * 10);
      g.scale.setScalar(Math.max(0.001, p.escala));
      animarPersonita(g, dt, p.mueve, p.vel, this.reducido);

      // indicador de ánimo
      if (p.animo && !u.sprite) {
        const s = new THREE.Sprite(p.animo === 'feliz' ? this.matFeliz : this.matMolesto);
        s.scale.set(0.5, 0.5, 1);
        s.position.y = 1.55 * u.alto;
        s.renderOrder = 10;
        g.add(s);
        u.sprite = s;
        u.tSprite = 0;
      }
      if (u.sprite) {
        u.tSprite += dt;
        const pop = this.reducido ? 1 : Math.min(1, u.tSprite / 0.25) * (1 + Math.sin(Math.min(1, u.tSprite / 0.25) * Math.PI) * 0.25);
        u.sprite.scale.set(0.5 * pop, 0.5 * pop, 1);
        if (!this.reducido) u.sprite.position.y = 1.55 * u.alto + Math.sin(this.t * 4 + u.fase) * 0.04;
      }
      // burbuja de recomendación para quien llega por orgánico
      if (p.origen === 'org' && p.estado === 'llega' && !u.burbuja && !u.burbujaUsada) {
        const b = new THREE.Sprite(this.matBurbuja);
        b.scale.set(0.42, 0.42, 1);
        b.position.set(0.18, 1.5 * u.alto, 0);
        b.renderOrder = 10;
        g.add(b);
        u.burbuja = b;
        u.burbujaUsada = true;
      }
      if (u.burbuja && (p.estado !== 'llega' || p.edad > 3.5)) {
        g.remove(u.burbuja);
        u.burbuja = null;
      }
      // paquete en manos
      if (p.paquete && !u.paquete) {
        const pk = new THREE.Mesh(G_PAQUETE, mat(C.caja));
        pk.position.set(0, 0.7, 0.28);
        u.cuerpo.add(pk);
        u.paquete = pk;
        u.bi.rotation.x = -1.1;
      }
      if (u.paquete) { u.bi.rotation.x = -1.2; u.bd.rotation.x = -1.2; }
    }
    for (const [id, g] of this.personas) {
      if (!vistos.has(id)) {
        this.scene.remove(g);
        this.personas.delete(id);
      }
    }
  }

  limpiarPersonas() {
    for (const g of this.personas.values()) this.scene.remove(g);
    this.personas.clear();
    this.nivelVisual = 0;
    for (const s of this.chispas) s.vida = 0;
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  // proyecta un punto 3D a pantalla (px); null si queda detrás
  proyectar(v3, out) {
    out.copy(v3).project(this.camera);
    if (out.z > 1) return false;
    return true;
  }

  pick(clientX, clientY) {
    const r = this.renderer.domElement.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(ndc, this.camera);
    const hit = ray.intersectObjects(this.hits, false)[0];
    return hit ? hit.object.userData.area : null;
  }
}

export { ANCLAS };
