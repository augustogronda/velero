import * as THREE from 'three';

export class SceneEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.isNight = false;
    this.activeSkyColor = 0x0284c7;
    this.activeWaterColor = 0x0369a1;

    this.baseWaterY = 0.28;
    this.waveFreq = 1.5;
    this.waveAmp = 0.08;

    this.initLights();
    this.initWater();
    this.initGrid();

    // Establecer color de cielo diurno oceánico inicial
    this.scene.background.setHex(this.activeSkyColor);
    this.scene.fog.color.setHex(this.activeSkyColor);
  }

  initLights() {
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0c4a6e, 0.85);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, 1.45);
    this.sunLight.position.set(25, 35, 20);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 100;
    this.sunLight.shadow.camera.left = -15;
    this.sunLight.shadow.camera.right = 15;
    this.sunLight.shadow.camera.top = 15;
    this.sunLight.shadow.camera.bottom = -15;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.underwaterLight = new THREE.DirectionalLight(0x0284c7, 0.6);
    this.underwaterLight.position.set(-10, -20, -10);
    this.scene.add(this.underwaterLight);
  }

  initWater() {
    const waterGeo = new THREE.PlaneGeometry(160, 160, 64, 64);
    this.waterMat = new THREE.MeshStandardMaterial({
      color: this.activeWaterColor,
      roughness: 0.15,
      metalness: 0.8,
      transparent: true,
      opacity: 0.82
    });

    this.waterMesh = new THREE.Mesh(waterGeo, this.waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = this.baseWaterY;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);
  }

  initGrid() {
    // Cuadrícula náutica sutil en el fondo marino para referencia visual
    this.subGrid = new THREE.GridHelper(80, 40, 0x0284c7, 0x0f172a);
    this.subGrid.position.y = -5.0;
    this.scene.add(this.subGrid);
  }

  setNightMode(enabled) {
    this.isNight = enabled;
    if (enabled) {
      this.scene.background.setHex(0x010409);
      this.scene.fog.color.setHex(0x010409);
      this.hemiLight.color.setHex(0x0e244d);
      this.hemiLight.groundColor.setHex(0x020713);
      this.hemiLight.intensity = 0.25;
      this.sunLight.color.setHex(0x93c5fd);
      this.sunLight.intensity = 0.35; // Luz de luna tenue
      this.waterMat.color.setHex(0x021329);
      this.waterMat.opacity = 0.92;
    } else {
      const daySky = this.activeSkyColor || 0x0284c7;
      this.scene.background.setHex(daySky);
      this.scene.fog.color.setHex(daySky);
      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0x0c4a6e);
      this.hemiLight.intensity = 0.85;
      this.sunLight.color.setHex(0xfffaed);
      this.sunLight.intensity = 1.45;
      this.waterMat.color.setHex(this.activeWaterColor || 0x0369a1);
      this.waterMat.opacity = 0.82;
    }
  }

  applyWeatherCondition(preset) {
    if (!preset) return;

    if (preset.waterColor) {
      this.activeWaterColor = preset.waterColor;
      this.waterMat.color.setHex(preset.waterColor);
    }
    if (preset.skyColor) {
      this.activeSkyColor = preset.skyColor;
      if (!this.isNight) {
        this.scene.background.setHex(preset.skyColor);
        this.scene.fog.color.setHex(preset.skyColor);
      }
    }
    if (preset.waveFreq) this.waveFreq = preset.waveFreq;
    if (preset.waveAmp) this.waveAmp = preset.waveAmp;

    // Repunte o bajante del agua sobre la cota normal
    const surge = preset.waterSurge || 0;
    this.waterMesh.position.y = this.baseWaterY + surge;
  }

  update(delta, time) {
    // Animación dinámica de oleaje marino según meteorología activa
    if (this.waterMesh) {
      const pos = this.waterMesh.geometry.attributes.position;
      const freq = this.waveFreq;
      const amp = this.waveAmp;

      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const wave = Math.sin(u * 0.15 + time * freq) * amp + Math.cos(v * 0.12 + time * (freq * 0.85)) * (amp * 0.75);
        pos.setZ(i, wave);
      }
      pos.needsUpdate = true;
    }
  }
}
