import { PointMorph, registerAllTransitions, registerAllAnimations } from '@core';

// ─── Register presets ────────────────────────────────────
registerAllTransitions();
registerAllAnimations();

// ─── PointMorph instance ─────────────────────────────────
const pm = new PointMorph('#point-morph', {
  "pointCount": 2000,
  "radius": 4.1,
  "spread": 0,
  "pointSize": 0.75,
  "form": "pumping_heart",
  "shape": "circle",
  "colorMode": "depth",
  "pointColor": "#0000",
  "gradientEnd": "#3b82f6",
  "opacity": 1,
  "bgColor": "#0a0a0f",
  "blendMode": "normal",
  "orbitSpeed": 0.52,
  "animationPreset": "diagonalWave",
  "animationIntensity": 0.21,
  "animationSpeed": 1.2,
  "autoRotate": true,
  "morphSpeed": 1.3,
  "morphEasing": "custom",
  "morphTransition": "blur",
  "sizeAttenuation": false,
  "depthFade": true,
  "sparkle": false,
  "fillVertexGap": true,
  "pointDensity": 1.5,
  "customBezier": [
    0,
    0.12837837837837843,
    0,
    0.9954954954954955
  ]
});

// ─── Init ────────────────────────────────────────────────
let manifest = [];

async function init() {
  // Load manifest
  try {
    const resp = await fetch('/models/manifest.json');
    manifest = resp.ok ? await resp.json() : [];
  } catch (e) {
    console.warn('Manifest load failed:', e.message);
  }

  // Preload all models into core
  for (const entry of manifest) {
    try {
      const info = await pm.loadModel(`/models/${entry.file}`, entry.id);
      console.log(`Model loaded: ${entry.id} (${info.vertexCount} verts, ${info.triangleCount} tris)`);
    } catch (e) {
      console.warn(`Failed to load model ${entry.id}:`, e);
    }
  }

  // Card hover interactions
  document.querySelectorAll('.card[data-morph]').forEach(card => {
    card.addEventListener('mouseenter', () => {
      const entry = manifest.find(m => m.id === card.dataset.morph);
      if (entry) pm.morphToModel(entry.id);
    });

    card.addEventListener('mouseleave', () => {
      pm.morphToDefault();
    });
  });
}

init();
