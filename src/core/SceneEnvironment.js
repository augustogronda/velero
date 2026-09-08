import * as THREE from 'three';

export class SceneEnvironment {
  constructor(scene) {
    this.scene = scene;
    this.isNight = false;

    // Colores diurnos radiantes por defecto
    this.activeSkyColor = 0x7dd3fc;   // Azul cielo brillante
    this.activeWaterColor = 0x0ea5e9; // Azul mar transparente

    this.baseWaterY = 0.28;
    this.waveFreq = 1.6;
    this.waveAmp = 0.08;
    this.wavesEnabled = true;

    this.sunBrightness = 1.6;
    this.sunElevation = 50;  // Grados de altitud sobre el horizonte (10° a 85°)
    this.sunAzimuth = 135;    // Grados de azimut (orientación)

    this.initLights();
    this.initSun3D();
    this.initWater();
    this.initGrid();

    this.updateSunPosition();
  }

  initLights() {
    this.hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0369a1, 0.95);
    this.hemiLight.position.set(0, 50, 0);
    this.scene.add(this.hemiLight);

    this.sunLight = new THREE.DirectionalLight(0xfffaed, this.sunBrightness);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 0.5;
    this.sunLight.shadow.camera.far = 120;
    this.sunLight.shadow.camera.left = -20;
    this.sunLight.shadow.camera.right = 20;
    this.sunLight.shadow.camera.top = 20;
    this.sunLight.shadow.camera.bottom = -20;
    this.sunLight.shadow.bias = -0.0005;
    this.scene.add(this.sunLight);

    this.underwaterLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
    this.underwaterLight.position.set(-10, -20, -10);
    this.scene.add(this.underwaterLight);
  }

  initSun3D() {
    // Objeto 3D del Sol visible en el firmamento
    this.sunGroup = new THREE.Group();
    this.scene.add(this.sunGroup);

    // Disco solar
    const sunGeo = new THREE.SphereGeometry(3.5, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffbeb });
    this.sunDisc = new THREE.Mesh(sunGeo, sunMat);
    this.sunGroup.add(this.sunDisc);

    // Resplandor / Corona solar brillante
    const haloGeo = new THREE.RingGeometry(3.6, 9.5, 32);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.38
    });
    this.sunHalo = new THREE.Mesh(haloGeo, haloMat);
    this.sunGroup.add(this.sunHalo);
  }

  initWater() {
    // Malla de agua optimizada a 24x24 (576 caras vs 4096 anteriores - 7x más liviano en CPU)
    this.waterGeo = new THREE.PlaneGeometry(160, 160, 24, 24);
    this.waterMat = new THREE.MeshStandardMaterial({
      color: this.activeWaterColor,
      roughness: 0.12,
      metalness: 0.75,
      transparent: true,
      opacity: 0.65 // Más transparente por defecto para ver la quilla y el fondo
    });

    this.waterMesh = new THREE.Mesh(this.waterGeo, this.waterMat);
    this.waterMesh.rotation.x = -Math.PI / 2;
    this.waterMesh.position.y = this.baseWaterY;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);
  }

  initGrid() {
    this.subGrid = new THREE.GridHelper(90, 30, 0x0284c7, 0x075985);
    this.subGrid.position.y = -5.0;
    this.scene.add(this.subGrid);
  }

  updateSunPosition() {
    if (this.isNight) return;

    const elevRad = THREE.MathUtils.degToRad(this.sunElevation);
    const azimRad = THREE.MathUtils.degToRad(this.sunAzimuth);

    const dist = 55;
    const x = dist * Math.cos(elevRad) * Math.sin(azimRad);
    const y = Math.max(12, dist * Math.sin(elevRad));
    const z = dist * Math.cos(elevRad) * Math.cos(azimRad);

    this.sunLight.position.set(x, y, z);
    this.sunGroup.position.set(x * 1.3, y * 1.3, z * 1.3);
    this.sunHalo.lookAt(0, 2, 0);

    // Intensidad proporcional al brillo solar
    this.sunLight.intensity = this.sunBrightness;
    this.hemiLight.intensity = 0.65 + this.sunBrightness * 0.25;

    // Modulación dinámica de claridad del cielo según el sol
    const skyLightness = THREE.MathUtils.clamp(this.sunBrightness / 1.6, 0.7, 1.3);
    const baseColor = new THREE.Color(this.activeSkyColor);
    baseColor.multiplyScalar(skyLightness);

    this.scene.background.copy(baseColor);
    this.scene.fog.color.copy(baseColor);
  }

  setSunBrightness(brightness) {
    this.sunBrightness = THREE.MathUtils.clamp(brightness, 0.4, 2.5);
    this.updateSunPosition();
  }

  setSunElevation(elevationDeg) {
    this.sunElevation = THREE.MathUtils.clamp(elevationDeg, 10, 85);
    this.updateSunPosition();
  }

  setWaterTransparency(opacity) {
    this.waterMat.opacity = THREE.MathUtils.clamp(opacity, 0.1, 0.98);
  }

  setWavesEnabled(enabled) {
    this.wavesEnabled = enabled;
    if (!enabled && this.waterMesh) {
      // Dejar superficie plana sin oscilaciones (CPU 0%)
      const pos = this.waterMesh.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.setZ(i, 0);
      }
      pos.needsUpdate = true;
    }
  }

  setWaveIntensity(amp) {
    this.waveAmp = THREE.MathUtils.clamp(amp, 0.01, 0.25);
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
      this.sunLight.intensity = 0.35;
      this.waterMat.color.setHex(0x021329);
      this.waterMat.opacity = 0.88;
      this.sunGroup.visible = false;
    } else {
      this.hemiLight.color.setHex(0xe0f2fe);
      this.hemiLight.groundColor.setHex(0x0369a1);
      this.sunLight.color.setHex(0xfffaed);
      this.waterMat.color.setHex(this.activeWaterColor);
      this.waterMat.opacity = 0.65;
      this.sunGroup.visible = true;
      this.updateSunPosition();
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
        this.updateSunPosition();
      }
    }
    if (preset.waveFreq) this.waveFreq = preset.waveFreq;
    if (preset.waveAmp) this.waveAmp = preset.waveAmp;

    const surge = preset.waterSurge || 0;
    this.waterMesh.position.y = this.baseWaterY + surge;
  }

  update(delta, time) {
    // Animación de oleaje optimizada (solo se ejecuta si está habilitada)
    if (this.wavesEnabled && this.waterMesh) {
      const pos = this.waterMesh.geometry.attributes.position;
      const freq = this.waveFreq;
      const amp = this.waveAmp;

      for (let i = 0; i < pos.count; i++) {
        const u = pos.getX(i);
        const v = pos.getY(i);
        const wave = Math.sin(u * 0.15 + time * freq) * amp + Math.cos(v * 0.12 + time * (freq * 0.85)) * (amp * 0.7);
        pos.setZ(i, wave);
      }
      pos.needsUpdate = true;
    }
  }
}
