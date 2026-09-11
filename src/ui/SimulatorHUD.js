import * as THREE from 'three';
import { COURSE_NOTES } from './CourseNotes.js';
import { RIPA_SCENARIOS } from '../simulation/RipaEngine.js';
import { WEATHER_PRESETS } from '../simulation/WeatherSystem.js';

// ══════════════════════════════════════════════════════════════════════════════
// PanelManager — Sistema de paneles con 3 estados snap: collapsed | normal | expanded
// Persistencia en localStorage, doble-tap para toggle, transiciones suaves CSS
// ══════════════════════════════════════════════════════════════════════════════
class PanelManager {
  /**
   * @param {HTMLElement} el  — El elemento panel
   * @param {string} id       — Identificador único para localStorage
   * @param {string[]} sizes  — Orden de tamaños: ['collapsed','normal','expanded']
   */
  constructor(el, id, sizes = ['collapsed', 'normal', 'expanded']) {
    this.el = el;
    this.id = id;
    this.sizes = sizes;
    this.storageKey = `panel-size-${id}`;

    // Restaurar estado guardado o usar 'normal'
    const saved = localStorage.getItem(this.storageKey);
    this.currentSize = sizes.includes(saved) ? saved : 'normal';
    this._apply(this.currentSize, false);

    // Doble-tap para toggle collapsed/normal
    this._setupDoubleTap();
  }

  /** Cambia al tamaño indicado con animación */
  setSize(size) {
    if (!this.sizes.includes(size)) return;
    this.currentSize = size;
    this._apply(size, true);
    try { localStorage.setItem(this.storageKey, size); } catch(e) {}
  }

  /** Cicla al siguiente tamaño */
  cycleNext() {
    const idx = this.sizes.indexOf(this.currentSize);
    const next = this.sizes[(idx + 1) % this.sizes.length];
    this.setSize(next);
  }

  _apply(size, animate = true) {
    if (!animate) this.el.style.transition = 'none';
    this.el.setAttribute('data-size', size);
    if (!animate) requestAnimationFrame(() => { this.el.style.transition = ''; });
  }

  _setupDoubleTap() {
    let lastTap = 0;
    const header = this.el.querySelector('.compass-header, .tel-header-row, .panel-double-tap-zone');
    const target = header || this.el;

    target.addEventListener('pointerdown', (e) => {
      // Solo actuar sobre el header, no sobre botones internos
      if (e.target.closest('button, input, select')) return;
      const now = Date.now();
      if (now - lastTap < 300) {
        // Doble-tap: toggle entre collapsed y normal
        const next = this.currentSize === 'collapsed' ? 'normal' : 'collapsed';
        this.setSize(next);
        e.preventDefault();
      }
      lastTap = now;
    });
  }

  /** Registra los botones S/M/L del panel */
  bindSizeButtons(container) {
    if (!container) return;
    const btns = container.querySelectorAll('.panel-size-btn');
    btns.forEach(btn => {
      const size = btn.getAttribute('data-size');
      btn.classList.toggle('active-size', size === this.currentSize);
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.setSize(size);
        btns.forEach(b => b.classList.toggle('active-size', b.getAttribute('data-size') === size));
      });
    });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PWA Install Banner — Toast para "Add to Home Screen" en iOS/iPadOS
// ══════════════════════════════════════════════════════════════════════════════
class PWAInstallBanner {
  constructor() {
    // Solo mostrar en iOS/iPadOS standalone-capable y si no fue descartado
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.userAgent.includes('Mac') && 'ontouchend' in document);
    const isStandalone = window.navigator.standalone === true;
    const wasDismissed = localStorage.getItem('pwa-banner-dismissed') === '1';

    if (!isIos || isStandalone || wasDismissed) return;

    this._build();
    // Mostrar 3s después de la carga
    setTimeout(() => this._show(), 3000);
  }

  _build() {
    this.el = document.createElement('div');
    this.el.className = 'pwa-install-banner';
    this.el.setAttribute('role', 'status');
    this.el.setAttribute('aria-live', 'polite');
    this.el.innerHTML = `
      <div class="pwa-banner-icon">⚓</div>
      <div class="pwa-banner-text">
        <div class="pwa-banner-title">Instalar como App</div>
        <div class="pwa-banner-desc">
          Tocá <strong>Compartir</strong> (□↑) y luego<br>
          <strong>"Agregar al inicio"</strong> para usar sin internet
        </div>
      </div>
      <button class="pwa-banner-close" aria-label="Cerrar">✕</button>
    `;
    document.body.appendChild(this.el);

    this.el.querySelector('.pwa-banner-close').addEventListener('click', () => {
      this._dismiss();
    });

    // Auto-cerrar después de 12s
    setTimeout(() => this._dismiss(), 12000);
  }

  _show() {
    if (this.el) this.el.classList.add('visible');
  }

  _dismiss() {
    if (!this.el) return;
    this.el.classList.remove('visible');
    try { localStorage.setItem('pwa-banner-dismissed', '1'); } catch(e) {}
    setTimeout(() => this.el?.remove(), 400);
  }
}

export class SimulatorHUD {
  constructor(windSystem, boat, environment, otherVessel, ripaEngine, ialaSystem, anchorSystem, weatherSystem, engine = null, windVisualizer = null) {
    this.wind = windSystem;
    this.boat = boat;
    this.env = environment;
    this.otherVessel = otherVessel;
    this.ripa = ripaEngine;
    this.iala = ialaSystem;
    this.anchor = anchorSystem;
    this.weather = weatherSystem;
    this.engine = engine;
    this.windVis = windVisualizer;

    this.currentMode = 'wind'; // 'wind', 'ripa', 'iala', 'anchor'

    // ── Optimización Three.js para iPad: limitar DPR a 2x ───────────
    if (this.engine && this.engine.renderer) {
      const dpr = Math.min(window.devicePixelRatio, 2);
      this.engine.renderer.setPixelRatio(dpr);
    }

    // ── Throttle del loop cuando app está en background ──────────────
    this._setupVisibilityThrottle();

    this.initDOM();
    this.populateRipaNavigation();
    this.bindEvents();

    // ── Inicializar sistema de paneles redimensionables ───────────────
    this._initPanelManagers();

    // ── Banner de instalación PWA ─────────────────────────────────────
    new PWAInstallBanner();

    // ── Registrar Service Worker ──────────────────────────────────────
    this._registerServiceWorker();

    this.update();
  }

