import * as THREE from 'three';

// ── Constantes del modelo físico náutico (PNA) ──────────────────────────────
// Ángulos de puntos de la vela (relativos a la proa, en grados)
const NO_GO_ZONE_DEG      = 38;   // Zona muerta: barco enfachado, sin gobierno
const CLOSE_HAULED_MAX    = 65;   // Ceñida: hasta 65° del viento
const BEAM_REACH_MAX      = 115;  // Través: hasta 115° del viento
const BROAD_REACH_MAX     = 155;  // Un largo: hasta 155° del viento
// Rendimiento de casco
const HULL_SPEED_MAX_KTS  = 8.0;  // Velocidad máxima de casco ~30 pies (Froude)
const SPEED_EFFICIENCY    = 0.45; // Factor de eficiencia vélica global (polar simplificado)
// Modelo de escora
const HEEL_REF_WIND_KTS   = 25;   // Viento de referencia para normalizar escora
const HEEL_COEFFICIENT    = 0.38; // Factor de conversión de fuerza lateral → radianes
const SHEET_HEEL_FACTOR   = 0.4;  // Reducción de escora por caza de escota
const EXCESS_HEEL_DEG     = 18;   // Umbral de sobre-escora (resistencia hidrodinámica)
const HEEL_DRAG_COEFF     = 0.022; // Coeficiente de drag por escora excesiva
// Diagrama polar (velero crucero-regata ~30 pies)
const POLAR_BASE_FACTOR   = 0.35; // Factor base de velocidad en ceñida
const POLAR_UPWIND_RANGE  = 0.45; // Incremento de velocidad ceñida → través
const POLAR_BEAM_MAX      = 0.80; // Factor máximo en través (mejor VMG)
const POLAR_DOWNWIND_DROP = 0.25; // Caída de velocidad través → popa
// Trim
const TRIM_DIFF_FLUTTER_THRESHOLD = 0.25; // Diferencia de trim que empieza a causar flameo
const TRIM_EFFICIENCY_MIN = 0.15; // Eficiencia mínima de trim (trimado muy malo)
const TRIM_EFFICIENCY_SLOPE = 1.5; // Sensibilidad: cuánto pierde por diferencia de trim

export class WindSystem {
  constructor() {
    this.trueWindDirection  = 0;     // Grados (0 = Norte)
    this.trueWindSpeed      = 14;    // Nudos
    this.boatHeading        = 45;    // Grados de rumbo de la proa
    this.boatSpeed          = 5.2;   // Nudos (calculado)

    this.mainSheetTrim = 0.25;  // 0 = cazada al máximo (crujía), 1 = filada al máximo
    this.jibSheetTrim  = 0.25;

    // Resultados calculados
    this.apparentWindDirection = 0;
    this.apparentWindSpeed     = 0;
    this.relativeWindAngle     = 0;  // 0°–180° (absoluto: mismo valor por babor y estribor)
    this.tackSide      = 'estribor'; // Por dónde entra el viento: 'estribor' | 'babor'
    this.pointOfSail   = 'Ceñida';
    this.heelingAngle  = 0;          // Radianes de escora (+ estribor, - babor)
    this.flutterIntensity  = 0;
    this.optimalMainTrim   = 0.2;
    this.trimEvaluation    = 'Óptimo';
    this.reefingFactor     = 1.0;    // 1.0 = paño completo, 0.65 = 1° rizo, 0.35 = 2° rizo

    // Calcular estado físico inicial inmediato
    this.calculatePhysics();
  }

  // ── Setters públicos ───────────────────────────────────────────────────────

  setReefingFactor(factor) {
    this.reefingFactor = THREE.MathUtils.clamp(factor, 0.1, 1.0);
    this.calculatePhysics();
  }

  setTrueWind(directionDeg, speedKnots) {
    this.trueWindDirection = (directionDeg % 360 + 360) % 360;
    this.trueWindSpeed     = Math.max(0, speedKnots);
    this.calculatePhysics();
  }

