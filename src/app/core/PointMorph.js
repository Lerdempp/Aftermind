// ═══════════════════════════════════════════════════════════
//  PointMorph — Point-cloud morphing engine (ES Module)
//  Lightweight Three.js point-cloud morphing engine
//
//  Usage:
//    import { PointMorph } from '@core';
//    import * as THREE from 'three';
//    const pm = new PointMorph('#el', { ... });
// ═══════════════════════════════════════════════════════════

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

class PointMorph {
  #el; #canvas; #scene; #camera; #renderer; #clock;
  #geometry; #material; #points;
  #basePositions = []; #morphFrom = []; #morphTo = [];
  #morphProgress = 1; #isMorphing = false;
  #autoAngle = 0; #rotX = 0; #rotY = 0; #targetRotX = 0; #targetRotY = 0; #zoom = 10;
  #mouseDown = false; #mouseX = 0; #mouseY = 0;
  #config; #listeners = {}; #raf; #destroyed = false;
  #modelCache = {};          // id → { vertices: Float32Array, indices: Uint32Array|null }
  #gltfLoader = null;        // lazy GLTFLoader instance
  #morphCompleteCallback = null;

  /* ─── Transition Registry & Model Manifest ─── */
  static _transitions = {};
  static _animations = {};
  static _manifest = null;

  static registerTransition(name, fn) { PointMorph._transitions[name] = fn; }
  static getTransitions() { return Object.keys(PointMorph._transitions); }

  /**
   * Register an idle animation preset.
   * fn(basePos, index, count, time, speed, intensity, radius) → {x, y, z}
   * - basePos: {x,y,z} rest position of point
   * - index: point index
   * - count: total point count
   * - time: elapsed seconds
   * - speed: animation speed multiplier
   * - intensity: animation strength 0-1
   * - radius: sphere radius
   */
  static registerAnimation(name, fn) { PointMorph._animations[name] = fn; }
  static getAnimations() { return Object.keys(PointMorph._animations); }

  /* ─── Model Manifest ─── */
  static getManifest() { return PointMorph._manifest || []; }
  static getManifestEntry(id) { return (PointMorph._manifest || []).find(function(m) { return m.id === id; }) || null; }

