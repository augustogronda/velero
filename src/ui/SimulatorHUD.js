import * as THREE from 'three';
import { COURSE_NOTES } from './CourseNotes.js';
import { RIPA_SCENARIOS } from '../simulation/RipaEngine.js';

export class SimulatorHUD {
  constructor(windSystem, boat, environment, otherVessel, ripaEngine, ialaSystem) {
    this.wind = windSystem;
    this.boat = boat;
    this.env = environment;
    this.otherVessel = otherVessel;
    this.ripa = ripaEngine;
    this.iala = ialaSystem;

    this.currentMode = 'wind'; // 'wind', 'ripa', 'iala'

    this.initDOM();
    this.bindEvents();
    this.update();
  }

  initDOM() {
    // 1. Barra superior
    this.header = document.createElement('header');
    this.header.className = 'sim-header';
    this.header.innerHTML = `
      <div class="sim-brand">
        <div class="sim-badge">⚓ CURSO DE TIMONEL PNA</div>
        <h1>Simulador Náutico 3D</h1>
      </div>
      <div class="sim-mode-selector">
        <button class="mode-tab active" data-mode="wind">🧭 Viento & Rumbos</button>
        <button class="mode-tab" data-mode="ripa">⚖️ Ejercicios RIPA (Cruces)</button>
        <button class="mode-tab" data-mode="iala">📍 Boyado IALA B</button>
      </div>
      <div class="sim-header-actions">
        <button id="btn-night-toggle" class="sim-btn sim-btn-night" title="Alternar modo noche y luces reglamentarias de navegación">🌙 Modo Noche (RIPA)</button>
        <a href="index.html" class="sim-btn sim-btn-link" title="Volver a la vista de partes y despiece 3D">⛵ Nomenclatura ➔</a>
      </div>
    `;
    document.body.appendChild(this.header);

    // 2. Rosa de los vientos (Modo Viento)
    this.compassWidget = document.createElement('div');
    this.compassWidget.className = 'sim-compass-card';
    this.compassWidget.innerHTML = `
      <div class="compass-header">
        <span>🧭 Rosa Náutica</span>
        <span class="compass-legend-tws" id="compass-tws">14 kts</span>
      </div>
      <div class="compass-dial-container">
        <svg class="compass-svg" viewBox="0 0 200 200" id="compass-svg">
          <circle cx="100" cy="100" r="92" class="compass-ring-outer" />
          <circle cx="100" cy="100" r="76" class="compass-ring-inner" />
          <text x="100" y="24" class="compass-cardinal" text-anchor="middle">N</text>
          <text x="180" y="105" class="compass-cardinal" text-anchor="middle">E</text>
          <text x="100" y="186" class="compass-cardinal" text-anchor="middle">S</text>
          <text x="20" y="105" class="compass-cardinal" text-anchor="middle">W</text>

          <g id="needle-wind" transform="rotate(0 100 100)">
            <line x1="100" y1="100" x2="100" y2="30" class="wind-arrow-line" />
            <polygon points="100,20 93,34 107,34" class="wind-arrow-head" />
            <text x="100" y="48" class="wind-arrow-label" text-anchor="middle">VIENTO</text>
          </g>

          <g id="needle-boat" transform="rotate(45 100 100)">
            <line x1="100" y1="100" x2="100" y2="40" class="boat-heading-line" />
            <polygon points="100,28 94,44 106,44" class="boat-heading-head" />
            <path d="M100,70 L95,115 L105,115 Z" class="boat-hull-icon" />
          </g>
        </svg>
      </div>
      <div class="compass-subtext">
        <span class="dot-wind">●</span> Viento: <strong id="val-twd">0° (N)</strong> |
        <span class="dot-boat">▲</span> Proa: <strong id="val-hdg">45°</strong>
      </div>
    `;
    document.body.appendChild(this.compassWidget);

    // 3. Tarjeta de Telemetría Náutica
    this.telemetryCard = document.createElement('div');
    this.telemetryCard.className = 'sim-telemetry-card';
    this.telemetryCard.innerHTML = `
      <div class="tel-row-point">
        <span class="tel-label">Punto de la Vela:</span>
        <span class="tel-point-badge" id="tel-point">Ceñida</span>
      </div>
      <div class="tel-metrics-grid">
        <div class="metric-box">
          <span class="m-val" id="tel-speed">5.2</span>
          <span class="m-unit">NUDOS (VELOCIDAD)</span>
        </div>
        <div class="metric-box">
          <span class="m-val" id="tel-heel">18°</span>
          <span class="m-unit">ESCORA</span>
        </div>
        <div class="metric-box">
          <span class="m-val" id="tel-app-wind">16.8</span>
          <span class="m-unit">VIENTO APARENTE</span>
        </div>
        <div class="metric-box">
          <span class="m-val" id="tel-tack">Estribor</span>
          <span class="m-unit" id="tel-tack-rule">🟢 PREFERENCIA (RIPA 12)</span>
        </div>
      </div>
      <div class="tel-eval-box" id="tel-eval">
        ¡Excelente trimado! Flujo laminar aerodinámico y velocidad óptima.
      </div>
    `;
    document.body.appendChild(this.telemetryCard);

    // 4. Tarjeta interactiva para ejercicios RIPA (Aparece en Modo RIPA)
    this.ripaCard = document.createElement('div');
    this.ripaCard.className = 'sim-ripa-card';
    this.ripaCard.style.display = 'none';
    this.ripaCard.innerHTML = `
      <div class="ripa-header">
        <span class="ripa-badge">⚖️ CASO DE EXAMEN RIPA</span>
        <select id="select-ripa-scenario" class="ripa-select">
          <option value="opposite_tacks">1. Distintas Amuras (Estribor vs Babor)</option>
          <option value="same_tack">2. Misma Amura (Barlovento / Sotavento)</option>
          <option value="overtaking">3. Buque que Alcanza</option>
          <option value="channel_commercial">4. Velero vs. Buque en Canal</option>
        </select>
      </div>
      <p class="ripa-desc" id="ripa-desc">Cargando situación...</p>
      <div class="ripa-quiz-box">
        <div class="ripa-question" id="ripa-question">¿Quién tiene derecho de paso?</div>
        <div class="ripa-options-group" id="ripa-options"></div>
        <div class="ripa-feedback" id="ripa-feedback"></div>
      </div>
    `;
    document.body.appendChild(this.ripaCard);

    // 5. Tarjeta informativa de Boyado IALA B (Aparece en Modo IALA)
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
      </div>
    `;
    document.body.appendChild(this.ialaCard);

    // 6. Panel inferior de Controles de Maniobra
    this.controlsCard = document.createElement('div');
    this.controlsCard.className = 'sim-controls-panel';
    this.controlsCard.innerHTML = `
      <div class="ctrl-row-presets">
        <span class="ctrl-group-title">Rumbos Oficiales PNA:</span>
        <div class="preset-btn-group">
          <button class="btn-preset" data-heading="0">⛔ En Facha (0°)</button>
          <button class="btn-preset active" data-heading="45">⛵ Ceñida (45°)</button>
          <button class="btn-preset" data-heading="90">⛵ Través (90°)</button>
          <button class="btn-preset" data-heading="135">⛵ Un Largo (135°)</button>
          <button class="btn-preset" data-heading="180">⛵ Popa Redonda (180°)</button>
        </div>
        <button id="btn-auto-trim" class="btn-auto-trim" title="Ajusta automáticamente las escotas al ángulo ideal">🎯 Trimado Óptimo</button>
        <button id="btn-notes-toggle" class="btn-notes-toggle" title="Abrir apuntes didácticos para examen de timonel">📖 Apuntes PNA</button>
      </div>

      <div class="ctrl-row-sliders">
        <div class="slider-card">
          <label>Rumbo de Proa: <strong id="lbl-hdg">45°</strong></label>
          <input type="range" id="slider-hdg" min="0" max="359" value="45">
        </div>
        <div class="slider-card">
          <label>Dirección Viento: <strong id="lbl-wind-dir">0° (Norte)</strong></label>
          <input type="range" id="slider-wind-dir" min="0" max="359" value="0">
        </div>
        <div class="slider-card">
          <label>Intensidad Viento: <strong id="lbl-wind-spd">14 kts</strong></label>
          <input type="range" id="slider-wind-spd" min="4" max="30" value="14">
        </div>
        <div class="slider-card">
          <label>Escota Mayor: <strong id="lbl-main-sheet">25%</strong></label>
          <input type="range" id="slider-main-sheet" min="0" max="100" value="25">
        </div>
        <div class="slider-card">
          <label>Escota Foque: <strong id="lbl-jib-sheet">25%</strong></label>
          <input type="range" id="slider-jib-sheet" min="0" max="100" value="25">
        </div>
      </div>
    `;
    document.body.appendChild(this.controlsCard);

    // 7. Drawer de Apuntes
    this.notesDrawer = document.createElement('aside');
    this.notesDrawer.className = 'sim-notes-drawer';
    this.notesDrawer.innerHTML = `
      <div class="notes-header">
        <h3>📖 Cuaderno de Estudio Náutico (PNA)</h3>
        <button id="btn-notes-close" class="btn-notes-close" aria-label="Cerrar apuntes">✕</button>
      </div>
      <div class="notes-body" id="notes-content"></div>
    `;
    document.body.appendChild(this.notesDrawer);
    this.populateNotes();
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

    // Night mode
    const btnNight = document.getElementById('btn-night-toggle');
    if (btnNight) {
      btnNight.addEventListener('click', () => {
        const night = !this.env.isNight;
        this.env.setNightMode(night);
        this.boat.setNavigationLights(night, false);
        if (this.otherVessel) this.otherVessel.setNightLights(night);
        btnNight.textContent = night ? '☀️ Modo Día' : '🌙 Modo Noche (RIPA)';
        btnNight.classList.toggle('active', night);
      });
    }

    // Sliders
    const sliderHdg = document.getElementById('slider-hdg');
    const sliderWindDir = document.getElementById('slider-wind-dir');
    const sliderWindSpd = document.getElementById('slider-wind-spd');
    const sliderMain = document.getElementById('slider-main-sheet');
    const sliderJib = document.getElementById('slider-jib-sheet');

    if (sliderHdg) sliderHdg.addEventListener('input', (e) => { this.wind.setBoatHeading(+e.target.value); this.update(); });
    if (sliderWindDir) sliderWindDir.addEventListener('input', (e) => { this.wind.setTrueWind(+e.target.value, this.wind.trueWindSpeed); this.update(); });
    if (sliderWindSpd) sliderWindSpd.addEventListener('input', (e) => { this.wind.setTrueWind(this.wind.trueWindDirection, +e.target.value); this.update(); });
    if (sliderMain) sliderMain.addEventListener('input', (e) => { this.wind.setSheetTrim(+e.target.value / 100, this.wind.jibSheetTrim); this.update(); });
    if (sliderJib) sliderJib.addEventListener('input', (e) => { this.wind.setSheetTrim(this.wind.mainSheetTrim, +e.target.value / 100); this.update(); });

    // Presets
    const presetBtns = document.querySelectorAll('.btn-preset');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const h = +btn.getAttribute('data-heading');
        sliderHdg.value = h;
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

    // RIPA scenario selector
    const selRipa = document.getElementById('select-ripa-scenario');
    if (selRipa) {
      selRipa.addEventListener('change', (e) => {
        this.loadRipaScenario(e.target.value);
      });
    }
  }

  setMode(mode) {
    this.currentMode = mode;
    if (mode === 'wind') {
      this.compassWidget.style.display = 'block';
      this.telemetryCard.style.display = 'flex';
      this.ripaCard.style.display = 'none';
      this.ialaCard.style.display = 'none';
      this.controlsCard.style.display = 'flex';
      this.otherVessel.setupScenario({ active: false });
      this.iala.setActive(false);
    } else if (mode === 'ripa') {
      this.compassWidget.style.display = 'none';
      this.telemetryCard.style.display = 'none';
      this.ripaCard.style.display = 'flex';
      this.ialaCard.style.display = 'none';
      this.controlsCard.style.display = 'flex';
      this.iala.setActive(false);
      this.loadRipaScenario(document.getElementById('select-ripa-scenario').value);
    } else if (mode === 'iala') {
      this.compassWidget.style.display = 'none';
      this.telemetryCard.style.display = 'none';
      this.ripaCard.style.display = 'none';
      this.ialaCard.style.display = 'flex';
      this.controlsCard.style.display = 'flex';
      this.otherVessel.setupScenario({ active: false });
      this.iala.setActive(true);
    }
  }

  loadRipaScenario(key) {
    const scen = this.ripa.loadScenario(key);
    if (!scen) return;

    const desc = document.getElementById('ripa-desc');
    const question = document.getElementById('ripa-question');
    const optionsGroup = document.getElementById('ripa-options');
    const feedback = document.getElementById('ripa-feedback');

    if (desc) desc.textContent = scen.description;
    if (question) question.textContent = scen.question;
    if (feedback) { feedback.textContent = ''; feedback.className = 'ripa-feedback'; }

    if (optionsGroup && scen.options) {
      optionsGroup.innerHTML = scen.options.map((opt, idx) => `
        <button class="ripa-opt-btn" data-idx="${idx}">${opt.text}</button>
      `).join('');

      optionsGroup.querySelectorAll('.ripa-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = +btn.getAttribute('data-idx');
          const opt = scen.options[idx];
          if (opt.correct) {
            feedback.textContent = opt.feedback;
            feedback.className = 'ripa-feedback feedback-correct';
          } else {
            feedback.textContent = opt.feedback;
            feedback.className = 'ripa-feedback feedback-wrong';
          }
        });
      });
    }
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
      telEval.textContent = this.wind.trimEvaluation;
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
  }
}
