import * as THREE from 'three';

export const RIPA_SCENARIOS = {
  free: {
    id: 'free',
    name: 'Navegación Libre (Sin Cruces)',
    description: 'Practica viradas, trimado y control de viento en solitario.',
    otherVessel: { active: false }
  },
  opposite_tacks: {
    id: 'opposite_tacks',
    name: 'RIPA Regla 12: Distintas Amuras',
    description: 'Dos veleros en rumbos convergentes con riesgo de colisión. Tu barco está amurado a estribor y el otro amurado a babor.',
    question: '¿Quién tiene derecho de paso en esta situación?',
    options: [
      { text: 'Tu velero (Estribor amurado) mantiene rumbo y velocidad', correct: true, feedback: '¡Correcto! Regla 12(a)(i): El buque amurado a babor debe apartarse del que está amurado a estribor.' },
      { text: 'El otro barco (Babor amurado) tiene preferencia', correct: false, feedback: 'Incorrecto. Quien tiene el viento entrando por estribor siempre tiene derecho de paso frente a babor amurado.' }
    ],
    otherVessel: {
      active: true,
      type: 'sailboat',
      startPos: new THREE.Vector3(-18, 0, 16),
      headingDeg: 40,
      speed: 4.8,
      tackSide: 'babor',
      trackColor: 0xef4444 // Rojo = debe ceder
    },
    ownBoatRule: 'privilegiado' // Mantiene rumbo
  },
  same_tack: {
    id: 'same_tack',
    name: 'RIPA Regla 12: Misma Amura (Barlovento / Sotavento)',
    description: 'Ambos veleros navegan amurados a la misma banda. Tu barco está a SOTAVENTO y el otro barco navega a BARLOVENTO.',
    question: '¿Qué barco debe maniobrar para evitar el abordaje?',
    options: [
      { text: 'El otro barco (Barlovento) debe maniobrar', correct: true, feedback: '¡Excelente! Regla 12(a)(ii): El buque que esté a barlovento se mantendrá apartado del buque que esté a sotavento.' },
      { text: 'Tu barco (Sotavento) debe gobernar y dejar pasar', correct: false, feedback: 'Incorrecto. El barco de sotavento tiene menos ángulo de viento disponible y está protegido por el reglamento.' }
    ],
    otherVessel: {
      active: true,
      type: 'sailboat',
      startPos: new THREE.Vector3(8, 0, 14),
      headingDeg: 55,
      speed: 5.0,
      tackSide: 'estribor',
      trackColor: 0xef4444 // Barlovento cede
    },
    ownBoatRule: 'privilegiado'
  },
  overtaking: {
    id: 'overtaking',
    name: 'RIPA Regla 13: Buque que Alcanza',
    description: 'Navegas a rumbo fijo cuando un barco más veloz se aproxima por tu popa (sector de más de 22.5° a popa del través).',
    question: '¿Quién debe maniobrar para evitar la colisión?',
    options: [
      { text: 'El buque que alcanza (el que viene de atrás) debe mantenerse apartado', correct: true, feedback: '¡Exacto! Regla 13: Todo buque que alcance a otro se mantendrá apartado de la derrota del buque alcanzado.' },
      { text: 'Tu barco debe virar para despejar el camino', correct: false, feedback: 'Incorrecto. El barco alcanzado debe mantener su rumbo y velocidad de forma predecible.' }
    ],
    otherVessel: {
      active: true,
      type: 'sailboat',
      startPos: new THREE.Vector3(-4, 0, -22),
      headingDeg: 45,
      speed: 7.5,
      tackSide: 'estribor',
      trackColor: 0xef4444
    },
    ownBoatRule: 'privilegiado'
  },
  channel_commercial: {
    id: 'channel_commercial',
    name: 'RIPA Regla 9: Velero vs. Buque Mercante en Canal',
    description: 'Navegas en las proximidades del Canal Mitre o canal de acceso y se aproxima un buque portacontenedores de gran porte.',
    question: '¿Tiene el velero preferencia de paso sobre el buque de motor en este canal?',
    options: [
      { text: 'NO. El velero NO debe estorbar a buques que solo navegan en canal angosto', correct: true, feedback: '¡Muy bien! Regla 9: Los veleros de placer no estorbarán el tránsito de buques comerciales con calado restringido.' },
      { text: 'SÍ. Porque los barcos a vela siempre tienen preferencia sobre el motor', correct: false, feedback: 'Grave error náutico. La Regla 9 (Canales Angostos) prevalece sobre la Regla 18 de propulsión.' }
    ],
    otherVessel: {
      active: true,
      type: 'motorboat',
      startPos: new THREE.Vector3(12, 0, -30),
      headingDeg: 0,
      speed: 8.5,
      trackColor: 0x10b981 // Buque tiene preferencia
    },
    ownBoatRule: 'cede_paso'
  }
};

export class RipaEngine {
  constructor(otherVessel) {
    this.otherVessel = otherVessel;
    this.currentScenarioKey = 'free';
  }

  loadScenario(key) {
    if (!RIPA_SCENARIOS[key]) return;
    this.currentScenarioKey = key;
    const scen = RIPA_SCENARIOS[key];
    this.otherVessel.setupScenario(scen.otherVessel);
    return scen;
  }

  getCurrentScenario() {
    return RIPA_SCENARIOS[this.currentScenarioKey];
  }
}
