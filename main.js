// p5.js (800x800): 3 righe, 5 forme in fila che scorrono.
// Alcune forme sono “vuote” (solo contorno) e, dentro, generano frattali random.
// Usiamo clip/beginClip/endClip per confinare il frattale dentro la forma. :contentReference[oaicite:0]{index=0}
// Usiamo randomSeed per rendere il frattale stabile finché non cambia seed. :contentReference[oaicite:1]{index=1}
const EMBEDDED_PNG = 'data/provafinale.png'

let embeddedImg;

function preload() {
  embeddedImg = loadImage(EMBEDDED_PNG, 
    () => console.log("PNG caricato:", embeddedImg.width, embeddedImg.height),
    (e) => console.error("ERRORE loadImage:", e)
  );
}


const W = 800, H = 800;
const ROWS = 3, PER_ROW = 11;

let shapes = [];

function setup() {

  createCanvas(W, H);
  angleMode(RADIANS);

  const rowYs = [H * 0.25, H * 0.50, H * 0.75];
  const types = ["square", "triangle", "circle"];

  for (let r = 0; r < ROWS; r++) {
    for (let i = 0; i < PER_ROW; i++) {
      const type = types[(i + r) % types.length];
      shapes.push(new MovingShape({
        type,
        y: rowYs[r],
        x: i * (W / PER_ROW),
        speed: random(1.2, 2.8),
        size: random(50, 120),
        hollow: random() < 0.55,          // quante forme “vuote”
        fractal: random() < 0.70          // quante forme con frattale dentro
      }));
    }
  }
}

function draw() {
  background(245);

  // linee guida leggere
  stroke(220);
//   strokeWeight(1);
//   line(0, H * 0.25, W, H * 0.25);
//   line(0, H * 0.50, W, H * 0.50);
//   line(0, H * 0.75, W, H * 0.75);

  for (const s of shapes) {
    s.update();
    s.render();
  }
}
function drawImageInSquare(img, size) {
  if (!img) return;

  const pad = size * 0.18;      // margine interno
  const dst = size - pad * 2;   // lato utile

  imageMode(CENTER);
  // Se vuoi preservare trasparenza/colore, non usare tint().
  image(img, 0, 0, dst, dst);
}


class MovingShape {
  constructor({ type, x, y, speed, size, hollow, fractal }) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.speed = speed;

    this.size = size;
    this.targetSize = size;
    this.nextSizeChange = frameCount + floor(random(15, 45));

    this.hollow = hollow;
    this.fractalEnabled = fractal;

    // seed e refresh per frattale
    this.seed = floor(random(1e9));
    this.nextSeedChange = frameCount + floor(random(20, 90));
  }

  update() {
    this.x += this.speed;
    if (this.x > width + 90) this.x = -90;

    if (frameCount >= this.nextSizeChange) {
      this.targetSize = random(30, 160);
      this.nextSizeChange = frameCount + floor(random(12, 55));
    }
    this.size = lerp(this.size, this.targetSize, 0.08);

    if (this.fractalEnabled && frameCount >= this.nextSeedChange) {
      this.seed = floor(random(1e9));
      this.nextSeedChange = frameCount + floor(random(25, 110));
    }
  }

render() {
  push();
  translate(this.x, this.y);

  // forma piena
  if (!this.hollow) {
    noStroke();
    fill(30);
    this.drawShapePath(this.size);
    pop();
    return;
  }

  // forma vuota + contenuto interno
  push();
  beginClip();
  noStroke();
  this.drawShapePath(this.size * 0.98);
  endClip();

  if (this.type === "square" && embeddedImg) {
    drawImageInSquare(embeddedImg, this.size);
  } else if (this.fractalEnabled) {
    randomSeed(this.seed);
    this.drawTinyFractal(this.size);
  }

  pop();

  // contorno sopra
  noFill();
  stroke(30);
  strokeWeight(3);
  this.drawShapePath(this.size);

  pop();
}


  drawShapePath(s) {
    if (this.type === "square") {
      rectMode(CENTER);
      rect(0, 0, s, s, 10);
    } else if (this.type === "circle") {
      circle(0, 0, s);
    } else if (this.type === "triangle") {
      const h = s * 0.95;
      triangle(
        0, -h * 0.62,
        -s * 0.62, h * 0.42,
        s * 0.62, h * 0.42
      );
    }
  }

  // frattale “randomino”: ricorsione di celle che si suddividono e disegnano micro-forme
  drawTinyFractal(s) {
    // sfondo leggero dentro la clip
    noStroke();
    fill(0, 0, 0, 10);
    rectMode(CENTER);
    rect(0, 0, s * 0.98, s * 0.98);

    const maxDepth = 4;
    const base = s * 0.80;
    this.fractalCell(-base / 2, -base / 2, base, 0, maxDepth);
  }

  fractalCell(x, y, w, depth, maxDepth) {
    const p = 0.55 - depth * 0.08; // meno suddivisione man mano che scendi
    const drawSomething = random() < 0.9;

    if (drawSomething) {
      const cx = x + w / 2;
      const cy = y + w / 2;

      // alterna micro-elementi
      const kind = floor(random(3));
      const a = 50 + depth * 20; // alpha
      noStroke();
      fill(0, 0, 0, a);

      if (kind === 0) {
        rectMode(CENTER);
        rect(cx, cy, w * random(0.25, 0.85), w * random(0.25, 0.85), 6);
      } else if (kind === 1) {
        circle(cx, cy, w * random(0.25, 0.95));
      } else {
        const s = w * random(0.35, 0.95);
        triangle(
          cx, cy - s * 0.55,
          cx - s * 0.55, cy + s * 0.45,
          cx + s * 0.55, cy + s * 0.45
        );
      }
    }

    if (depth >= maxDepth) return;

    if (random() < p) {
      // subdividi in 4
      const w2 = w / 2;
      this.fractalCell(x, y, w2, depth + 1, maxDepth);
      this.fractalCell(x + w2, y, w2, depth + 1, maxDepth);
      this.fractalCell(x, y + w2, w2, depth + 1, maxDepth);
      this.fractalCell(x + w2, y + w2, w2, depth + 1, maxDepth);
    }
  }
}
