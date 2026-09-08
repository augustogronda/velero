import * as THREE from 'three';

export class AnchorSystem {
  constructor(scene, boat) {
    this.scene = scene;
    this.boat = boat;

    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Parámetros de fondeo
    this.active = false;
    this.depth = 4.0;          // Profundidad de agua en metros
    this.rodeLength = 24.0;    // Metros de cadena/cabo filados
    this.bottomType = 'fango'; // 'fango' (Río de la Plata), 'arena', 'piedra'
    this.windDir = 90;         // Dirección del viento que empuja al barco
    this.currentDir = 120;     // Dirección de la corriente
    this.currentSpeed = 1.2;   // Nudos de corriente
    this.isDragging = false;   // Estado de garreo (dragging anchor)
    this.dragOffset = 0;       // Desplazamiento por garreo

    this.initMaterials();
    this.buildAnchor();
    this.buildNeighborBoat();
    this.buildSwingingCircle();
    this.buildRodeLine();

    this.group.visible = false;
  }

  initMaterials() {
    this.metalMat = new THREE.MeshStandardMaterial({
      color: 0x64748b, // Acero galvanizado
      roughness: 0.4,
      metalness: 0.85
    });

    this.anchorMat = new THREE.MeshStandardMaterial({
      color: 0x334155, // Ancla Danforth gris hierro
      roughness: 0.35,
      metalness: 0.9
    });

    this.seabedMat = new THREE.MeshStandardMaterial({
      color: 0x78350f, // Fango del Río de la Plata
      roughness: 0.9,
      metalness: 0.05
    });

    this.neighborMat = new THREE.MeshStandardMaterial({
      color: 0x9333ea, // Casco púrpura para diferenciar el barco vecino
      roughness: 0.4,
      metalness: 0.2
    });
  }

