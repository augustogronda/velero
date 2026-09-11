export const WEATHER_PRESETS = {
  sudestada: {
    id: 'sudestada',
    name: 'Sudestada Rioplatense (SE Sostenido)',
    windDir: 135,
    windSpd: 26,
    pressureHpa: 1020,
    tempC: 14,
    waterSurge: 0.65, // Repunte de marea en metros
    waveFreq: 2.8,
    waveAmp: 0.16,
    waterColor: 0x6b4f2c, // Agua color leonado barroso típico del Río de la Plata
    skyColor: 0x334155,   // Cielo gris plomizo
    fogDensity: 0.022,
    description: 'Viento sostenido y húmedo del Sudeste. Empuja el agua oceánica contra la desembocadura provocando el repunte del río e inundación de zonas bajas. El oleaje se torna corto, rompiente y muy empinado.',
    nauticalAdvice: 'El timonel debe tomar el 1° o 2° rizo en la mayor y achicar con enrollador a tormentín para equilibrar el velero y evitar sobrecargar el estay y timón.',
    recommendedReef: 1
  },
  pampero: {
    id: 'pampero',
    name: 'Pampero con Barrón (Frente Frío del SW)',
    windDir: 225,
    windSpd: 34,
    pressureHpa: 1005,
    tempC: 11,
    waterSurge: -0.4, // Bajante brusca de agua
    waveFreq: 3.4,
    waveAmp: 0.22,
    waterColor: 0x1e293b, // Agua oscura revuelta con crestas blancas
    skyColor: 0x0f172a,   // Cielo de tormenta amenazante con barrón
    fogDensity: 0.035,
    description: 'Masa de aire frío patagónica que avanza velozmente tras una baja térmica. Se caracteriza por un barrón de nubes oscuras en el horizonte SW, descenso térmico abrupto y ráfagas súbitas de gran violencia.',
    nauticalAdvice: '¡Atención inmediata! Ante el avistaje del barrón pampero, filar escotas de inmediato, arriar velas o tomar el 2° rizo con foque de tormenta para evitar vuelcos.',
    recommendedReef: 2
  },
  calma_norte: {
    id: 'calma_norte',
    name: 'Viento Norteño / Calma (Pre-frontal)',
    windDir: 0,
    windSpd: 5,
    pressureHpa: 1008,
    tempC: 28,
    waterSurge: -0.15,
    waveFreq: 1.0,
    waveAmp: 0.03,
    waterColor: 0x0284c7, // Agua mansa
    skyColor: 0x0369a1,
    fogDensity: 0.008,
    description: 'Viento cálido y húmedo del sector Norte con baja presión atmosférica. Río calmo tipo espejo ("calma chicha") con escasa arrancada y abatimiento por corriente.',
    nauticalAdvice: 'Navegar con todo el paño desplegado (100% de mayor y foque al tope) y trimado suelto buscando la más mínima ráfaga.',
    recommendedReef: 0
  },
  virazon: {
    id: 'virazon',
    name: 'Virazón Costera (Brisa Térmica del Este)',
    windDir: 90,
    windSpd: 15,
    pressureHpa: 1014,
    tempC: 22,
    waterSurge: 0.0,
    waveFreq: 1.8,
    waveAmp: 0.08,
    waterColor: 0x0369a1,
    skyColor: 0x0284c7,
    fogDensity: 0.012,
    description: 'Brisa térmica típica de verano producida por la diferencia térmica entre la tierra caldeada y el río fresco. Entra regularmente por la tarde desde el Este brindando condiciones ideales.',
    nauticalAdvice: 'Excelente condición para navegación a través y descuartelar con aparejo estándar sin necesidad de rizar.',
    recommendedReef: 0
  }
};

export const REEF_CONFIG = [
  { level: 0, label: 'Paño completo (100%)', mainScaleY: 1.0, jibScale: 1.0, windFactor: 1.00 },
  { level: 1, label: '1° Rizo (-30% sup.)', mainScaleY: 0.72, jibScale: 0.8, windFactor: 0.65 },
  { level: 2, label: '2° Rizo (-60% sup.)', mainScaleY: 0.48, jibScale: 0.5, windFactor: 0.35 }
];

export class WeatherSystem {
  constructor(sceneEnvironment, windSystem, boat) {
    this.env = sceneEnvironment;
    this.wind = windSystem;
    this.boat = boat;

    this.currentPresetKey = 'virazon';
    this.reefingLevel = 0; // 0 = paño completo, 1 = 1° rizo (-30%), 2 = 2° rizo (-60%)
  }

  setPreset(key) {
    if (!WEATHER_PRESETS[key]) return;
    this.currentPresetKey = key;
    const p = WEATHER_PRESETS[key];

    // 1. Configurar viento en WindSystem
    if (this.wind) {
      this.wind.setTrueWind(p.windDir, p.windSpd);
    }

    // 2. Configurar entorno y oleaje en SceneEnvironment
    if (this.env) {
      this.env.applyWeatherCondition(p);
    }

    // 3. Aplicar efecto de rizos y escora
    this.applyReefing(this.reefingLevel);
    return p;
  }

  getCurrentPreset() {
    return WEATHER_PRESETS[this.currentPresetKey];
  }

  setReefing(level) {
    this.reefingLevel = Math.max(0, Math.min(REEF_CONFIG.length - 1, level));
    this.applyReefing(this.reefingLevel);
  }

  applyReefing(level) {
    const config = REEF_CONFIG[level] || REEF_CONFIG[0];

    // 1. Escalar visualmente velas si el modelo está presente
    if (this.boat && this.boat.sails) {
      if (this.boat.sails.mainMesh) {
        this.boat.sails.mainMesh.scale.set(1.0, config.mainScaleY, 1.0);
      }
      if (this.boat.sails.jibMesh) {
        this.boat.sails.jibMesh.scale.set(config.jibScale, config.jibScale, config.jibScale);
      }
    }

    // 2. Actualizar factor de rizado físico en WindSystem y sincronizar escora
    if (this.wind) {
      this.wind.setReefingFactor(config.windFactor);
      if (this.boat && typeof this.boat.setHeel === 'function') {
        this.boat.setHeel(this.wind.heelingAngle);
      }
    }
  }
}

