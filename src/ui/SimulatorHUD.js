import * as THREE from 'three';
import { COURSE_NOTES } from './CourseNotes.js';
import { RIPA_SCENARIOS } from '../simulation/RipaEngine.js';
import { WEATHER_PRESETS } from '../simulation/WeatherSystem.js';

export class SimulatorHUD {
  constructor(windSystem, boat, environment, otherVessel, ripaEngine, ialaSystem, anchorSystem, weatherSystem, engine = null) {
    this.wind = windSystem;
    this.boat = boat;
    this.env = environment;
    this.otherVessel = otherVessel;
    this.ripa = ripaEngine;
    this.iala = ialaSystem;
    this.anchor = anchorSystem;
    this.weather = weatherSystem;
    this.engine = engine;

    this.currentMode = 'wind'; // 'wind', 'ripa', 'iala', 'anchor', 'weather'

    this.initDOM();
    this.populateRipaNavigation();
    this.bindEvents();
    this.update();
  }

  initDOM() {
    // 1. Barra superior con los 5 modos educativos oficiales PNA
    this.header = document.createElement('header');
    this.header.className = 'sim-header';
    this.header.innerHTML = `
      <div class="sim-brand">
        <div class="sim-badge">⚓ CURSO DE TIMONEL PNA</div>
        <h1>Simulador Náutico 3D</h1>
      </div>
      <div class="sim-mode-selector">
        <button class="mode-tab active" data-mode="wind">🧭 Viento</button>
        <button class="mode-tab" data-mode="ripa">⚖️ RIPA</button>
        <button class="mode-tab" data-mode="iala">📍 Boyado B</button>
        <button class="mode-tab" data-mode="anchor">⚓ Fondeo</button>
        <button class="mode-tab" data-mode="weather">⛈️ Meteorología</button>
      </div>
      <div class="sim-header-actions">
        <button id="btn-night-toggle" class="sim-btn sim-btn-night" title="Alternar modo noche y luces reglamentarias de navegación">🌙 Modo Noche</button>
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
        <div class="anchor-slider-row">
          <label>Profundidad (Sonda): <strong id="lbl-anchor-depth">4.0 m</strong></label>
          <input type="range" id="slider-anchor-depth" min="2" max="10" step="0.5" value="4">
        </div>
        <div class="anchor-slider-row">
          <label>Cadena/Cabo Filado: <strong id="lbl-anchor-rode">24 m</strong></label>
          <input type="range" id="slider-anchor-rode" min="6" max="50" step="1" value="24">
        </div>
        <div class="anchor-slider-row">
          <label>Dirección del Viento: <strong id="lbl-anchor-wind">90°</strong></label>
          <input type="range" id="slider-anchor-wind" min="0" max="359" value="90">
        </div>
        <div class="anchor-slider-row">
          <label>Corriente de Marea: <strong id="lbl-anchor-curr">120° (1.2 kts)</strong></label>
          <input type="range" id="slider-anchor-curr" min="0" max="359" value="120">
        </div>
      </div>
      <p class="anchor-advice" id="anchor-advice">
        Catenaria óptima. La tracción horizontal clava las uñas Danforth profundamente en el fango.
      </p>
    `;
    document.body.appendChild(this.anchorCard);

    // 7. Tarjeta interactiva de Meteorología Rioplatense (Modo Meteorología)
    this.weatherCard = document.createElement('div');
    this.weatherCard.className = 'sim-weather-card';
    this.weatherCard.style.display = 'none';
    this.weatherCard.innerHTML = `
      <div class="weather-header">
        <span class="weather-badge">⛈️ METEOROLOGÍA RIOPLATENSE & RIZADO</span>
      </div>
      <div class="weather-presets-grid">
        <button class="weather-btn" data-preset="sudestada">🌪️ Sudestada (SE 26 kts)</button>
        <button class="weather-btn" data-preset="pampero">⚡ Pampero (SW 34 kts)</button>
        <button class="weather-btn" data-preset="calma_norte">☀️ Calma Norte (Bochorno)</button>
        <button class="weather-btn active" data-preset="virazon">🌊 Virazón Térmica (E 15 kts)</button>
      </div>
      <div class="weather-metrics-bar">
        <div class="w-metric">
          <span class="w-val" id="w-pressure">1014 hPa</span>
          <span class="w-lbl">Barómetro</span>
        </div>
        <div class="w-metric">
          <span class="w-val" id="w-temp">22°C</span>
          <span class="w-lbl">Temperatura</span>
        </div>
        <div class="w-metric">
          <span class="w-val" id="w-surge">Normal</span>
          <span class="w-lbl">Nivel del Río</span>
        </div>
      </div>
      <div class="reefing-section">
        <div class="reefing-title">⚙️ Maniobra de Rizado (Mayor y Foque)</div>
        <div class="reefing-btn-group">
          <button class="reefing-btn active" data-reef="0">Todo el Paño</button>
          <button class="reefing-btn" data-reef="1">1° Rizo (-30%)</button>
          <button class="reefing-btn" data-reef="2">2° Rizo (-60%)</button>
        </div>
      </div>
      <p class="weather-desc-box" id="weather-desc">
        Brisa térmica regular de la tarde. Condiciones ideales con aparejo completo.
      </p>
    `;
    document.body.appendChild(this.weatherCard);

    // 8. Panel de Control Táctil Inferior (Timón, Viento y Escotas)
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

      <div class="ctrl-row-weather">
        <span class="ctrl-label">Clima:</span>
        <div class="ctrl-weather-btns">
          <button class="btn-weather-quick active" data-preset="virazon">🌊 Virazón (E 15k)</button>
          <button class="btn-weather-quick" data-preset="sudestada">🌪️ Sudestada (SE 26k)</button>
          <button class="btn-weather-quick" data-preset="pampero">⚡ Pampero (SW 34k)</button>
          <button class="btn-weather-quick" data-preset="calma_norte">☀️ Calma Norte</button>
        </div>
        <span class="ctrl-label" style="margin-left:6px;">Rizos:</span>
        <div class="ctrl-reef-btns">
          <button class="btn-reef-quick active" data-reef="0">100%</button>
          <button class="btn-reef-quick" data-reef="1">1° Rizo</button>
          <button class="btn-reef-quick" data-reef="2">2° Rizo</button>
        </div>
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

    // 9. Drawer de Apuntes
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

    // Sliders Viento y Barco
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

    // Weather presets handler (sincroniza panel de control y tarjeta de clima)
    const handleWeatherPreset = (pKey) => {
      document.querySelectorAll('.weather-btn, .btn-weather-quick').forEach(b => {
        b.classList.toggle('active', b.getAttribute('data-preset') === pKey);
      });
      const preset = this.weather.setPreset(pKey);
      if (preset) {
        const sliderWindDir = document.getElementById('slider-wind-dir');
        const sliderWindSpd = document.getElementById('slider-wind-spd');
        if (sliderWindDir) sliderWindDir.value = preset.windDir;
        if (sliderWindSpd) sliderWindSpd.value = preset.windSpd;
        this.applyAutoTrim();
      }
      this.updateWeatherUI();
      this.update();
    };

    document.querySelectorAll('.weather-btn, .btn-weather-quick').forEach(btn => {
      btn.addEventListener('click', () => {
        handleWeatherPreset(btn.getAttribute('data-preset'));
      });
    });

    // Reefing buttons handler (sincroniza panel de control y tarjeta de clima)
    const handleReefing = (rLevel) => {
      document.querySelectorAll('.reefing-btn, .btn-reef-quick').forEach(b => {
        b.classList.toggle('active', +b.getAttribute('data-reef') === rLevel);
      });
      this.weather.setReefing(rLevel);
      this.update();
    };

    document.querySelectorAll('.reefing-btn, .btn-reef-quick').forEach(btn => {
      btn.addEventListener('click', () => {
        handleReefing(+btn.getAttribute('data-reef'));
      });
    });
  }

