import * as THREE from 'three';
import { COURSE_NOTES } from './CourseNotes.js';
import { RIPA_SCENARIOS } from '../simulation/RipaEngine.js';

export class SimulatorHUD {
  constructor(windSystem, boat, environment, otherVessel, ripaEngine, ialaSystem, engine = null) {
    this.wind = windSystem;
    this.boat = boat;
    this.env = environment;
    this.otherVessel = otherVessel;
    this.ripa = ripaEngine;
    this.iala = ialaSystem;
    this.engine = engine;

    this.currentMode = 'wind'; // 'wind', 'ripa', 'iala'

    this.initDOM();
    this.populateRipaNavigation();
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
        <button id="btn-notes-toggle" class="sim-btn" title="Ver apuntes y glosario del curso">📖 Apuntes PNA</button>
        <a href="index.html" class="sim-btn sim-btn-link" title="Volver a la vista de partes y despiece 3D">⛵ Nomenclatura ➔</a>
      </div>
    `;
    document.body.appendChild(this.header);

    // 2. Widget de Rosa Náutica y Viento (Aparece en Modo Viento)
    this.compassWidget = document.createElement('div');
    this.compassWidget.className = 'sim-compass-card';
    this.compassWidget.innerHTML = `
      <div class="compass-header">
        <span>Rosa de los Vientos</span>
        <span class="compass-legend-tws" id="compass-tws">14 kts</span>
      </div>
      <div class="compass-wrap">
        <svg viewBox="0 0 200 200" class="compass-svg">
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
          <circle cx="100" cy="100" r="75" fill="none" stroke="rgba(56,189,248,0.15)" stroke-width="1" stroke-dasharray="2,4"/>
          
          <!-- Graduación cardinal -->
          <text x="100" y="24" text-anchor="middle" class="c-cardinal north">N (0°)</text>
          <text x="182" y="104" text-anchor="middle" class="c-cardinal">E (90°)</text>
          <text x="100" y="186" text-anchor="middle" class="c-cardinal">S (180°)</text>
          <text x="20" y="104" text-anchor="middle" class="c-cardinal">W (270°)</text>

          <!-- Zona muerta (no go zone) sombreada -->
          <path d="M 100 100 L 70 28 A 90 90 0 0 1 130 28 Z" fill="rgba(239,68,68,0.15)"/>

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
        <div class="compass-legend-item">
          <span class="legend-dot cyan"></span> Viento: <strong id="val-twd">0°</strong>
        </div>
        <div class="compass-legend-item">
          <span class="legend-dot gold"></span> Rumbo: <strong id="val-hdg">0°</strong>
        </div>
      </div>
      <div class="compass-subtext">Viento aparente y sustentación en tiempo real</div>
    `;
    document.body.appendChild(this.compassWidget);

    // 3. Tarjeta de Telemetría Dinámica Náutica
    this.telemetryCard = document.createElement('div');
    this.telemetryCard.className = 'sim-telemetry-card';
    this.telemetryCard.innerHTML = `
      <div class="tel-row-point">
        <span class="tel-label">Punto de la Vela:</span>
        <span class="tel-point-badge danger" id="tel-point">Zona Muerta (En Facha)</span>
      </div>
      <div class="tel-metrics-grid">
        <div class="metric-box">
          <span class="m-val" id="tel-speed">0.0</span>
          <span class="m-unit">NUDOS (VELOCIDAD)</span>
        </div>
        <div class="metric-box">
          <span class="m-val" id="tel-heel">0°</span>
          <span class="m-unit">ESCORA</span>
        </div>
        <div class="metric-box">
          <span class="m-val" id="tel-app-wind">14.0</span>
          <span class="m-unit">VIENTO APARENTE</span>
        </div>
        <div class="metric-box">
          <span class="m-val" id="tel-tack">Estribor</span>
          <span class="m-unit" id="tel-tack-rule">🟢 PREFERENCIA (RIPA 12)</span>
        </div>
      </div>
      <div class="tel-eval-box" id="tel-eval">
        Barco proa al viento. Las velas flamean violentamente.
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
          <span class="ripa-badge" id="ripa-badge">⚖️ EJERCICIO 1 DE 10</span>
          <div class="ripa-nav-actions">
            <button id="btn-ripa-prev" class="ripa-nav-btn" title="Ejercicio anterior">◀ Ant</button>
            <button id="btn-ripa-next" class="ripa-nav-btn" title="Siguiente ejercicio">Sig ▶</button>
            <button id="btn-ripa-reset" class="ripa-nav-btn" title="Reiniciar posiciones de los barcos">🔄 Repetir</button>
          </div>
        </div>

        <div class="ripa-pills-bar" id="ripa-pills-bar"></div>

        <select id="select-ripa-scenario" class="ripa-select" aria-label="Seleccionar caso RIPA"></select>
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

    // 6. Panel de Control Táctil Inferior (Timón, Viento y Escotas)
    this.controlsCard = document.createElement('div');
    this.controlsCard.className = 'sim-controls-panel';
    this.controlsCard.innerHTML = `
      <div class="ctrl-row-presets">
        <span class="ctrl-label">Rumbos de Examen:</span>
        <div class="ctrl-preset-btns">
          <button class="btn-preset active" data-heading="0">Proa Viento</button>
          <button class="btn-preset" data-heading="45">Ceñida</button>
          <button class="btn-preset" data-heading="90">Través</button>
          <button class="btn-preset" data-heading="135">Un Largo</button>
          <button class="btn-preset" data-heading="180">Popa</button>
        </div>
        <button id="btn-auto-trim" class="btn-auto-trim" title="Cazar/filar automáticamente para máximo rendimiento">🎯 Trimado Óptimo</button>
      </div>

      <div class="ctrl-row-sliders">
        <div class="slider-card">
          <label>Rumbo Barco: <strong id="lbl-hdg">0°</strong></label>
          <input type="range" id="slider-hdg" min="0" max="359" value="0">
        </div>
        <div class="slider-card">
          <label>Dirección Viento: <strong id="lbl-wind-dir">0°</strong></label>
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

  populateRipaNavigation() {
    const pillsContainer = document.getElementById('ripa-pills-bar');
    const select = document.getElementById('select-ripa-scenario');
    if (!pillsContainer || !select) return;

    const list = this.ripa.getScenarioList();
    pillsContainer.innerHTML = '';
    select.innerHTML = '';

    list.forEach(scen => {
      // Pill
      const pill = document.createElement('button');
      pill.className = 'ripa-pill';
      pill.setAttribute('data-key', scen.id);
      pill.setAttribute('title', `${scen.number}. ${scen.badge} - ${scen.title}`);
      pill.textContent = scen.number;
      pillsContainer.appendChild(pill);

      // Option in dropdown
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

    // RIPA scenario selector & navigation
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
          const key = pill.getAttribute('data-key');
          this.loadRipaScenario(key);
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
      this.env.setNightMode(false);
      this.boat.setNavigationLights(false, false);
      const btnNight = document.getElementById('btn-night-toggle');
      if (btnNight) {
        btnNight.textContent = '🌙 Modo Noche (RIPA)';
        btnNight.classList.remove('active');
      }
    } else if (mode === 'ripa') {
      this.compassWidget.style.display = 'none';
      this.telemetryCard.style.display = 'none';
      this.ripaCard.style.display = 'flex';
      this.ialaCard.style.display = 'none';
      this.controlsCard.style.display = 'none';
      this.iala.setActive(false);
      this.loadRipaScenario(this.ripa.currentScenarioKey);
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

    // 1. Sincronizar encabezado, badge y selector
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

    // Sincronizar píldoras numeradas
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

    // 2. Configurar el estado 3D exacto del escenario
    if (scen.wind) {
      this.wind.setTrueWind(scen.wind.directionDeg, scen.wind.speedKts);
    }
    if (scen.ownBoat) {
      this.wind.setBoatHeading(scen.ownBoat.headingDeg);
      this.boat.setNavigationLights(scen.nightMode || false, scen.ownBoat.underEngine || false);
    }
    this.applyAutoTrim();

    // Sincronizar iluminación día/noche
    const isNight = !!scen.nightMode;
    this.env.setNightMode(isNight);
    const btnNight = document.getElementById('btn-night-toggle');
    if (btnNight) {
      btnNight.textContent = isNight ? '☀️ Modo Día' : '🌙 Modo Noche (RIPA)';
      btnNight.classList.toggle('active', isNight);
    }

    // Sincronizar cámara 3D si está disponible
    if (this.engine && scen.camera) {
      this.engine.camera.position.set(...scen.camera.position);
      this.engine.controls.target.set(...scen.camera.target);
    }

    // 3. Renderizar opciones del cuestionario
    if (optionsGroup && scen.options) {
      optionsGroup.innerHTML = scen.options.map((opt, idx) => `
        <button class="ripa-opt-btn" data-idx="${idx}">${opt.text}</button>
      `).join('');

      optionsGroup.querySelectorAll('.ripa-opt-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = +btn.getAttribute('data-idx');
          const opt = scen.options[idx];

          optionsGroup.querySelectorAll('.ripa-opt-btn').forEach(b => {
            b.classList.remove('opt-correct', 'opt-wrong');
          });

          if (opt.correct) {
            btn.classList.add('opt-correct');
            feedback.textContent = opt.feedback;
            feedback.className = 'ripa-feedback feedback-correct';
            this.ripa.markCompleted(key);

            const activePill = document.querySelector(`.ripa-pill[data-key="${key}"]`);
            if (activePill) {
              activePill.classList.add('completed');
              activePill.textContent = '✓';
            }
          } else {
            btn.classList.add('opt-wrong');
            feedback.textContent = opt.feedback;
            feedback.className = 'ripa-feedback feedback-wrong';
          }
        });
      });
    }

    this.update();
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

    const sliderHdg = document.getElementById('slider-hdg');
    if (sliderHdg && document.activeElement !== sliderHdg) sliderHdg.value = this.wind.boatHeading;
  }
}
