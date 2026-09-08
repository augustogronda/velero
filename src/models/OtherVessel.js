import * as THREE from 'three';

export class OtherVessel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.type = 'sailboat'; // 'sailboat' o 'motorboat'
    this.speed = 4.5;
    this.heading = 0;
    this.active = false;
    this.tackSide = 'babor'; // para veleros
    this.heeling = 0;

    this.initMaterials();
    this.buildMeshes();
    this.buildTrajectoryVisualizer();
    this.group.visible = false;
  }

  initMaterials() {
    this.hullMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Casco azul náutico contrastante
      roughness: 0.35,
      metalness: 0.2
    });
    this.cargoMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c, // Rojo óxido / mercante
      roughness: 0.5,
      metalness: 0.4
    });
    this.deckMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.4
    });
    this.sailMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5, // Vela crema
      roughness: 0.6,
      side: THREE.DoubleSide
    });
  }

  buildMeshes() {
    // Subgrupo de velero
    this.sailorGroup = new THREE.Group();
    this.group.add(this.sailorGroup);

    // Casco simplificado pero elegante para el segundo velero
    const hullShape = new THREE.Shape();
    hullShape.moveTo(0, 4.2);
    hullShape.bezierCurveTo(1.6, 2.5, 1.6, -1.2, 1.3, -3.4);
    hullShape.lineTo(-1.3, -3.4);
    hullShape.bezierCurveTo(-1.6, -1.2, -1.6, 2.5, 0, 4.2);

    const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
      steps: 1,
      depth: 0.9,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.25,
      bevelSegments: 3
    });
    hullGeo.center();
    const hullMesh = new THREE.Mesh(hullGeo, this.hullMat);
    hullMesh.rotation.x = Math.PI / 2;
    hullMesh.position.set(0, 0.7, 0);
    this.sailorGroup.add(hullMesh);

    // Mástil
    const mast = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.11, 9.5, 12),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8 })
    );
    mast.position.set(0, 5.8, 0.8);
    this.sailorGroup.add(mast);

    // Botavara y vela mayor
    this.otherBoom = new THREE.Group();
    this.otherBoom.position.set(0, 2.2, 0.8);
    this.sailorGroup.add(this.otherBoom);

    const boomStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 3.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    boomStick.rotation.x = Math.PI / 2;
    boomStick.position.set(0, 0, -1.9);
    this.otherBoom.add(boomStick);

    const mainSailGeo = new THREE.BufferGeometry();
    const mainVerts = new Float32Array([
      0, 0, 0,
      0, 8.2, 0,
      0.15, 0.2, -3.7
    ]);
    mainSailGeo.setAttribute('position', new THREE.BufferAttribute(mainVerts, 3));
    mainSailGeo.computeVertexNormals();
    this.otherMain = new THREE.Mesh(mainSailGeo, this.sailMat);
    this.otherBoom.add(this.otherMain);

    // Foque
    const jibGeo = new THREE.BufferGeometry();
    const jibVerts = new Float32Array([
      0, 1.2, 3.9,
      0, 7.2, 0.8,
      0.15, 1.5, 0.7
    ]);
    jibGeo.setAttribute('position', new THREE.BufferAttribute(jibVerts, 3));
    jibGeo.computeVertexNormals();
    this.otherJib = new THREE.Mesh(jibGeo, this.sailMat);
    this.sailorGroup.add(this.otherJib);

    // Luces de navegación de velero
    this.vesselPortLight = new THREE.PointLight(0xff0000, 0, 10);
    this.vesselPortLight.position.set(-1.1, 1.2, 1.0);
    this.sailorGroup.add(this.vesselPortLight);

    this.vesselStbdLight = new THREE.PointLight(0x00ff00, 0, 10);
    this.vesselStbdLight.position.set(1.1, 1.2, 1.0);
    this.sailorGroup.add(this.vesselStbdLight);

    this.vesselSternLight = new THREE.PointLight(0xffffff, 0, 10);
    this.vesselSternLight.position.set(0, 1.2, -3.4);
    this.sailorGroup.add(this.vesselSternLight);

    // Subgrupo de buque de carga (Mercante para cruce en canal)
    this.cargoGroup = new THREE.Group();
    this.group.add(this.cargoGroup);

    const cargoHull = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 3.2, 22.0),
      this.cargoMat
    );
    cargoHull.position.set(0, 1.2, 0);
    this.cargoGroup.add(cargoHull);

    const cargoSuperstructure = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 3.5, 4.5),
      new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
    );
    cargoSuperstructure.position.set(0, 4.5, -6.5);
    this.cargoGroup.add(cargoSuperstructure);

    this.cargoMastLight = new THREE.PointLight(0xffffff, 0, 25);
    this.cargoMastLight.position.set(0, 8.5, 6.0);
    this.cargoGroup.add(this.cargoMastLight);

    this.cargoGroup.visible = false;
  }

  buildTrajectoryVisualizer() {
    // Línea discontinua que proyecta el rumbo sobre el agua para análisis didáctico
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.35, 0),
      new THREE.Vector3(0, 0.35, 25)
    ]);
    this.trackLine = new THREE.Line(
      lineGeo,
      new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 1.2,
        gapSize: 0.8,
        linewidth: 2
      })
    );
    this.trackLine.computeLineDistances();
    this.group.add(this.trackLine);
  }

  setupScenario(config) {
    // config: { active, type, startPos, headingDeg, speed, tackSide, trackColor }
    this.active = config.active;
    this.group.visible = config.active;
    if (!config.active) return;

    this.type = config.type || 'sailboat';
    this.speed = config.speed || 4.5;
    this.heading = config.headingDeg || 0;
    this.tackSide = config.tackSide || 'babor';

    this.sailorGroup.visible = this.type === 'sailboat';
    this.cargoGroup.visible = this.type === 'motorboat';

    if (config.startPos) {
      this.group.position.copy(config.startPos);
    }

    const headingRad = THREE.MathUtils.degToRad(-this.heading);
    this.group.rotation.y = headingRad;

    // Orientar las velas según la amura
    if (this.type === 'sailboat' && this.otherBoom) {
      const boomSign = this.tackSide === 'estribor' ? 1 : -1;
      this.otherBoom.rotation.y = boomSign * 0.45;
      this.heeling = boomSign * 0.22;
      this.sailorGroup.rotation.z = this.heeling;
    } else {
      this.sailorGroup.rotation.z = 0;
    }

    if (this.trackLine && config.trackColor) {
      this.trackLine.material.color.setHex(config.trackColor);
    }
  }

  setNightLights(enabled) {
    const intensity = enabled ? 2.5 : 0;
    this.vesselPortLight.intensity = intensity;
    this.vesselStbdLight.intensity = intensity;
    this.vesselSternLight.intensity = intensity;
    this.cargoMastLight.intensity = (enabled && this.type === 'motorboat') ? 4.0 : 0;
  }

  update(delta, time) {
    if (!this.active || !this.group.visible) return;

    // Movimiento hacia adelante según rumbo
    const headingRad = -this.group.rotation.y;
    const moveDist = (this.speed * 0.5) * delta;
    this.group.position.x += Math.sin(headingRad) * moveDist;
    this.group.position.z += Math.cos(headingRad) * moveDist;

    // Oleaje
    this.group.position.y = Math.sin(time * 2.0 + 1.2) * 0.035;

    // Reubicar si se aleja demasiado (bucle pedagógico continuo)
    if (this.group.position.length() > 60) {
      this.group.position.setLength(25);
      this.group.position.negate();
    }
  }
}
