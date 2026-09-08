import * as THREE from 'three';

export const RIPA_SCENARIOS = {
  opposite_tacks: {
    id: 'opposite_tacks',
    number: 1,
    badge: 'Regla 12(a)(i)',
    title: 'Distintas Amuras (Babor cede a Estribor)',
    name: 'RIPA Regla 12(a)(i): Distintas Amuras',
    description: 'Dos veleros navegan en rumbos de colisión. Tu velero recibe el viento por la banda de estribor (Estribor amurado). El otro velero recibe el viento por babor (Babor amurado).',
    question: '¿Quién tiene derecho de paso en este cruce según el RIPA y la PNA?',
    options: [
      {
        text: 'Tu velero (Estribor amurado) tiene preferencia de paso y debe mantener rumbo y velocidad.',
        correct: true,
        feedback: '¡Correcto! Regla 12(a)(i): Cuando dos buques de vela se aproximen con riesgo de colisión y reciban el viento por bandas contrarias, el que esté amurado a babor se mantendrá apartado del amurado a estribor.'
      },
      {
        text: 'El otro barco tiene preferencia porque viene por la derecha.',
        correct: false,
        feedback: 'Incorrecto. La prioridad de la derecha solo rige entre buques a motor (Regla 15). Entre veleros la amura a estribor manda.'
      },
      {
        text: 'Ambos barcos deben arribar inmediatamente a sotavento.',
        correct: false,
        feedback: 'Incorrecto. El buque privilegiado no debe alterar su rumbo arbitrariamente para no desorientar al buque obligado.'
      }
    ],
    ownBoat: {
      headingDeg: 45,
      speed: 5.2,
      underEngine: false,
      role: 'privilegiado',
      roleLabel: '🟢 TU VELERO: PREFERENCIA (Estribor Amurado - Mantiene Rumbo)'
    },
    wind: { directionDeg: 0, speedKts: 14 },
    otherVessel: {
      active: true,
      type: 'sailboat',
      startPos: new THREE.Vector3(-20, 0, 16),
      headingDeg: 40,
      speed: 5.0,
      tackSide: 'babor',
      trackColor: 0xef4444, // Rojo = Cede el paso
      roleLabel: '🔴 OTRO BARCO: CEDE EL PASO (Babor Amurado)'
    },
    nightMode: false,
    camera: { position: [14, 9, 20], target: [0, 2, 4] }
  },

  same_tack: {
    id: 'same_tack',
    number: 2,
    badge: 'Regla 12(a)(ii)',
    title: 'Misma Amura (Barlovento vs Sotavento)',
    name: 'RIPA Regla 12(a)(ii): Misma Amura',
    description: 'Ambos veleros reciben el viento por la misma banda (estribor). Tu velero navega a SOTAVENTO (más lejos del viento). El otro velero navega a BARLOVENTO (más cerca de donde sopla el viento).',
    question: 'Navegando amurados a la misma banda, ¿qué buque tiene la obligación de maniobrar?',
    options: [
      {
        text: 'El otro barco (a Barlovento) debe mantenerse apartado del barco a Sotavento.',
        correct: true,
        feedback: '¡Excelente! Regla 12(a)(ii): Cuando ambos veleros reciben el viento por la misma banda, el que esté a barlovento se mantendrá apartado del que esté a sotavento.'
      },
      {
        text: 'Tu barco (a Sotavento) debe gobernar porque tiene menos viento.',
        correct: false,
        feedback: 'Incorrecto. El barco de sotavento tiene limitado su margen de maniobra hacia el viento y está protegido por la regla.'
      },
      {
        text: 'El barco que tenga mayor velocidad debe ceder siempre el paso.',
        correct: false,
        feedback: 'Incorrecto. La velocidad o el tamaño no cambian la regla de barlovento/sotavento entre veleros.'
      }
    ],
    ownBoat: {
      headingDeg: 55,
      speed: 5.4,
      underEngine: false,
      role: 'privilegiado',
      roleLabel: '🟢 TU VELERO: PREFERENCIA (Sotavento - Mantiene Rumbo)'
    },
    wind: { directionDeg: 0, speedKts: 14 },
    otherVessel: {
      active: true,
      type: 'sailboat',
      startPos: new THREE.Vector3(10, 0, 18),
      headingDeg: 50,
      speed: 5.1,
      tackSide: 'estribor',
      trackColor: 0xef4444,
      roleLabel: '🔴 OTRO BARCO: CEDE EL PASO (Barlovento - Debe Apartarse)'
    },
    nightMode: false,
    camera: { position: [16, 10, 22], target: [4, 2, 5] }
  },

  doubtful_tack: {
    id: 'doubtful_tack',
    number: 3,
    badge: 'Regla 12(a)(iii)',
    title: 'Viento por Babor y Amura Dudosa',
    name: 'RIPA Regla 12(a)(iii): Amura Indeterminada',
    description: 'Navegas amurado a babor en ceñida. Divisas a otro velero por tu barlovento en rumbo de colisión, pero por la distancia y el ángulo no puedes confirmar con certeza por qué banda recibe el viento.',
    question: 'Según la Regla 12(a)(iii) del RIPA, ¿cómo debe actuar tu velero?',
    options: [
      {
        text: 'Tu velero debe maniobrar y mantenerse apartado preventivamente de la derrota del otro.',
        correct: true,
        feedback: '¡Muy bien! Regla 12(a)(iii): Si un buque amurado a babor avista a otro por barlovento y no puede determinar con certeza la amura de este último, se mantendrá apartado de él sin dudar.'
      },
      {
        text: 'Mantener el rumbo y velocidad hasta tener contacto visual a menos de 50 metros.',
        correct: false,
        feedback: 'Peligroso error náutico. Esperar a corta distancia genera un riesgo inminente de abordaje.'
      },
      {
        text: 'Encender el motor y exigir paso por tener velas izadas.',
        correct: false,
        feedback: 'Incorrecto. Encender el motor convierte al velero en buque de propulsión mecánica con menores privilegios (Reglas 18 y 23).'
      }
    ],
    ownBoat: {
      headingDeg: 315,
      speed: 5.1,
      underEngine: false,
      role: 'cede_paso',
      roleLabel: '🔴 TU VELERO: CEDE EL PASO (Babor Amurado / Amura Dudosa)'
    },
    wind: { directionDeg: 0, speedKts: 14 },
    otherVessel: {
      active: true,
      type: 'sailboat',
      startPos: new THREE.Vector3(18, 0, 16),
      headingDeg: 300,
      speed: 5.2,
      tackSide: 'estribor',
      trackColor: 0x10b981,
      roleLabel: '🟢 OTRO BARCO: PRIVILEGIADO A BARLOVENTO'
    },
    nightMode: false,
    camera: { position: [18, 12, 18], target: [0, 2, 0] }
  },

  overtaking: {
    id: 'overtaking',
    number: 4,
    badge: 'Regla 13',
    title: 'Situación de Alcance (Overtaking)',
    name: 'RIPA Regla 13: Buque que Alcanza',
    description: 'Navegas a 4.8 nudos a rumbo fijo. Una embarcación más rápida navega en tu misma dirección aproximándose por tu popa (sector a más de 22.5° a popa de tu través).',
    question: '¿Quién debe maniobrar y qué conducta debe guardar tu embarcación?',
    options: [
      {
        text: 'El buque que alcanza debe mantenerse totalmente apartado; tu velero mantiene rumbo y velocidad.',
        correct: true,
        feedback: '¡Exacto! Regla 13: Todo buque que alcance a otro se mantendrá apartado de la derrota del buque alcanzado. Ninguna alteración posterior de los rumbos convertirá al buque que alcanza en un buque que cruza.'
      },
      {
        text: 'Tu velero debe virar hacia estribor para despejar la ruta al barco más veloz.',
        correct: false,
        feedback: 'Incorrecto. El buque alcanzado debe conservar rumbo y velocidad para permitir una maniobra segura y predecible.'
      },
      {
        text: 'El buque que alcanza tiene prioridad si anuncia su pasada por radio VHF.',
        correct: false,
        feedback: 'Falso. Las comunicaciones radiales no invalidan la obligación reglamentaria de mantenerse apartado impuesta por la Regla 13.'
      }
    ],
    ownBoat: {
      headingDeg: 0,
      speed: 4.8,
      underEngine: false,
      role: 'privilegiado',
      roleLabel: '🟢 TU VELERO: ALCANZADO (Conserva Rumbo y Velocidad)'
    },
    wind: { directionDeg: 45, speedKts: 12 },
    otherVessel: {
      active: true,
      type: 'motorboat',
      startPos: new THREE.Vector3(-4, 0, -26),
      headingDeg: 0,
      speed: 8.5,
      trackColor: 0xef4444,
      roleLabel: '🔴 BUQUE QUE ALCANZA: DEBE MANTENERSE APARTADO'
    },
    nightMode: false,
    camera: { position: [12, 8, -10], target: [0, 2, -6] }
  },

  head_on: {
    id: 'head_on',
    number: 5,
    badge: 'Regla 14',
    title: 'Vuelta Encontrada (Head-on - Barcos a Motor)',
    name: 'RIPA Regla 14: Situación de Vuelta Encontrada',
    description: 'Navegas propulsando a motor en el Río de la Plata. De proa se aproxima otra lancha a motor con rumbos opuestos o casi opuestos (de noche verías ambas luces de costado roja y verde simultáneamente).',
    question: '¿Cuál es la maniobra obligatoria reglamentaria para evitar la colisión?',
    options: [
      {
        text: 'AMBOS buques deben caer a su respectivo ESTRIBOR para pasar babor con babor.',
        correct: true,
        feedback: '¡Regla fundamental! Regla 14: Cuando dos buques de propulsión mecánica naveguen en rumbos opuestos o casi opuestos con riesgo de colisión, cada uno caerá a su estribor de modo que pasen por la banda de babor del otro.'
      },
      {
        text: 'Ambos buques caen a babor para abrir mayor ángulo de agua.',
        correct: false,
        feedback: '¡Grave peligro! Caer a babor en vuelta encontrada es la principal causa de abordajes catastróficos en navegación.'
      },
      {
        text: 'Cede el paso el buque más liviano.',
        correct: false,
        feedback: 'Incorrecto. La Regla 14 impone la misma obligación mutua a ambos buques sin distinción de peso ni eslora.'
      }
    ],
    ownBoat: {
      headingDeg: 0,
      speed: 6.0,
      underEngine: true,
      role: 'ambos_maniobran',
      roleLabel: '⚠️ AMBOS BUQUES: CAER A ESTRIBOR (Pasar Babor con Babor)'
    },
    wind: { directionDeg: 90, speedKts: 10 },
    otherVessel: {
      active: true,
      type: 'motorboat',
      startPos: new THREE.Vector3(0, 0, 32),
      headingDeg: 180,
      speed: 6.0,
      trackColor: 0xf59e0b, // Amarillo = Maniobra mutua
      roleLabel: '⚠️ OTRO BUQUE: CAE A SU ESTRIBOR'
    },
    nightMode: false,
    camera: { position: [14, 9, 8], target: [0, 2, 10] }
  },

  crossing_power: {
    id: 'crossing_power',
    number: 6,
    badge: 'Regla 15',
    title: 'Situación de Cruce a Motor (Paso a Estribor)',
    name: 'RIPA Regla 15: Situación de Cruce',
    description: 'Navegas propulsando a motor rumbo Norte. Por tu banda de ESTRIBOR (costado derecho) divisas a otra embarcación a motor en rumbo de colisión cruzando de derecha a izquierda.',
    question: 'En esta situación de cruce a motor, ¿quién tiene derecho de paso?',
    options: [
      {
        text: 'Tu barco debe apartarse (el que ve al otro por su estribor cede el paso) y evitar cortar su proa.',
        correct: true,
        feedback: '¡Correcto! Regla 15: Cuando dos buques de propulsión mecánica se crucen con riesgo de colisión, el que tenga al otro por su costado de estribor se mantendrá apartado y, si las circunstancias lo permiten, evitará cortar su proa.'
      },
      {
        text: 'Tu barco tiene preferencia porque navega rumbo Norte verdadero.',
        correct: false,
        feedback: 'Falso. El rumbo de la rosa de los vientos no otorga ninguna prioridad en el RIPA.'
      },
      {
        text: 'El otro barco debe frenar por ser el de menor eslora.',
        correct: false,
        feedback: 'Incorrecto. La regla no evalúa la eslora; evalúa únicamente por qué banda se avistan.'
      }
    ],
    ownBoat: {
      headingDeg: 0,
      speed: 5.5,
      underEngine: true,
      role: 'cede_paso',
      roleLabel: '🔴 TU EMBARCACIÓN: CEDE EL PASO (El Otro Viene por Estribor)'
    },
    wind: { directionDeg: 45, speedKts: 8 },
    otherVessel: {
      active: true,
      type: 'motorboat',
      startPos: new THREE.Vector3(22, 0, 10),
      headingDeg: 270,
      speed: 6.2,
      trackColor: 0x10b981, // Verde = Privilegiado
      roleLabel: '🟢 OTRO BUQUE: TIENE PREFERENCIA (Cruza por la Derecha)'
    },
    nightMode: false,
    camera: { position: [16, 11, 16], target: [6, 2, 4] }
  },

  hierarchy_fishing: {
    id: 'hierarchy_fishing',
    number: 7,
    badge: 'Regla 18',
    title: 'Jerarquía entre Buques: Velero vs. Pesquero en Faena',
    name: 'RIPA Regla 18: Obligaciones entre Buques',
    description: 'Navegas a vela en mar abierto. Divisas a un buque pesquero comercial de arrastre con sus redes desplegadas en faena activa de pesca en rumbo de cruce.',
    question: '¿Tiene el velero derecho de paso sobre el buque pesquero faenando?',
    options: [
      {
        text: 'NO. El velero DEBE mantenerse apartado de todo buque dedicado a la pesca en faena.',
        correct: true,
        feedback: '¡Clave de examen PNA! Regla 18(a)(iii): Los buques de vela en navegación se mantendrán apartados de los buques dedicados a la pesca, buques sin gobierno y buques con capacidad de maniobra restringida.'
      },
      {
        text: 'SÍ. Los barcos a vela siempre tienen prioridad absoluta sobre los barcos a motor.',
        correct: false,
        feedback: 'Grave error común. La vela solo tiene preferencia sobre los barcos a motor ordinarios; cede ante pesqueros en faena, barcos sin gobierno y maniobra restringida.'
      },
      {
        text: 'SÍ, siempre que el velero esté en rumbo de ceñida.',
        correct: false,
        feedback: 'Incorrecto. El aparejo de pesca limita la maniobra del pesquero y prevalece la seguridad náutica.'
      }
    ],
    ownBoat: {
      headingDeg: 45,
      speed: 5.0,
      underEngine: false,
      role: 'cede_paso',
      roleLabel: '🔴 TU VELERO: DEBE APARTARSE (Pesquero en Faena Activa)'
    },
    wind: { directionDeg: 0, speedKts: 14 },
    otherVessel: {
      active: true,
      type: 'fishing',
      startPos: new THREE.Vector3(18, 0, 14),
      headingDeg: 285,
      speed: 3.8,
      trackColor: 0x10b981,
      roleLabel: '🟢 PESQUERO EN FAENA: PRIVILEGIADO POR REGLA 18'
    },
    nightMode: false,
    camera: { position: [18, 11, 20], target: [6, 2, 4] }
  },

  narrow_channel: {
    id: 'narrow_channel',
    number: 8,
    badge: 'Regla 9',
    title: 'Canales Angostos (Velero vs. Mercante en Canal)',
    name: 'RIPA Regla 9: Canales Angostos',
    description: 'Navegas a vela en las proximidades del Canal Mitre o canal de acceso dragado. Se aproxima un buque mercante portacontenedores de gran calado que solo puede navegar dentro de la boya.',
    question: '¿Puede el velero obligar al mercante a desviar su rumbo alegando preferencia de vela?',
    options: [
      {
        text: 'NO. Los veleros y embarcaciones menores de 20m NO deben estorbar el paso de buques que solo pueden navegar en el canal.',
        correct: true,
        feedback: '¡Excelente! Regla 9(b): Los buques de vela y los de eslora inferior a 20 metros no estorbarán el tránsito de un buque que solo pueda navegar con seguridad dentro de un paso o canal angosto.'
      },
      {
        text: 'SÍ. En cualquier lugar del mundo la vela manda sobre el buque a motor.',
        correct: false,
        feedback: 'Peligrosísimo mito. En canales angostos y pasos restringidos, la Regla 9 se antepone a la Regla 18.'
      },
      {
        text: 'Solo si el velero hace sonar su bocina de niebla.',
        correct: false,
        feedback: 'Incorrecto. La bocina no altera la restricción física de calado y maniobra del buque de ultramar.'
      }
    ],
    ownBoat: {
      headingDeg: 90,
      speed: 4.8,
      underEngine: false,
      role: 'cede_paso',
      roleLabel: '🔴 TU VELERO: NO ESTORBAR (Canal Angosto / Buque Comercial)'
    },
    wind: { directionDeg: 45, speedKts: 12 },
    otherVessel: {
      active: true,
      type: 'cargo',
      startPos: new THREE.Vector3(0, 0, -32),
      headingDeg: 0,
      speed: 8.5,
      trackColor: 0x10b981,
      roleLabel: '🟢 BUQUE MERCANTE: PRIORIDAD TOTAL EN EL CANAL'
    },
    nightMode: false,
    camera: { position: [20, 14, -6], target: [0, 3, -10] }
  },

  stand_on_action: {
    id: 'stand_on_action',
    number: 9,
    badge: 'Regla 17',
    title: 'Buque con Preferencia (Maniobra In Extremis)',
    name: 'RIPA Regla 17: Acción del Buque Privilegiado',
    description: 'Navegas como buque con derecho de paso (amurado a estribor). El otro velero obligado (babor amurado) no realiza ninguna maniobra a pesar de la extrema proximidad y pitadas de peligro.',
    question: 'Si el buque que debe ceder no actúa, ¿qué exige la Regla 17(b) del RIPA?',
    options: [
      {
        text: 'El buque con preferencia DEBE maniobrar por sí mismo para evitar la colisión (maniobra in extremis).',
        correct: true,
        feedback: '¡Brillante! Regla 17(b): Cuando el buque que tiene preferencia se encuentre tan próximo que no pueda evitarse el abordaje únicamente por la acción del buque obligado, ejercerá la maniobra que mejor ayude a evitar la colisión.'
      },
      {
        text: 'Mantener el rumbo rígidamente hasta el impacto para no perder la razón legal.',
        correct: false,
        feedback: 'Completamente prohibido por el RIPA. La prioridad nunca es un cheque en blanco para dejarse colisionar.'
      },
      {
        text: 'Arrojar bengalas rojas al agua y abandonar la caña de timón.',
        correct: false,
        feedback: 'Incorrecto. El timonel debe mantener el control y ejecutar una maniobra de escape decisiva.'
      }
    ],
    ownBoat: {
      headingDeg: 45,
      speed: 5.2,
      underEngine: false,
      role: 'privilegiado',
      roleLabel: '⚠️ BUQUE PRIVILEGIADO: MANIOBRA IN EXTREMIS SI EL OTRO NO ACTÚA'
    },
    wind: { directionDeg: 0, speedKts: 14 },
    otherVessel: {
      active: true,
      type: 'sailboat',
      startPos: new THREE.Vector3(-9, 0, 11),
      headingDeg: 40,
      speed: 5.0,
      tackSide: 'babor',
      trackColor: 0xef4444,
      roleLabel: '🔴 BUQUE OBLIGADO: NO MANIOBRA (PELIGRO INMINENTE)'
    },
    nightMode: false,
    camera: { position: [12, 8, 16], target: [-2, 2, 6] }
  },

  night_lights_id: {
    id: 'night_lights_id',
    number: 10,
    badge: 'Reglas 21 & 23',
    title: 'Identificación de Luces Nocturnas RIPA',
    name: 'RIPA Reglas 21 y 23: Identificación Nocturna',
    description: 'Navegación nocturna en el Río de la Plata (Modo Noche activado). Divisas en el horizonte por tu banda de babor únicamente una LUZ VERDE y una LUZ BLANCA por encima de ella.',
    question: '¿Qué tipo de embarcación estás divisando y qué situación reglamentaria se produce?',
    options: [
      {
        text: 'Un buque de propulsión mecánica que muestra su costado de estribor; como te ve por su babor (tu luz verde), TÚ tienes derecho de paso.',
        correct: true,
        feedback: '¡Perfecto reconocimiento nocturno! Luz de tope blanca (225°) + luz de costado verde (112.5°) corresponden a un buque a motor navegando hacia la derecha. Como él te ve por su estribor (Regla 15), él está obligado a mantenerse apartado.'
      },
      {
        text: 'Un velero en ceñida visto desde su aleta de babor.',
        correct: false,
        feedback: 'Incorrecto. Los veleros a vela pura NO encienden luz de tope blanca en el palo; solo muestran luces de costado y alcance.'
      },
      {
        text: 'Una boya de peligro aislado del canal.',
        correct: false,
        feedback: 'Incorrecto. Las boyas de peligro aislado emiten luz blanca con dos destellos grupo Fl(2) W, no luz verde fija.'
      }
    ],
    ownBoat: {
      headingDeg: 0,
      speed: 5.2,
      underEngine: false,
      role: 'privilegiado',
      roleLabel: '🌙 NOCHE: VES SU LUZ VERDE Y BLANCA (Él debe cederte el paso)'
    },
    wind: { directionDeg: 45, speedKts: 12 },
    otherVessel: {
      active: true,
      type: 'motorboat',
      startPos: new THREE.Vector3(-18, 0, 14),
      headingDeg: 80,
      speed: 6.2,
      nightLights: true,
      trackColor: 0x10b981,
      roleLabel: '🌙 OTRO BUQUE: LUZ BLANCA TOPE + VERDE ESTRIBOR'
    },
    nightMode: true,
    camera: { position: [14, 8, 16], target: [-2, 2, 6] }
  }
};

