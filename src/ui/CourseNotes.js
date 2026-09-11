export const COURSE_NOTES = {
  modulo2Estabilidad: {
    title: "Módulo 2 · Estabilidad y Centros de Fuerza",
    icon: "⚖️",
    sections: [
      {
        heading: "Estabilidad y Efectos del Viento",
        content: "Los barcos están sometidos a diferentes esfuerzos que tienden a modificar su estabilidad. El principal es el viento sobre las velas, que provoca una escora que puede llegar a ser muy pronunciada e incluso causar el volcamiento de la embarcación."
      },
      {
        heading: "Centro Vélico (CV)",
        content: "El viento actúa sobre las velas. Si determinamos los Centros Vélicos (CV) de cada una de ellas (sus baricentros geométricos) y unimos ambos puntos, el CENTRO VÉLICO del barco se obtiene sobre esa recta, dividiéndola proporcionalmente según la superficie de cada vela. Es deseable que quede a popa del palo, pero cerca de él. Esto asegura un barco equilibrado, con una leve tendencia a orzar (comportamiento ardiente), que es la respuesta náutica correcta y segura."
      },
      {
        heading: "Centro de Gravedad (CG)",
        content: "El casco de la embarcación tiene un Centro de Gravedad (CG), determinado por diseño con el barco sin carga, salvo los elementos previstos (como el lastre del quillote). La tripulación puede alterar su ubicación de acuerdo con las decisiones de estiba y uso ('hacer banda' a barlovento), por lo que es un aspecto operativo crucial. La fuerza de gravedad actúa verticalmente hacia abajo."
      },
      {
        heading: "Centro de Carena (Centro de Flotación, B)",
        content: "Existe otro centro de esfuerzo llamado Centro de Carena (centro de flotación, B), donde se concentra la fuerza de empuje hacia arriba de acuerdo con el principio de Arquímedes sobre el volumen sumergido. Cuando el barco está en reposo y adrizado, ambos centros (CG y B) están alineados verticalmente: la gravedad actúa hacia abajo y la flotación hacia arriba."
      },
      {
        heading: "Momento Escorante vs. Momento Adrizante",
        content: "Cuando el barco navega, el viento que actúa sobre las velas concentra su fuerza en el Centro Vélico (CV). En el casco, la parte que se sumerge tiene su Centro de Carena (B), que empuja hacia arriba y se desplaza lateralmente respecto del Centro de Gravedad (CG). Entre la fuerza lateral del viento en las velas y la resistencia de la carena se genera un MOMENTO ESCORANTE. A la vez, la distancia horizontal entre el CG y el centro de flotación B genera un brazo (GZ) y un MOMENTO ADRIZANTE que intenta enderezar la embarcación. Si la escora aumenta demasiado, el centro de carena puede desplazarse hacia la otra banda, sumar su fuerza a la de la gravedad y provocar el volcamiento (sin considerar el impacto adicional de las olas o agua en el interior)."
      }
    ]
  },
  modulo2ElVeleroYElViento: {
    title: "Módulo 2 · El Velero, el Viento y Maniobras",
    icon: "🧭",
    sections: [
      {
        heading: "Límites de Navegación y Zona Prohibida",
        content: "El viento es la energía que mueve al barco, pero existen limitaciones físicas: un velero no puede navegar directamente contra el viento. Hay un arco de aproximadamente 45° por cada banda (~90° en total) en el que la navegación no es posible (zona muerta o barco enfachado)."
      },
      {
        heading: "Los Rumbos de la Rosa Náutica",
        content: "El primer ángulo factible navegando lo más cerrado posible al viento es la CEÑIDA (~45°). Luego siguen: el TRAVÉS (viento a 90° de la línea de crujía), el LARGO (viento a 120°-150°) y la POPA REDONDA (180°), además de posiciones intermedias como un descuartelar."
      },
      {
        heading: "Bordejear ('Tirar Bordes')",
        content: "Cuando nuestro destino está en la dirección exacta de donde viene el viento, nos vemos obligados a BORDEJEAR para acercarnos. Esto exige una navegación precisa y un trimado muy correcto de las velas, poniendo en evidencia las características marineras de la embarcación. Navegamos 'tirando bordes' en zigzag alternando las amuras."
      },
      {
        heading: "Orzar y Derivar",
        content: "• ORZAR: Acercar la proa hacia el viento hasta el límite de navegabilidad (meter caña hacia sotavento / llevar velas hacia crujía).\n• DERIVAR (Arribar): Alejar la proa de la dirección del viento hacia rumbos francos o popa."
      },
      {
        heading: "Virada por Avante vs. Virada en Redondo (Trasluchada)",
        content: "• VIRADA POR AVANTE: Cuando la proa continúa orzando y el viento pasa a la otra banda cruzando el ojo del viento.\n• VIRADA EN REDONDO o TRASLUCHADA: Cuando seguimos derivando hasta que el viento pasa por la popa. Según las condiciones meteorológicas y la experiencia de la tripulación, la trasluchada puede ser dificultosa y hasta peligrosa por el paso violento de la botavara."
      },
      {
        heading: "Barlovento, Sotavento y Abatimiento",
        content: "• BARLOVENTO: El lugar o costado de donde viene el viento.\n• SOTAVENTO: El lado hacia donde se dirige el viento.\n• ABATIMIENTO: Como los barcos tienden a desplazarse lateralmente hacia sotavento por el empuje lateral del viento, debemos tener en cuenta el abatimiento (deriva) compensándolo en el rumbo de gobierno."
      }
    ]
  },
  modulo2VientoAmuras: {
    title: "Módulo 2 · Viento Real, Viento Aparente y Amuras",
    icon: "💨",
    sections: [
      {
        heading: "Viento Real vs. Viento Aparente",
        content: "• VIENTO REAL: Es el que sentimos estando detenidos o parados en tierra o fondeados.\n• VIENTO APARENTE: Al movernos, percibimos una modificación en la intensidad y la dirección del viento: eso que sentimos a bordo es el VIENTO APARENTE.\n• COMPOSICIÓN VECTORIAL: Resulta de combinar el vector del viento real con el vector de la velocidad del barco. En términos generales, el viento aparente se ubica más a proa que el viento real y aumenta su velocidad relativa. En el barco SIEMPRE SE NAVEGA de acuerdo con el viento aparente."
      },
      {
        heading: "Las Amuras: 'Buenas' y 'Malas'",
        content: "Define por qué banda del barco recibimos el viento:\n• AMURADOS A ESTRIBOR ('BUENAS'): Si recibimos el viento por la banda de ESTRIBOR (botavara abierta a babor). En el lenguaje náutico habitual se dice que un barco 'viene con buenas'.\n• AMURADOS A BABOR ('MALAS'): Si recibimos el viento por la banda de BABOR (botavara abierta a estribor). Se dice que el barco 'viene con malas'.\n• PREFERENCIA RIPA: El barco que viene con buenas (amurado a estribor) tiene derecho de paso frente al que viene con malas."
      }
    ]
  },
  modulo2TrimadoFisica: {
    title: "Módulo 2 · Trimado de Velas, Bernoulli y Reglas de Oro",
    icon: "⛵",
    sections: [
      {
        heading: "Evolución y Física: Empuje vs. Succión (Bernoulli)",
        content: "La navegación evolucionó desde flotar sobre un tronco hasta diseñar velas que permiten navegar casi contra el viento.\n• Del TRAVÉS hacia la POPA: Las velas actúan principalmente por 'EMPUJE' (resistencia / arrastre aerodinámico directo).\n• Del TRAVÉS hacia la CEÑIDA: Debemos orzar y la física actúa de manera diferente: las velas son 'SUCCIONADAS', igual que las alas de un avión.\n• PRINCIPIO DE BERNOULLI: En el perfil de una vela que recibe el viento casi de frente, el flujo se divide en dos caras: por barlovento el recorrido es más recto; por sotavento, debido a la curvatura de la vela dada por la tripulación, el camino es más largo. Allí el flujo acelera y disminuye la presión. Se forma un centro de baja presión que genera una fuerza de sustentación y succión hacia adelante, hasta el límite de la zona prohibida donde el barco queda 'enfachado'."
      },
      {
        heading: "Hacer que el Viento Fluya",
        content: "Como regla general, debemos procurar que el viento 'fluya'. Las velas no deben gualdrapear (flamear por falta de tensión), pero tampoco deben ir sobrecazadas, porque además de aumentar la escora inútilmente, pueden frenar el barco. Para trimar las velas, además de ajustarlas al rumbo elegido, debemos tener en cuenta la velocidad del viento."
      },
      {
        heading: "Cazar y Filar",
        content: "• CAZAR: Tirar del cabo / escota hacia uno (acercar la vela hacia crujía).\n• FILAR: Soltar o aflojar el cabo / escota (dejar que la vela abra hacia sotavento).\nEstas dos acciones son fundamentales para ajustar las velas al rumbo y a las condiciones de viento."
      },
      {
        heading: "Reglas de Oro del Trimado",
        content: "1. 'A MAYOR VIENTO, MENOS VELA' (reducir paño y tomar rizos preventivamente para evitar exceso de escora).\n2. 'NO HAY ORZADA SIN CAZADA Y DERIVADA SIN FILADA' (al orzar la proa al viento se debe cazar; al derivar abriendo el rumbo se debe filar)."
      }
    ]
  },
  ripaReglas: {
    title: "RIPA: Derecho de Paso entre Veleros",
    icon: "⚖️",
    sections: [
      {
        heading: "Regla 12 a) i: Amurados a distinta banda",
        content: "Cuando dos veleros se aproximan con riesgo de abordaje, el buque que está amurado a babor ('con malas') DEBE MANTENERSE APARTADO del buque que está amurado a estribor ('con buenas')."
      },
      {
        heading: "Regla 12 a) ii: Amurados a la misma banda",
        content: "Cuando ambos veleros tienen el viento por la misma banda, el buque que esté a barlovento (más cerca de donde viene el viento) DEBE MANTENERSE APARTADO del buque que esté a sotavento."
      },
      {
        heading: "Regla 13: Buque que alcanza",
        content: "Todo buque que alcance a otro (viniendo desde más de 22.5° a popa del través) DEBERÁ MANTENERSE APARTADO del buque alcanzado, sin importar si navega a vela o a motor."
      }
    ]
  },
  fondeoBorneo: {
    title: "Maniobra de Fondeo y Círculo de Borneo (PNA)",
    icon: "⚓",
    sections: [
      {
        heading: "Regla de Oro del Filado (Scope)",
        content: "Para que el ancla clave, el tiro de la cadena en el fondo debe ser completamente horizontal. La relación reglamentaria de la Prefectura es: con buen tiempo y estadía diurna, filar de 3 a 5 veces la profundidad (sonda + francobordo); con mal tiempo, noche o viento fuerte, filar de 5 a 7 (incluso 8) veces la profundidad."
      },
      {
        heading: "El Garreo (Garapeo)",
        content: "Ocurre cuando el ancla arrastra por el fondo sin clavarse. Se detecta tomando enfilaciones a tierra de dos puntos fijos o con la alarma de fondeo del GPS. Si garrea, nunca esperar: arrancar motor de inmediato, cobrar línea y volver a fondear filando mayor longitud de cadena o cambiando de tenedero."
      },
      {
        heading: "Círculo y Radio de Borneo",
        content: "Es la circunferencia donde gira el barco fondeado según giren el viento o la marea (corriente). Su radio es igual a: Longitud de cadena/cabo filada + Eslora del velero. Al fondear en fondeaderos concurridos (San Antonio, Olivos, Quilmes), siempre debe verificarse que los círculos de borneo con barcos vecinos no se solapen."
      },
      {
        heading: "Tenederos del Río de la Plata",
        content: "El fondo del Río de la Plata y el Delta es predominantemente de fango blando y limo. El ancla por excelencia para estas aguas es la Danforth (por sus uñas anchas con gran poder de agarre) y la Bruce/Trefoil."
      }
    ]
  },
  meteorologia: {
    title: "Meteorología Rioplatense: Pampero y Sudestada",
    icon: "⛈️",
    sections: [
      {
        heading: "La Sudestada (Viento Persistente del SE)",
        content: "Originada por un anticiclón centrado en el Atlántico Sur y una baja relativa en el interior. Provoca viento fuerte sostenido del SE (20-35 nudos), lloviznas persistentes y 'repunte' (crecida del nivel del río) que inunda la costa. Las olas son cortas, empinadas y muy picadas debido al poco fondo del estuario."
      },
      {
        heading: "El Pampero (Frente Frío Patagónico del SW)",
        content: "Entrada brusca de masa polar patagónica que barre el aire cálido y húmedo previo del norte. Se anuncia en el horizonte SW por el 'barrón pampero' (nubes oscuras y densas). Trae ráfagas violentas de 30 a 50 nudos, caída abrupta de temperatura (hasta 15°C en minutos) y bajante rápida del nivel del río."
      },
      {
        heading: "Toma de Rizos en Veleros",
        content: "Reducir paño preventivamente antes de que la escora supere los 25°-30°. Con el 1° rizo se baja la mayor ~25%; con el 2° rizo se achica al 50%. En proa se enrolla el génova dejando una superficie reducida de tormentín. Un velero adrizado es más veloz, tiene mejor gobierno de timón y no fatiga el aparejo."
      },
      {
        heading: "La Tendencia Bárica",
        content: "Una caída rápida de más de 3 hPa en 3 horas en el barómetro es el aviso inequívoco de la llegada inminente de un temporal o frente frío activo."
      }
    ]
  },
  lucesNoche: {
    title: "Luces de Navegación Reglamentarias (PNA)",
    icon: "🏮",
    sections: [
      {
        heading: "Luz de Babor (Roja)",
        content: "Luz roja visible en un arco de horizonte de 112.5°, desde la proa hasta 22.5° a popa del través de babor."
      },
      {
        heading: "Luz de Estribor (Verde)",
        content: "Luz verde visible en un arco de horizonte de 112.5°, desde la proa hasta 22.5° a popa del través de estribor."
      },
      {
        heading: "Luz de Alcance / Coronamiento (Blanca)",
        content: "Luz blanca ubicada lo más cerca posible de la popa, visible en un arco de 135° (67.5° hacia cada banda desde la popa)."
      },
      {
        heading: "Navegación a Motor (Velero a Motor)",
        content: "Cuando un velero propulsa a motor (aunque lleve velas izadas), legalmente ES UN BUQUE DE PROPULSIÓN MECÁNICA: debe encender la luz blanca de tope en el palo (225°) e izar de día un cono negro con el vértice hacia abajo en el estay."
      }
    ]
  },
  glosario: {
    title: "Vocabulario Náutico Fundamental para el Examen",
    icon: "📖",
    sections: [
      { heading: "Orzar", content: "Llevar la proa hacia el viento hasta el límite de navegabilidad." },
      { heading: "Derivar (Arribar)", content: "Alejar la proa de la dirección del viento." },
      { heading: "Cazar", content: "Tirar del cabo / escota hacia uno para acercar la vela a crujía." },
      { heading: "Filar", content: "Soltar o aflojar una escota para que la vela abra al viento." },
      { heading: "Barlovento", content: "Lugar de donde viene el viento con respecto a un punto de referencia." },
      { heading: "Sotavento", content: "Lado hacia donde se dirige el viento con respecto a un punto de referencia." },
      { heading: "Amurado a Estribor (Buenas)", content: "Recibir el viento por la banda de estribor. Otorga derecho de paso." },
      { heading: "Amurado a Babor (Malas)", content: "Recibir el viento por la banda de babor. Obliga a maniobrar y ceder el paso." },
      { heading: "Virada por Avante", content: "Maniobra donde la proa orza y pasa por el ojo del viento hacia la otra amura." },
      { heading: "Trasluchada (Virada en Redondo)", content: "Maniobra donde la popa pasa por la dirección del viento, cambiando la botavara de banda." },
      { heading: "Abatimiento", content: "Desplazamiento lateral que experimenta la embarcación hacia sotavento." },
      { heading: "Enfachado", content: "Quedar proa al viento en la zona prohibida sin sustentación vélica." }
    ]
  }
};
