import { Engine } from './core/Engine.js';
import { SceneEnvironment } from './core/SceneEnvironment.js';
import { Boat } from './models/Boat.js';
import { WindSystem } from './simulation/WindSystem.js';
import { SimulatorHUD } from './ui/SimulatorHUD.js';

// Inicialización de la aplicación modular
window.addEventListener('DOMContentLoaded', () => {
  const engine = new Engine('webgl-container');
  const environment = new SceneEnvironment(engine.scene);
  engine.addUpdatable(environment);

  const boat = new Boat(engine.scene);
  engine.addUpdatable(boat);

  const windSystem = new WindSystem();
  const hud = new SimulatorHUD(windSystem, boat, environment);

  // Iniciar el loop de simulación física y renderizado 3D
  engine.start();

  console.log('⚓ Simulador Náutico de Maniobras iniciado correctamente (POO + Vite + Three.js).');
});