export class RipaEngine {
  constructor(otherVessel) {
    this.otherVessel = otherVessel;
    this.currentScenarioKey = 'opposite_tacks';
    this.completedScenarios = new Set();
  }

  getScenarioList() {
    return Object.values(RIPA_SCENARIOS);
  }

  getScenarioKeys() {
    return Object.keys(RIPA_SCENARIOS);
  }

  getScenarioByIndex(index) {
    const keys = this.getScenarioKeys();
    const safeIdx = Math.max(0, Math.min(keys.length - 1, index));
    return this.loadScenario(keys[safeIdx]);
  }

  getCurrentIndex() {
    const keys = this.getScenarioKeys();
    return keys.indexOf(this.currentScenarioKey);
  }

  loadScenario(key) {
    if (!RIPA_SCENARIOS[key]) return null;
    this.currentScenarioKey = key;
    const scen = RIPA_SCENARIOS[key];
    if (this.otherVessel && scen.otherVessel) {
      this.otherVessel.setupScenario(scen.otherVessel);
    }
    return scen;
  }

  getCurrentScenario() {
    return RIPA_SCENARIOS[this.currentScenarioKey];
  }

  markCompleted(key) {
    this.completedScenarios.add(key);
  }

  isCompleted(key) {
    return this.completedScenarios.has(key);
  }
}