  setMode(mode) {
    this.currentMode = mode;

    // Resetear visibilidades de tarjetas
    this.compassWidget.style.display = 'none';
    this.telemetryCard.style.display = 'none';
    this.ripaCard.style.display = 'none';
    this.ialaCard.style.display = 'none';
    this.anchorCard.style.display = 'none';
    this.weatherCard.style.display = 'none';
    this.controlsCard.style.display = 'none';

    // Desactivar sistemas especializados
    this.otherVessel.setupScenario({ active: false });
    this.iala.setActive(false);
    this.anchor.setActive(false);

    if (mode === 'wind') {
      this.compassWidget.style.display = 'block';
      this.telemetryCard.style.display = 'flex';
      this.controlsCard.style.display = 'flex';
      this.boat.group.position.set(0, 0, 0);
      this.env.setNightMode(false);
      this.boat.setNavigationLights(false, false);
      if (this.engine) {
        this.engine.camera.position.set(12, 7, 16);
        this.engine.controls.target.set(0, 1.8, 0);
      }
    } else if (mode === 'ripa') {
      this.ripaCard.style.display = 'flex';
      this.loadRipaScenario(this.ripa.currentScenarioKey);
    } else if (mode === 'iala') {
      this.ialaCard.style.display = 'flex';
      this.controlsCard.style.display = 'flex';
      this.boat.group.position.set(0, 0, 0);
      this.iala.setActive(true);
      if (this.engine) {
        this.engine.camera.position.set(16, 12, 28);
        this.engine.controls.target.set(0, 2, 8);
      }
    } else if (mode === 'anchor') {
      this.anchorCard.style.display = 'flex';
      this.anchor.setActive(true);
      this.updateAnchorUI();
      if (this.engine) {
        this.engine.camera.position.set(18, 16, 26);
        this.engine.controls.target.set(0, 0, 8);
      }
    } else if (mode === 'weather') {
      this.weatherCard.style.display = 'flex';
      this.telemetryCard.style.display = 'flex';
      this.controlsCard.style.display = 'flex';
      this.boat.group.position.set(0, 0, 0);
      this.weather.setPreset(this.weather.currentPresetKey);
      this.updateWeatherUI();
      if (this.engine) {
        this.engine.camera.position.set(12, 6, 16);
        this.engine.controls.target.set(0, 1.5, 0);
      }
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

  updateWeatherUI() {
    if (!this.weather) return;
    const p = this.weather.getCurrentPreset();

    const pressure = document.getElementById('w-pressure');
    const temp = document.getElementById('w-temp');
    const surge = document.getElementById('w-surge');
    const desc = document.getElementById('weather-desc');

    if (pressure) pressure.textContent = `${p.pressureHpa} hPa`;
    if (temp) temp.textContent = `${p.tempC}°C`;
    if (surge) {
      if (p.waterSurge > 0) surge.textContent = `+${p.waterSurge}m (Repunte)`;
      else if (p.waterSurge < 0) surge.textContent = `${p.waterSurge}m (Bajante)`;
      else surge.textContent = 'Normal';
    }
    if (desc) desc.textContent = `${p.description} ${p.nauticalAdvice}`;

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
