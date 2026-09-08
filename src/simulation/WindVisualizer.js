import * as THREE from 'three';

export class WindVisualizer {
  constructor(scene, windSystem) {
    this.scene = scene;
    this.wind = windSystem;
    this.enabled = true;

    this.numLines = 90;
    this.particles = [];

    this.initStreamlines();
  }

  initStreamlines() {
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Buffer con 2 vértices por línea (inicio y fin de cada traza)
    const positions = new Float32Array(this.numLines * 2 * 3);
    const colors = new Float32Array(this.numLines * 2 * 3);

    const cHead = new THREE.Color(0x38bdf8); // Cian brillante
    const cTail = new THREE.Color(0x0284c7); // Azul marino suave

    for (let i = 0; i < this.numLines; i++) {
      // Estado de cada línea de corriente
      this.particles.push({
        lateralOffset: (Math.random() - 0.5) * 22,    // Separación perpendicular al viento
        height: 0.6 + Math.pow(Math.random(), 0.8) * 11.0, // Altura entre 0.6m y 11.5m (más densas cerca de las velas)
        distance: (Math.random() - 0.5) * 44,         // Posición a lo largo del flujo (-22m a +22m)
        trailLength: 2.5 + Math.random() * 2.2,       // Longitud de la traza
        speedVariance: 0.85 + Math.random() * 0.3     // Pequeña variación de turbulencia natural
      });

      // Color de cabeza (más luminoso)
      colors[i * 6 + 0] = cHead.r;
      colors[i * 6 + 1] = cHead.g;
      colors[i * 6 + 2] = cHead.b;

      // Color de cola (más difuminado)
      colors[i * 6 + 3] = cTail.r * 0.4;
      colors[i * 6 + 4] = cTail.g * 0.4;
      colors[i * 6 + 5] = cTail.b * 0.4;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      linewidth: 1.5
    });

    this.lineMesh = new THREE.LineSegments(this.geometry, this.material);
    this.group.add(this.lineMesh);
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    this.group.visible = enabled;
  }

  setOpacity(val) {
    this.material.opacity = THREE.MathUtils.clamp(val, 0.1, 1.0);
  }

  update(delta) {
    if (!this.enabled || !this.lineMesh) return;

    const twdRad = THREE.MathUtils.degToRad(this.wind.trueWindDirection);
    // Vector unitario de avance del flujo de viento
    // TWD 0° (Norte) fluye hacia -Z, TWD 90° (Este) fluye hacia -X
    const flowDirX = -Math.sin(twdRad);
    const flowDirZ = -Math.cos(twdRad);

    // Vector perpendicular al flujo para distribuir las líneas a babor/estribor
    const perpX = -flowDirZ;
    const perpZ = flowDirX;

    // Velocidad de avance de las trazas en m/s proporcional a los nudos reales
    const speedKts = Math.max(3, this.wind.trueWindSpeed);
    const flowSpeed = (speedKts * 0.514) * 0.85; // Factor de escala para lectura visual óptima

    const posAttr = this.geometry.attributes.position;
    const posArray = posAttr.array;

    const maxDist = 24; // Distancia límite a sotavento
    const minDist = -24; // Distancia límite a barlovento

    for (let i = 0; i < this.numLines; i++) {
      const p = this.particles[i];

      // Avanzar línea a favor del viento
      p.distance += flowSpeed * p.speedVariance * delta;

      // Si sobrepasa la zona de sotavento, reaparece a barlovento
      if (p.distance > maxDist) {
        p.distance = minDist + (p.distance - maxDist);
        p.lateralOffset = (Math.random() - 0.5) * 22;
        p.height = 0.6 + Math.pow(Math.random(), 0.8) * 11.0;
      }

      // Longitud visual dinámica según la intensidad del viento
      const len = p.trailLength * (0.6 + (speedKts / 20) * 0.7);

      // Posición de la cabeza (punto adelantado)
      const headDist = p.distance;
      const headX = flowDirX * headDist + perpX * p.lateralOffset;
      const headY = p.height;
      const headZ = flowDirZ * headDist + perpZ * p.lateralOffset;

      // Posición de la cola (punto retrasado aguas arriba)
      const tailDist = p.distance - len;
      const tailX = flowDirX * tailDist + perpX * p.lateralOffset;
      const tailY = p.height;
      const tailZ = flowDirZ * tailDist + perpZ * p.lateralOffset;

      // Vértice 1 (Cabeza)
      const idx = i * 6;
      posArray[idx + 0] = headX;
      posArray[idx + 1] = headY;
      posArray[idx + 2] = headZ;

      // Vértice 2 (Cola)
      posArray[idx + 3] = tailX;
      posArray[idx + 4] = tailY;
      posArray[idx + 5] = tailZ;
    }

    posAttr.needsUpdate = true;
  }
}
