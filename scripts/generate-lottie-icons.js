// Authors small, original Lottie animations from scratch (plain JSON, no
// third-party assets) — a ring that draws itself on and pops in behind each
// icon glyph. Zero licensing risk since every keyframe here is hand-written.
const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "src", "images", "lottie");
fs.mkdirSync(outDir, { recursive: true });

// [r,g,b,a] in 0-1 floats, Lottie's native color format
const variants = {
  forest: [0.2118, 0.3725, 0.1176, 1],
  sunset: [0.7725, 0.2275, 0.0314, 1],
  gold: [0.8784, 0.6431, 0, 1],
  sky: [0.2235, 0.7137, 0.8745, 1],
};

function buildRingPulse(color) {
  return {
    v: "5.7.4",
    fr: 30,
    ip: 0,
    op: 42,
    w: 100,
    h: 100,
    nm: "ring-pulse",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "ring",
        sr: 1,
        ks: {
          o: {
            a: 1,
            k: [
              { t: 0, s: [0] },
              { t: 8, s: [100] },
              { t: 32, s: [100] },
              { t: 42, s: [0] },
            ],
          },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [50, 50, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { t: 0, s: [55, 55, 100] },
              { t: 16, s: [112, 112, 100] },
              { t: 26, s: [100, 100, 100] },
            ],
          },
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            nm: "ring-group",
            it: [
              {
                ty: "el",
                nm: "circle",
                p: { a: 0, k: [0, 0] },
                s: { a: 0, k: [78, 78] },
              },
              {
                ty: "st",
                nm: "stroke",
                c: { a: 0, k: color },
                o: { a: 0, k: 100 },
                w: { a: 0, k: 5 },
                lc: 2,
                lj: 2,
              },
              {
                ty: "tm",
                nm: "trim",
                s: { a: 0, k: 0 },
                e: {
                  a: 1,
                  k: [
                    { t: 0, s: [0] },
                    { t: 26, s: [100] },
                  ],
                },
                o: { a: 0, k: 0 },
                m: 1,
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 },
              },
            ],
          },
        ],
        ip: 0,
        op: 42,
        st: 0,
      },
    ],
  };
}

for (const [name, color] of Object.entries(variants)) {
  const json = buildRingPulse(color);
  fs.writeFileSync(path.join(outDir, `ring-pulse-${name}.json`), JSON.stringify(json));
  console.log("wrote", `ring-pulse-${name}.json`);
}
