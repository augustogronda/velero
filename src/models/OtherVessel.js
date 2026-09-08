import * as THREE from 'three';

export class OtherVessel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this.type = 'sailboat'; // 'sailboat', 'motorboat', 'cargo', 'fishing'
    this.speed = 4.5;
    this.heading = 0;
    this.active = false;
    this.tackSide = 'babor';
    this.heeling = 0;
    this.startPos = new THREE.Vector3(-18, 0, 16);

    this.initMaterials();
    this.buildSailboat();
    this.buildMotorboat();
    this.buildCargo();
    this.buildFishing();
    this.buildTrajectoryVisualizer();

    this.group.visible = false;
  }

  initMaterials() {
    this.hullSailMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7, // Azul náutico brillante
      roughness: 0.35,
      metalness: 0.2
    });
    this.hullMotorMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0, // Blanco fibra de vidrio moderna
      roughness: 0.25,
      metalness: 0.15
    });
    this.cargoMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Rojo óxido mercante
      roughness: 0.5,
      metalness: 0.3
    });
    this.fishingMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f, // Casco pesquero de trabajo
      roughness: 0.6,
      metalness: 0.2
    });
    this.cabinMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3
    });
    this.sailMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5,
      roughness: 0.6,
      side: THREE.DoubleSide
    });
  }

  buildSailboat() {
    this.sailorGroup = new THREE.Group();
    this.group.add(this.sailorGroup);

    // Casco velero
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
    const hullMesh = new THREE.Mesh(hullGeo, this.hullSailMat);
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

    // Luces de velero
    this.sailPortLight = new THREE.PointLight(0xff0000, 0, 12);
    this.sailPortLight.position.set(-1.1, 1.2, 1.0);
    this.sailorGroup.add(this.sailPortLight);

    this.sailStbdLight = new THREE.PointLight(0x00ff00, 0, 12);
    this.sailStbdLight.position.set(1.1, 1.2, 1.0);
    this.sailorGroup.add(this.sailStbdLight);

    this.sailSternLight = new THREE.PointLight(0xffffff, 0, 12);
    this.sailSternLight.position.set(0, 1.2, -3.4);
    this.sailorGroup.add(this.sailSternLight);
  }

  buildMotorboat() {
    this.motorGroup = new THREE.Group();
    this.group.add(this.motorGroup);

    // Casco lancha deportiva / crucero de 8m
    const hullShape = new THREE.Shape();
    hullShape.moveTo(0, 4.0);
    hullShape.lineTo(1.5, 1.5);
    hullShape.lineTo(1.4, -3.2);
    hullShape.lineTo(-1.4, -3.2);
    hullShape.lineTo(-1.5, 1.5);
    hullShape.closePath();

    const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
      steps: 1,
      depth: 1.1,
      bevelEnabled: true,
      bevelThickness: 0.25,
      bevelSize: 0.2,
      bevelSegments: 3
    });
    hullGeo.center();
    const hullMesh = new THREE.Mesh(hullGeo, this.hullMotorMat);
    hullMesh.rotation.x = Math.PI / 2;
    hullMesh.position.set(0, 0.6, 0);
    this.motorGroup.add(hullMesh);

    // Cabina y parabrisas polarizado
    const cabin = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 1.1, 3.2),
      this.cabinMat
    );
    cabin.position.set(0, 1.5, -0.4);
    this.motorGroup.add(cabin);

    const windshield = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.7, 1.2),
      new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.9 })
    );
    windshield.position.set(0, 1.85, 0.7);
    windshield.rotation.x = -Math.PI * 0.12;
    this.motorGroup.add(windshield);

    // Mástil de luces de motor
    const lightPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9 })
    );
    lightPole.position.set(0, 2.6, -1.2);
    this.motorGroup.add(lightPole);

    // Luces de navegación de buque de propulsión mecánica (Regla 23)
    this.motorMastLight = new THREE.PointLight(0xffffff, 0, 18); // Tope proa blanca 225°
    this.motorMastLight.position.set(0, 3.5, -1.2);
    this.motorGroup.add(this.motorMastLight);

    this.motorPortLight = new THREE.PointLight(0xff0000, 0, 12);
    this.motorPortLight.position.set(-1.2, 1.2, 0.8);
    this.motorGroup.add(this.motorPortLight);

    this.motorStbdLight = new THREE.PointLight(0x00ff00, 0, 12);
    this.motorStbdLight.position.set(1.2, 1.2, 0.8);
    this.motorGroup.add(this.motorStbdLight);

    this.motorSternLight = new THREE.PointLight(0xffffff, 0, 12);
    this.motorSternLight.position.set(0, 1.2, -3.2);
    this.motorGroup.add(this.motorSternLight);

    this.motorGroup.visible = false;
  }

  buildCargo() {
    this.cargoGroup = new THREE.Group();
    this.group.add(this.cargoGroup);

    const cargoHull = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 3.2, 24.0),
      this.cargoMat
    );
    cargoHull.position.set(0, 1.2, 0);
    this.cargoGroup.add(cargoHull);

    const cargoSuperstructure = new THREE.Mesh(
      new THREE.BoxGeometry(3.8, 3.8, 4.8),
      this.cabinMat
    );
    cargoSuperstructure.position.set(0, 4.6, -7.5);
    this.cargoGroup.add(cargoSuperstructure);

    // Contenedores simulados
    const containerMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.6 });
    const cont1 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 2.2, 10.0), containerMat);
    cont1.position.set(0, 3.8, 1.5);
    this.cargoGroup.add(cont1);

    this.cargoMastLight = new THREE.PointLight(0xffffff, 0, 30);
    this.cargoMastLight.position.set(0, 8.5, 6.0);
    this.cargoGroup.add(this.cargoMastLight);

    this.cargoPortLight = new THREE.PointLight(0xff0000, 0, 15);
    this.cargoPortLight.position.set(-2.2, 3.0, 4.0);
    this.cargoGroup.add(this.cargoPortLight);

    this.cargoStbdLight = new THREE.PointLight(0x00ff00, 0, 15);
    this.cargoStbdLight.position.set(2.2, 3.0, 4.0);
    this.cargoGroup.add(this.cargoStbdLight);

    this.cargoGroup.visible = false;
  }

  buildFishing() {
    this.fishingGroup = new THREE.Group();
    this.group.add(this.fishingGroup);

    // Casco pesquero
    const fishHull = new THREE.Mesh(
      new THREE.BoxGeometry(3.0, 2.2, 12.0),
      this.fishingMat
    );
    fishHull.position.set(0, 0.9, 0);
    this.fishingGroup.add(fishHull);

    // Caseta de gobierno
    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 2.2, 2.8),
      this.cabinMat
    );
    bridge.position.set(0, 2.8, -2.8);
    this.fishingGroup.add(bridge);

    // Pórtico de arrastre / red (Trawl gantry)
    const gantry = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 2.8, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.7 })
    );
    gantry.position.set(0, 2.8, 4.5);
    this.fishingGroup.add(gantry);

    // Luces RIPA Regla 26: Buque dedicado a la pesca de arrastre
    // Dos luces todo horizonte: Verde sobre Blanco (Arrastrero) o Roja sobre Blanco (No arrastre)
    this.fishingTopLight = new THREE.PointLight(0x22c55e, 0, 20); // Verde todo horizonte superior
    this.fishingTopLight.position.set(0, 5.2, -2.8);
    this.fishingGroup.add(this.fishingTopLight);

    this.fishingBottomLight = new THREE.PointLight(0xffffff, 0, 20); // Blanca todo horizonte inferior
    this.fishingBottomLight.position.set(0, 4.2, -2.8);
    this.fishingGroup.add(this.fishingBottomLight);

    this.fishingGroup.visible = false;
  }

  buildTrajectoryVisualizer() {
    // Línea discontinua que proyecta el rumbo sobre el agua para análisis didáctico
    const lineGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0.35, 0),
      new THREE.Vector3(0, 0.35, 35)
    ]);
    this.trackLine = new THREE.Line(
      lineGeo,
      new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 1.4,
        gapSize: 0.9,
        linewidth: 2
      })
    );
    this.trackLine.computeLineDistances();
    this.group.add(this.trackLine);
  }

  setupScenario(config) {
    this.active = config.active;
    this.group.visible = config.active;
    if (!config.active) return;

    this.type = config.type || 'sailboat';
    this.speed = config.speed || 4.5;
    this.heading = config.headingDeg || 0;
    this.tackSide = config.tackSide || 'babor';

    this.sailorGroup.visible = this.type === 'sailboat';
    this.motorGroup.visible = this.type === 'motorboat';
    this.cargoGroup.visible = this.type === 'cargo';
    this.fishingGroup.visible = this.type === 'fishing';

    if (config.startPos) {
      this.startPos = config.startPos.clone();
      this.group.position.copy(this.startPos);
    }

    const headingRad = THREE.MathUtils.degToRad(-this.heading);
    this.group.rotation.y = headingRad;

    // Orientar velas si es velero
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

    this.setNightLights(config.nightLights || false);
  }

  resetPosition() {
    if (this.startPos) {
      this.group.position.copy(this.startPos);
    }
  }

  setNightLights(enabled) {
    const intensity = enabled ? 3.0 : 0;

    // Velero
    this.sailPortLight.intensity = intensity;
    this.sailStbdLight.intensity = intensity;
    this.sailSternLight.intensity = intensity;

    // Lancha a motor
    this.motorMastLight.intensity = (enabled && this.type === 'motorboat') ? 4.0 : 0;
    this.motorPortLight.intensity = intensity;
    this.motorStbdLight.intensity = intensity;
    this.motorSternLight.intensity = intensity;

    // Buque mercante
    this.cargoMastLight.intensity = (enabled && this.type === 'cargo') ? 5.0 : 0;
    this.cargoPortLight.intensity = intensity;
    this.cargoStbdLight.intensity = intensity;

    // Pesquero en faena (Verde sobre Blanco)
    this.fishingTopLight.intensity = (enabled && this.type === 'fishing') ? 4.5 : 0;
    this.fishingBottomLight.intensity = (enabled && this.type === 'fishing') ? 4.5 : 0;
  }

  update(delta, time) {
    if (!this.active || !this.group.visible) return;

    // Movimiento constante a lo largo de su derrota
    const headingRad = -this.group.rotation.y;
    const moveDist = (this.speed * 0.48) * delta;
    this.group.position.x += Math.sin(headingRad) * moveDist;
    this.group.position.z += Math.cos(headingRad) * moveDist;

    // Suave oleaje según su tipo
    const waveAmp = this.type === 'cargo' ? 0.015 : 0.035;
    this.group.position.y = Math.sin(time * 2.0 + 1.2) * waveAmp;

    // Si se aleja mucho del punto inicial, reiniciar automáticamente en bucle didáctico
    if (this.startPos && this.group.position.distanceTo(this.startPos) > 65) {
      this.group.position.copy(this.startPos);
    }
  }
}
