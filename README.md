# ⛵ Partes de un Velero - Experiencia Interactiva 3D

Aplicación web educativa interactiva desarrollada en **WebGL y Three.js** para aprender y explorar la anatomía náutica, arboladura, jarcia, velas y aparejos de una embarcación a vela.

---

## ✨ Características Principales

1. **Modelado 3D Programático de Alta Fidelidad**:
   - Basado en planos y láminas técnicas de navegación náutica tradicional:
     - **1/ Nomenclatura**: Casco (Obra Viva y Obra Muerta separadas por la Línea de Flotación), Roda, Espejo de popa, Francobordo, Quillote con bulbo de plomo, Pala de timón, Cubierta, Carroza, Escotilla, Tambucho de proa, Cockpit (bañera) con bancadas, Mástil (Palo), Crucetas, Tope, Fogonadura, Botavara, Herraje Tintero, Estay Proel, Estay Popel (Baquestay) y Obenques altos y bajos.
     - **2/ Velas y Puños**: Vela Mayor y Foque con sus 3 puños destacados (Driza ①, Amura ②, Escota ③), Gratil, Baluma con Battens (sables), Fajas de rizos con matafiones, Pujamen con cabo repique, y Garruchos metálicos en el estay proel.

2. **🎯 Modo Enfoque / Aislamiento (*Ghosting*)**:
   - Al seleccionar cualquier componente, este permanece nítido, opaco y con resplandor cyan, mientras el resto del barco pasa a un estado translúcido técnico (*ghosting*).
   - Botón conmutable `🎯 Aislar: ON / OFF` (Atajo: tecla `A` o `I`) para activar o desactivar este modo a gusto.

3. **🌐 Modo Wireframe CAD Náutico (Líneas Alámbricas)**:
   - Alterna entre el modo de renderizado sólido y la estructura alámbrica de líneas (*wireframe*) técnica estilo planos navales y programas de ingeniería CAD (Rhino Marine, Maxsurf).
   - Botón interactivo `🌐 Wireframe: ON / OFF` (Atajo: tecla `W`).

4. **💥 Modo Vista de Despiece (*Exploded View*)**:
   - Botón interactivo y control deslizante (*slider 0% - 100%*) para separar cinemáticamente los componentes del velero en 3D en tiempo real (Atajo: tecla `X`).
   - Permite examinar piezas internas y herrajes que normalmente quedan ocultos.

5. **🔍 Buscador de Piezas y Lista Optimizada por Subsistemas**:
   - Campo de búsqueda instantánea `🔍 Buscar pieza o cota naval...` en el panel lateral.
   - Lista organizada por grupos estructurales: *Casco & Estructura*, *Obra Viva & Gobierno*, *Arboladura & Jarcia*, *Velas & Maniobra*, y *Cotas Navales*.
   - Depuración de términos redundantes (Francobordo unificado, Drizas/Escotas integradas con sus puños de trabajo, Pujamen y refuerzo consolidados) preservando 100% de la teoría y apuntes técnicos.

6. **🌊 Órbita Submarina 360° y Agua Translúcida**:
   - Rotación libre sin límites polares, permitiendo sumergirse bajo la línea de flotación para inspeccionar la obra viva, el quillote y el timón.
   - Botón para alternar la visibilidad del océano (`Agua: Visible / Oculta`) para modo dique seco.

7. **📐 Cambiador de Aparejos Náuticos en Vivo (6 Tipos)**:
   - Alterna en tiempo real entre los 6 aparejos de la lámina técnica:
     1. **Sloop (Balandro)**
     2. **Cat**
     3. **Sloop Cutter (Cúter)**
     4. **Queche (Ketch)**
     5. **Yawl**
     6. **Goleta (Schooner)**

8. **⌨️ Atajos de Teclado y Controles CAD**:
   - `W`: Conmutar modo Wireframe / Sólido.
   - `A` / `I`: Conmutar modo Aislar / Opacar demás piezas.
   - `X`: Alternar vista de Despiece cinemático.
   - `Esc`: Restablecer cámara general y selección de casco.
   - **Girar la rueda**: Zoom suave centrado en el barco.
   - **Apretar la rueda (botón central)**: Mover / orbitar la escena 3D sin deseleccionar piezas.
   - **Clic Derecho o `Shift + Arrastrar`**: Panear / desplazar el encuadre.

9. **🎨 Interfaz Glassmorphism en Modo Oscuro**:
   - Panel lateral derecho translúcido con efecto desenfoque (*backdrop blur*), fichas técnicas detalladas y citas de apuntes náuticos.
   - Tooltips flotantes en el cursor y destacados con brillo azul (*emissive*) mediante `THREE.Raycaster`.

---

## 🚀 Cómo Ejecutarlo

No requiere instalación de dependencias ni servidores locales:
1. Clona el repositorio:
   ```bash
   git clone git@github.com:augustogronda/velero.git
   cd velero
   ```
2. Haz **doble clic** sobre `index.html` para abrirlo directamente en cualquier navegador moderno (Chrome, Edge, Firefox, Safari, Brave).

---

## 🛠️ Tecnologías Utilizadas

- **HTML5 & CSS3 Moderno** (Flexbox, Grid, Glassmorphism, CSS Variables).
- **JavaScript ES6+** (Sin compilación previa, autocontenido).
- **Three.js** (r128) & **OrbitControls** vía CDN UMD (100% compatible con protocolo local `file:///`).
- **Google Fonts** (*Space Grotesk* & *Outfit*).
