import * as THREE from 'three';
import { SailManager } from '../src/models/Sail.js';

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

console.log('\n🎉 TODOS LOS TESTS DE FÍSICA Y CINEMÁTICA DE VELAS PASARON CON ÉXITO!');