  setBoatHeading(headingDeg) {
    this.boatHeading = (headingDeg % 360 + 360) % 360;
    this.calculatePhysics();
  }

  setSheetTrim(mainTrim, jibTrim) {
    this.mainSheetTrim = THREE.MathUtils.clamp(mainTrim, 0, 1);
    this.jibSheetTrim  = THREE.MathUtils.clamp(jibTrim, 0, 1);
    this.calculatePhysics();
  }

  // ── Motor de física ────────────────────────────────────────────────────────

  /**
   * Recalcula todo el estado físico del barco a partir de viento, rumbo y escotas.
   * Llama a los submétodos en orden de dependencia.
   */
  calculatePhysics() {
    // Ángulo relativo del viento con respecto a la proa (-180° a +180°)
    let deltaAngle = this.trueWindDirection - this.boatHeading;
    while (deltaAngle >  180) deltaAngle -= 360;
    while (deltaAngle < -180) deltaAngle += 360;

    // Amura: Por qué banda recibe el viento el barco
    this.tackSide        = deltaAngle >= 0 ? 'estribor' : 'babor';
    this.relativeWindAngle = Math.abs(deltaAngle); // 0° (proa) a 180° (popa)

    this._classifyPointOfSail();
    this._calculateHeeling();
    this._calculateBoatSpeed();
    this._calculateApparentWind(deltaAngle);
  }

  /**
   * Clasifica el punto de la vela y determina el trimado óptimo ideal.
   * Nomenclatura oficial del Curso de Timonel PNA Argentina.
   */
  _classifyPointOfSail() {
    const a = this.relativeWindAngle;
    if (a < NO_GO_ZONE_DEG) {
      this.pointOfSail    = 'Proa al Viento (Zona Muerta)';
      this.optimalMainTrim = 0.05;
    } else if (a < CLOSE_HAULED_MAX) {
      this.pointOfSail    = 'Ceñida (Close-Hauled)';
      this.optimalMainTrim = 0.15; // Velas cazadas a crujía
    } else if (a < BEAM_REACH_MAX) {
      this.pointOfSail    = 'Través (Beam Reach)';
      this.optimalMainTrim = 0.45; // Velas a ~45°
    } else if (a < BROAD_REACH_MAX) {
      this.pointOfSail    = 'Un Largo (Broad Reach)';
      this.optimalMainTrim = 0.75; // Velas filadas a ~65°
    } else {
      this.pointOfSail    = 'Popa Redonda (Running)';
      this.optimalMainTrim = 0.95; // Velas abiertas a 80–90°
    }
  }

  /**
   * Calcula el ángulo de escora lateral.
   * La fuerza escorante depende del viento, la superficie vélica y la posición de la escota.
   * A mayor viento → mayor escora; a mayor filado de escota → menor escora.
   */
  _calculateHeeling() {
    const side = this.tackSide === 'estribor' ? 1 : -1;
    let baseHeel = 0;

    if (this.relativeWindAngle >= NO_GO_ZONE_DEG) {
      const lateralForce = Math.sin(THREE.MathUtils.degToRad(this.relativeWindAngle));
      baseHeel = (this.trueWindSpeed / HEEL_REF_WIND_KTS)
               * lateralForce
               * (1.1 - this.mainSheetTrim * SHEET_HEEL_FACTOR)
               * HEEL_COEFFICIENT;
    }

    // Rizado: menos paño → menos escora
    baseHeel *= this.reefingFactor;
    this.heelingAngle = baseHeel * side; // Positivo = escora a estribor
  }

