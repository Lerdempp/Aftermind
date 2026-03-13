"use client";

import { useEffect, useRef } from "react";

export default function PointMorph() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pmRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let manifest: any[] = [];

    async function init() {
      // Dinamik import ile PointMorph'u yükle
      const { PointMorph, registerAllTransitions, registerAllAnimations } = await import('./core/index.js');

      // Register presets
      registerAllTransitions();
      registerAllAnimations();

      // PointMorph instance
      const pm = new PointMorph('#point-morph', {
        "pointCount": 12000,
        "radius": 4.1,
        "spread": 0,
        "pointSize": 0.75,
        "form": "pumping_heart",
        "shape": "circle",
        "colorMode": "depth",
        "pointColor": "#34d399",
        "gradientEnd": "#3b82f6",
        "opacity": 1,
        "bgColor": "#0a0a0f",
        "blendMode": "additive",
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

      pmRef.current = pm;

      // Load manifest
      try {
        const resp = await fetch('/models/manifest.json');
        manifest = resp.ok ? await resp.json() : [];
      } catch (e) {
        console.warn('Manifest load failed:', e);
      }

      // Preload all models
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
          const entry = manifest.find(m => m.id === (card as HTMLElement).dataset.morph);
          if (entry) pm.morphToModel(entry.id);
        });

        card.addEventListener('mouseleave', () => {
          pm.morphToDefault();
        });
      });
    }

    init();

    return () => {
      // Cleanup
      if (pmRef.current && pmRef.current.dispose) {
        pmRef.current.dispose();
      }
    };
  }, []);

  return <div id="point-morph" ref={containerRef} style={{ width: '100%', height: '100vh' }} />;
}
