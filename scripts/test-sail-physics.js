import * as THREE from 'three';
import { SailManager } from '../src/models/Sail.js';
import { WindSystem } from '../src/simulation/WindSystem.js';
import { Boat } from '../src/models/Boat.js';

console.log('=== TEST DE FÍSICA Y CINEMÁTICA DE VELAS ===\n');

const boatGroup = new THREE.Group();
const sailMgr = new SailManager(boatGroup);

// TEST 1: Viento por Estribor (side = 1) -> Velas deben ir a Babor (+X)
console.log('--- Test 1: Viento por Estribor (Ceñida 45°) ---');
sailMgr.setSailTrim(0.15, 0.15, 1, 0, 15, 45);
// Simular varios frames para que el lerp alcance el ángulo objetivo
for (let f = 0; f < 50; f++) {
  sailMgr.update(0.016, f * 0.016);
}

const boomAngle1 = sailMgr.boomPivot.rotation.y;
const jibAngle1 = sailMgr.jibPivot.rotation.y;
console.log(`Ángulo de botavara: ${(boomAngle1 * 180 / Math.PI).toFixed(1)}° (debe ser negativo para ir a Babor)`);
console.log(`Ángulo de foque: ${(jibAngle1 * 180 / Math.PI).toFixed(1)}° (debe ser negativo para ir a Babor)`);

// Calcular posición punta de botavara en X
// Punto (0, 0, -4.3) rotado por boomAngle1
const tipX1 = -4.3 * Math.sin(boomAngle1);
console.log(`Posición X de punta de botavara: ${tipX1.toFixed(3)} (debe ser POSITIVA: hacia Babor/+X)`);
if (tipX1 > 0) {
  console.log('✅ TEST 1 PASÓ: La botavara rota correctamente hacia Sotavento (Babor)!');
} else {
  console.error('❌ TEST 1 FALLÓ: La botavara fue hacia Barlovento!');
  process.exit(1);
}

// Verificar que la bolsa de la vela (camber) esté hacia Babor (+X)
const midMainIdx = Math.floor(sailMgr.mainPositions.length / 2);
const midX1 = sailMgr.mainPositions[midMainIdx - (midMainIdx % 3)]; // coordenada X
console.log(`Desplazamiento X del centro de la vela mayor: ${midX1.toFixed(3)} (debe ser POSITIVO: hacia Babor/+X)`);
if (midX1 > 0) {
  console.log('✅ TEST 1B PASÓ: La bolsa de la mayor curva correctamente hacia Sotavento!');
} else {
  console.error('❌ TEST 1B FALLÓ: La bolsa de la mayor curva hacia Barlovento!');
  process.exit(1);
}

// TEST 2: Viento por Babor (side = -1) -> Velas deben ir a Estribor (-X)
console.log('\n--- Test 2: Viento por Babor (Ceñida 315°) ---');
sailMgr.setSailTrim(0.15, 0.15, -1, 0, 15, 45);
for (let f = 0; f < 50; f++) {
  sailMgr.update(0.016, 1.0 + f * 0.016);
}

const boomAngle2 = sailMgr.boomPivot.rotation.y;
const tipX2 = -4.3 * Math.sin(boomAngle2);
console.log(`Ángulo de botavara: ${(boomAngle2 * 180 / Math.PI).toFixed(1)}° (debe ser positivo para ir a Estribor)`);
console.log(`Posición X de punta de botavara: ${tipX2.toFixed(3)} (debe ser NEGATIVA: hacia Estribor/-X)`);
if (tipX2 < 0) {
  console.log('✅ TEST 2 PASÓ: La botavara rota correctamente hacia Sotavento (Estribor)!');
} else {
  console.error('❌ TEST 2 FALLÓ: La botavara fue hacia Barlovento!');
  process.exit(1);
}

// TEST 3: Proa al Viento / Zona Muerta (Rumbo 0°, Viento 0° -> relAngle = 0°)
console.log('\n--- Test 3: Proa al viento / En facha ---');
sailMgr.setSailTrim(0.05, 0.05, 1, 0.85, 15, 0); // en facha
for (let f = 0; f < 50; f++) {
  sailMgr.update(0.016, 2.0 + f * 0.016);
}
const boomAngle3 = Math.abs(sailMgr.boomPivot.rotation.y * 180 / Math.PI);
console.log(`Ángulo de botavara en proa al viento: ${boomAngle3.toFixed(1)}° (debe estar centrado < 5°)`);
if (boomAngle3 < 6) {
  console.log('✅ TEST 3 PASÓ: La botavara se mantiene al centro flameando en proa al viento!');
} else {
  console.error('❌ TEST 3 FALLÓ: La botavara no se centró!');
  process.exit(1);
}