  buildAnchor() {
    this.anchorGroup = new THREE.Group();
    this.group.add(this.anchorGroup);

    // Posición del ancla clavada en el lecho marino
    this.anchorPos = new THREE.Vector3(0, -this.depth, 14);
    this.anchorGroup.position.copy(this.anchorPos);

    // Caña del ancla (Shank)
    const shank = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 1.8, 0.12),
      this.anchorMat
    );
    shank.rotation.x = Math.PI * 0.42; // Apoyada horizontal en el fondo
    shank.position.set(0, 0.15, -0.6);
    this.anchorGroup.add(shank);

    // Cepo transversal (Stock)
    const stock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.5, 8),
      this.anchorMat
    );
    stock.rotation.z = Math.PI / 2;
    stock.position.set(0, 0.2, 0.1);
    this.anchorGroup.add(stock);

    // Uñas basculantes Danforth (Flukes)
    const flukes = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.08, 0.8),
      this.anchorMat
    );
    flukes.position.set(0, 0.05, -1.2);
    flukes.rotation.x = -Math.PI * 0.15; // Clavadas en el fondo
    this.anchorGroup.add(flukes);

    // Boyarín de orinque (marcador de superficie del ancla)
    this.buoyFloat = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 }) // Naranja llamativo
    );
    this.buoyFloat.position.set(0, 0.25, 14);
    this.group.add(this.buoyFloat);

    // Cabo de orinque (conecta ancla con boyarín)
    const orinqueGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -this.depth, 14),
      new THREE.Vector3(0, 0.25, 14)
    ]);
    this.orinqueLine = new THREE.Line(orinqueGeo, new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 1 }));
    this.group.add(this.orinqueLine);
  }

  buildNeighborBoat() {
    // Barco vecino para demostrar la importancia del radio de borneo en fondeaderos
    this.neighborGroup = new THREE.Group();
    this.group.add(this.neighborGroup);

    const nHull = new THREE.Mesh(
      new THREE.BoxGeometry(1.8, 1.2, 7.5),
      this.neighborMat
    );
    nHull.position.set(0, 0.6, 0);
    this.neighborGroup.add(nHull);

    const nCabin = new THREE.Mesh(
      new THREE.BoxGeometry(1.4, 0.9, 3.2),
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    nCabin.position.set(0, 1.4, -0.6);
    this.neighborGroup.add(nCabin);

    const nMast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.08, 8.0, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8 })
    );
    nMast.position.set(0, 4.8, 0.5);
    this.neighborGroup.add(nMast);

    // Posicionar vecino a estribor en fondeadero
    this.neighborGroup.position.set(22, 0, 4);
    this.neighborGroup.rotation.y = THREE.MathUtils.degToRad(-90);
  }

  buildSwingingCircle() {
    // Círculo de borneo proyectado sobre el agua
    const segments = 64;
    const radius = this.rodeLength + 5; // Filado + eslora aproximada
    const circleGeo = new THREE.RingGeometry(radius - 0.2, radius + 0.2, segments);
    this.circleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });

    this.swingingCircle = new THREE.Mesh(circleGeo, this.circleMat);
    this.swingingCircle.rotation.x = -Math.PI / 2;
    this.swingingCircle.position.set(this.anchorPos.x, 0.32, this.anchorPos.z);
    this.group.add(this.swingingCircle);

    // Disco semitransparente de seguridad
    const discGeo = new THREE.CircleGeometry(radius, segments);
    this.discMat = new THREE.MeshBasicMaterial({
      color: 0x0284c7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.12
    });
    this.swingingDisc = new THREE.Mesh(discGeo, this.discMat);
    this.swingingDisc.rotation.x = -Math.PI / 2;
    this.swingingDisc.position.set(this.anchorPos.x, 0.31, this.anchorPos.z);
    this.group.add(this.swingingDisc);
  }

  buildRodeLine() {
    // Curva de catenaria de la cadena
    this.rodeCurvePoints = 20;
    const initialPoints = [];
    for (let i = 0; i <= this.rodeCurvePoints; i++) {
      initialPoints.push(new THREE.Vector3(0, 0, 0));
    }
    this.rodeGeo = new THREE.BufferGeometry().setFromPoints(initialPoints);
    this.rodeLine = new THREE.Line(
      this.rodeGeo,
      new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 })
    );
    this.group.add(this.rodeLine);
  }

  setActive(active) {
    this.active = active;
    this.group.visible = active;
    if (active) {
      this.updateCalculations();
    }
  }

  setParameters(depth, rodeLength, bottomType = 'fango') {
    this.depth = depth;
    this.rodeLength = rodeLength;
    this.bottomType = bottomType;

    // Actualizar posición vertical del ancla en el lecho
    this.anchorPos.y = -this.depth;
    this.anchorGroup.position.copy(this.anchorPos);

    // Actualizar boyarín de orinque
    const orinquePositions = this.orinqueLine.geometry.attributes.position;
    orinquePositions.setXYZ(0, this.anchorPos.x, -this.depth, this.anchorPos.z);
    orinquePositions.setXYZ(1, this.anchorPos.x, 0.25, this.anchorPos.z);
    orinquePositions.needsUpdate = true;
    this.buoyFloat.position.set(this.anchorPos.x, 0.25, this.anchorPos.z);

    this.updateCalculations();
  }

  setEnvironmentForces(windDir, currentDir, currentSpeed = 1.2) {
    this.windDir = windDir;
    this.currentDir = currentDir;
    this.currentSpeed = currentSpeed;
    this.updateCalculations();
  }

  getScope() {
    // Relación de filado: Longitud de cadena / Profundidad
    return this.depth > 0 ? this.rodeLength / this.depth : 0;
  }

  getStatus() {
    const scope = this.getScope();
    let statusText = '';
    let statusClass = '';
    let explanation = '';

    if (scope < 3.0) {
      this.isDragging = true;
      statusText = '🔴 PELIGRO: EL ANCLA GARRAPEA (Garreo Activo)';
      statusClass = 'danger';
      explanation = `Relación de filado crítica de ${scope.toFixed(1)}:1 (mínimo exigido: 3:1 o 5:1). El tiro sobre el ancla es vertical, las uñas se desclavan y el barco deriva a la deriva. ¡Fila más cadena de inmediato!`;
    } else if (scope >= 3.0 && scope < 5.0) {
      this.isDragging = false;
      statusText = '🟡 FONDEO PRECARIO / REGULAR (Solo Buen Tiempo)';
      statusClass = 'warning';
      explanation = `Relación de ${scope.toFixed(1)}:1. Aceptable para fondeo de corta duración diurno con calma chicha en el Delta, pero insuficiente para vientos fuertes o noche en el Río de la Plata.`;
    } else if (scope >= 5.0 && scope <= 8.0) {
      this.isDragging = false;
      statusText = '🟢 FONDEO SEGURO Y REGLAMENTARIO (PNA)';
      statusClass = 'success';
      explanation = `Excelente relación de ${scope.toFixed(1)}:1. El peso de la cadena forma una catenaria que amortigua los tirones y tracciona 100% horizontal sobre las uñas, clavándolas profundamente en el lecho.`;
    } else {
      this.isDragging = false;
      statusText = '🟢 FONDEO DE MAL TIEMPO / TEMPORAL';
      statusClass = 'success';
      explanation = `Relación holgada de ${scope.toFixed(1)}:1 recomendada para temporales (7:1 a 8:1). Considera que el radio de borneo es amplio y debes mantener distancia de barcos vecinos.`;
    }

    return {
      scope: scope.toFixed(1),
      isDragging: this.isDragging,
      statusText,
      statusClass,
      explanation,
      swingRadius: Math.round(this.rodeLength + 5)
    };
  }

  updateCalculations() {
    const status = this.getStatus();

    // Actualizar radio del círculo de borneo
    const radius = this.rodeLength + 5;
    this.swingingCircle.geometry.dispose();
    this.swingingCircle.geometry = new THREE.RingGeometry(radius - 0.2, radius + 0.2, 64);
    this.swingingDisc.geometry.dispose();
    this.swingingDisc.geometry = new THREE.CircleGeometry(radius, 64);

    // Color del círculo según seguridad
    if (this.isDragging) {
      this.circleMat.color.setHex(0xef4444);
      this.discMat.color.setHex(0xef4444);
    } else if (status.scope < 5.0) {
      this.circleMat.color.setHex(0xf59e0b);
      this.discMat.color.setHex(0xf59e0b);
    } else {
      this.circleMat.color.setHex(0x10b981);
      this.discMat.color.setHex(0x0284c7);
    }

    // Orientar el velero por la combinación de viento y corriente (borneo)
    // El barco fondeado se alinea proa al vector resultante
    const effectiveAngle = this.windDir; // Para fines didácticos, proa orientada al viento
    const distFromAnchor = Math.min(this.rodeLength * 0.85, radius - 2);

    const rad = THREE.MathUtils.degToRad(effectiveAngle);
    const boatX = this.anchorPos.x - Math.sin(rad) * distFromAnchor;
    const boatZ = this.anchorPos.z - Math.cos(rad) * distFromAnchor;

    if (this.boat) {
      this.boat.group.position.set(boatX, 0, boatZ);
      // La proa del velero apunta hacia el ancla (orzar hacia el fondeo)
      const headingToAnchor = Math.atan2(this.anchorPos.x - boatX, this.anchorPos.z - boatZ);
      this.boat.setHeading(headingToAnchor);
      this.boat.setHeel(0); // Fondeado sin escora
    }

    // Actualizar catenaria de la cadena
    this.updateRodeCatenary();
  }

  updateRodeCatenary() {
    const bowPos = new THREE.Vector3();
    if (this.boat) {
      // Roldana de proa
      bowPos.copy(this.boat.group.position);
      const heading = this.boat.heading;
      bowPos.x += Math.sin(heading) * 4.2;
      bowPos.y = 0.9;
      bowPos.z += Math.cos(heading) * 4.2;
    }

    const points = [];
    const steps = this.rodeCurvePoints;
    const isTaut = this.isDragging || this.getScope() < 3.2;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Interpolación lineal entre proa y ancla
      const x = THREE.MathUtils.lerp(bowPos.x, this.anchorPos.x, t);
      const z = THREE.MathUtils.lerp(bowPos.z, this.anchorPos.z, t);

      // Catenaria vertical (si no garrea, la cadena descansa en el fondo)
      let y;
      if (isTaut) {
        // Cadena tensa en línea recta (tiro vertical dañino)
        y = THREE.MathUtils.lerp(bowPos.y, this.anchorPos.y, t);
      } else {
        // Catenaria profunda: desciende rápido y descansa en el lecho marino
        const sag = Math.sin(t * Math.PI) * (this.depth * 0.35);
        y = THREE.MathUtils.lerp(bowPos.y, this.anchorPos.y, t) - sag;
        if (y < this.anchorPos.y) y = this.anchorPos.y; // No atraviesa el lecho
      }
      points.push(new THREE.Vector3(x, y, z));
    }

    this.rodeLine.geometry.setFromPoints(points);
  }

  update(delta, time) {
    if (!this.active || !this.group.visible) return;

    // Si garrea, el ancla y el barco derivan lentamente con la corriente
    if (this.isDragging) {
      this.dragOffset += delta * 0.6;
      const driftRad = THREE.MathUtils.degToRad(this.currentDir);
      const dx = Math.sin(driftRad) * delta * 0.5;
      const dz = Math.cos(driftRad) * delta * 0.5;

      this.anchorPos.x += dx;
      this.anchorPos.z += dz;
      this.anchorGroup.position.copy(this.anchorPos);
      this.swingingCircle.position.set(this.anchorPos.x, 0.32, this.anchorPos.z);
      this.swingingDisc.position.set(this.anchorPos.x, 0.31, this.anchorPos.z);
      this.buoyFloat.position.set(this.anchorPos.x, 0.25, this.anchorPos.z);

      this.updateCalculations();
    }

    // Suave balanceo del boyarín en el agua
    if (this.buoyFloat) {
      this.buoyFloat.position.y = 0.25 + Math.sin(time * 2.5) * 0.04;
    }
  }
}