  static async loadManifest(url) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      PointMorph._manifest = await resp.json();
    } catch (e) {
      console.warn('PointMorph: Failed to load manifest from', url, e.message);
      PointMorph._manifest = [];
    }
    return PointMorph._manifest;
  }

  static DEFAULTS = {
    pointCount: 12000, radius: 4, spread: 0.3, pointSize: 2.5,
    orbitSpeed: 0.3, animationPreset: 'pulse', animationIntensity: 0.15, animationSpeed: 1.5, autoRotate: true,
    shape: 'circle', form: 'default', morphSpeed: 2, morphEasing: 'smooth',
    morphTransition: 'direct', customBezier: [0.25, 0.1, 0.25, 1],
    colorMode: 'gradient', pointColor: '#a78bfa', gradientEnd: '#60a5fa',
    opacity: 0.85, bgColor: '#000000', blendMode: 'additive',
    sizeAttenuation: true, depthFade: true, sparkle: false,
    zoomEnabled: true,
    fillVertexGap: true,   // triangle surface sampling
    pointDensity: 1.0      // multiplier: targetCount = model vertexCount × pointDensity
  };

  constructor(selector, opts = {}) {
    this.#el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    this.#config = { ...PointMorph.DEFAULTS, ...opts };
    this.#init();
  }

  /* ─── Init ─── */
  #init() {
    this.#canvas = this.#el.querySelector('canvas') || (() => {
      const c = document.createElement('canvas');
      this.#el.appendChild(c);
      return c;
    })();

    const w = this.#el.clientWidth, h = this.#el.clientHeight;
    this.#scene = new THREE.Scene();
    this.#scene.background = this.#config.bgColor === 'transparent' ? null : new THREE.Color(this.#config.bgColor);
    this.#camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 100);
    this.#camera.position.z = this.#zoom;
    this.#renderer = new THREE.WebGLRenderer({ canvas: this.#canvas, antialias: true, alpha: true });
    this.#renderer.setSize(w, h);
    this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.#clock = new THREE.Clock();

    this.#buildPoints();
    this.#bindEvents();
    this.#animate();

    const ro = new ResizeObserver(() => this.#onResize());
    ro.observe(this.#el);
    this._ro = ro;
  }

  /* ─── Shape Texture ─── */
  #createShapeTexture(type) {
    const s = 64, c = document.createElement('canvas'); c.width = c.height = s;
    const ctx = c.getContext('2d'), h = s / 2;
    ctx.clearRect(0, 0, s, s);
    ctx.fillStyle = '#fff';
    switch (type) {
      case 'circle': default:
        ctx.beginPath(); ctx.arc(h, h, h - 2, 0, Math.PI * 2); ctx.fill(); break;
      case 'square':
        ctx.fillRect(4, 4, s - 8, s - 8); break;
      case 'diamond':
        ctx.beginPath(); ctx.moveTo(h, 2); ctx.lineTo(s - 2, h); ctx.lineTo(h, s - 2); ctx.lineTo(2, h); ctx.closePath(); ctx.fill(); break;
      case 'star': {
        ctx.beginPath();
        for (let i = 0; i < 10; i++) {
          const a = (i * Math.PI) / 5 - Math.PI / 2, r = i % 2 === 0 ? h - 2 : h * 0.4;
          ctx[i === 0 ? 'moveTo' : 'lineTo'](h + Math.cos(a) * r, h + Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill(); break;
      }
      case 'ring':
        ctx.beginPath(); ctx.arc(h, h, h - 2, 0, Math.PI * 2); ctx.arc(h, h, h * 0.5, 0, Math.PI * 2, true); ctx.fill(); break;
    }
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  /* ─── Color helpers ─── */
  #hexToRGB(h) { const c = parseInt(h.slice(1), 16); return { r: ((c >> 16) & 255) / 255, g: ((c >> 8) & 255) / 255, b: (c & 255) / 255 }; }
  #hslToRGB(h, s, l) {
    let r, g, b;
    if (s === 0) { r = g = b = l; } else {
      const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3);
    }
    return { r, g, b };
  }

  /* ─── Morph Target Generator (fibonacci sphere fallback) ─── */
  #genMorphTarget(type, idx, count, R) {
    const phi = Math.acos(1 - 2 * (idx + 0.5) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * idx;
    return { x: R * Math.sin(phi) * Math.cos(theta), y: R * Math.sin(phi) * Math.sin(theta), z: R * Math.cos(phi) };
  }

  /* ─── Easing ─── */
  #getEasing(n) {
    const cfg = this.#config;
    const fns = {
      smooth: t => t * t * (3 - 2 * t),
      elastic: t => (t === 0 || t === 1) ? t : Math.pow(2, -10 * t) * Math.sin((t - 0.075) * (2 * Math.PI) / 0.3) + 1,
      bounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
      linear: t => t,
      custom: t => {
        const [x1, y1, x2, y2] = cfg.customBezier || [0.25, 0.1, 0.25, 1];
        if (t <= 0) return 0; if (t >= 1) return 1;
        let lo = 0, hi = 1, mid;
        for (let i = 0; i < 20; i++) { mid = (lo + hi) / 2; const bx = 3 * (1 - mid) * (1 - mid) * mid * x1 + 3 * (1 - mid) * mid * mid * x2 + mid * mid * mid; if (bx < t) lo = mid; else hi = mid; }
        mid = (lo + hi) / 2;
        return 3 * (1 - mid) * (1 - mid) * mid * y1 + 3 * (1 - mid) * mid * mid * y2 + mid * mid * mid;
      }
    };
    return fns[n] || fns.smooth;
  }

  /* ─── Transitions (registry-based) ─── */
  #_transRand = null;
  #getTransRand(count) {
    if (this.#_transRand && this.#_transRand.length === count * 3) return this.#_transRand;
    this.#_transRand = new Float32Array(count * 3);
    let s = 12345;
    for (let i = 0; i < count * 3; i++) { s = (s * 16807 + 0) % 2147483647; this.#_transRand[i] = s / 2147483647; }
    return this.#_transRand;
  }

  static _getTransRand(instance, count) { return instance.#getTransRand(count); }

  #applyTransition(f, to, t, i, count, R) {
    const tr = this.#config.morphTransition;
    const regFn = PointMorph._transitions[tr];
    if (regFn) return regFn(f, to, t, i, count, R, this);
    return { x: f.x + (to.x - f.x) * t, y: f.y + (to.y - f.y) * t, z: f.z + (to.z - f.z) * t };
  }

  /* ─── Model Data Extraction ─── */
  #extractModelData(gltf) {
    const allVerts = [];
    const allIndices = [];
    let vertexOffset = 0;

    gltf.scene.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const geo = child.geometry;
      const posAttr = geo.getAttribute('position');
      if (!posAttr) return;

      child.updateWorldMatrix(true, false);
      const matrix = child.matrixWorld;
      const vec = new THREE.Vector3();

      // Extract vertices with world transform
      for (let i = 0; i < posAttr.count; i++) {
        vec.set(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        vec.applyMatrix4(matrix);
        allVerts.push(vec.x, vec.y, vec.z);
      }

      // Extract indices (offset by accumulated vertex count)
      if (geo.index) {
        const idx = geo.index;
        for (let i = 0; i < idx.count; i++) {
          allIndices.push(idx.getAt ? idx.getAt(i) + vertexOffset : idx.array[i] + vertexOffset);
        }
      } else {
        // Non-indexed: generate sequential indices
        for (let i = 0; i < posAttr.count; i++) {
          allIndices.push(vertexOffset + i);
        }
      }

      vertexOffset += posAttr.count;
    });

    return {
      vertices: new Float32Array(allVerts),
      indices: allIndices.length > 0 ? new Uint32Array(allIndices) : null
    };
  }

  #normalizeVertices(raw, targetRadius) {
    const count = raw.length / 3;
    if (count < 1) return raw;

    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < count; i++) {
      const x = raw[i * 3], y = raw[i * 3 + 1], z = raw[i * 3 + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < minZ) minZ = z; if (z > maxZ) maxZ = z;
    }

    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2, cz = (minZ + maxZ) / 2;
    const maxSpan = Math.max(maxX - minX, maxY - minY, maxZ - minZ) || 1;
    const scale = (targetRadius * 2) / maxSpan;

    const result = new Float32Array(raw.length);
    for (let i = 0; i < count; i++) {
      result[i * 3]     = (raw[i * 3]     - cx) * scale;
      result[i * 3 + 1] = (raw[i * 3 + 1] - cy) * scale;
      result[i * 3 + 2] = (raw[i * 3 + 2] - cz) * scale;
    }
    return result;
  }

  /* ─── Triangle Surface Sampling ─── */
  #sampleTriangleSurface(vertices, indices, targetCount) {
    const triCount = Math.floor(indices.length / 3);
    if (triCount === 0) return this.#sampleVertexPositions(vertices, targetCount);

    // Compute area of each triangle and build CDF
    const areas = new Float64Array(triCount);
    let totalArea = 0;
    for (let t = 0; t < triCount; t++) {
      const i0 = indices[t * 3], i1 = indices[t * 3 + 1], i2 = indices[t * 3 + 2];
      const ax = vertices[i0 * 3], ay = vertices[i0 * 3 + 1], az = vertices[i0 * 3 + 2];
      const bx = vertices[i1 * 3], by = vertices[i1 * 3 + 1], bz = vertices[i1 * 3 + 2];
      const cx = vertices[i2 * 3], cy = vertices[i2 * 3 + 1], cz = vertices[i2 * 3 + 2];
      // Cross product of (B-A) × (C-A)
      const abx = bx - ax, aby = by - ay, abz = bz - az;
      const acx = cx - ax, acy = cy - ay, acz = cz - az;
      const crossX = aby * acz - abz * acy;
      const crossY = abz * acx - abx * acz;
      const crossZ = abx * acy - aby * acx;
      const area = 0.5 * Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ);
      areas[t] = area;
      totalArea += area;
    }

    // Build cumulative distribution
    const cdf = new Float64Array(triCount);
    cdf[0] = areas[0] / totalArea;
    for (let t = 1; t < triCount; t++) {
      cdf[t] = cdf[t - 1] + areas[t] / totalArea;
    }
    cdf[triCount - 1] = 1.0; // ensure no floating-point drift

    // Sample points
    const positions = [];
    for (let p = 0; p < targetCount; p++) {
      // Pick triangle via binary search on CDF
      const r = Math.random();
      let lo = 0, hi = triCount - 1;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (cdf[mid] < r) lo = mid + 1; else hi = mid;
      }
      const ti = lo;
      const i0 = indices[ti * 3], i1 = indices[ti * 3 + 1], i2 = indices[ti * 3 + 2];

      // Random barycentric coordinates
      let u = Math.random(), v = Math.random();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const w = 1 - u - v;

      positions.push({
        x: vertices[i0 * 3] * w + vertices[i1 * 3] * u + vertices[i2 * 3] * v,
        y: vertices[i0 * 3 + 1] * w + vertices[i1 * 3 + 1] * u + vertices[i2 * 3 + 1] * v,
        z: vertices[i0 * 3 + 2] * w + vertices[i1 * 3 + 2] * u + vertices[i2 * 3 + 2] * v
      });
    }
    return positions;
  }

  #sampleVertexPositions(vertices, targetCount) {
    const srcCount = vertices.length / 3;
    if (srcCount === 0) return [];

    // Shuffled index array for better distribution
    const idxArr = Array.from({ length: srcCount }, (_, i) => i);
    for (let i = srcCount - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxArr[i], idxArr[j]] = [idxArr[j], idxArr[i]];
    }

    const positions = [];
    for (let i = 0; i < targetCount; i++) {
      const si = idxArr[i % srcCount];
      positions.push({
        x: vertices[si * 3],
        y: vertices[si * 3 + 1],
        z: vertices[si * 3 + 2]
      });
    }
    return positions;
  }

  /* ─── Shared Morph Starter ─── */
  #startMorph(toPositions, opts = {}) {
    if (opts.speed !== undefined) this.#config.morphSpeed = opts.speed;
    if (opts.easing) this.#config.morphEasing = opts.easing;
    if (opts.transition) this.#config.morphTransition = opts.transition;
    if (opts.onComplete) this.#morphCompleteCallback = opts.onComplete;

    this.#morphFrom = this.#basePositions.map(p => ({ ...p }));
    this.#morphTo = toPositions;
    this.#morphProgress = 0;
    this.#isMorphing = true;
  }

  /* ─── Build Points ─── */
  #getBlend() {
    return { additive: THREE.AdditiveBlending, normal: THREE.NormalBlending, multiply: THREE.MultiplyBlending, subtractive: THREE.SubtractiveBlending }[this.#config.blendMode] || THREE.AdditiveBlending;
  }

  #buildPoints() {
    if (this.#points) { this.#scene.remove(this.#points); this.#geometry.dispose(); this.#material.dispose(); }
    const cfg = this.#config, count = cfg.pointCount, R = cfg.radius;
    const pos = new Float32Array(count * 3), col = new Float32Array(count * 3), szs = new Float32Array(count);
    this.#basePositions = [];
    const c1 = this.#hexToRGB(cfg.pointColor), c2 = this.#hexToRGB(cfg.gradientEnd);

    for (let i = 0; i < count; i++) {
      const p = this.#genMorphTarget(cfg.form, i, count, R);
      const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) || 1;
      const so = (Math.random() - 0.5) * 2 * cfg.spread;
      p.x += (p.x / len) * so; p.y += (p.y / len) * so; p.z += (p.z / len) * so;
      pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z;
      this.#basePositions.push({ x: p.x, y: p.y, z: p.z });
      const t = i / count; let cr, cg, cb;
      switch (cfg.colorMode) {
        case 'solid': cr = c1.r; cg = c1.g; cb = c1.b; break;
        case 'gradient': cr = c1.r + (c2.r - c1.r) * t; cg = c1.g + (c2.g - c1.g) * t; cb = c1.b + (c2.b - c1.b) * t; break;
        case 'rainbow': { const rgb = this.#hslToRGB(t, 0.8, 0.6); cr = rgb.r; cg = rgb.g; cb = rgb.b; break; }
        case 'depth': { const ny = (p.y / R + 1) / 2; cr = c1.r + (c2.r - c1.r) * ny; cg = c1.g + (c2.g - c1.g) * ny; cb = c1.b + (c2.b - c1.b) * ny; break; }
      }
      col[i * 3] = cr; col[i * 3 + 1] = cg; col[i * 3 + 2] = cb;
      szs[i] = cfg.pointSize * (0.7 + Math.random() * 0.6);
    }

    this.#geometry = new THREE.BufferGeometry();
    this.#geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.#geometry.setAttribute('color', new THREE.BufferAttribute(col, 3));
    this.#geometry.setAttribute('size', new THREE.BufferAttribute(szs, 1));
    this.#material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }, uPointSize: { value: cfg.pointSize }, uOpacity: { value: cfg.opacity },
        uTexture: { value: this.#createShapeTexture(cfg.shape) },
        uDepthFade: { value: cfg.depthFade ? 1 : 0 }, uSparkle: { value: cfg.sparkle ? 1 : 0 },
        uSizeAttenuation: { value: cfg.sizeAttenuation ? 1 : 0 }
      },
      vertexShader: `attribute float size;varying vec3 vColor;varying float vDist;uniform float uPointSize;uniform float uSizeAttenuation;void main(){vColor=color;vec4 mv=modelViewMatrix*vec4(position,1.0);vDist=-mv.z;float fs=size*uPointSize;gl_PointSize=uSizeAttenuation>0.5?fs*(300.0/-mv.z):fs*5.0;gl_Position=projectionMatrix*mv;}`,
      fragmentShader: `uniform float uOpacity;uniform float uTime;uniform float uDepthFade;uniform float uSparkle;uniform sampler2D uTexture;varying vec3 vColor;varying float vDist;float rand(vec2 s){return fract(sin(dot(s,vec2(12.9898,78.233)))*43758.5453);}void main(){vec4 tx=texture2D(uTexture,gl_PointCoord);if(tx.a<0.1)discard;float a=uOpacity*tx.a;if(uDepthFade>0.5){a*=mix(0.3,1.0,smoothstep(15.0,4.0,vDist));}if(uSparkle>0.5){a*=mix(0.5,1.0,rand(gl_PointCoord+vec2(uTime*0.01)));}gl_FragColor=vec4(vColor,a);}`,
      transparent: true, vertexColors: true, depthWrite: cfg.blendMode === 'normal', blending: this.#getBlend()
    });
    this.#points = new THREE.Points(this.#geometry, this.#material);
    this.#scene.add(this.#points);
  }

  /* ─── Animation ─── */
  #lastTime = 0;
  #animate() {
    if (this.#destroyed) return;
    this.#raf = requestAnimationFrame(() => this.#animate());
    const elapsed = this.#clock.getElapsedTime(), delta = elapsed - this.#lastTime;
    this.#lastTime = elapsed;
    if (this.#material) this.#material.uniforms.uTime.value = elapsed;

    if (this.#isMorphing && this.#morphFrom.length > 0) {
      this.#morphProgress += delta * this.#config.morphSpeed;
      if (this.#morphProgress >= 1) {
        this.#morphProgress = 1; this.#isMorphing = false;
        // Clear CSS blur when morph ends
        if (this.#canvas) this.#canvas.style.filter = '';
        if (this.#morphCompleteCallback) {
          const cb = this.#morphCompleteCallback;
          this.#morphCompleteCallback = null;
          cb();
        }
      }
      // Apply CSS blur filter for 'blur' transition — bell curve: max at 0.5, zero at 0 and 1
      if (this.#config.morphTransition === 'blur' && this.#canvas) {
        const blurAmount = Math.sin(this.#morphProgress * Math.PI) * 4; // max 4px at midpoint
        this.#canvas.style.filter = blurAmount > 0.1 ? `blur(${blurAmount.toFixed(1)}px)` : '';
      }
      const ef = this.#getEasing(this.#config.morphEasing);
      const t = ef(Math.min(this.#morphProgress, 1));
      const pa = this.#geometry.getAttribute('position');
      const cnt = this.#basePositions.length, R = this.#config.radius;
      const animFn = this.#config.animationIntensity > 0 ? PointMorph._animations[this.#config.animationPreset] : null;
      const spd = this.#config.animationSpeed, inten = this.#config.animationIntensity;
      for (let i = 0; i < cnt; i++) {
        const f = this.#morphFrom[i], to = this.#morphTo[i]; if (!f || !to) continue;
        const p = this.#applyTransition(f, to, t, i, cnt, R);
        this.#basePositions[i] = { x: p.x, y: p.y, z: p.z };
        if (animFn) { const ap = animFn(p, i, cnt, elapsed, spd, inten, R); pa.setXYZ(i, ap.x, ap.y, ap.z); }
        else { pa.setXYZ(i, p.x, p.y, p.z); }
      }
      pa.needsUpdate = true;
    } else if (this.#config.animationIntensity > 0 && this.#points) {
      const animFn = PointMorph._animations[this.#config.animationPreset];
      if (animFn) {
        const pa = this.#geometry.getAttribute('position');
        const cnt = this.#basePositions.length, R = this.#config.radius;
        const spd = this.#config.animationSpeed, inten = this.#config.animationIntensity;
        for (let i = 0; i < cnt; i++) {
          const b = this.#basePositions[i]; if (!b) continue;
          const p = animFn(b, i, cnt, elapsed, spd, inten, R);
          pa.setXYZ(i, p.x, p.y, p.z);
        }
        pa.needsUpdate = true;
      }
    }

    if (this.#config.autoRotate) this.#autoAngle += this.#config.orbitSpeed * 0.01;
    this.#rotX += (this.#targetRotX - this.#rotX) * 0.08;
    this.#rotY += (this.#targetRotY - this.#rotY) * 0.08;
    if (this.#points) { this.#points.rotation.x = this.#rotX; this.#points.rotation.y = this.#rotY + this.#autoAngle; }
    this.#camera.position.z += (this.#zoom - this.#camera.position.z) * 0.08;
    this.#renderer.render(this.#scene, this.#camera);
  }

  /* ─── Events ─── */
  #bindEvents() {
    const cvs = this.#renderer.domElement;
    cvs.addEventListener('mousedown', e => { this.#mouseDown = true; this.#mouseX = e.clientX; this.#mouseY = e.clientY; });
    window.addEventListener('mouseup', () => this.#mouseDown = false);
    window.addEventListener('mousemove', e => {
      if (!this.#mouseDown) return;
      this.#targetRotY += (e.clientX - this.#mouseX) * 0.005;
      this.#targetRotX += (e.clientY - this.#mouseY) * 0.005;
      this.#mouseX = e.clientX; this.#mouseY = e.clientY;
    });
    cvs.addEventListener('wheel', e => {
      if (!this.#config.zoomEnabled) return;
      this.#zoom += e.deltaY * 0.01;
      this.#zoom = Math.max(3, Math.min(25, this.#zoom));
      e.preventDefault();
    }, { passive: false });
  }

  #onResize() {
    const w = this.#el.clientWidth, h = this.#el.clientHeight;
    this.#camera.aspect = w / h;
    this.#camera.updateProjectionMatrix();
    this.#renderer.setSize(w, h);
  }

  /* ─── Public API ─── */

  /**
   * Morph to a mathematical form (fibonacci sphere variants).
   * @param {string} form - 'default', 'cone', etc.
   * @param {object} opts - { speed, easing, transition, onComplete }
   */
  morphTo(form, opts = {}) {
    const count = this.#config.pointCount, R = this.#config.radius, sp = this.#config.spread;
    this.#config.form = form;
    const toPositions = [];
    for (let i = 0; i < count; i++) {
      const p = this.#genMorphTarget(form, i, count, R);
      const len = Math.sqrt(p.x * p.x + p.y * p.y + p.z * p.z) || 1;
      const so = (Math.random() - 0.5) * 2 * sp;
      p.x += (p.x / len) * so; p.y += (p.y / len) * so; p.z += (p.z / len) * so;
      toPositions.push(p);
    }
    this.#startMorph(toPositions, opts);
  }

  /**
   * Load a GLTF/GLB model and cache it.
   * @param {string} url - path to .glb/.gltf file
   * @param {string} id - unique identifier for this model
   * @returns {Promise<{vertexCount: number, triangleCount: number}>}
   */
  async loadModel(url, id) {
    if (this.#modelCache[id]) {
      const cached = this.#modelCache[id];
      return {
        vertexCount: cached.vertices.length / 3,
        triangleCount: cached.indices ? cached.indices.length / 3 : 0
      };
    }

    if (!this.#gltfLoader) this.#gltfLoader = new GLTFLoader();

    return new Promise((resolve, reject) => {
      this.#gltfLoader.load(
        url,
        (gltf) => {
          const data = this.#extractModelData(gltf);
          const normalized = this.#normalizeVertices(data.vertices, this.#config.radius);
          this.#modelCache[id] = { vertices: normalized, indices: data.indices };
          resolve({
            vertexCount: normalized.length / 3,
            triangleCount: data.indices ? data.indices.length / 3 : 0
          });
        },
        undefined,
        (err) => {
          console.warn('PointMorph: Failed to load model:', id, err);
          reject(err);
        }
      );
    });
  }

  /**
   * Morph to a loaded model by id.
   * @param {string} id - model id (previously loaded via loadModel)
   * @param {object} opts - { speed, easing, transition, onComplete }
   */
  morphToModel(id, opts = {}) {
    const cached = this.#modelCache[id];
    if (!cached) {
      console.warn('PointMorph: Model not loaded:', id);
      return;
    }

    const cfg = this.#config;
    const pointCount = cfg.pointCount;

    // pointDensity controls how many unique sample positions we generate
    // from the model surface, then we map those to our fixed pointCount
    const modelVertexCount = cached.vertices.length / 3;
    const sampleCount = Math.max(1, Math.round(modelVertexCount * cfg.pointDensity));
    // Use the larger of sampleCount and pointCount for sampling,
    // so we have enough unique positions to fill all points
    const samplingTarget = Math.max(sampleCount, pointCount);

    let sampled;
    if (cfg.fillVertexGap && cached.indices && cached.indices.length >= 3) {
      sampled = this.#sampleTriangleSurface(cached.vertices, cached.indices, samplingTarget);
    } else {
      sampled = this.#sampleVertexPositions(cached.vertices, samplingTarget);
    }

    // Map sampled positions to our fixed pointCount
    const positions = [];
    for (let i = 0; i < pointCount; i++) {
      positions.push(sampled[i % sampled.length]);
    }

    this.#startMorph(positions, opts);
  }

  /**
   * Morph back to the default fibonacci sphere.
   * @param {object} opts - { speed, easing, transition, onComplete }
   */
  morphToDefault(opts = {}) {
    const count = this.#config.pointCount, R = this.#config.radius;
    const positions = [];
    for (let i = 0; i < count; i++) {
      positions.push(this.#genMorphTarget('default', i, count, R));
    }
    this.#startMorph(positions, opts);
  }

  /**
   * Get list of loaded model IDs.
   * @returns {string[]}
   */
  getLoadedModels() {
    return Object.keys(this.#modelCache);
  }

  setForm(form) { this.#config.form = form; this.#buildPoints(); }

  updateConfig(opts) {
    Object.assign(this.#config, opts);
    this.#buildPoints();
  }

  getConfig() { return { ...this.#config }; }
  getBasePositions() { return this.#basePositions; }
  getGeometry() { return this.#geometry; }

  rebuild() { this.#buildPoints(); }

  setBasePositions(arr) {
    this.#basePositions = arr;
    const pa = this.#geometry.getAttribute('position');
    for (let i = 0; i < arr.length; i++) pa.setXYZ(i, arr[i].x, arr[i].y, arr[i].z);
    pa.needsUpdate = true;
  }

  on(event, cb) {
    const cvs = this.#renderer.domElement;
    if (event === 'click') cvs.addEventListener('click', cb);
    else if (event === 'hover') cvs.addEventListener('mouseenter', cb);
    else if (event === 'hoverEnd') cvs.addEventListener('mouseleave', cb);
    if (!this.#listeners[event]) this.#listeners[event] = [];
    this.#listeners[event].push(cb);
  }

  destroy() {
    this.#destroyed = true;
    cancelAnimationFrame(this.#raf);
    if (this.#points) { this.#scene.remove(this.#points); this.#geometry.dispose(); this.#material.dispose(); }
    this.#renderer.dispose();
    if (this._ro) this._ro.disconnect();
  }
}

export { PointMorph };
export default PointMorph;
