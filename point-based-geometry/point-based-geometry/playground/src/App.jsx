import { useEffect, useRef } from 'react';
import { initPlayground } from './playgroundInit';
import './playground.css';

export default function App() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const cleanup = initPlayground();

    return cleanup;
  }, []);

  return (
    <>
      <div className="top-toggle" id="topToggle">
        <button id="toggleLeft" className="active" onClick={() => window.toggleLeftPanel?.()}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M2 4h5M2 8h5M2 12h5" />
            <rect x="9" y="2" width="5" height="12" rx="1" />
          </svg>
          Morph
        </button>
        <div className="divider"></div>
        <div className="zoom-indicator" id="zoomIndicator">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="7" cy="7" r="5" />
            <path d="M11 11l3.5 3.5" />
          </svg>
          <span id="zoomValue">10.0</span>
          <button className="zoom-reset-btn" id="zoomResetBtn" title="Reset zoom" onClick={() => window.resetZoom?.()}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2v5h5" />
              <path d="M3 8.5A6 6 0 1 1 3.5 12" />
            </svg>
          </button>
        </div>
        <div className="divider"></div>
        <button id="toggleRight" className="active" onClick={() => window.toggleRightPanel?.()}>
          Settings
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M9 4h5M9 8h5M9 12h5" />
            <rect x="2" y="2" width="5" height="12" rx="1" />
          </svg>
        </button>
      </div>
      <div className="panel" id="leftPanel">
        <h2>Morph</h2>
        <div className="subtitle">3D Models</div>
        <div className="section">
          <div className="model-upload-zone" id="modelUploadZone">
            <div className="mu-icon">△</div>
            <div className="mu-text">
              Drop <span>3D model</span> or click to upload
            </div>
            <div className="mu-formats">.glb · .gltf (+.bin) · .obj</div>
            <input type="file" id="modelInput" accept=".glb,.gltf,.obj,.bin" multiple />
          </div>
        </div>
        <div className="section">
          <div className="section-title">Morph Target</div>
          <div className="morph-grid" id="morphGrid"></div>
          <div className="control-row">
            <div className="control-header">
              <label>Morph Speed</label>
              <span className="value-display" id="morphSpeedVal">2.0</span>
            </div>
            <input type="range" id="morphSpeed" min="0.5" max="5" defaultValue="2" step="0.1" />
          </div>
          <div className="control-row">
            <label>Morph Easing</label>
            <div className="right-side">
              <select id="morphEasing" defaultValue="smooth">
                <option value="smooth">Smooth</option>
                <option value="elastic">Elastic</option>
                <option value="bounce">Bounce</option>
                <option value="linear">Linear</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>
          <div className="bezier-editor" id="bezierEditor">
            <div className="be-header">
              <span>Curve Editor</span>
              <span className="be-values" id="bezierValues">cubic-bezier(0.25, 0.10, 0.25, 1.00)</span>
            </div>
            <div className="bezier-canvas-wrap">
              <canvas id="bezierCanvas" width="400" height="400"></canvas>
            </div>
            <div className="bezier-presets" id="bezierPresets">
              <button data-bez="0.25,0.1,0.25,1" className="active">ease</button>
              <button data-bez="0.42,0,1,1">ease-in</button>
              <button data-bez="0,0,0.58,1">ease-out</button>
              <button data-bez="0.42,0,0.58,1">ease-in-out</button>
              <button data-bez="0.68,-0.55,0.27,1.55">back</button>
              <button data-bez="0.5,0,0.5,1">gentle</button>
              <button data-bez="0.7,0,0.3,1">snappy</button>
              <button data-bez="1,0,0,1">sharp</button>
            </div>
          </div>
          <div className="section-title" style={{ marginTop: '14px' }}>
            Transition
          </div>
          <div className="trans-strip-wrap">
            <div className="trans-strip" id="transStrip">
              <button className="trans-btn active" data-trans="direct">
                <div className="t-icon">➔</div>Direct
              </button>
              <button className="trans-btn" data-trans="explode">
                <div className="t-icon">✹</div>Explode
              </button>
              <button className="trans-btn" data-trans="implode">
                <div className="t-icon">◉</div>Implode
              </button>
              <button className="trans-btn" data-trans="wave">
                <div className="t-icon">≏</div>Wave
              </button>
              <button className="trans-btn" data-trans="spiral">
                <div className="t-icon">✬</div>Spiral
              </button>
              <button className="trans-btn" data-trans="scatter">
                <div className="t-icon">✦</div>Scatter
              </button>
              <button className="trans-btn" data-trans="cascade">
                <div className="t-icon">✎</div>Cascade
              </button>
              <button className="trans-btn" data-trans="flip">
                <div className="t-icon">↻</div>Flip
              </button>
              <button className="trans-btn" data-trans="blur">
                <div className="t-icon">○</div>Blur
              </button>
            </div>
          </div>
        </div>
        {/* Model library list hidden — models appear in morph grid above */}
        <div className="model-library" id="modelLibrary" style={{ display: 'none' }}>
          <div className="model-library-empty" id="modelEmptyMsg">No models loaded</div>
        </div>
      </div>
      <div className="panel" id="rightPanel">
        <h2>Settings</h2>
        <div className="subtitle">Geometry, colors &amp; effects</div>
        <div className="section">
          <div className="section-title">Geometry</div>
          <div className="control-row">
            <div className="control-header">
              <label>Point Count</label>
              <span className="value-display" id="pointCountVal">12000</span>
            </div>
            <input type="range" id="pointCount" min="500" max="50000" defaultValue="12000" step="500" />
          </div>
          <div className="control-row">
            <div className="control-header">
              <label>Radius</label>
              <span className="value-display" id="radiusVal">4.0</span>
            </div>
            <input type="range" id="radius" min="1" max="10" defaultValue="4" step="0.1" />
          </div>
          <div className="control-row">
            <div className="control-header">
              <label>Spread</label>
              <span className="value-display" id="spreadVal">0.30</span>
            </div>
            <input type="range" id="spread" min="0" max="3" defaultValue="0.3" step="0.05" />
          </div>
          <div className="control-row">
            <div className="control-header">
              <label>Point Size</label>
              <span className="value-display" id="pointSizeVal">2.5</span>
            </div>
            <input type="range" id="pointSize" min="0.5" max="8" defaultValue="2.5" step="0.1" />
          </div>
          <div className="control-row">
            <div className="control-header">
              <label>Point Density</label>
              <span className="value-display" id="pointDensityVal">1.0</span>
            </div>
            <input type="range" id="pointDensity" min="0.1" max="5" defaultValue="1.0" step="0.1" />
          </div>
          <div className="checkbox-row">
            <input type="checkbox" id="fillVertexGap" defaultChecked />
            <label htmlFor="fillVertexGap">Fill Vertex Gap</label>
          </div>
        </div>
        <div className="section">
          <div className="section-title">Point Shape</div>
          <div className="preset-grid">
            <button className="preset-btn active" data-shape="circle" onClick={(e) => window.setShape?.('circle', e.currentTarget)}>
              <div className="icon">
                <svg viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" fill="currentColor" />
                </svg>
              </div>
              Circle
            </button>
            <button className="preset-btn" data-shape="square" onClick={(e) => window.setShape?.('square', e.currentTarget)}>
              <div className="icon">
                <svg viewBox="0 0 16 16">
                  <rect x="2" y="2" width="12" height="12" fill="currentColor" />
                </svg>
              </div>
              Square
            </button>
            <button className="preset-btn" data-shape="diamond" onClick={(e) => window.setShape?.('diamond', e.currentTarget)}>
              <div className="icon">
                <svg viewBox="0 0 16 16">
                  <polygon points="8,1 15,8 8,15 1,8" fill="currentColor" />
                </svg>
              </div>
              Diamond
            </button>
            <button className="preset-btn" data-shape="star" onClick={(e) => window.setShape?.('star', e.currentTarget)}>
              <div className="icon">
                <svg viewBox="0 0 16 16">
                  <polygon points="8,1 10,6 15,6.5 11,10.5 12.5,15 8,12 3.5,15 5,10.5 1,6.5 6,6" fill="currentColor" />
                </svg>
              </div>
              Star
            </button>
            <button className="preset-btn" data-shape="triangle" onClick={(e) => window.setShape?.('triangle', e.currentTarget)}>
              <div className="icon">
                <svg viewBox="0 0 16 16">
                  <polygon points="8,1 15,14 1,14" fill="currentColor" />
                </svg>
              </div>
              Triangle
            </button>
            <button className="preset-btn" data-shape="ring" onClick={(e) => window.setShape?.('ring', e.currentTarget)}>
              <div className="icon">
                <svg viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
                </svg>
              </div>
              Ring
            </button>
            <button className="preset-btn" data-shape="cross" onClick={(e) => window.setShape?.('cross', e.currentTarget)}>
              <div className="icon">
                <svg viewBox="0 0 16 16">
                  <path d="M6,1 h4 v5 h5 v4 h-5 v5 h-4 v-5 h-5 v-4 h5z" fill="currentColor" />
                </svg>
              </div>
              Cross
            </button>
            <button className="preset-btn" data-shape="hex" onClick={(e) => window.setShape?.('hex', e.currentTarget)}>
              <div className="icon">
                <svg viewBox="0 0 16 16">
                  <polygon points="8,1 14,4.5 14,11.5 8,15 2,11.5 2,4.5" fill="currentColor" />
                </svg>
              </div>
              Hexagon
            </button>
          </div>
        </div>
        <div className="section">
          <div className="section-title">Animation</div>
          <div className="section-subtitle">Preset</div>
          <div className="anim-preset-grid" id="animPresetGrid">
            <button className="anim-preset-btn active" data-anim="pulse" onClick={(e) => window.setAnimPreset?.('pulse', e.currentTarget)}>
              <div className="ap-icon">◎</div>Pulse
            </button>
            <button className="anim-preset-btn" data-anim="wave" onClick={(e) => window.setAnimPreset?.('wave', e.currentTarget)}>
              <div className="ap-icon">≈</div>Wave
            </button>
            <button className="anim-preset-btn" data-anim="diagonalWave" onClick={(e) => window.setAnimPreset?.('diagonalWave', e.currentTarget)}>
              <div className="ap-icon">∿</div>Diagonal
            </button>
            <button className="anim-preset-btn" data-anim="breathe" onClick={(e) => window.setAnimPreset?.('breathe', e.currentTarget)}>
              <div className="ap-icon">◯</div>Breathe
            </button>
            <button className="anim-preset-btn" data-anim="float" onClick={(e) => window.setAnimPreset?.('float', e.currentTarget)}>
              <div className="ap-icon">↕</div>Float
            </button>
            <button className="anim-preset-btn" data-anim="twist" onClick={(e) => window.setAnimPreset?.('twist', e.currentTarget)}>
              <div className="ap-icon">⟳</div>Twist
            </button>
            <button className="anim-preset-btn" data-anim="jelly" onClick={(e) => window.setAnimPreset?.('jelly', e.currentTarget)}>
              <div className="ap-icon">◠</div>Jelly
            </button>
            <button className="anim-preset-btn" data-anim="orbit" onClick={(e) => window.setAnimPreset?.('orbit', e.currentTarget)}>
              <div className="ap-icon">⊕</div>Orbit
            </button>
          </div>
          <div className="control-row">
            <div className="control-header">
              <label>Orbit Speed</label>
              <span className="value-display" id="orbitSpeedVal">0.30</span>
            </div>
            <input type="range" id="orbitSpeed" min="0" max="2" defaultValue="0.3" step="0.01" />
          </div>
          <div className="control-row">
            <div className="control-header">
              <label>Anim Intensity</label>
              <span className="value-display" id="animationIntensityVal">0.15</span>
            </div>
            <input type="range" id="animationIntensity" min="0" max="1" defaultValue="0.15" step="0.01" />
          </div>
          <div className="control-row">
            <div className="control-header">
              <label>Anim Speed</label>
              <span className="value-display" id="animationSpeedVal">1.5</span>
            </div>
            <input type="range" id="animationSpeed" min="0" max="5" defaultValue="1.5" step="0.1" />
          </div>
          <div className="checkbox-row">
            <input type="checkbox" id="autoRotate" defaultChecked />
            <label htmlFor="autoRotate">Auto Rotate</label>
          </div>
        </div>
        <div className="section">
          <div className="section-title">Colors</div>
          <div className="seg-control" id="colorModeControl">
            <button data-mode="solid">Solid</button>
            <button data-mode="gradient" className="active">
              Gradient
            </button>
            <button data-mode="rainbow">Rainbow</button>
            <button data-mode="depth">Depth</button>
          </div>
          <div id="solidColorRow" className="control-row" style={{ display: 'none' }}>
            <label>Color</label>
            <div className="right-side">
              <input type="color" id="pointColor" defaultValue="#a78bfa" />
            </div>
          </div>
          <div id="gradPresetsRow" className="grad-presets-wrap">
            <div className="grad-presets" id="gradPresets"></div>
          </div>
          <div id="gradBarWrap" className="grad-bar-wrap">
            <div className="grad-bar" id="gradBar">
              <div className="grad-bar-inner" id="gradBarInner"></div>
              <div className="grad-stop" id="gradStopStart" style={{ left: '10%' }}>
                <input type="color" id="gradColorStart" defaultValue="#a78bfa" />
              </div>
              <div className="grad-stop" id="gradStopEnd" style={{ left: '90%' }}>
                <input type="color" id="gradColorEnd" defaultValue="#60a5fa" />
              </div>
            </div>
            <div className="grad-bar-actions">
              <span className="color-hex" id="gradHexStart">
                #a78bfa
              </span>
              <button className="grad-reverse-btn" id="gradReverseBtn">
                ⇄ Reverse
              </button>
              <span className="color-hex" id="gradHexEnd">
                #60a5fa
              </span>
            </div>
          </div>
          <input type="hidden" id="colorMode" defaultValue="gradient" />
          <input type="hidden" id="gradientEnd" defaultValue="#60a5fa" />
          <div className="control-row">
            <div className="control-header">
              <label>Opacity</label>
              <span className="value-display" id="opacityVal">0.85</span>
            </div>
            <input type="range" id="opacity" min="0.1" max="1" defaultValue="0.85" step="0.01" />
          </div>
          <div className="control-row">
            <label>Background</label>
            <div className="right-side">
              <input type="color" id="bgColor" defaultValue="#0a0a0f" />
            </div>
          </div>
        </div>
        <div className="section">
          <div className="section-title">Effects</div>
          <div className="control-row">
            <label>Blending</label>
            <div className="right-side">
              <select id="blendMode" defaultValue="additive">
                <option value="additive">Additive (Glow)</option>
                <option value="normal">Normal</option>
                <option value="multiply">Multiply</option>
                <option value="subtractive">Subtractive</option>
              </select>
            </div>
          </div>
          <div className="control-row">
            <label>Size Attenuation</label>
            <div className="right-side">
              <select id="sizeAttenuation" defaultValue="true">
                <option value="true">Perspective</option>
                <option value="false">Fixed</option>
              </select>
            </div>
          </div>
          <div className="checkbox-row">
            <input type="checkbox" id="depthFade" defaultChecked />
            <label htmlFor="depthFade">Depth Fade</label>
          </div>
          <div className="checkbox-row">
            <input type="checkbox" id="sparkle" />
            <label htmlFor="sparkle">Sparkle Effect</label>
          </div>
        </div>
        <div className="section">
          <button className="export-btn" onClick={() => window.openExportModal?.()}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M2 5V2.5A1.5 1.5 0 013.5 1h9A1.5 1.5 0 0114 2.5V5" />
              <path d="M8 4v8M8 4L5 7M8 4l3 3" />
            </svg>
            Export Config
          </button>
        </div>
      </div>
      <div id="stats"></div>
      <div className="signature">
        <span>by</span> <a href="https://x.com/keremyildan" target="_blank" rel="noopener">Kerem Yıldan</a>
      </div>
      <div className="modal-overlay" id="exportModal" onClick={(e) => e.target === e.currentTarget && window.closeExportModal?.()}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Export Config</h3>
            <div className="modal-actions">
              <button className="modal-action-btn primary" onClick={() => window.copySnippet?.()}>
                Copy
              </button>
              <button className="modal-action-btn" onClick={() => window.closeExportModal?.()}>
                Close
              </button>
            </div>
          </div>
          <div className="modal-body">
            <pre id="snippetContent"></pre>
          </div>
        </div>
      </div>
      <div className="copy-toast" id="copyToast">
        Copied to clipboard
      </div>
    </>
  );
}