  /** Registra el Service Worker para soporte offline */
  _registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js', { scope: './' })
          .then(reg => {
            if (import.meta.env?.DEV) console.log('⚓ SW registrado:', reg.scope);
            if (reg.waiting) {
              reg.waiting.postMessage('SKIP_WAITING');
            }
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    newWorker.postMessage('SKIP_WAITING');
                  }
                });
              }
            });
          })
          .catch(err => {
            if (import.meta.env?.DEV) console.warn('SW no disponible:', err);
          });
      });
    }
  }

  /** Throttle del game loop cuando la pestaña está en background */
  _setupVisibilityThrottle() {
    if (!this.engine) return;
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Pausar o reducir FPS a 1fps cuando está en background
        this.engine.setThrottled(true);
      } else {
        this.engine.setThrottled(false);
      }
    });
  }

  /** Inicializa PanelManagers para brújula y telemetría */
  _initPanelManagers() {
    // Brújula
    if (this.compassWidget) {
      this.compassPM = new PanelManager(this.compassWidget, 'compass');
      const sizeCtrl = this.compassWidget.querySelector('.panel-size-controls');
      this.compassPM.bindSizeButtons(sizeCtrl);
    }
    // Telemetría
    if (this.telemetryCard) {
      this.telemetryPM = new PanelManager(this.telemetryCard, 'telemetry');
      const sizeCtrl = this.telemetryCard.querySelector('.panel-size-controls');
      this.telemetryPM.bindSizeButtons(sizeCtrl);
    }
  }

  initDOM() {
    // 1. Barra superior unificada con los 4 grandes ejes temáticos del curso PNA
    this.header = document.createElement('header');
    this.header.className = 'sim-header';
    this.header.innerHTML = `
      <div class="sim-brand">
        <div class="sim-badge">⚓ CURSO DE TIMONEL PNA</div>
        <h1>Simulador Náutico 3D</h1>
      </div>

      <div class="sim-mode-selector" role="tablist" aria-label="Ejes temáticos del simulador">
        <button class="mode-tab active" role="tab" id="tab-wind" aria-selected="true" aria-controls="sim-controls-panel" data-mode="wind" title="Física de viento real, aparente y trimado">🧭 Viento & Clima</button>
        <button class="mode-tab" role="tab" id="tab-ripa" aria-selected="false" data-mode="ripa" title="Reglamento Internacional para Prevenir Abordajes: 10 ejercicios interactivos">⚖️ RIPA (10 Cruces)</button>
        <button class="mode-tab" role="tab" id="tab-iala" aria-selected="false" data-mode="iala" title="Sistema de Boyado Marítimo IALA Región B">📍 Balizamiento IALA B</button>
        <button class="mode-tab" role="tab" id="tab-anchor" aria-selected="false" data-mode="anchor" title="Reglas y física de fondeo, filado y círculo de borneo">⚓ Fondeo & Borneo</button>
      </div>

      <div class="sim-header-actions">
        <button id="btn-env-settings" class="sim-btn" title="Ajustar brillo del sol, agua y viento 3D">☀️ <span class="btn-text">Luz</span></button>
        <button id="btn-night-toggle" class="sim-btn sim-btn-night" title="Alternar modo noche y luces reglamentarias de navegación">🌙 <span class="btn-text">Noche</span></button>
        <button id="btn-notes-toggle" class="sim-btn" title="Ver apuntes y glosario del curso">📖 <span class="btn-text">Apuntes</span></button>
        <button id="btn-toggle-hud" class="sim-btn" title="Ocultar interfaz para vista panorámica 3D" aria-label="Ocultar interfaz visual">👁️ <span class="btn-text">HUD</span></button>
        <a href="index.html" class="sim-btn sim-btn-link" title="Volver a la vista de partes y despiece 3D">⛵ <span class="btn-text">Partes</span></a>
      </div>
    `;
    document.body.appendChild(this.header);

    // 1b. Panel de Ajustes de Luz y Agua (Brillo solar, posición y transparencia de oleaje)
    this.envCard = document.createElement('div');
    this.envCard.className = 'sim-env-card';
    this.envCard.setAttribute('role', 'dialog');
    this.envCard.setAttribute('aria-label', 'Ajustes de Luz, Agua y Viento');
    this.envCard.style.display = 'none';
    this.envCard.innerHTML = `
      <div class="env-card-header">
        <span>☀️ Ajustes de Luz, Agua y Viento</span>
        <button id="btn-env-close" class="btn-env-close" aria-label="Cerrar ajustes de luz">✕</button>
      </div>
      <div class="env-card-body">
        <div class="env-section">
          <div class="env-section-title">☀️ Iluminación Solar Diurna</div>
          <div class="env-row">
            <label>Brillo Solar: <strong id="lbl-sun-brightness">1.6x</strong></label>
            <input type="range" id="slider-sun-brightness" min="0.5" max="2.5" step="0.1" value="1.6" aria-label="Brillo solar">
          </div>
          <div class="env-row">
            <label>Posición / Altura del Sol: <strong id="lbl-sun-elevation">42°</strong></label>
            <input type="range" id="slider-sun-elevation" min="15" max="80" step="1" value="42" aria-label="Altura del sol en grados">
          </div>
        </div>

        <div class="env-section">
          <div class="env-section-title">🌊 Simulación del Agua</div>
          <div class="env-row">
            <label>Transparencia / Opacidad: <strong id="lbl-water-opacity">65%</strong></label>
            <input type="range" id="slider-water-opacity" min="0.15" max="0.95" step="0.05" value="0.65" aria-label="Transparencia del agua">
          </div>
          <div class="env-row">
            <label>Animación de Oleaje:</label>
            <div class="env-toggle-group">
              <button id="btn-waves-on" class="env-toggle-btn active">🌊 Ondulante</button>
              <button id="btn-waves-off" class="env-toggle-btn">🧊 Calma (0% CPU)</button>
            </div>
          </div>
          <div class="env-row" id="row-wave-height">
            <label>Altura de Olas: <strong id="lbl-wave-height">0.07 m</strong></label>
            <input type="range" id="slider-wave-height" min="0.02" max="0.20" step="0.01" value="0.07" aria-label="Altura de olas en metros">
          </div>
        </div>

        <div class="env-section">
          <div class="env-section-title">💨 Flujo de Viento 3D (Aerodinámica)</div>
          <div class="env-row">
            <label>Animación de Viento:</label>
            <div class="env-toggle-group">
              <button id="btn-wind-lines-on" class="env-toggle-btn active">💨 Activo</button>
              <button id="btn-wind-lines-off" class="env-toggle-btn">🚫 Oculto (0% CPU)</button>
            </div>
          </div>
          <div class="env-row" id="row-wind-opacity">
            <label>Visibilidad / Opacidad: <strong id="lbl-wind-opacity">70%</strong></label>
            <input type="range" id="slider-wind-opacity" min="0.2" max="1.0" step="0.05" value="0.7" aria-label="Opacidad de líneas de viento">
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.envCard);

    // 2. Widget de Rosa Náutica y Viento (Modo Viento)
    this.compassWidget = document.createElement('div');
    this.compassWidget.className = 'sim-compass-card';
    this.compassWidget.innerHTML = `
      <div class="compass-header">
        <span class="compass-title" title="Rosa de los Vientos">🧭 Rosa<span class="compass-title-long"> de los Vientos</span></span>
        <span class="compass-legend-tws" id="compass-tws">14 kts</span>
        <div class="panel-size-controls" title="Cambiar tamaño del panel">
          <button class="panel-size-btn" data-size="collapsed" title="Colapsar panel de rosa" aria-label="Colapsar panel brújula">−</button>
          <button class="panel-size-btn active-size" data-size="normal" title="Tamaño normal" aria-label="Tamaño normal brújula">□</button>
          <button class="panel-size-btn" data-size="expanded" title="Expandir panel" aria-label="Expandir panel brújula">+</button>
        </div>
      </div>
      <div class="compass-dial-container">
        <svg viewBox="0 0 200 200" class="compass-svg" role="img" aria-label="Rosa de los vientos indicando viento real y rumbo de proa">
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
          <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(56,189,248,0.15)" stroke-width="1" stroke-dasharray="2,4"/>
          
          <text x="100" y="24" text-anchor="middle" class="c-cardinal north">N (0°)</text>
          <text x="182" y="104" text-anchor="middle" class="c-cardinal">E (90°)</text>
          <text x="100" y="186" text-anchor="middle" class="c-cardinal">S (180°)</text>
          <text x="20" y="104" text-anchor="middle" class="c-cardinal">W (270°)</text>

          <!-- Zona muerta (no go zone) sombreada -->
          <path d="M 100 100 L 70 28 A 90 90 0 0 1 130 28 Z" fill="rgba(239,68,68,0.18)"/>

          <!-- Aguja de Viento Real (Cian) -->
          <g id="needle-wind" transform="rotate(0 100 100)">
            <line x1="100" y1="26" x2="100" y2="100" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
            <polygon points="100,14 94,30 106,30" fill="#38bdf8"/>
            <circle cx="100" cy="100" r="4" fill="#38bdf8"/>
          </g>

          <!-- Aguja de Rumbo de Proa del Barco (Dorado) -->
          <g id="needle-boat" transform="rotate(0 100 100)">
            <polygon points="100,32 93,115 107,115" fill="rgba(245,158,11,0.3)" stroke="#f59e0b" stroke-width="2"/>
            <polygon points="100,22 95,36 105,36" fill="#f59e0b"/>
            <circle cx="100" cy="100" r="5" fill="#f59e0b"/>
          </g>
        </svg>
      </div>
      <div class="compass-footer">
        <div class="compass-legend-item" title="Dirección de donde sopla el viento">
          <span class="legend-dot cyan"></span> Viento: <strong id="val-twd">0°</strong>
        </div>
        <div class="compass-legend-item" title="Rumbo hacia donde apunta la proa">
          <span class="legend-dot gold"></span> Rumbo: <strong id="val-hdg">0°</strong>
        </div>
      </div>
      <div class="compass-subtext">Sector rojo = Zona prohibida / Barco enfachado</div>
    `;
    document.body.appendChild(this.compassWidget);

    // 3. Tarjeta de Telemetría Dinámica Náutica
    this.telemetryCard = document.createElement('div');
    this.telemetryCard.className = 'sim-telemetry-card';
    this.telemetryCard.innerHTML = `
      <div class="tel-header-row panel-double-tap-zone">
        <span class="tel-label" style="color:var(--accent-cyan);font-size:0.78rem;">📊 Telemetría</span>
        <div class="panel-size-controls" title="Cambiar tamaño del panel">
          <button class="panel-size-btn" data-size="collapsed" title="Colapsar" aria-label="Colapsar panel telemetría">−</button>
          <button class="panel-size-btn active-size" data-size="normal" title="Normal" aria-label="Tamaño normal telemetría">□</button>
          <button class="panel-size-btn" data-size="expanded" title="Expandir" aria-label="Expandir panel telemetría">+</button>
        </div>
      </div>
      <div class="tel-row-point">
        <span class="tel-label">Punto de la Vela:</span>
        <span class="tel-point-badge" id="tel-point">Calculando rumbo...</span>
      </div>
      <div class="tel-metrics-grid">
        <div class="metric-box" title="Velocidad sobre el agua calculada con diagrama polar del velero">
          <span class="m-val" id="tel-speed">0.0</span>
          <span class="m-unit">NUDOS (VELOCIDAD)</span>
        </div>
        <div class="metric-box" title="Inclinación lateral del casco por fuerza escorante del viento">
          <span class="m-val" id="tel-heel">0°</span>
          <span class="m-unit">ESCORA</span>
        </div>
        <div class="metric-box" title="Viento resultante a bordo combinando viento real con la marcha del barco">
          <span class="m-val" id="tel-app-wind">14.0</span>
          <span class="m-unit">VIENTO APARENTE</span>
        </div>
        <div class="metric-box" title="Banda por donde ingresa el viento según RIPA regla 12">
          <span class="m-val" id="tel-tack">Estribor</span>
          <span class="m-unit" id="tel-tack-rule">🟢 PREFERENCIA (RIPA 12)</span>
        </div>
      </div>
      <div class="tel-eval-box" id="tel-eval">
        Ajustando trimado aerodinámico...
      </div>
    `;
    document.body.appendChild(this.telemetryCard);


    // 4. Tarjeta interactiva para ejercicios RIPA (Modo RIPA)
    this.ripaCard = document.createElement('div');
    this.ripaCard.className = 'sim-ripa-card';
    this.ripaCard.style.display = 'none';
    this.ripaCard.innerHTML = `
      <div class="ripa-header">
        <div class="ripa-top-bar">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
            <span class="ripa-badge" id="ripa-badge">⚖️ EJERCICIO 1 DE 10</span>
            <span id="ripa-progress-badge" style="font-size:0.68rem;font-weight:800;color:var(--accent-emerald);background:rgba(16,185,129,0.15);padding:2px 7px;border-radius:6px;border:1px solid rgba(16,185,129,0.3);">0/10 ✓</span>
          </div>
          <div class="ripa-nav-actions">
            <button id="btn-ripa-prev" class="ripa-nav-btn" title="Ejercicio anterior" aria-label="Ejercicio anterior">◀ Ant</button>
            <button id="btn-ripa-next" class="ripa-nav-btn" title="Siguiente ejercicio" aria-label="Siguiente ejercicio">Sig ▶</button>
            <button id="btn-ripa-reset" class="ripa-nav-btn" title="Reiniciar posiciones de los barcos" aria-label="Reiniciar simulación de cruce">🔄 Repetir</button>
          </div>
        </div>

        <div class="ripa-pills-bar" id="ripa-pills-bar"></div>

        <select id="select-ripa-scenario" class="ripa-select" aria-label="Seleccionar caso de colisión RIPA"></select>
      </div>

      <div class="ripa-tactical-banner role-privilegiado" id="ripa-tactical-banner">
        🟢 TU BARCO: TIENE PREFERENCIA (Mantiene Rumbo)
      </div>

      <p class="ripa-desc" id="ripa-desc">Cargando situación...</p>

      <div class="ripa-quiz-box">
        <div class="ripa-question" id="ripa-question">¿Quién tiene derecho de paso?</div>
        <div class="ripa-options-group" id="ripa-options"></div>
        <div class="ripa-feedback" id="ripa-feedback"></div>
      </div>
    `;
    document.body.appendChild(this.ripaCard);

    // 5. Tarjeta informativa de Boyado IALA B (Modo IALA)
    this.ialaCard = document.createElement('div');
    this.ialaCard.className = 'sim-iala-card';
    this.ialaCard.style.display = 'none';
    this.ialaCard.innerHTML = `
      <div class="iala-header">
        <span class="iala-badge">📍 SISTEMA IALA B (ARGENTINA)</span>
      </div>
      <div class="iala-rules-content">
        <p class="iala-motto"><strong>Regla de Oro en Región B:</strong> Al ingresar de mar a puerto, se deja <span style="color:#ef4444;font-weight:700;">ROJO A BABOR</span> y <span style="color:#22c55e;font-weight:700;">VERDE A ESTRIBOR</span>.</p>
        <div class="iala-buoy-pills">
          <div class="buoy-pill green">
            <span class="bp-icon">▲</span>
            <div><strong>Canal Estribor</strong>: Verde, cónica, destello Fl G. Número impar.</div>
          </div>
          <div class="buoy-pill red">
            <span class="bp-icon">■</span>
            <div><strong>Canal Babor</strong>: Roja, cilíndrica, destello Fl R. Número par.</div>
          </div>
          <div class="buoy-pill black">
            <span class="bp-icon">●●</span>
            <div><strong>Peligro Aislado</strong>: Negra con franjas rojas, dos esferas. Fl(2) W 5s.</div>
          </div>
          <div class="buoy-pill safe">
            <span class="bp-icon">⚪</span>
            <div><strong>Aguas Seguras</strong>: Franjas rojas/blancas, una esfera. Recalada.</div>
          </div>
        </div>
        <div class="iala-tips">
          Observa los destellos de luz nocturnos sobre el agua y la geometría de las marcas de tope.
        </div>
      </div>
    `;
    document.body.appendChild(this.ialaCard);

    // 6. Tarjeta interactiva de Fondeo y Círculo de Borneo (Modo Fondeo)
    this.anchorCard = document.createElement('div');
    this.anchorCard.className = 'sim-anchor-card';
    this.anchorCard.style.display = 'none';
    this.anchorCard.innerHTML = `
      <div class="anchor-header">
        <span class="anchor-badge">⚓ MANIOBRA DE FONDEO Y BORNEO (PNA)</span>
      </div>
      <div class="anchor-status-banner success" id="anchor-status-banner">
        🟢 FONDEO SEGURO Y REGLAMENTARIO (PNA)
      </div>
      <div class="anchor-scope-box">
        <div>
          <div class="scope-val" id="anchor-scope-val">6.0:1</div>
          <div class="scope-desc">Relación de Filado (Scope)</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:1.1rem;font-weight:700;color:#38bdf8;" id="anchor-radius-val">29 m</div>
          <div class="scope-desc">Radio de Borneo</div>
        </div>
      </div>
      <div class="anchor-sliders-group">
        <div class="anchor-slider-row" title="Profundidad de la columna de agua bajo el casco">
          <label>Profundidad (Sonda): <strong id="lbl-anchor-depth">4.0 m</strong></label>
          <input type="range" id="slider-anchor-depth" min="2" max="10" step="0.5" value="4" aria-label="Profundidad de sonda en metros">
        </div>
        <div class="anchor-slider-row" title="Longitud de cadena y cabo arrojada al fondo marino">
          <label>Cadena/Cabo Filado: <strong id="lbl-anchor-rode">24 m</strong></label>
          <input type="range" id="slider-anchor-rode" min="6" max="50" step="1" value="24" aria-label="Cadena o cabo filado en metros">
        </div>
        <div class="anchor-slider-row" title="Dirección de donde sopla el viento que ejerce fuerza de arrastre">
          <label>Dirección del Viento: <strong id="lbl-anchor-wind">90°</strong></label>
          <input type="range" id="slider-anchor-wind" min="0" max="359" value="90" aria-label="Dirección del viento de fondeo en grados">
        </div>
        <div class="anchor-slider-row" title="Rumbo y velocidad de la corriente de marea en el fondeadero">
          <label>Corriente de Marea: <strong id="lbl-anchor-curr">120° (1.2 kts)</strong></label>
          <input type="range" id="slider-anchor-curr" min="0" max="359" value="120" aria-label="Dirección de corriente de marea en grados">
        </div>
      </div>
      <p class="anchor-advice" id="anchor-advice">
        Catenaria óptima. La tracción horizontal clava las uñas Danforth profundamente en el fango.
      </p>
    `;
    document.body.appendChild(this.anchorCard);

    // 7. Panel de Control Táctil Inferior: Rumbos, Clima Rioplatense, Rizos y Sliders
    this.controlsCard = document.createElement('div');
    this.controlsCard.className = 'sim-controls-panel';
    this.controlsCard.id = 'sim-controls-panel';
    this.controlsCard.innerHTML = `
      <div class="ctrl-drawer-handle" id="ctrl-drawer-toggle" role="button" tabindex="0" aria-label="Abrir o cerrar panel de controles náuticos">
        <div class="drawer-pill"></div>
        <div class="drawer-bar-info">
          <span class="dbi-badge">🎮 Controles</span>
          <span class="dbi-val" id="dbi-summary">0° · 15 kts · 0.0 kts</span>
          <span class="dbi-arrow" id="dbi-arrow">▲</span>
        </div>
      </div>

      <div class="ctrl-drawer-content" id="ctrl-drawer-content">
        <div class="ctrl-row-presets">
          <span class="ctrl-label">Rumbos de Examen:</span>
          <div class="ctrl-preset-btns">
            <button class="btn-preset" data-heading="0" title="0°: Proa al ojo del viento (Zona de exclusión)">Proa Viento</button>
            <button class="btn-preset active" data-heading="45" title="45°: Navegación cerrada contra el viento">Ceñida</button>
            <button class="btn-preset" data-heading="90" title="90°: Viento entra perpendicular por el costado">Través</button>
            <button class="btn-preset" data-heading="135" title="135°: Viento entra por la aleta (rumbo franco)">Un Largo</button>
            <button class="btn-preset" data-heading="180" title="180°: Viento entra directo por el espejo de popa">Popa</button>
          </div>
          <button id="btn-auto-trim" class="btn-auto-trim" title="Cazar/filar automáticamente para máximo rendimiento según el rumbo actual">🎯 Trimado Óptimo</button>
          <button id="btn-toggle-wind-lines" class="btn-toggle-wind-lines active" title="Alternar líneas de flujo aerodinámico de viento 3D">💨 Viento 3D: ON</button>
        </div>

        <div class="ctrl-row-weather">
          <span class="ctrl-label">Clima:</span>
          <div class="ctrl-weather-btns">
            <button class="btn-weather-quick active" data-preset="virazon" title="Brisa térmica estival del Este">🌊 Virazón (E 15k)</button>
            <button class="btn-weather-quick" data-preset="sudestada" title="Viento húmedo con crecida y oleaje corto">🌪️ Sudestada (SE 26k)</button>
            <button class="btn-weather-quick" data-preset="pampero" title="Frente frío del SW con ráfagas violentas">⚡ Pampero (SW 34k)</button>
            <button class="btn-weather-quick" data-preset="calma_norte" title="Viento suave del Norte y río calmo">☀️ Calma Norte</button>
            <button class="btn-weather-quick" data-preset="custom" id="btn-weather-custom" title="Ajuste manual libre">⚙️ Personalizado</button>
          </div>
          <span class="ctrl-label" style="margin-left:6px;">Rizos:</span>
          <div class="ctrl-reef-btns">
            <button class="btn-reef-quick active" data-reef="0" title="100% paño completo">100%</button>
            <button class="btn-reef-quick" data-reef="1" title="1er Rizo: reduce 30% la superficie mayor">1° Rizo</button>
            <button class="btn-reef-quick" data-reef="2" title="2do Rizo: reduce 60% la superficie para vientos duros">2° Rizo</button>
          </div>
        </div>

        <div class="weather-info-box" id="weather-info-box">
          🌊 <strong>Virazón Costera:</strong> Brisa térmica regular de la tarde desde el Este (15 kts). Condiciones ideales con aparejo completo.
        </div>

        <div class="ctrl-row-sliders">
          <div class="slider-card" title="Rumbo de proa en grados sexagesimales (0° a 359°)">
            <label>Rumbo Barco: <strong id="lbl-hdg">0°</strong></label>
            <input type="range" id="slider-hdg" min="0" max="359" value="0" aria-label="Rumbo de proa en grados">
          </div>
          <div class="slider-card" title="Dirección de donde sopla el viento real (0° = Norte, 90° = Este)">
            <label>Dirección Viento: <strong id="lbl-wind-dir">90°</strong></label>
            <input type="range" id="slider-wind-dir" min="0" max="359" value="90" aria-label="Dirección del viento real en grados">
          </div>
          <div class="slider-card" title="Intensidad o fuerza del viento real medida en nudos náuticos (kts)">
            <label>Intensidad Viento: <strong id="lbl-wind-spd">15 kts</strong></label>
            <input type="range" id="slider-wind-spd" min="4" max="35" value="15" aria-label="Intensidad del viento en nudos">
          </div>
          <div class="slider-card" title="Cabo de control de la vela mayor: cazá (baja %) en ceñida o filá (sube %) en rumbos francos">
            <label>Escota Mayor: <strong id="lbl-main-sheet">25%</strong></label>
            <input type="range" id="slider-main-sheet" min="0" max="100" value="25" aria-label="Tensión de escota de vela mayor">
          </div>
          <div class="slider-card" title="Cabo de control del foque de proa: cazá o filá para equilibrar el centro vélico con el timón">
            <label>Escota Foque: <strong id="lbl-jib-sheet">25%</strong></label>
            <input type="range" id="slider-jib-sheet" min="0" max="100" value="25" aria-label="Tensión de escota de foque">
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(this.controlsCard);

    // 8. Drawer de Apuntes
    this.notesDrawer = document.createElement('aside');
    this.notesDrawer.className = 'sim-notes-drawer';
    this.notesDrawer.setAttribute('role', 'dialog');
    this.notesDrawer.setAttribute('aria-label', 'Cuaderno de Estudio Náutico PNA');
    this.notesDrawer.innerHTML = `
      <div class="notes-header">
        <h3>📖 Cuaderno de Estudio Náutico (PNA)</h3>
        <button id="btn-notes-close" class="btn-notes-close" aria-label="Cerrar cuaderno de apuntes">✕</button>
      </div>
      <div class="notes-body" id="notes-content"></div>
    `;
    document.body.appendChild(this.notesDrawer);
    this.populateNotes();
  }


  populateRipaNavigation() {
    const pillsContainer = document.getElementById('ripa-pills-bar');
    const select = document.getElementById('select-ripa-scenario');
    if (!pillsContainer || !select) return;

    const list = this.ripa.getScenarioList();
    pillsContainer.innerHTML = '';
    select.innerHTML = '';

    list.forEach(scen => {
      const pill = document.createElement('button');
      pill.className = 'ripa-pill';
      pill.setAttribute('data-key', scen.id);
      pill.setAttribute('title', `${scen.number}. ${scen.badge} - ${scen.title}`);
      pill.textContent = scen.number;
      pillsContainer.appendChild(pill);

      const opt = document.createElement('option');
      opt.value = scen.id;
      opt.textContent = `${scen.number}. ${scen.badge} — ${scen.title}`;
      select.appendChild(opt);
    });
  }

  populateNotes() {
    const container = document.getElementById('notes-content');
    if (!container) return;
    let html = '';
    for (const key in COURSE_NOTES) {
      const cat = COURSE_NOTES[key];
      html += `
        <div class="note-card">
          <h4>${cat.icon} ${cat.title}</h4>
          <div class="note-items">
            ${cat.sections.map(s => `
              <div class="note-item">
                <strong>${s.heading}</strong>
                <p>${s.content}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    container.innerHTML = html;
  }

  bindEvents() {
    // Mode switcher
    const modeTabs = document.querySelectorAll('.mode-tab');
    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        modeTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.setMode(tab.getAttribute('data-mode'));
      });
    });

    // Drawer colapsable inferior para móviles (Bottom Sheet) — con swipe táctil
    const drawerToggle = document.getElementById('ctrl-drawer-toggle');
    const drawerArrow = document.getElementById('dbi-arrow');
    if (drawerToggle && this.controlsCard) {
      // Tap en el handle
      drawerToggle.addEventListener('click', () => {
        const isOpen = this.controlsCard.classList.toggle('drawer-open');
        if (drawerArrow) drawerArrow.textContent = isOpen ? '▼' : '▲';
      });

      // ── Swipe up/down en el panel de controles ────────────────────
      let swipeTouchStartY = 0;
      let swipeTouchStartTime = 0;

      this.controlsCard.addEventListener('touchstart', (e) => {
        swipeTouchStartY = e.touches[0].clientY;
        swipeTouchStartTime = Date.now();
      }, { passive: true });

      this.controlsCard.addEventListener('touchend', (e) => {
        const dy = swipeTouchStartY - e.changedTouches[0].clientY;
        const dt = Date.now() - swipeTouchStartTime;
        // Swipe rápido (< 350ms) de al menos 40px
        if (dt < 350 && Math.abs(dy) > 40) {
          const isOpen = dy > 0; // swipe up = abrir, swipe down = cerrar
          this.controlsCard.classList.toggle('drawer-open', isOpen);
          if (drawerArrow) drawerArrow.textContent = isOpen ? '▼' : '▲';
        }
      }, { passive: true });
    }

    // Botón para ocultar/mostrar toda la interfaz (HUD)
    const btnToggleHud = document.getElementById('btn-toggle-hud');
    if (btnToggleHud) {
      btnToggleHud.addEventListener('click', () => {
        const isHidden = document.body.classList.toggle('hud-hidden');
        btnToggleHud.classList.toggle('hud-off', isHidden);
        btnToggleHud.innerHTML = isHidden
          ? '👁️ <span class="btn-text">Ver HUD</span>'
          : '👁️ <span class="btn-text">HUD</span>';
      });
    }

    // Panel de Ajustes de Luz y Agua
    const btnEnvSettings = document.getElementById('btn-env-settings');
    const btnEnvClose = document.getElementById('btn-env-close');
    if (btnEnvSettings && this.envCard) {
      btnEnvSettings.addEventListener('click', () => {
        const isClosed = this.envCard.style.display === 'none';
        this.envCard.style.display = isClosed ? 'flex' : 'none';
      });
    }
    if (btnEnvClose && this.envCard) {
      btnEnvClose.addEventListener('click', () => {
        this.envCard.style.display = 'none';
      });
    }

    // Sliders de Brillo Solar y Posición
    const sliderSunBrt = document.getElementById('slider-sun-brightness');
    const lblSunBrt = document.getElementById('lbl-sun-brightness');
    if (sliderSunBrt) {
      sliderSunBrt.addEventListener('input', (e) => {
        const val = +e.target.value;
        this.env.setSunBrightness(val);
        if (lblSunBrt) lblSunBrt.textContent = val.toFixed(1) + 'x';
      });
    }

    const sliderSunElev = document.getElementById('slider-sun-elevation');
    const lblSunElev = document.getElementById('lbl-sun-elevation');
    if (sliderSunElev) {
      sliderSunElev.addEventListener('input', (e) => {
        const val = +e.target.value;
        this.env.setSunElevation(val);
        if (lblSunElev) lblSunElev.textContent = val + '°';
      });
    }

    // Slider de Transparencia del Agua
    const sliderWaterOp = document.getElementById('slider-water-opacity');
    const lblWaterOp = document.getElementById('lbl-water-opacity');
    if (sliderWaterOp) {
      sliderWaterOp.addEventListener('input', (e) => {
        const val = +e.target.value;
        this.env.setWaterTransparency(val);
        if (lblWaterOp) lblWaterOp.textContent = Math.round(val * 100) + '%';
      });
    }

    // Botones de Animación de Olas (Activar / Desactivar 0% CPU)
    const btnWavesOn = document.getElementById('btn-waves-on');
    const btnWavesOff = document.getElementById('btn-waves-off');
    const rowWaveHeight = document.getElementById('row-wave-height');
    if (btnWavesOn && btnWavesOff) {
      btnWavesOn.addEventListener('click', () => {
        btnWavesOn.classList.add('active');
        btnWavesOff.classList.remove('active');
        this.env.setWavesEnabled(true);
        if (rowWaveHeight) rowWaveHeight.style.display = 'flex';
      });
      btnWavesOff.addEventListener('click', () => {
        btnWavesOff.classList.add('active');
        btnWavesOn.classList.remove('active');
        this.env.setWavesEnabled(false);
        if (rowWaveHeight) rowWaveHeight.style.display = 'none';
      });
    }

    // Slider de Altura de Olas
    const sliderWaveH = document.getElementById('slider-wave-height');
    const lblWaveH = document.getElementById('lbl-wave-height');
    if (sliderWaveH) {
      sliderWaveH.addEventListener('input', (e) => {
        const val = +e.target.value;
        this.env.setWaveIntensity(val);
        if (lblWaveH) lblWaveH.textContent = val.toFixed(2) + ' m';
      });
    }

    // Control de Líneas de Viento 3D (Streamlines aerodinámicas)
    const btnQuickWindLines = document.getElementById('btn-toggle-wind-lines');
    const btnWindLinesOn = document.getElementById('btn-wind-lines-on');
    const btnWindLinesOff = document.getElementById('btn-wind-lines-off');
    const rowWindOp = document.getElementById('row-wind-opacity');
    const sliderWindOp = document.getElementById('slider-wind-opacity');
    const lblWindOp = document.getElementById('lbl-wind-opacity');

    const updateWindLinesState = (enabled) => {
      if (this.windVis) this.windVis.setEnabled(enabled);
      if (btnQuickWindLines) {
        btnQuickWindLines.classList.toggle('active', enabled);
        btnQuickWindLines.textContent = enabled ? '💨 Viento 3D: ON' : '💨 Viento 3D: OFF';
      }
      if (btnWindLinesOn) btnWindLinesOn.classList.toggle('active', enabled);
      if (btnWindLinesOff) btnWindLinesOff.classList.toggle('active', !enabled);
      if (rowWindOp) rowWindOp.style.display = enabled ? 'flex' : 'none';
    };

    if (btnQuickWindLines) {
      btnQuickWindLines.addEventListener('click', () => {
        const next = this.windVis ? !this.windVis.enabled : false;
        updateWindLinesState(next);
      });
    }

    if (btnWindLinesOn && btnWindLinesOff) {
      btnWindLinesOn.addEventListener('click', () => updateWindLinesState(true));
      btnWindLinesOff.addEventListener('click', () => updateWindLinesState(false));
    }

    if (sliderWindOp) {
      sliderWindOp.addEventListener('input', (e) => {
        const val = +e.target.value;
        if (this.windVis) this.windVis.setOpacity(val);
        if (lblWindOp) lblWindOp.textContent = Math.round(val * 100) + '%';
      });
    }

    // Night mode
    const btnNight = document.getElementById('btn-night-toggle');
    if (btnNight) {
      btnNight.addEventListener('click', () => {
        const night = !this.env.isNight;
        this.env.setNightMode(night);
        this.boat.setNavigationLights(night, false);
        if (this.otherVessel) this.otherVessel.setNightLights(night);
        btnNight.textContent = night ? '☀️ Modo Día' : '🌙 Modo Noche';
        btnNight.classList.toggle('active', night);
      });
    }

    // Sliders de viento, rumbo y escotas con desactivación automática de preset climático
    const sliderHdg = document.getElementById('slider-hdg');
    const sliderWindDir = document.getElementById('slider-wind-dir');
    const sliderWindSpd = document.getElementById('slider-wind-spd');
    const sliderMain = document.getElementById('slider-main-sheet');
    const sliderJib = document.getElementById('slider-jib-sheet');

    const activateCustomWeather = () => {
      document.querySelectorAll('.btn-weather-quick').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-preset') === 'custom');
      });
      const info = document.getElementById('weather-info-box');
      if (info) {
        info.innerHTML = `⚙️ <strong>Ajuste Personalizado:</strong> Viento a ${this.wind.trueWindSpeed} kts desde ${this.wind.trueWindDirection}°. Parámetros ajustados manualmente por el timonel.`;
      }
    };

    if (sliderHdg) {
      sliderHdg.addEventListener('input', (e) => {
        this.wind.setBoatHeading(+e.target.value);
        this.update();
      });
    }
    if (sliderWindDir) {
      sliderWindDir.addEventListener('input', (e) => {
        this.wind.setTrueWind(+e.target.value, this.wind.trueWindSpeed);
        activateCustomWeather();
        this.update();
      });
    }
    if (sliderWindSpd) {
      sliderWindSpd.addEventListener('input', (e) => {
        this.wind.setTrueWind(this.wind.trueWindDirection, +e.target.value);
        activateCustomWeather();
        this.update();
      });
    }
    if (sliderMain) {
      sliderMain.addEventListener('input', (e) => {
        this.wind.setSheetTrim(+e.target.value / 100, this.wind.jibSheetTrim);
        this.update();
      });
    }
    if (sliderJib) {
      sliderJib.addEventListener('input', (e) => {
        this.wind.setSheetTrim(this.wind.mainSheetTrim, +e.target.value / 100);
        this.update();
      });
    }

    // Presets de rumbo
    const presetBtns = document.querySelectorAll('.btn-preset');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const h = +btn.getAttribute('data-heading');
        if (sliderHdg) sliderHdg.value = h;
        this.wind.setBoatHeading(h);
        this.applyAutoTrim();
        this.update();
      });
    });

    // Auto-trim
    const btnAutoTrim = document.getElementById('btn-auto-trim');
    if (btnAutoTrim) {
      btnAutoTrim.addEventListener('click', () => {
        this.applyAutoTrim();
        this.update();
      });
    }

    // Notes drawer
    const btnNotesToggle = document.getElementById('btn-notes-toggle');
    const btnNotesClose = document.getElementById('btn-notes-close');
    if (btnNotesToggle && this.notesDrawer) btnNotesToggle.addEventListener('click', () => this.notesDrawer.classList.toggle('open'));
    if (btnNotesClose && this.notesDrawer) btnNotesClose.addEventListener('click', () => this.notesDrawer.classList.remove('open'));

    // RIPA controls
    const selRipa = document.getElementById('select-ripa-scenario');
    if (selRipa) {
      selRipa.addEventListener('change', (e) => {
        this.loadRipaScenario(e.target.value);
      });
    }

    const pillsBar = document.getElementById('ripa-pills-bar');
    if (pillsBar) {
      pillsBar.addEventListener('click', (e) => {
        const pill = e.target.closest('.ripa-pill');
        if (pill) {
          this.loadRipaScenario(pill.getAttribute('data-key'));
        }
      });
    }

    const btnPrev = document.getElementById('btn-ripa-prev');
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        const currIdx = this.ripa.getCurrentIndex();
        const keys = this.ripa.getScenarioKeys();
        const nextIdx = (currIdx - 1 + keys.length) % keys.length;
        this.loadRipaScenario(keys[nextIdx]);
      });
    }

    const btnNext = document.getElementById('btn-ripa-next');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const currIdx = this.ripa.getCurrentIndex();
        const keys = this.ripa.getScenarioKeys();
        const nextIdx = (currIdx + 1) % keys.length;
        this.loadRipaScenario(keys[nextIdx]);
      });
    }

    const btnReset = document.getElementById('btn-ripa-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (this.otherVessel) this.otherVessel.resetPosition();
        this.loadRipaScenario(this.ripa.currentScenarioKey);
      });
    }

    // Anchor sliders
    const sDepth = document.getElementById('slider-anchor-depth');
    const sRode = document.getElementById('slider-anchor-rode');
    const sWind = document.getElementById('slider-anchor-wind');
    const sCurr = document.getElementById('slider-anchor-curr');

    if (sDepth) sDepth.addEventListener('input', (e) => {
      this.anchor.setParameters(+e.target.value, this.anchor.rodeLength);
      this.updateAnchorUI();
    });
    if (sRode) sRode.addEventListener('input', (e) => {
      this.anchor.setParameters(this.anchor.depth, +e.target.value);
      this.updateAnchorUI();
    });
    if (sWind) sWind.addEventListener('input', (e) => {
      this.anchor.setEnvironmentForces(+e.target.value, this.anchor.currentDir, this.anchor.currentSpeed);
      this.updateAnchorUI();
    });
    if (sCurr) sCurr.addEventListener('input', (e) => {
      this.anchor.setEnvironmentForces(this.anchor.windDir, +e.target.value, this.anchor.currentSpeed);
      this.updateAnchorUI();
    });

    // Manejador de Clima Rioplatense integrado en la sección Viento
    const handleWeatherPreset = (pKey) => {
      document.querySelectorAll('.btn-weather-quick').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-preset') === pKey);
      });

      if (pKey === 'custom') {
        activateCustomWeather();
        return;
      }

      const preset = this.weather.setPreset(pKey);
      if (preset) {
        if (sliderWindDir) sliderWindDir.value = preset.windDir;
        if (sliderWindSpd) sliderWindSpd.value = preset.windSpd;
        this.applyAutoTrim();

        const info = document.getElementById('weather-info-box');
        if (info) {
          const reefNote = this.weather.reefingLevel === 1 
            ? ' <em>[1° Rizo Tomado: Área reducida y escora aminorada]</em>'
            : (this.weather.reefingLevel === 2 ? ' <em>[2° Rizo Tomado: Tormentín y máxima estabilidad]</em>' : '');
          info.innerHTML = `🌪️ <strong>${preset.name}:</strong> ${preset.description} 💡 <strong>Consejo Timonel:</strong> ${preset.nauticalAdvice}${reefNote}`;
        }
      }
      this.update();
    };

    document.querySelectorAll('.btn-weather-quick').forEach(btn => {
      btn.addEventListener('click', () => {
        handleWeatherPreset(btn.getAttribute('data-preset'));
      });
    });

    // Manejador de Rizado de Velas (Mayor y Foque)
    const handleReefing = (rLevel) => {
      document.querySelectorAll('.btn-reef-quick').forEach(b => {
        b.classList.toggle('active', +b.getAttribute('data-reef') === rLevel);
      });
      this.weather.setReefing(rLevel);

      const info = document.getElementById('weather-info-box');
      if (info) {
        const reefText = rLevel === 0 
          ? '⛵ <strong>Velas desplegadas al 100%:</strong> Superficie vélica completa para vientos moderados.'
          : (rLevel === 1 
              ? '⚙️ <strong>1° Rizo Tomado (-30% superficie):</strong> Centro vélico más bajo, menor brazo de palanca y reducción inmediata de escora.'
              : '⛈️ <strong>2° Rizo Tomado (-60% superficie):</strong> Aparejo de temporal para vientos duros (Pampero/Sudestada). Máxima seguridad.');
        info.innerHTML = reefText;
      }

      this.update();
    };

    document.querySelectorAll('.btn-reef-quick').forEach(btn => {
      btn.addEventListener('click', () => {
        handleReefing(+btn.getAttribute('data-reef'));
      });
    });
  }

  _showPanel(panel, displayType = 'flex') {
    if (!panel) return;
    panel.style.display = displayType;
    panel.classList.remove('panel-entering');
    void panel.offsetWidth; // Forzar reflow para reiniciar animación CSS
    panel.classList.add('panel-entering');
  }

  setMode(mode) {
    this.currentMode = mode;

    // Actualizar tabs accesibles
    const modeTabs = document.querySelectorAll('.mode-tab');
    modeTabs.forEach(t => {
      const isActive = t.getAttribute('data-mode') === mode;
      t.classList.toggle('active', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    // Ocultar todas las tarjetas antes de mostrar el modo activo
    [this.compassWidget, this.telemetryCard, this.ripaCard, this.ialaCard, this.anchorCard, this.controlsCard].forEach(c => {
      if (c) c.style.display = 'none';
    });

    // Desactivar subsistemas especializados defensivamente
    if (this.otherVessel && typeof this.otherVessel.setupScenario === 'function') {
      this.otherVessel.setupScenario({ active: false });
    }
    if (this.iala && typeof this.iala.setActive === 'function') {
      this.iala.setActive(false);
    }
    if (this.anchor && typeof this.anchor.setActive === 'function') {
      this.anchor.setActive(false);
    }

    if (mode === 'wind') {
      this._showPanel(this.compassWidget, 'block');
      this._showPanel(this.telemetryCard, 'flex');
      this._showPanel(this.controlsCard, 'flex');
      this.boat.group.position.set(0, 0, 0);
      this.env.setNightMode(false);
      this.boat.setNavigationLights(false, false);
      if (this.engine) {
        this.engine.camera.position.set(12, 7, 16);
        this.engine.controls.target.set(0, 1.8, 0);
      }
    } else if (mode === 'ripa') {
      this._showPanel(this.ripaCard, 'flex');
      this.loadRipaScenario(this.ripa.currentScenarioKey);
    } else if (mode === 'iala') {
      this._showPanel(this.ialaCard, 'flex');
      this._showPanel(this.controlsCard, 'flex');
      this.boat.group.position.set(0, 0, 0);
      if (this.iala) this.iala.setActive(true);
      if (this.engine) {
        this.engine.camera.position.set(16, 12, 28);
        this.engine.controls.target.set(0, 2, 8);
      }
    } else if (mode === 'anchor') {
      this._showPanel(this.anchorCard, 'flex');
      if (this.anchor) this.anchor.setActive(true);
      this.updateAnchorUI();
      if (this.engine) {
        this.engine.camera.position.set(18, 16, 26);
        this.engine.controls.target.set(0, 0, 8);
      }
    }
  }

  updateRipaProgress() {
    const badge = document.getElementById('ripa-progress-badge');
    if (!badge || !this.ripa) return;
    const list = this.ripa.getScenarioList();
    const completedCount = list.filter(s => this.ripa.isCompleted(s.id)).length;
    badge.textContent = `${completedCount}/${list.length} resueltos ✓`;
    if (completedCount === list.length) {
      badge.textContent = '🏆 10/10 ¡Aprobado PNA!';
      badge.style.background = 'rgba(16, 185, 129, 0.3)';
    }
  }

  loadRipaScenario(key) {
    const scen = this.ripa.loadScenario(key);
    if (!scen) return;

    this.boat.group.position.set(0, 0, 0);

    const badge = document.getElementById('ripa-badge');
    const banner = document.getElementById('ripa-tactical-banner');
    const desc = document.getElementById('ripa-desc');
    const question = document.getElementById('ripa-question');
    const optionsGroup = document.getElementById('ripa-options');
    const feedback = document.getElementById('ripa-feedback');
    const select = document.getElementById('select-ripa-scenario');

    if (badge) badge.textContent = `⚖️ EJERCICIO ${scen.number} DE 10 — ${scen.badge}`;
    if (select) select.value = key;

    if (banner) {
      banner.textContent = scen.ownBoat.roleLabel;
      banner.className = `ripa-tactical-banner role-${scen.ownBoat.role}`;
    }

    if (desc) desc.textContent = scen.description;
    if (question) question.textContent = scen.question;
    if (feedback) {
      feedback.textContent = '';
      feedback.className = 'ripa-feedback';
      feedback.style.display = 'none';
    }

    this.updateRipaProgress();

    const list = this.ripa.getScenarioList();
    const pills = document.querySelectorAll('.ripa-pill');
    pills.forEach(p => {
      const pKey = p.getAttribute('data-key');
      p.classList.toggle('active', pKey === key);
      const isDone = this.ripa.isCompleted(pKey);
      p.classList.toggle('completed', isDone);
      if (isDone) {
        p.textContent = '✓';
      } else {
        const found = list.find(s => s.id === pKey);
        p.textContent = found ? found.number : p.textContent;
      }
    });

    if (scen.wind) {
      this.wind.setTrueWind(scen.wind.directionDeg, scen.wind.speedKts);
    }
    if (scen.ownBoat) {
      this.wind.setBoatHeading(scen.ownBoat.headingDeg);
      this.boat.setNavigationLights(scen.nightMode || false, scen.ownBoat.underEngine || false);
    }
    this.applyAutoTrim();

    const isNight = !!scen.nightMode;
    this.env.setNightMode(isNight);
    const btnNight = document.getElementById('btn-night-toggle');
    if (btnNight) {
      btnNight.textContent = isNight ? '☀️ Modo Día' : '🌙 Modo Noche';
      btnNight.classList.toggle('active', isNight);
    }

    if (this.engine && scen.camera) {
      this.engine.camera.position.set(...scen.camera.position);
      this.engine.controls.target.set(...scen.camera.target);
    }

    if (optionsGroup && scen.options) {
      optionsGroup.innerHTML = scen.options.map((opt, idx) => `
        <button class="ripa-opt-btn" data-idx="${idx}" aria-label="Opción ${idx + 1}">${opt.text}</button>
      `).join('');

      // Delegación de eventos en optionsGroup para evitar múltiples listeners acumulados
      optionsGroup.onclick = (e) => {
        const btn = e.target.closest('.ripa-opt-btn');
        if (!btn) return;
        const idx = +btn.getAttribute('data-idx');
        const opt = scen.options[idx];
        if (!opt) return;

        optionsGroup.querySelectorAll('.ripa-opt-btn').forEach(b => {
          b.classList.remove('opt-correct', 'opt-wrong');
        });

        if (opt.correct) {
          btn.classList.add('opt-correct');
          if (feedback) {
            feedback.textContent = opt.feedback;
            feedback.className = 'ripa-feedback feedback-correct';
          }
          this.ripa.markCompleted(key);

          const activePill = document.querySelector(`.ripa-pill[data-key="${key}"]`);
          if (activePill) {
            activePill.classList.add('completed');
            activePill.textContent = '✓';
          }
          this.updateRipaProgress();
        } else {
          btn.classList.add('opt-wrong');
          if (feedback) {
            feedback.textContent = opt.feedback;
            feedback.className = 'ripa-feedback feedback-wrong';
          }
        }
      };
    }

    this.update();
  }


  updateAnchorUI() {
    if (!this.anchor) return;
    const status = this.anchor.getStatus();

    const banner = document.getElementById('anchor-status-banner');
    const scopeVal = document.getElementById('anchor-scope-val');
    const radiusVal = document.getElementById('anchor-radius-val');
    const advice = document.getElementById('anchor-advice');
    const lblDepth = document.getElementById('lbl-anchor-depth');
    const lblRode = document.getElementById('lbl-anchor-rode');
    const lblWind = document.getElementById('lbl-anchor-wind');
    const lblCurr = document.getElementById('lbl-anchor-curr');

    if (banner) {
      banner.textContent = status.statusText;
      banner.className = `anchor-status-banner ${status.statusClass}`;
    }
    if (scopeVal) scopeVal.textContent = `${status.scope}:1`;
    if (radiusVal) radiusVal.textContent = `${status.swingRadius} m`;
    if (advice) advice.textContent = status.explanation;

    if (lblDepth) lblDepth.textContent = `${this.anchor.depth.toFixed(1)} m`;
    if (lblRode) lblRode.textContent = `${this.anchor.rodeLength} m`;
    if (lblWind) lblWind.textContent = `${this.anchor.windDir}°`;
    if (lblCurr) lblCurr.textContent = `${this.anchor.currentDir}° (${this.anchor.currentSpeed} kts)`;
  }

  applyAutoTrim() {
    const ideal = this.wind.optimalMainTrim;
    this.wind.setSheetTrim(ideal, ideal);
    const sliderMain = document.getElementById('slider-main-sheet');
    const sliderJib = document.getElementById('slider-jib-sheet');
    if (sliderMain) sliderMain.value = Math.round(ideal * 100);
    if (sliderJib) sliderJib.value = Math.round(ideal * 100);
  }

  update() {
    const headingRad = THREE.MathUtils.degToRad(-this.wind.boatHeading);
    this.boat.setHeading(headingRad);
    this.boat.setHeel(this.wind.heelingAngle);

    const side = this.wind.tackSide === 'estribor' ? 1 : -1;
    this.boat.sails.setSailTrim(
      this.wind.mainSheetTrim,
      this.wind.jibSheetTrim,
      side,
      this.wind.flutterIntensity
    );

    const needleWind = document.getElementById('needle-wind');
    const needleBoat = document.getElementById('needle-boat');
    if (needleWind) needleWind.setAttribute('transform', `rotate(${this.wind.trueWindDirection} 100 100)`);
    if (needleBoat) needleBoat.setAttribute('transform', `rotate(${this.wind.boatHeading} 100 100)`);

    const valTwd = document.getElementById('val-twd');
    const valHdg = document.getElementById('val-hdg');
    const compassTws = document.getElementById('compass-tws');
    if (valTwd) valTwd.textContent = `${this.wind.trueWindDirection}°`;
    if (valHdg) valHdg.textContent = `${this.wind.boatHeading}°`;
    if (compassTws) compassTws.textContent = `${this.wind.trueWindSpeed} kts`;

    const telPoint = document.getElementById('tel-point');
    const telSpeed = document.getElementById('tel-speed');
    const telHeel = document.getElementById('tel-heel');
    const telAppWind = document.getElementById('tel-app-wind');
    const telTack = document.getElementById('tel-tack');
    const telTackRule = document.getElementById('tel-tack-rule');
    const telEval = document.getElementById('tel-eval');

    if (telPoint) {
      telPoint.textContent = this.wind.pointOfSail;
      telPoint.className = `tel-point-badge ${this.wind.pointOfSail.includes('Zona Muerta') ? 'danger' : 'active'}`;
    }
    if (telSpeed) telSpeed.textContent = this.wind.boatSpeed.toFixed(1);
    if (telHeel) telHeel.textContent = `${Math.abs(Math.round(THREE.MathUtils.radToDeg(this.wind.heelingAngle)))}°`;
    if (telAppWind) telAppWind.textContent = this.wind.apparentWindSpeed.toFixed(1);

    if (telTack) {
      telTack.textContent = this.wind.tackSide === 'estribor' ? 'Estribor Amurado' : 'Babor Amurado';
    }
    if (telTackRule) {
      if (this.wind.tackSide === 'estribor') {
        telTackRule.textContent = '🟢 PREFERENCIA (RIPA Regla 12)';
        telTackRule.style.color = '#34d399';
      } else {
        telTackRule.textContent = '🔴 CEDE EL PASO (RIPA Regla 12)';
        telTackRule.style.color = '#f87171';
      }
    }
    if (telEval) {
      if (this.weather && this.weather.reefingLevel > 0) {
        telEval.textContent = `Vela rizada (${this.weather.reefingLevel === 1 ? '1° Rizo -30%' : '2° Rizo -60%'}): Escora reducida y adrizamiento de seguridad. ${this.wind.trimEvaluation}`;
      } else {
        telEval.textContent = this.wind.trimEvaluation;
      }
      telEval.className = `tel-eval-box ${this.wind.flutterIntensity > 0.3 ? 'eval-warning' : 'eval-good'}`;
    }

    const lblHdg = document.getElementById('lbl-hdg');
    const lblWindDir = document.getElementById('lbl-wind-dir');
    const lblWindSpd = document.getElementById('lbl-wind-spd');
    const lblMainSheet = document.getElementById('lbl-main-sheet');
    const lblJibSheet = document.getElementById('lbl-jib-sheet');

    if (lblHdg) lblHdg.textContent = `${this.wind.boatHeading}°`;
    if (lblWindDir) lblWindDir.textContent = `${this.wind.trueWindDirection}°`;
    if (lblWindSpd) lblWindSpd.textContent = `${this.wind.trueWindSpeed} kts`;
    if (lblMainSheet) lblMainSheet.textContent = `${Math.round(this.wind.mainSheetTrim * 100)}%`;
    if (lblJibSheet) lblJibSheet.textContent = `${Math.round(this.wind.jibSheetTrim * 100)}%`;

    const sliderHdg = document.getElementById('slider-hdg');
    if (sliderHdg && document.activeElement !== sliderHdg) sliderHdg.value = this.wind.boatHeading;

    const dbiSummary = document.getElementById('dbi-summary');
    if (dbiSummary) {
      dbiSummary.textContent = `${this.wind.boatHeading}° · ${this.wind.trueWindSpeed} kts · ${this.wind.boatSpeed.toFixed(1)} kts`;
    }
  }
}
