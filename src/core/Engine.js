import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Engine {
  constructor(containerId = 'webgl-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Contenedor #${containerId} no encontrado.`);
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060a14);
    this.scene.fog = new THREE.FogExp2(0x060a14, 0.015);

    this.camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(12, 7, 16);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 50;
    this.controls.target.set(0, 1.8, 0);

    this.updatables = [];
    this.clock = new THREE.Clock();

    window.addEventListener('resize', () => this.onResize());
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  addUpdatable(object) {
    this.updatables.push(object);
  }

  start() {
    const loop = () => {
      requestAnimationFrame(loop);
      const delta = this.clock.getDelta();
      const time = this.clock.getElapsedTime();

      for (const obj of this.updatables) {
        if (typeof obj.update === 'function') {
          obj.update(delta, time);
        }
      }

      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    loop();
  }
}
