import * as THREE from 'three';

export class SailManager {
  constructor(boatGroup) {
    this.boatGroup = boatGroup;

    this.mainSheetTrim = 0.25; // 0 = cazada al centro, 1 = filada al máximo
    this.jibSheetTrim = 0.25;
    this.currentBoomAngle = 0;
    this.currentJibAngle = 0;
    this.currentSide = 1; // 1 = amurado a estribor (velas a babor), -1 = babor (velas a estribor)
    this.flutterIntensity = 0;
    this.windSpeed = 14;
    this.relativeWindAngle = 45;

    // Materiales con color blanco cálido de lona náutica (Dacron) y acabado mate
    this.sailMat = new THREE.MeshStandardMaterial({
      color: 0xfffae6,
      roughness: 0.45,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    this.jibMat = new THREE.MeshStandardMaterial({
      color: 0xfff7d6,
      roughness: 0.45,
      metalness: 0.02,
      side: THREE.DoubleSide
    });

    this.boomMat = new THREE.MeshStandardMaterial({
      color: 0x64748b,
      roughness: 0.3,
      metalness: 0.7
    });

    this.initBoomAndMain();
    this.initJib();
  }

  initBoomAndMain() {
    // Eje de pivote de la botavara en el mástil (x=0, y=2.4, z=0.95)
    this.boomPivot = new THREE.Group();
    this.boomPivot.position.set(0, 2.4, 0.95);
    this.boatGroup.add(this.boomPivot);

    // Botavara cilíndrica horizontal hacia popa (-Z)
    const boomGeo = new THREE.CylinderGeometry(0.065, 0.065, 4.4, 16);
    this.boomMesh = new THREE.Mesh(boomGeo, this.boomMat);
    this.boomMesh.rotation.x = Math.PI / 2;
    this.boomMesh.position.set(0, 0, -2.2); // Centro del cilindro
    this.boomMesh.castShadow = true;
    this.boomPivot.add(this.boomMesh);

    // Malla de la Vela Mayor (12 verticales x 8 horizontales)
    this.mainSegY = 12;
    this.mainSegZ = 8;
    const count = (this.mainSegY + 1) * (this.mainSegZ + 1);
    this.mainPositions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const indices = [];

    for (let i = 0; i <= this.mainSegY; i++) {
      const ty = i / this.mainSegY;
      for (let j = 0; j <= this.mainSegZ; j++) {
        const tz = j / this.mainSegZ;
        const uvIdx = (i * (this.mainSegZ + 1) + j) * 2;
        uvs[uvIdx] = tz;
        uvs[uvIdx + 1] = ty;
      }
    }

    for (let i = 0; i < this.mainSegY; i++) {
      for (let j = 0; j < this.mainSegZ; j++) {
        const a = i * (this.mainSegZ + 1) + j;
        const b = (i + 1) * (this.mainSegZ + 1) + j;
        const c = (i + 1) * (this.mainSegZ + 1) + (j + 1);
        const d = i * (this.mainSegZ + 1) + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    this.mainGeo = new THREE.BufferGeometry();
    this.mainGeo.setIndex(indices);
    this.mainGeo.setAttribute('position', new THREE.BufferAttribute(this.mainPositions, 3));
    this.mainGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    this.mainMesh = new THREE.Mesh(this.mainGeo, this.sailMat);
    this.mainMesh.castShadow = true;
    this.mainMesh.receiveShadow = true;
    this.boomPivot.add(this.mainMesh);
  }

  initJib() {
    // Foque con pivote en la roda (proa)
    this.jibPivot = new THREE.Group();
    this.jibPivot.position.set(0, 1.4, 4.3); // Puño de amura en el estay proel
    this.boatGroup.add(this.jibPivot);

    // Malla del Foque tridimensional (10 verticales x 6 horizontales)
    this.jibSegY = 10;
    this.jibSegZ = 6;
    const count = (this.jibSegY + 1) * (this.jibSegZ + 1);
    this.jibPositions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const indices = [];

    for (let i = 0; i <= this.jibSegY; i++) {
      const ty = i / this.jibSegY;
      for (let j = 0; j <= this.jibSegZ; j++) {
        const tz = j / this.jibSegZ;
        const uvIdx = (i * (this.jibSegZ + 1) + j) * 2;
        uvs[uvIdx] = tz;
        uvs[uvIdx + 1] = ty;
      }
    }

    for (let i = 0; i < this.jibSegY; i++) {
      for (let j = 0; j < this.jibSegZ; j++) {
        const a = i * (this.jibSegZ + 1) + j;
        const b = (i + 1) * (this.jibSegZ + 1) + j;
        const c = (i + 1) * (this.jibSegZ + 1) + (j + 1);
        const d = i * (this.jibSegZ + 1) + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    this.jibGeo = new THREE.BufferGeometry();
    this.jibGeo.setIndex(indices);
    this.jibGeo.setAttribute('position', new THREE.BufferAttribute(this.jibPositions, 3));
    this.jibGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    this.jibMesh = new THREE.Mesh(this.jibGeo, this.jibMat);
    this.jibMesh.castShadow = true;
    this.jibMesh.receiveShadow = true;
    this.jibPivot.add(this.jibMesh);
  }

  /**
   * Recibe parámetros de navegación náutica calculados por el WindSystem.
   * @param {number} mainTrim - 0 (cazada a crujía) a 1 (filada a tope)
   * @param {number} jibTrim - 0 a 1
   * @param {number} side - 1 = viento por estribor (velas a babor), -1 = viento por babor (velas a estribor)
   * @param {number} flutter - 0 (flujo laminar) a 1 (flameo violento)
   * @param {number} windSpeed - Viento real en nudos
   * @param {number} relativeWindAngle - Ángulo relativo de viento 0° a 180°
   */
  setSailTrim(mainTrim, jibTrim, side = 1, flutter = 0, windSpeed = 14, relativeWindAngle = 45) {
    this.mainSheetTrim = THREE.MathUtils.clamp(mainTrim, 0, 1);
    this.jibSheetTrim = THREE.MathUtils.clamp(jibTrim, 0, 1);
    this.currentSide = side;
    this.flutterIntensity = flutter;
    this.windSpeed = windSpeed;
    this.relativeWindAngle = relativeWindAngle;
  }

  update(delta, time) {
    const isNoGoZone = this.relativeWindAngle < 38; // Proa al viento / zona muerta

    // ── 1. ROTACIÓN DE LA BOTAVARA Y FOQUE ──────────────────────────────
    // Coordenadas del velero: Proa = +Z, Popa = -Z, Babor = +X, Estribor = -X.
    // La botavara apunta hacia popa (-Z).
    // Para rotar hacia Babor (+X), el ángulo de rotación Y debe ser NEGATIVO.
    // Para rotar hacia Estribor (-X), el ángulo de rotación Y debe ser POSITIVO.
    //
    // Si viento viene por Estribor (side = 1):
    // Las velas deben ir a Sotavento = Babor (+X) -> ángulo Y NEGATIVO.
    // Si viento viene por Babor (side = -1):
    // Las velas deben ir a Sotavento = Estribor (-X) -> ángulo Y POSITIVO.
    const leewardSign = this.currentSide; // +1 cuando viento de estribor -> hacia Babor (+X)
    const boomAngleSign = -this.currentSide; // negativo para girar hacia +X

    let targetBoomAngle = 0;
    let targetJibAngle = 0;

    if (isNoGoZone) {
      // En facha / proa al viento: el viento viene de frente, la botavara se centra y tiembla
      const shiver = Math.sin(time * 26) * 0.04 * (this.flutterIntensity || 0.8);
      targetBoomAngle = boomAngleSign * 0.03 + shiver;
      targetJibAngle = boomAngleSign * 0.04 + Math.cos(time * 28) * 0.05 * (this.flutterIntensity || 0.8);
    } else {
      // Navegando: botavara orientada a sotavento según el cazado/filado de escota
      targetBoomAngle = boomAngleSign * (0.06 + this.mainSheetTrim * 1.30); // ~3.5° a 78°
      targetJibAngle = boomAngleSign * (0.08 + this.jibSheetTrim * 1.20);   // ~4.5° a 73°
    }

    this.currentBoomAngle = THREE.MathUtils.lerp(this.currentBoomAngle, targetBoomAngle, 0.08);
    this.currentJibAngle = THREE.MathUtils.lerp(this.currentJibAngle, targetJibAngle, 0.08);

    if (this.boomPivot) this.boomPivot.rotation.y = this.currentBoomAngle;
    if (this.jibPivot) this.jibPivot.rotation.y = this.currentJibAngle;

    // ── 2. ONDULACIÓN Y BOLSA AERODINÁMICA DE LAS VELAS ─────────────────
    this._updateMainMesh(time, isNoGoZone, leewardSign);
    this._updateJibMesh(time, isNoGoZone, leewardSign);
  }

  _updateMainMesh(time, isNoGoZone, leewardSign) {
    const pos = this.mainPositions;
    const waveSpeed = 3.5 + this.windSpeed * 0.28;
    const flutter = this.flutterIntensity;
    const camberDepth = isNoGoZone ? 0.03 : (0.26 * (1 - this.mainSheetTrim * 0.2));

    for (let i = 0; i <= this.mainSegY; i++) {
      const ty = i / this.mainSegY; // 0 en botavara, 1 en tope de mástil
      const y = ty * 9.6;
      const maxZ = -(1 - ty) * 4.3;

      for (let j = 0; j <= this.mainSegZ; j++) {
        const tz = j / this.mainSegZ; // 0 en mástil (gratil), 1 en baluma (leech)
        const z = tz * maxZ;

        // Curvatura aerodinámica (bolsa / camber hacia sotavento)
        // Perfil alar NACA: máximo calado al 35% de la cuerda (tz^0.75 * PI)
        const camberProfile = Math.sin(Math.pow(tz, 0.75) * Math.PI);
        const camber = leewardSign * camberDepth * camberProfile * (1 - ty * 0.35);

        // Torsión de baluma (twist aerodinámico hacia sotavento con la altura)
        const twist = leewardSign * ty * tz * 0.14 * (1 - this.mainSheetTrim * 0.3);

        // Ondulación continua y dinámica del viento (propagación mástil -> baluma)
        const wave1 = Math.sin(time * waveSpeed - tz * 6.5 + ty * 2.8) * 0.035 * Math.min(1.5, this.windSpeed / 12);
        const wave2 = Math.cos(time * waveSpeed * 1.4 - tz * 11.0 + ty * 1.2) * 0.016;
        // Clamping: gratil fijo en mástil (tz=0 -> 0), botavara restringe pie
        const breathing = (wave1 + wave2) * tz * (0.3 + 0.7 * ty);

        // Flameo violento al desventear o en proa al viento
        let flutterDisplacement = 0;
        if (flutter > 0.02 || isNoGoZone) {
          const fIntensity = isNoGoZone ? 0.85 : flutter;
          const f1 = Math.sin(time * 28.0 + ty * 9.0 + tz * 14.0) * fIntensity * 0.18 * tz;
          const f2 = Math.cos(time * 42.0 - tz * 18.0 + ty * 4.0) * fIntensity * 0.08 * tz;
          flutterDisplacement = f1 + f2;
        }

        const x = camber + twist + breathing + flutterDisplacement;

        const idx = (i * (this.mainSegZ + 1) + j) * 3;
        pos[idx] = x;
        pos[idx + 1] = y;
        pos[idx + 2] = z;
      }
    }

    this.mainGeo.attributes.position.needsUpdate = true;
    this.mainGeo.computeVertexNormals();
  }

  _updateJibMesh(time, isNoGoZone, leewardSign) {
    const pos = this.jibPositions;
    const waveSpeed = 3.8 + this.windSpeed * 0.30;
    const flutter = this.flutterIntensity;
    const camberDepth = isNoGoZone ? 0.02 : (0.24 * (1 - this.jibSheetTrim * 0.2));

    for (let i = 0; i <= this.jibSegY; i++) {
      const ty = i / this.jibSegY; // 0 en puño de amura, 1 en puño de driza
      const luffY = ty * 7.8;
      const luffZ = -ty * 3.35;
      const leechY = 0.4 * (1 - ty) + 7.8 * ty;
      const leechZ = -3.1 * (1 - ty) - 3.35 * ty;

      for (let j = 0; j <= this.jibSegZ; j++) {
        const tz = j / this.jibSegZ; // 0 en estay (gratil), 1 en baluma (leech)
        const y = luffY + tz * (leechY - luffY);
        const z = luffZ + tz * (leechZ - luffZ);

        // Bolsa aerodinámica del foque hacia sotavento
        const camberProfile = Math.sin(Math.pow(tz, 0.75) * Math.PI);
        const camber = leewardSign * camberDepth * camberProfile * (1 - ty * 0.35);

        // Ondulación natural del foque
        const wave1 = Math.sin(time * waveSpeed - tz * 7.0 + ty * 3.2) * 0.038 * Math.min(1.5, this.windSpeed / 12);
        const wave2 = Math.cos(time * waveSpeed * 1.35 - tz * 12.0) * 0.016;
        const breathing = (wave1 + wave2) * tz;

        // Flameo del foque
        let flutterDisplacement = 0;
        if (flutter > 0.02 || isNoGoZone) {
          const fIntensity = isNoGoZone ? 0.85 : flutter;
          const f1 = Math.sin(time * 30.0 + ty * 8.0 + tz * 15.0) * fIntensity * 0.20 * tz;
          const f2 = Math.cos(time * 46.0 - tz * 19.0) * fIntensity * 0.09 * tz;
          flutterDisplacement = f1 + f2;
        }

        const x = camber + breathing + flutterDisplacement;

        const idx = (i * (this.jibSegZ + 1) + j) * 3;
        pos[idx] = x;
        pos[idx + 1] = y;
        pos[idx + 2] = z;
      }
    }

    this.jibGeo.attributes.position.needsUpdate = true;
    this.jibGeo.computeVertexNormals();
  }
}
