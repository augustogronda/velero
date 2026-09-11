import * as THREE from 'three';
import { SailManager } from './Sail.js';

export class Boat {
  constructor(scene) {
    this.scene = scene;

    // Grupo raíz que controla la posición y rumbo en el agua
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Grupo de balanceo (escora y cabeceo)
    this.tiltGroup = new THREE.Group();
    this.group.add(this.tiltGroup);

    this.heading = 0;   // Radianes (0 = Norte / rumbo z-)
    this.heelAngle = 0; // Radianes de escora
    this.pitchAngle = 0;// Radianes de cabeceo

    this.initMaterials();
    this.buildHull();
    this.buildKeelAndRudder();
    this.buildDeckAndCabin();
    this.buildRigging();
    this.buildNavigationLights();

    this.sails = new SailManager(this.tiltGroup);
  }

  initMaterials() {
    this.hullDeadMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.25
    });
    this.hullAliveMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.45,
      metalness: 0.2
    });
    this.deckMat = new THREE.MeshStandardMaterial({
      color: 0xc89666,
      roughness: 0.6,
      metalness: 0.05
    });
    this.cabinMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.25,
      metalness: 0.1
    });
    this.mastMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.2,
      metalness: 0.85
    });
    this.keelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.3
    });
    this.bulbMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      roughness: 0.35,
      metalness: 0.4
    });
    this.rudderMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.35,
      metalness: 0.25
    });
    this.metalFitMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.9
    });
    this.cableMat = new THREE.LineBasicMaterial({
      color: 0x93c5fd,
      linewidth: 1,
      transparent: true,
      opacity: 0.85
    });
  }

  buildHull() {
    // 1. Obra muerta
    const hullShape = new THREE.Shape();
    hullShape.moveTo(0, 4.8);
    hullShape.bezierCurveTo(1.75, 3.0, 1.8, -1.5, 1.45, -3.9);
    hullShape.lineTo(-1.45, -3.9);
    hullShape.bezierCurveTo(-1.8, -1.5, -1.75, 3.0, 0, 4.8);

    const hullGeo = new THREE.ExtrudeGeometry(hullShape, {
      steps: 2,
      depth: 0.95,
      bevelEnabled: true,
      bevelThickness: 0.35,
      bevelSize: 0.3,
      bevelSegments: 4
    });
    hullGeo.center();
    const hullMesh = new THREE.Mesh(hullGeo, this.hullDeadMat);
    hullMesh.rotation.x = Math.PI / 2;
    hullMesh.position.set(0, 0.76, 0);
    hullMesh.castShadow = true;
    hullMesh.receiveShadow = true;
    this.tiltGroup.add(hullMesh);

    // 2. Obra viva (sumergida en rojo)
    const liveShape = new THREE.Shape();
    liveShape.moveTo(0, 4.4);
    liveShape.bezierCurveTo(1.45, 2.6, 1.45, -1.2, 1.15, -3.4);
    liveShape.lineTo(-1.15, -3.4);
    liveShape.bezierCurveTo(-1.45, -1.2, -1.45, 2.6, 0, 4.4);

    const liveGeo = new THREE.ExtrudeGeometry(liveShape, {
      steps: 2,
      depth: 0.8,
      bevelEnabled: true,
      bevelThickness: 0.3,
      bevelSize: 0.25,
      bevelSegments: 4
    });
    liveGeo.center();
    const liveMesh = new THREE.Mesh(liveGeo, this.hullAliveMat);
    liveMesh.rotation.x = Math.PI / 2;
    liveMesh.position.set(0, -0.08, 0);
    liveMesh.castShadow = true;
    this.tiltGroup.add(liveMesh);

    // Línea de flotación
    const wlGeo = new THREE.BoxGeometry(2.38, 0.07, 7.4);
    const wlMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const wlMesh = new THREE.Mesh(wlGeo, wlMat);
    wlMesh.position.set(0, 0.28, 0.1);
    this.tiltGroup.add(wlMesh);

    // Roda y Espejo
    const rodaGeo = new THREE.BoxGeometry(0.18, 1.4, 0.6);
    const rodaMesh = new THREE.Mesh(rodaGeo, this.metalFitMat);
    rodaMesh.position.set(0, 0.7, 4.5);
    this.tiltGroup.add(rodaMesh);

    const transomGeo = new THREE.BoxGeometry(2.4, 1.2, 0.15);
    const transomMesh = new THREE.Mesh(transomGeo, this.hullDeadMat);
    transomMesh.position.set(0, 0.7, -3.85);
    this.tiltGroup.add(transomMesh);
  }

  buildKeelAndRudder() {
    // Quillote con bulbo
    const keelFinGeo = new THREE.BoxGeometry(0.18, 2.6, 1.7);
    const keelFinMesh = new THREE.Mesh(keelFinGeo, this.keelMat);
    keelFinMesh.position.set(0, -1.35, 0.3);
    keelFinMesh.castShadow = true;
    this.tiltGroup.add(keelFinMesh);

    const bulbGeo = new THREE.ConeGeometry(0.38, 3.4, 16);
    const bulbMesh = new THREE.Mesh(bulbGeo, this.bulbMat);
    bulbMesh.rotation.x = Math.PI / 2;
    bulbMesh.position.set(0, -2.55, 0.3);
    bulbMesh.castShadow = true;
    this.tiltGroup.add(bulbMesh);

    // Timón y mecha
    this.rudderPivot = new THREE.Group();
    this.rudderPivot.position.set(0, 0.6, -3.6);
    this.tiltGroup.add(this.rudderPivot);

    const stockGeo = new THREE.CylinderGeometry(0.045, 0.045, 2.2, 12);
    const stockMesh = new THREE.Mesh(stockGeo, this.metalFitMat);
    stockMesh.position.set(0, -0.6, 0);
    this.rudderPivot.add(stockMesh);

    const bladeGeo = new THREE.BoxGeometry(0.1, 1.5, 0.7);
    const bladeMesh = new THREE.Mesh(bladeGeo, this.rudderMat);
    bladeMesh.position.set(0, -1.25, -0.2);
    bladeMesh.castShadow = true;
    this.rudderPivot.add(bladeMesh);

    // Caña de timón
    const tillerGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.3, 10);
    const tillerMesh = new THREE.Mesh(tillerGeo, this.deckMat);
    tillerMesh.rotation.x = Math.PI / 2;
    tillerMesh.position.set(0, 0.65, 0.6);
    this.rudderPivot.add(tillerMesh);
  }

  buildDeckAndCabin() {
    // Cubierta de teca
    const deckGeo = new THREE.BoxGeometry(2.36, 0.15, 7.3);
    const deckMesh = new THREE.Mesh(deckGeo, this.deckMat);
    deckMesh.position.set(0, 1.25, -0.15);
    deckMesh.receiveShadow = true;
    this.tiltGroup.add(deckMesh);

    // Carroza y escotillas
    const cabinGeo = new THREE.BoxGeometry(1.55, 0.48, 3.1);
    const cabinMesh = new THREE.Mesh(cabinGeo, this.cabinMat);
    cabinMesh.position.set(0, 1.54, 0.5);
    cabinMesh.castShadow = true;
    this.tiltGroup.add(cabinMesh);

    const hatchGeo = new THREE.BoxGeometry(0.85, 0.12, 0.85);
    const hatchMesh = new THREE.Mesh(hatchGeo, new THREE.MeshStandardMaterial({ color: 0x1e293b }));
    hatchMesh.position.set(0, 1.8, 0.4);
    this.tiltGroup.add(hatchMesh);

    // Cockpit
    const cockpitGeo = new THREE.BoxGeometry(1.4, 0.35, 2.2);
    const cockpitMesh = new THREE.Mesh(cockpitGeo, new THREE.MeshStandardMaterial({ color: 0x0f172a }));
    cockpitMesh.position.set(0, 1.15, -2.4);
    this.tiltGroup.add(cockpitMesh);

    const benchGeo = new THREE.BoxGeometry(0.35, 0.15, 2.1);
    const benchL = new THREE.Mesh(benchGeo, this.deckMat);
    benchL.position.set(-0.9, 1.3, -2.4);
    const benchR = new THREE.Mesh(benchGeo, this.deckMat);
    benchR.position.set(0.9, 1.3, -2.4);
    this.tiltGroup.add(benchL);
    this.tiltGroup.add(benchR);
  }

  buildRigging() {
    // Mástil principal
    const mastGeo = new THREE.CylinderGeometry(0.08, 0.13, 10.8, 16);
    this.mastMesh = new THREE.Mesh(mastGeo, this.mastMat);
    this.mastMesh.position.set(0, 6.7, 0.95);
    this.mastMesh.castShadow = true;
    this.tiltGroup.add(this.mastMesh);

    // Crucetas (spreaders)
    const spreaderGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.7, 8);
    const spreaderMesh = new THREE.Mesh(spreaderGeo, this.metalFitMat);
    spreaderMesh.rotation.z = Math.PI / 2;
    spreaderMesh.position.set(0, 6.5, 0.95);
    this.tiltGroup.add(spreaderMesh);

    // Jarcia firme: Estay de proa, Popel y Obenques
    const addCable = (p1, p2) => {
      const geo = new THREE.BufferGeometry().setFromPoints([p1, p2]);
      const line = new THREE.Line(geo, this.cableMat);
      this.tiltGroup.add(line);
    };

    addCable(new THREE.Vector3(0, 1.4, 4.4), new THREE.Vector3(0, 12.1, 0.95));  // Estay Proel
    addCable(new THREE.Vector3(0, 1.3, -3.8), new THREE.Vector3(0, 12.1, 0.95)); // Baquestay
    addCable(new THREE.Vector3(1.18, 1.3, 0.9), new THREE.Vector3(0, 12.1, 0.95)); // Obenque Babor (+X)
    addCable(new THREE.Vector3(-1.18, 1.3, 0.9), new THREE.Vector3(0, 12.1, 0.95));// Obenque Estribor (-X)
  }

  buildNavigationLights() {
    this.lightsGroup = new THREE.Group();
    this.tiltGroup.add(this.lightsGroup);

    // Luz de Babor (Roja - 112.5° hacia proa y banda de babor - Izquierda looking forward / +X)
    this.portLamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xff2222, emissive: 0xff0000, emissiveIntensity: 0 })
    );
    this.portLamp.position.set(1.18, 1.35, 1.2);
    this.lightsGroup.add(this.portLamp);

    this.portSpot = new THREE.SpotLight(0xff2222, 0, 14, Math.PI * 0.35, 0.5);
    this.portSpot.position.set(1.18, 1.35, 1.2);
    this.portSpot.target.position.set(5, 0, 5);
    this.lightsGroup.add(this.portSpot);
    this.lightsGroup.add(this.portSpot.target);

    // Luz de Estribor (Verde - 112.5° hacia proa y banda de estribor - Derecha looking forward / -X)
    this.starboardLamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x22ff44, emissive: 0x00ff22, emissiveIntensity: 0 })
    );
    this.starboardLamp.position.set(-1.18, 1.35, 1.2);
    this.lightsGroup.add(this.starboardLamp);

    this.starboardSpot = new THREE.SpotLight(0x22ff44, 0, 14, Math.PI * 0.35, 0.5);
    this.starboardSpot.position.set(-1.18, 1.35, 1.2);
    this.starboardSpot.target.position.set(-5, 0, 5);
    this.lightsGroup.add(this.starboardSpot);
    this.lightsGroup.add(this.starboardSpot.target);

    // Luz de Alcance (Popa - Blanca 135°)
    this.sternLamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.07, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0 })
    );
    this.sternLamp.position.set(0, 1.35, -3.85);
    this.lightsGroup.add(this.sternLamp);

    this.sternSpot = new THREE.SpotLight(0xffffff, 0, 14, Math.PI * 0.4, 0.4);
    this.sternSpot.position.set(0, 1.35, -3.85);
    this.sternSpot.target.position.set(0, 0, -8);
    this.lightsGroup.add(this.sternSpot);
    this.lightsGroup.add(this.sternSpot.target);

    // Luz de Tope (Blanca 225° en el mástil - navegación a motor)
    this.mastLightLamp = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0 })
    );
    this.mastLightLamp.position.set(0, 7.5, 1.05);
    this.lightsGroup.add(this.mastLightLamp);
  }

  setNavigationLights(enabled, underEngine = false) {
    const intensity = enabled ? 2.5 : 0;
    const emissive = enabled ? 1.5 : 0;

    this.portLamp.material.emissiveIntensity = emissive;
    this.portSpot.intensity = intensity;

    this.starboardLamp.material.emissiveIntensity = emissive;
    this.starboardSpot.intensity = intensity;

    this.sternLamp.material.emissiveIntensity = emissive;
    this.sternSpot.intensity = intensity;

    const mastIntensity = (enabled && underEngine) ? 3.0 : 0;
    this.mastLightLamp.material.emissiveIntensity = mastIntensity ? 2.0 : 0;
  }

  setHeading(radians) {
    this.heading = radians;
    this.group.rotation.y = radians;
  }

  setHeel(radians) {
    this.heelAngle = radians;
    this.tiltGroup.rotation.z = radians;
  }

  setRudder(radians) {
    if (this.rudderPivot) {
      this.rudderPivot.rotation.y = radians;
    }
  }

  update(delta, time) {
    // Cabeceo suave y oleaje sobre el casco
    const pitch = Math.sin(time * 1.8) * 0.025;
    const waveY = Math.sin(time * 2.2) * 0.035;
    this.tiltGroup.rotation.x = pitch;
    this.tiltGroup.position.y = waveY;

    if (this.sails) {
      this.sails.update(delta, time);
    }
  }
}
