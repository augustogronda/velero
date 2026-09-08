import { Engine } from './core/Engine.js';
import { SceneEnvironment } from './core/SceneEnvironment.js';
import { Boat } from './models/Boat.js';
import { OtherVessel } from './models/OtherVessel.js';
import { WindSystem } from './simulation/WindSystem.js';
import { RipaEngine } from './simulation/RipaEngine.js';
import { IalaSystem } from './simulation/IalaSystem.js';
import { AnchorSystem } from './simulation/AnchorSystem.js';
import { WeatherSystem } from './simulation/WeatherSystem.js';
import { SimulatorHUD } from './ui/SimulatorHUD.js';

window.addEventListener('DOMContentLoaded', () => {
  const engine = new Engine('webgl-container');

  const environment = new SceneEnvironment(engine.scene);
  engine.addUpdatable(environment);

  const boat = new Boat(engine.scene);
  engine.addUpdatable(boat);

  const otherVessel = new OtherVessel(engine.scene);
  engine.addUpdatable(otherVessel);

  const ialaSystem = new IalaSystem(engine.scene);
  engine.addUpdatable(ialaSystem);

  const anchorSystem = new AnchorSystem(engine.scene, boat);
  engine.addUpdatable(anchorSystem);

  const windSystem = new WindSystem();
  const ripaEngine = new RipaEngine(otherVessel);
  const weatherSystem = new WeatherSystem(environment, windSystem, boat);

  const hud = new SimulatorHUD(
    windSystem,
    boat,
    environment,
    otherVessel,
    ripaEngine,
    ialaSystem,
    anchorSystem,
    weatherSystem,
    engine
  );

  engine.start();

  console.log('⚓ Simulador Náutico Integral PNA (Viento, RIPA, IALA B, Fondeo y Meteorología) listo.');
});
