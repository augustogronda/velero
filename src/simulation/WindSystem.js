import * as THREE from 'three';

export class WindSystem {
  constructor() {
    this.trueWindDirection = 0;   // Grados (0 = Norte)
    this.trueWindSpeed = 14;      // Nudos
    this.boatHeading = 45;        // Grados de rumbo de la proa
    this.boatSpeed = 5.2;         // Nudos

    this.mainSheetTrim = 0.25;    // 0 = cazada al centro, 1 = filada
    this.jibSheetTrim = 0.25;

    // Resultados calculados
    this.apparentWindDirection = 0;
    this.apparentWindSpeed = 0;
    this.relativeWindAngle = 0;    // 0 a 180° (mismo ángulo tanto a babor como estribor)
    this.tackSide = 'estribor';   // Por dónde entra el viento: 'estribor' o 'babor'
    this.pointOfSail = 'Ceñida';
    this.heelingAngle = 0;         // Radianes de escora
    this.flutterIntensity = 0;
    this.optimalMainTrim = 0.2;
    this.trimEvaluation = 'Óptimo';
    this.reefingFactor = 1.0; // 1.0 = paño completo, 0.65 = 1° rizo, 0.35 = 2° rizo
  }

  setReefingFactor(factor) {
    this.reefingFactor = THREE.MathUtils.clamp(factor, 0.1, 1.0);
    this.calculatePhysics();
  }

  setTrueWind(directionDeg, speedKnots) {
    this.trueWindDirection = (directionDeg % 360 + 360) % 360;
    this.trueWindSpeed = Math.max(0, speedKnots);
    this.calculatePhysics();
  }

  setBoatHeading(headingDeg) {
    this.boatHeading = (headingDeg % 360 + 360) % 360;
    this.calculatePhysics();
  }

  setSheetTrim(mainTrim, jibTrim) {
    this.mainSheetTrim = THREE.MathUtils.clamp(mainTrim, 0, 1);
    this.jibSheetTrim = THREE.MathUtils.clamp(jibTrim, 0, 1);
    this.calculatePhysics();
  }

  calculatePhysics() {
    // 1. Ángulo relativo del viento con respecto a la proa (-180° a +180°)
    let deltaAngle = this.trueWindDirection - this.boatHeading;
    while (deltaAngle > 180) deltaAngle -= 360;
    while (deltaAngle < -180) deltaAngle += 360;

    // Amura: Por dónde recibe el viento el barco
    // Si deltaAngle está entre -180° y 0°, el viento viene por Babor (amura de babor)
    // Si deltaAngle está entre 0° y 180°, el viento viene por Estribor (amura de estribor)
    this.tackSide = deltaAngle >= 0 ? 'estribor' : 'babor';
    this.relativeWindAngle = Math.abs(deltaAngle); // 0° (proa) a 180° (popa)

    // 2. Clasificación oficial de Puntos de la Vela (Nomenclatura PNA Argentina)
    if (this.relativeWindAngle < 38) {
      this.pointOfSail = 'Proa al Viento (Zona Muerta)';
      this.optimalMainTrim = 0.05;
    } else if (this.relativeWindAngle < 65) {
      this.pointOfSail = 'Ceñida (Close-Hauled)';
      this.optimalMainTrim = 0.15; // Velas bien cazadas a crujía
    } else if (this.relativeWindAngle < 115) {
      this.pointOfSail = 'Través (Beam Reach)';
      this.optimalMainTrim = 0.45; // Velas a ~45°
    } else if (this.relativeWindAngle < 155) {
      this.pointOfSail = 'Un Largo (Broad Reach)';
      this.optimalMainTrim = 0.75; // Velas filadas a ~65°
    } else {
      this.pointOfSail = 'Popa Redonda (Running)';
      this.optimalMainTrim = 0.95; // Velas totalmente abiertas a 80-90°
    }

    // 3. Diagrama Polar de Velocidad (nudos del barco)
    let polarFactor = 0;
    if (this.relativeWindAngle >= 38) {
      // Curva polar típica de velero crucero-regata de 30 pies
      if (this.relativeWindAngle <= 90) {
        polarFactor = 0.35 + 0.45 * Math.sin(((this.relativeWindAngle - 38) / 52) * (Math.PI / 2));
      } else {
        polarFactor = 0.80 - 0.25 * ((this.relativeWindAngle - 90) / 90);
      }
    }

    // Penalización por trimado incorrecto
    const trimDiff = Math.abs(this.mainSheetTrim - this.optimalMainTrim);
    const trimEfficiency = Math.max(0.15, 1.0 - trimDiff * 1.5);

    if (this.relativeWindAngle < 38) {
      this.boatSpeed = 0;
      this.flutterIntensity = 0.85; // Flameo en zona muerta
      this.trimEvaluation = 'En facha / Sin gobierno: velas flameando sin sustentación.';
    } else {
      this.boatSpeed = +(this.trueWindSpeed * 0.45 * polarFactor * trimEfficiency).toFixed(1);
      this.flutterIntensity = Math.max(0, (trimDiff - 0.25) * 1.8);

      if (trimDiff < 0.12) {
        this.trimEvaluation = '¡Excelente trimado! Flujo laminar aerodinámico y velocidad óptima.';
      } else if (this.mainSheetTrim > this.optimalMainTrim) {
        this.trimEvaluation = 'Velas desventeando (filadas de más): Cazar escotas para ceñir.';
      } else {
        this.trimEvaluation = 'Velas sobrecazadas (ahogadas): Filar escotas para ganar empuje.';
      }
    }

    // 4. Viento Aparente (Vectorial)
    // El barco genera un viento propio hacia atrás igual a su velocidad
    const twRad = THREE.MathUtils.degToRad(deltaAngle);
    const vTrueX = -this.trueWindSpeed * Math.sin(twRad);
    const vTrueY = -this.trueWindSpeed * Math.cos(twRad);
    // Viento aparente = Viento real + Viento generado por la marcha (-vBarco)
    const vAppX = vTrueX;
    const vAppY = vTrueY - this.boatSpeed;

    this.apparentWindSpeed = +(Math.hypot(vAppX, vAppY)).toFixed(1);
    this.apparentWindDirection = +THREE.MathUtils.radToDeg(Math.atan2(-vAppX, -vAppY)).toFixed(0);

    // 5. Ángulo de Escora (Heeling)
    // La fuerza de escora es perpendicular a crujía: F = Viento^2 * sin(AnguloViento)
    const sideMultiplier = this.tackSide === 'estribor' ? 1 : -1; // Escora a sotavento
    let baseHeel = 0;
    if (this.relativeWindAngle >= 38) {
      const lateralForce = Math.sin(THREE.MathUtils.degToRad(this.relativeWindAngle));
      baseHeel = (this.trueWindSpeed / 25) * lateralForce * (1.1 - this.mainSheetTrim * 0.4) * 0.38;
    }
    // Modulación dinámica por rizado de velas (PNA)
    baseHeel *= this.reefingFactor;
    this.heelingAngle = baseHeel * sideMultiplier; // Radianes
  }
}
