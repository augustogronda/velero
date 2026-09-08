export const COURSE_NOTES = {
  puntosVela: {
    title: "Puntos de la Vela y Maniobras",
    icon: "🧭",
    sections: [
      {
        heading: "1. Zona Muerta / En Facha (Proa al Viento)",
        content: "Comprende un sector de unos 40° a cada lado de la dirección del viento. Las velas flamean violentamente como banderas, no hay sustentación aerodinámica y el barco pierde el gobierno por falta de arrancada."
      },
      {
        heading: "2. La Ceñida (Close-Hauled)",
        content: "Navegar lo más cerca posible de la zona muerta (~45°). Las velas deben ir cazadas a crujía. Es el rumbo con mayor escora y abatimiento lateral, contrarrestado por el quillote con bulbo de plomo."
      },
      {
        heading: "3. El Través (Beam Reach)",
        content: "El viento entra por la amura o través exacto a 90°. Las velas se filan hasta aproximadamente 45°. Es el rumbo más rápido y eficiente hidrodinámicamente de casi todos los veleros de crucero."
      },
      {
        heading: "4. Un Largo (Broad Reach)",
        content: "El viento entra por la aleta (entre 120° y 150°). Las velas van bien filadas (~60°-70°). La escora es mínima, la navegación es muy estable y descansada."
      },
      {
        heading: "5. Popa Redonda (Running) y la Trasluchada",
        content: "El viento entra exactamente por el espejo de popa (180°). La botavara va a 80°-90° hacia una banda y el foque a la opuesta ('orejas de burro'). PRECAUCIÓN DE EXAMEN PNA: Peligro de trasluchada involuntaria si el timonel arriba de más; la botavara cruza violentamente la cubierta pudiendo causar graves accidentes."
      }
    ]
  },
  ripaReglas: {
    title: "RIPA: Derecho de Paso entre Veleros",
    icon: "⚖️",
    sections: [
      {
        heading: "Regla 12 a) i: Amurados a distinta banda",
        content: "Cuando dos veleros se aproximan con riesgo de abordaje, el buque que está amurado a babor DEBE MANTENERSE APARTADO del buque que está amurado a estribor ('Estribor amurado tiene preferencia de paso')."
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
      { heading: "Orzar", content: "Meter la caña de timón hacia donde van las velas para que la proa se dirija más hacia el viento." },
      { heading: "Arribar", content: "Alejar la proa de la dirección del viento (derivar a rumbos francos o popa)." },
      { heading: "Cazar", content: "Cobrar o tirar de una escota para acercar la vela a crujía." },
      { heading: "Filar", content: "Soltar o aflojar una escota para abrir la vela al viento." },
      { heading: "Barlovento", content: "De donde viene el viento con respecto a un punto de referencia." },
      { heading: "Sotavento", content: "Hacia donde se va el viento con respecto a un punto de referencia." }
    ]
  }
};
