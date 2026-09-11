import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Engine {
  constructor(containerId = 'webgl-container') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      throw new Error(`Contenedor #${containerId} no encontrado.`);
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x7dd3fc); // Cielo azul diurno luminoso
    this.scene.fog = new THREE.FogExp2(0x7dd3fc, 0.006);

    const { width, height } = this.getViewportSize();

    this.camera = new THREE.PerspectiveCamera(
      45,
      width / height,
      0.1,
      1000
    );
    this.camera.position.set(12, 7, 16);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3; // Exposición diurna radiante
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.minDistance = 3;
    this.controls.maxDistance = 65;
    this.controls.target.set(0, 1.8, 0);

    this.updatables = [];
    this.clock = new THREE.Clock();

    // Eventos de resize estándar y visualViewport
    window.addEventListener('resize', () => this.onResize());
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', () => this.onResize());
    }

    // ResizeObserver directo sobre el contenedor WebGL
    if (typeof ResizeObserver !== 'undefined' && this.container) {
      this.resizeObserver = new ResizeObserver(() => this.onResize());
      this.resizeObserver.observe(this.container);
    }

    // Solución al arranque de iPadOS en modo standalone / fullscreen PWA:
    // WebKit ajusta la altura final de pantalla tras la animación de inicio sin disparar 'resize'.
    // Varios ticks garantizan que el canvas tome el 100% de la pantalla sin dejar franjas muertas.
    setTimeout(() => this.onResize(), 60);
    setTimeout(() => this.onResize(), 180);
    setTimeout(() => this.onResize(), 350);
    setTimeout(() => this.onResize(), 700);
    setTimeout(() => this.onResize(), 1200);

    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.onResize(), 100);
      setTimeout(() => this.onResize(), 300);
      setTimeout(() => this.onResize(), 600);
    });
  }

  /**
   * Obtiene dimensiones exactas del viewport dando prioridad al contenedor y visualViewport.
   * Evita el bug de WebKit en iOS donde window.innerHeight reporta dimensiones incompletas.
   */
  getViewportSize() {
    let width = this.container ? this.container.clientWidth : 0;
    let height = this.container ? this.container.clientHeight : 0;

    if (!width || !height) {
      if (window.visualViewport) {
        width = Math.round(window.visualViewport.width);
        height = Math.round(window.visualViewport.height);
      } else {
        width = window.innerWidth;
        height = window.innerHeight;
      }
    }
    return { width, height };
  }

  onResize() {
    const { width, height } = this.getViewportSize();
    if (width <= 0 || height <= 0) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  addUpdatable(object) {
    this.updatables.push(object);
  }

  /**
   * Throttle del render loop cuando la app está en background.
   * En modo throttled renderiza a máximo 1fps para ahorrar batería.
   * @param {boolean} throttled
   */
  setThrottled(throttled) {
    this._throttled = throttled;
    console.log(`⚡ Engine: render ${throttled ? 'throttled (background)' : 'normal (foreground)'}`);
  }

  start() {
    this._throttled = false;
    this._lastThrottledFrame = 0;

    const loop = () => {
      requestAnimationFrame(loop);

      // En background: renderizar a 1fps máximo para ahorrar batería iPad
      if (this._throttled) {
        const now = performance.now();
        if (now - this._lastThrottledFrame < 1000) return;
        this._lastThrottledFrame = now;
      }

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
