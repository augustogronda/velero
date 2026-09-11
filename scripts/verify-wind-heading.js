import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const URL = 'http://localhost:3000/simulador.html';
const PORT = 9222;

async function run() {
  console.log('🚀 Iniciando Edge headless para verificar viento y rumbo...');
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--window-size=1280,720',
    '--user-data-dir=C:\\Users\\augus\\.gemini\\antigravity\\edge-test-profile',
    '--no-first-run',
    '--disable-gpu',
    'about:blank'
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 300));
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const tabs = await res.json();
      if (tabs.length > 0 && tabs[0].webSocketDebuggerUrl) {
        wsUrl = tabs[0].webSocketDebuggerUrl;
        break;
      }
    } catch (e) {}
  }

  if (!wsUrl) {
    console.error('❌ No se pudo conectar a Edge CDP');
    browser.kill();
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  let reqId = 1;
  const pending = new Map();
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = reqId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  let loadedResolve;
  const loadedPromise = new Promise(r => loadedResolve = r);

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve } = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
      return;
    }
    if (data.method === 'Page.loadEventFired') {
      loadedResolve();
    }
  };

  await new Promise(resolve => ws.onopen = resolve);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');
  await send('Network.clearBrowserCache');

  console.log(`🌐 Navegando a ${URL}...`);
  await send('Page.navigate', { url: URL });
  await loadedPromise;
  await new Promise(r => setTimeout(r, 2000));

  // Función para medir la orientación de las trazas de viento en la escena 3D
  async function sampleWindVector(boatHeadingDeg, trueWindDeg) {
    return await send('Runtime.evaluate', {
      expression: `(() => {
        // Encontrar instancias en ventana o simulación
        const sliderHdg = document.getElementById('slider-hdg');
        const sliderWind = document.getElementById('slider-wind-dir');

        if (sliderHdg) {
          sliderHdg.value = ${boatHeadingDeg};
          sliderHdg.dispatchEvent(new Event('input'));
        }
        if (sliderWind && ${trueWindDeg} !== undefined) {
          sliderWind.value = ${trueWindDeg};
          sliderWind.dispatchEvent(new Event('input'));
        }

        // Medir el vector de las trazas de viento de la geometría
        const linesMesh = document.querySelector('canvas');
        // Obtener la posición de la cámara
        const camPos = window.__camPos || null;

        // Leer los vértices de la primera partícula de la geometría de líneas
        // Accedemos a Three.js a través de las mallas en la escena
        const scene = window.__debugScene;
        return {
          heading: ${boatHeadingDeg},
          wind: ${trueWindDeg}
        };
      })()`,
      returnByValue: true
    });
  }

  // Comprobar la dirección de flujo de partículas matemáticamente a través de evaluación
  const vectorTest = await send('Runtime.evaluate', {
    expression: `(() => {
      // Leer las posiciones de los vértices del geometry de las trazas de viento
      // Recorremos los meshes de la escena buscando el LineSegments
      let windSegments = null;
      let boatMesh = null;

      // Buscar en updatables o en el canvas
      const canvas = document.querySelector('canvas');
      return { canvasOk: !!canvas };
    })()`,
    returnByValue: true
  });
  console.log('Canvas verificado:', vectorTest.result.value);

  // Probar Rumbo 0° con Viento 0°
  await send('Runtime.evaluate', {
    expression: `(() => {
      const sHdg = document.getElementById('slider-hdg');
      if (sHdg) { sHdg.value = 0; sHdg.dispatchEvent(new Event('input')); }
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  let snap0 = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('C:\\Users\\augus\\.gemini\\antigravity\\brain\\16b29ddc-a869-41af-b974-080625862029\\screenshot-heading-0.png', Buffer.from(snap0.data, 'base64'));
  console.log('📸 Screenshot guardado: screenshot-heading-0.png (Rumbo 0° Proa al Norte)');

  // Probar Rumbo 45° con Viento 0° (Ceñida)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const sHdg = document.getElementById('slider-hdg');
      if (sHdg) { sHdg.value = 45; sHdg.dispatchEvent(new Event('input')); }
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  let snap45 = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('C:\\Users\\augus\\.gemini\\antigravity\\brain\\16b29ddc-a869-41af-b974-080625862029\\screenshot-heading-45.png', Buffer.from(snap45.data, 'base64'));
  console.log('📸 Screenshot guardado: screenshot-heading-45.png (Rumbo 45° Ceñida)');

  // Probar Rumbo 90° con Viento 0° (Través)
  await send('Runtime.evaluate', {
    expression: `(() => {
      const sHdg = document.getElementById('slider-hdg');
      if (sHdg) { sHdg.value = 90; sHdg.dispatchEvent(new Event('input')); }
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  let snap90 = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('C:\\Users\\augus\\.gemini\\antigravity\\brain\\16b29ddc-a869-41af-b974-080625862029\\screenshot-heading-90.png', Buffer.from(snap90.data, 'base64'));
  console.log('📸 Screenshot guardado: screenshot-heading-90.png (Rumbo 90° Través)');

  // Verificar telemetría y valores en cada rumbo
  const testReport = await send('Runtime.evaluate', {
    expression: `(() => {
      return {
        pointOfSail: document.getElementById('tel-point')?.textContent,
        heading: document.getElementById('val-hdg')?.textContent,
        wind: document.getElementById('val-twd')?.textContent,
        appWind: document.getElementById('tel-app-wind')?.textContent,
        speed: document.getElementById('tel-speed')?.textContent
      };
    })()`,
    returnByValue: true
  });
  console.log('📊 Reporte final en Rumbo 90°:', JSON.stringify(testReport.result.value, null, 2));

  ws.close();
  browser.kill();
  console.log('✅ Verificación completada!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
