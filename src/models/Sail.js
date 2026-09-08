import * as THREE from 'three';

export class SailManager {
  constructor(boatGroup) {
    this.boatGroup = boatGroup;

    this.mainSheetTrim = 0.5; // 0 = cazada al centro, 1 = filada al máximo
    this.jibSheetTrim = 0.5;
    this.currentBoomAngle = 0;
    this.currentJibAngle = 0;
    this.flutterIntensity = 0; // 0 = flujo laminar perfecto, 1 = flameo violento

    this.sailMat = new THREE.MeshStandardMaterial({
      color: 0xfef9c3,
      roughness: 0.55,
      metalness: 0.05,
      side: THREE.DoubleSide
    });

    this.jibMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      roughness: 0.55,
      metalness: 0.05,
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

    // Botavara cilíndrica horizontal hacia popa
    const boomGeo = new THREE.CylinderGeometry(0.065, 0.065, 4.4, 16);
    this.boomMesh = new THREE.Mesh(boomGeo, this.boomMat);
    this.boomMesh.rotation.x = Math.PI / 2;
    this.boomMesh.position.set(0, 0, -2.2); // Centro del cilindro
    this.boomMesh.castShadow = true;
    this.boomPivot.add(this.boomMesh);

    // Malla de la Vela Mayor
    // Vértices relativos al pivote:
    // P0: Amura / Pinzote (0, 0, 0)
    // P1: Puño de driza en tope mástil (0, 9.6, 0)
    // P2: Puño de escota al final de botavara (0, 0, -4.3)
    this.mainGeo = new THREE.BufferGeometry();
    this.updateMainGeometry(0);
    this.mainMesh = new THREE.Mesh(this.mainGeo, this.sailMat);
    this.mainMesh.castShadow = true;
    this.boomPivot.add(this.mainMesh);
  }

  initJib() {
    // Foque con pivote en la roda (proa)
    this.jibPivot = new THREE.Group();
    this.jibPivot.position.set(0, 1.4, 4.3); // Puño de amura en el estay proel
    this.boatGroup.add(this.jibPivot);

    this.jibGeo = new THREE.BufferGeometry();
    this.updateJibGeometry(0);
    this.jibMesh = new THREE.Mesh(this.jibGeo, this.jibMat);
    this.jibMesh.castShadow = true;
    this.jibPivot.add(this.jibMesh);
  }

  updateMainGeometry(flutter = 0) {
    // Subdivisión de la vela mayor con curvatura aerodinámica (bolsa)
    const verts = [];
    const uvs = [];
    const segmentsY = 8;
    const segmentsZ = 6;

    for (let i = 0; i <= segmentsY; i++) {
      const ty = i / segmentsY;
      const y = ty * 9.6;
      const maxZ = -(1 - ty) * 4.3;

      for (let j = 0; j <= segmentsZ; j++) {
        const tz = j / segmentsZ;
        const z = tz * maxZ;
        // Curvatura transversal (camber aerodinámico de la vela)
        const camber = Math.sin(tz * Math.PI) * (1 - ty * 0.4) * 0.28;
        // Deformación de flameo
        const fl = flutter * Math.sin(ty * 10 + tz * 8) * 0.15;
        const x = camber + fl;

        verts.push(x, y, z);
        uvs.push(tz, ty);
      }
    }

    const indices = [];
    for (let i = 0; i < segmentsY; i++) {
      for (let j = 0; j < segmentsZ; j++) {
        const a = i * (segmentsZ + 1) + j;
        const b = (i + 1) * (segmentsZ + 1) + j;
        const c = (i + 1) * (segmentsZ + 1) + (j + 1);
        const d = i * (segmentsZ + 1) + (j + 1);
        indices.push(a, b, d);
        indices.push(b, c, d);
      }
    }

    this.mainGeo.setIndex(indices);
    this.mainGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    this.mainGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    this.mainGeo.computeVertexNormals();
  }

  updateJibGeometry(flutter = 0) {
    // Foque triangular desde amura (0,0,0) hacia driza (0, 7.8, -3.35) y escota (-0.3, 0.4, -3.1)
    const verts = new Float32Array([
      0.0, 0.0, 0.0,                              // Amura
      0.0, 7.8, -3.35,                            // Driza
      0.25 + flutter * 0.1, 0.4, -3.1             // Escota
    ]);
    this.jibGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
    this.jibGeo.computeVertexNormals();
  }

  setSailTrim(mainTrim, jibTrim, side = 1, flutter = 0) {
    // mainTrim: 0 = crujía (0°), 1 = filado máximo (80°)
    // side: 1 = escora/velas a babor (-), -1 = a estribor (+)
    this.mainSheetTrim = THREE.MathUtils.clamp(mainTrim, 0, 1);
    this.jibSheetTrim = THREE.MathUtils.clamp(jibTrim, 0, 1);
    this.flutterIntensity = flutter;

    const targetBoomAngle = side * (0.05 + this.mainSheetTrim * 1.35); // 3° a 78°
    const targetJibAngle = side * (0.08 + this.jibSheetTrim * 1.25);

    this.currentBoomAngle = THREE.MathUtils.lerp(this.currentBoomAngle, targetBoomAngle, 0.1);
    this.currentJibAngle = THREE.MathUtils.lerp(this.currentJibAngle, targetJibAngle, 0.1);

    if (this.boomPivot) {
      this.boomPivot.rotation.y = this.currentBoomAngle;
    }
    if (this.jibPivot) {
      this.jibPivot.rotation.y = this.currentJibAngle;
    }
  }

  update(delta, time) {
    if (this.flutterIntensity > 0.05) {
      const flutterOffset = Math.sin(time * 25) * this.flutterIntensity;
      this.updateMainGeometry(flutterOffset);
      this.updateJibGeometry(flutterOffset);
    }
  }
}