  /**
   * Calcula la velocidad del barco usando el diagrama polar simplificado.
   * El polar representa la curva de velocidad óptima de un velero crucero-regata de ~30 pies
   * en función del ángulo al viento real.
   */
  _calculateBoatSpeed() {
    const a = this.relativeWindAngle;

    if (a < NO_GO_ZONE_DEG) {
      this.boatSpeed        = 0;
      this.flutterIntensity = 0.85; // Flameo máximo en zona muerta
      this.trimEvaluation   = 'En facha / Sin gobierno: velas flameando sin sustentación.';
      return;
    }

    // Polar simplificado: seno de transición ceñida→través, caída lineal través→popa
    let polarFactor;
    if (a <= 90) {
      polarFactor = POLAR_BASE_FACTOR
        + POLAR_UPWIND_RANGE * Math.sin(((a - NO_GO_ZONE_DEG) / 52) * (Math.PI / 2));
    } else {
      polarFactor = POLAR_BEAM_MAX - POLAR_DOWNWIND_DROP * ((a - 90) / 90);
    }

    // Penalización por trimado incorrecto (diferencia respecto al óptimo)
    const trimDiff       = Math.abs(this.mainSheetTrim - this.optimalMainTrim);
    const trimEfficiency = Math.max(TRIM_EFFICIENCY_MIN, 1.0 - trimDiff * TRIM_EFFICIENCY_SLOPE);

    // Rizado reduce la potencia vélica (velocidad ~ superficie^0.45 — ley hidrodinámica de desplazamiento)
    const sailPower = Math.pow(this.reefingFactor, 0.45);

    // Resistencia hidrodinámica por sobre-escora (>18°): el timón debe cruzarse para controlarla
    const heelDeg        = Math.abs(this.heelingAngle) * (180 / Math.PI);
    const excessHeel     = Math.max(0, heelDeg - EXCESS_HEEL_DEG);
    const heelDragEff    = Math.max(0.70, 1.0 - excessHeel * HEEL_DRAG_COEFF);

    const rawSpeed = this.trueWindSpeed * SPEED_EFFICIENCY * polarFactor
                   * trimEfficiency * sailPower * heelDragEff;
    this.boatSpeed        = +Math.min(HULL_SPEED_MAX_KTS, rawSpeed).toFixed(1);
    this.flutterIntensity = Math.max(0, (trimDiff - TRIM_DIFF_FLUTTER_THRESHOLD) * 1.8);

    this._evaluateTrim(trimDiff, excessHeel);
  }

  /**
   * Genera el texto de evaluación del trimado para el panel de telemetría.
   * Guía educativa para el estudiante sobre qué ajustar.
   */
  _evaluateTrim(trimDiff, excessHeel) {
    if (trimDiff < 0.12) {
      if (excessHeel > 6) {
        this.trimEvaluation = 'Barco sobrevelado: escora excesiva frena el casco. ¡Tomá rizos!';
      } else if (this.reefingFactor < 0.7) {
        this.trimEvaluation = 'Aparejo rizado: superficie reducida, escora y marcha controladas.';
      } else {
        this.trimEvaluation = '¡Excelente trimado! Flujo laminar aerodinámico y velocidad óptima.';
      }
    } else if (this.mainSheetTrim > this.optimalMainTrim) {
      this.trimEvaluation = 'Velas desventeando (filadas de más): cazá la escota mayor →';
    } else {
      this.trimEvaluation = 'Velas sobrecazadas (ahogadas): filá la escota mayor ←';
    }
  }

  /**
   * Calcula el viento aparente (vectorial): suma del viento real y el viento de marcha.
   * El barco en movimiento genera un viento opuesto a su velocidad.
   * @param {number} deltaAngle - Ángulo entre viento real y proa (-180° a 180°)
   */
  _calculateApparentWind(deltaAngle) {
    const twRad  = THREE.MathUtils.degToRad(deltaAngle);
    const vTrueX = -this.trueWindSpeed * Math.sin(twRad);
    const vTrueY = -this.trueWindSpeed * Math.cos(twRad);
    // Viento aparente = viento real + viento generado por la marcha (–vBarco en eje Y)
    const vAppX  = vTrueX;
    const vAppY  = vTrueY - this.boatSpeed;

    this.apparentWindSpeed     = +(Math.hypot(vAppX, vAppY)).toFixed(1);
    this.apparentWindDirection = +THREE.MathUtils.radToDeg(Math.atan2(-vAppX, -vAppY)).toFixed(0);
  }
}