// TEST 4: Ondulación continua dinámica
console.log('\n--- Test 4: Ondulación continua de tela en el tiempo ---');
sailMgr.setSailTrim(0.4, 0.4, 1, 0, 18, 90);
sailMgr.update(0.016, 3.0);
const sample1 = sailMgr.mainPositions[15]; // vértice arbitrario
sailMgr.update(0.016, 3.15);
const sample2 = sailMgr.mainPositions[15];
const deltaX = Math.abs(sample2 - sample1);
console.log(`Diferencia de posición en vértice tras 150ms: ${deltaX.toFixed(5)}`);
if (deltaX > 0.001) {
  console.log('✅ TEST 4 PASÓ: La tela presenta ondulación y movimiento dinámico continuo!');
} else {
  console.error('❌ TEST 4 FALLÓ: La tela está estática!');
  process.exit(1);
}

// TEST 5: Dirección de escora con viento por Estribor
console.log('\n--- Test 5: Dirección de Escora (Viento por Estribor -> Escora a Babor) ---');
const wind = new WindSystem();
const testScene = new THREE.Scene();
const boat = new Boat(testScene);

// Viento desde el Norte (0°), Rumbo 315° (Noroeste) -> Viento entra por Estribor (+45°)
wind.setTrueWind(0, 18);
wind.setBoatHeading(315);
console.log(`Amura: ${wind.tackSide} (esperado: estribor)`);
console.log(`Escora calculada: ${(wind.heelingAngle * 180 / Math.PI).toFixed(1)}°`);

boat.setHeel(wind.heelingAngle);
// Verifiquemos hacia qué banda se inclina el mástil (+Y).
// El mástil apunta hacia arriba (0, 10, 0) en tiltGroup.
const mastWorldPos = new THREE.Vector3(0, 10, 0);
boat.tiltGroup.localToWorld(mastWorldPos);
console.log(`Posición X de la perilla del mástil: ${mastWorldPos.x.toFixed(3)} (debe ser POSITIVA: inclinación hacia Babor/+X)`);

if (wind.tackSide === 'estribor' && mastWorldPos.x > 0.01) {
  console.log('✅ TEST 5 PASÓ: Con viento por Estribor, el barco escora hacia Sotavento (Babor)!');
} else {
  console.error('❌ TEST 5 FALLÓ: Con viento por Estribor, el barco escoró a Barlovento o hacia el lado incorrecto!');
  process.exit(1);
}

// TEST 6: Dirección de escora con viento por Babor
console.log('\n--- Test 6: Dirección de Escora (Viento por Babor -> Escora a Estribor) ---');
// Viento desde el Norte (0°), Rumbo 45° (Noreste) -> Viento entra por Babor (-45°)
wind.setBoatHeading(45);
console.log(`Amura: ${wind.tackSide} (esperado: babor)`);
console.log(`Escora calculada: ${(wind.heelingAngle * 180 / Math.PI).toFixed(1)}°`);

boat.setHeel(wind.heelingAngle);
const mastWorldPos2 = new THREE.Vector3(0, 10, 0);
boat.tiltGroup.localToWorld(mastWorldPos2);
console.log(`Posición X de la perilla del mástil: ${mastWorldPos2.x.toFixed(3)} (debe ser NEGATIVA: inclinación hacia Estribor/-X)`);

if (wind.tackSide === 'babor' && mastWorldPos2.x < -0.01) {
  console.log('✅ TEST 6 PASÓ: Con viento por Babor, el barco escora hacia Sotavento (Estribor)!');
} else {
  console.error('❌ TEST 6 FALLÓ: Con viento por Babor, el barco escoró a Barlovento o hacia el lado incorrecto!');
  process.exit(1);
}

console.log('\n🎉 TODOS LOS TESTS DE FÍSICA, CINEMÁTICA Y ESCORA PASARON CON ÉXITO!');

