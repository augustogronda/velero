import { COURSE_NOTES } from './CourseNotes.js';

export class SimulatorHUD {
  constructor(windSystem, boat, environment) {
    this.wind = windSystem;
    this.boat = boat;
    this.env = environment;

    this.initDOM();
    this.bindEvents();
    this.update();
  }

  initDOM() {
    // 1. Barra superior de navegación y título
    this.header = document.createElement('header');
    this.header.className = 'sim-header';
    this.header.innerHTML = `
      <div class="sim-brand">
        <div class="sim-badge">⚓ CURSO DE TIMONEL PNA</div>
        <h1>Simulador Náutico de Viento y Maniobras</h1>
      </div>
      <div class="sim-header-actions">
        <button id="btn-night-toggle" class="sim-btn sim-btn-night" title="Alternar modo noche y luces reglamentarias de navegación">🌙 Modo Noche (RIPA)</button>
        <a href="index.html" class="sim-btn sim-btn-link" title="Volver a la vista de partes y despiece 3D">⛵ Nomenclatura 3D ➔</a>
      </div>
    `;
    document.body.appendChild(this.header);

    // 2. Rosa de los vientos interactiva flotante (Cuadrante superior izquierdo)
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
          
          <!-- Puntos cardinales -->
          <text x="100" y="24" class="compass-cardinal" text-anchor="middle">N</text>
          <text x="180" y="105" class="compass-cardinal" text-anchor="middle">E</text>
          <text x="100" y="186" class="compass-cardinal" text-anchor="middle">S</text>
          <text x="20" y="105" class="compass-cardinal" text-anchor="middle">W</text>

          <!-- Flecha de Viento Real (Azul / Blanco) -->
          <g id="needle-wind" transform="rotate(0 100 100)">
            <line x1="100" y1="100" x2="100" y2="30" class="wind-arrow-line" />
            <polygon points="100,20 93,34 107,34" class="wind-arrow-head" />
            <text x="100" y="48" class="wind-arrow-label" text-anchor="middle">VIENTO</text>
          </g>

          <!-- Flecha de Rumbo del Velero (Dorado / Amarillo) -->
          <g id="needle-boat" transform="rotate(45 100 100)">
            <line x1="100" y1="100" x2="100" y2="40" class="boat-heading-line" />
            <polygon points="100,28 94,44 106,44" class="boat-heading-head" />
            <!-- Silueta de velero -->
            <path d="M100,70 L95,115 L105,115 Z" class="boat-hull-icon" />
          </g>
        </svg>
      </div>
      <div class="compass-subtext">
        <span class="dot-wind">●</span> Viento Real: <strong id="val-twd">0° (N)</strong> |
        <span class="dot-boat">▲</span> Proa: <strong id="val-hdg">45° (NE)</strong>
      </div>
    `;
    document.body.appendChild(this.compassWidget);

    // 3. Tarjeta de Telemetría Náutica (Cuadrante superior derecho)
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
          <span class="m-unit">ESCORA (INCLINACIÓN)</span>
        </div>
        <div class="metric-box">
          <span class="m-val" id="tel-app-wind">16.8</span>
          <span class="m-unit">VIENTO APARENTE (KTS)</span>
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

    // 4. Panel inferior de Controles de Maniobra
    this.controlsCard = document.createElement('div');
    this.controlsCard.className = 'sim-controls-panel';
    this.controlsCard.innerHTML = `
      <!-- Fila 1: Botones rápidos de Rumbo oficial (Presets de Examen) -->
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

      <!-- Fila 2: Sliders precisos de Gobierno y Velamen -->
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
          <label>Escota Mayor: <strong id="lbl-main-sheet">25% (Cazada)</strong></label>
          <input type="range" id="slider-main-sheet" min="0" max="100" value="25">
        </div>
        <div class="slider-card">
          <label>Escota Foque: <strong id="lbl-jib-sheet">25% (Cazada)</strong></label>
          <input type="range" id="slider-jib-sheet" min="0" max="100" value="25">
        </div>
      </div>
    `;
    document.body.appendChild(this.controlsCard);

    // 5. Cajón de Apuntes Didácticos de Timonel (Off-canvas drawer)
    this.notesDrawer = document.createElement('aside');
    this.notesDrawer.className = 'sim-notes-drawer';
    this.notesDrawer.innerHTML = `
      <div class="notes-header">
        <h3>📖 Cuaderno de Estudio Náutico (PNA)</h3>
        <button id="btn-notes-close" class="btn-notes-close" aria-label="Cerrar apuntes">✕</button>
      </div>
      <div class="notes-body" id="notes-content">
        <!-- Rellenado dinámicamente -->
      </div>
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
    // Night Mode Toggle
    const btnNight = document.getElementById('btn-night-toggle');
    if (btnNight) {
      btnNight.addEventListener('click', () => {
        const night = !this.env.isNight;
        this.env.setNightMode(night);
        this.boat.setNavigationLights(night, false);
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

    if (sliderHdg) {
      sliderHdg.addEventListener('input', (e) => {
        this.wind.setBoatHeading(+e.target.value);
        this.update();
      });
    }
    if (sliderWindDir) {
      sliderWindDir.addEventListener('input', (e) => {
        this.wind.setTrueWind(+e.target.value, this.wind.trueWindSpeed);
        this.update();
      });
    }
    if (sliderWindSpd) {
      sliderWindSpd.addEventListener('input', (e) => {
        this.wind.setTrueWind(this.wind.trueWindDirection, +e.target.value);
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

    // Auto-Trim button
    const btnAutoTrim = document.getElementById('btn-auto-trim');
    if (btnAutoTrim) {
      btnAutoTrim.addEventListener('click', () => {
        this.applyAutoTrim();
        this.update();
      });
    }

    // Notes Drawer Toggle
    const btnNotesToggle = document.getElementById('btn-notes-toggle');
    const btnNotesClose = document.getElementById('btn-notes-close');
    if (btnNotesToggle && this.notesDrawer) {
      btnNotesToggle.addEventListener('click', () => {
        this.notesDrawer.classList.toggle('open');
      });
    }
    if (btnNotesClose && this.notesDrawer) {
      btnNotesClose.addEventListener('click', () => {
        this.notesDrawer.classList.remove('open');
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
    // 1. Actualizar el modelo del velero en 3D
    const headingRad = THREE.MathUtils.degToRad(-this.wind.boatHeading);
    this.boat.setHeading(headingRad);
    this.boat.setHeel(this.wind.heelingAngle);

    // Ajustar velas según la amura
    const side = this.wind.tackSide === 'estribor' ? 1 : -1;
    this.boat.sails.setSailTrim(
      this.wind.mainSheetTrim,
      this.wind.jibSheetTrim,
      side,
      this.wind.flutterIntensity
    );

    // 2. Actualizar agujas de la Rosa de los Vientos
    const needleWind = document.getElementById('needle-wind');
    const needleBoat = document.getElementById('needle-boat');
    if (needleWind) {
      needleWind.setAttribute('transform', `rotate(${this.wind.trueWindDirection} 100 100)`);
    }
    if (needleBoat) {
      needleBoat.setAttribute('transform', `rotate(${this.wind.boatHeading} 100 100)`);
    }

    // 3. Textos y etiquetas de la Rosa Náutica
    const valTwd = document.getElementById('val-twd');
    const valHdg = document.getElementById('val-hdg');
    const compassTws = document.getElementById('compass-tws');
    if (valTwd) valTwd.textContent = `${this.wind.trueWindDirection}°`;
    if (valHdg) valHdg.textContent = `${this.wind.boatHeading}°`;
    if (compassTws) compassTws.textContent = `${this.wind.trueWindSpeed} kts`;

    // 4. Telemetría
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

    // 5. Sliders etiquetas
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
