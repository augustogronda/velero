import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const URL = 'http://localhost:3000/simulador.html';
const PORT = 9222;

async function run() {
  console.log('🚀 Iniciando Edge headless para verificar iPad PWA standalone...');
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--window-size=1024,768',
    '--user-data-dir=C:\\Users\\augus\\.gemini\\antigravity\\edge-test-profile-pwa',
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
      if (loadedResolve) loadedResolve();
    }
  };

  await new Promise(resolve => ws.onopen = resolve);
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'display-mode', value: 'standalone' }]
  });

  await send('Emulation.setDeviceMetricsOverride', {
    width: 1024,
    height: 768,
    deviceScaleFactor: 2,
    mobile: true,
    screenOrientation: { angle: 90, type: 'landscapePrimary' }
  });

  console.log(`🌐 Navegando a ${URL}...`);
  await send('Page.navigate', { url: URL });
  await new Promise(r => setTimeout(r, 2500));

  const check = await send('Runtime.evaluate', {
    expression: `(() => {
      const container = document.getElementById('webgl-container');
      const canvas = container ? container.querySelector('canvas') : null;
      const controls = document.querySelector('.sim-controls-panel');
      const body = document.body;

      const cRect = canvas ? canvas.getBoundingClientRect() : null;
      const contRect = container ? container.getBoundingClientRect() : null;
      const ctrlRect = controls ? controls.getBoundingClientRect() : null;
      const bRect = body.getBoundingClientRect();

      return {
        window: { innerWidth: window.innerWidth, innerHeight: window.innerHeight },
        body: { top: bRect.top, bottom: bRect.bottom, height: bRect.height, width: bRect.width },
        container: contRect ? { top: contRect.top, bottom: contRect.bottom, height: contRect.height } : null,
        canvas: cRect ? { top: cRect.top, bottom: cRect.bottom, height: cRect.height, width: cRect.width } : null,
        controls: ctrlRect ? { top: ctrlRect.top, bottom: ctrlRect.bottom, height: ctrlRect.height, left: ctrlRect.left, right: ctrlRect.right } : null,
        isCanvasFullHeight: cRect && Math.abs(cRect.height - window.innerHeight) <= 1,
        isCanvasFullWidth: cRect && Math.abs(cRect.width - window.innerWidth) <= 1,
        isControlsDockedBottom: ctrlRect && Math.abs(ctrlRect.bottom - window.innerHeight) <= 1
      };
    })()`,
    returnByValue: true
  });

  const res = check.result.value;
  console.log('📊 Métricas de iPad Standalone:', JSON.stringify(res, null, 2));

  if (!res.isCanvasFullHeight) {
    console.error('❌ ERROR: El canvas NO cubre el 100% de la altura de la pantalla!');
  } else {
    console.log('✅ Canvas cubre 100% de la altura física (sin franja vacía).');
  }

  if (!res.isControlsDockedBottom) {
    console.warn('⚠️ Panel de controles no está al borde inferior:', res.controls?.bottom, 'vs', res.window.innerHeight);
  } else {
    console.log('✅ Panel de controles perfectamente acoplado al fondo sin franja muerta.');
  }

  const snap = await send('Page.captureScreenshot', { format: 'png' });
  const filename = 'screenshot-ipad-standalone-full.png';
  const fullPath = `C:\\Users\\augus\\.gemini\\antigravity\\brain\\16b29ddc-a869-41af-b974-080625862029\\${filename}`;
  writeFileSync(fullPath, Buffer.from(snap.data, 'base64'));
  console.log(`📸 Screenshot guardado en: ${filename}`);

  ws.close();
  browser.kill();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
