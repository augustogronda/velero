import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const URL = 'http://localhost:3000/simulador.html';
const PORT = 9222;

async function run() {
  console.log('🚀 Iniciando Edge headless para verificar iPad 9 responsive...');
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--window-size=1080,810',
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

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pending.has(data.id)) {
      const { resolve } = pending.get(data.id);
      pending.delete(data.id);
      resolve(data.result);
      return;
    }
  };

  await new Promise(resolve => ws.onopen = resolve);
  await send('Page.enable');
  await send('Runtime.enable');

  await send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'display-mode', value: 'standalone' }]
  });

  // Emular iPad 9 Landscape: 1080x810 (resolución nativa lógica iPad 9)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1080,
    height: 810,
    deviceScaleFactor: 2,
    mobile: true,
    screenOrientation: { angle: 90, type: 'landscapePrimary' }
  });

  console.log(`🌐 Navegando a ${URL}...`);
  await send('Page.navigate', { url: URL });
  await new Promise(r => setTimeout(r, 2500));

  // 1. Verificar estado abierto/expandido
  const checkExpanded = await send('Runtime.evaluate', {
    expression: `(() => {
      const container = document.getElementById('webgl-container');
      const canvas = container ? container.querySelector('canvas') : null;
      const controls = document.querySelector('.sim-controls-panel');
      const drawerHandle = document.querySelector('.ctrl-drawer-handle');

      const cRect = canvas ? canvas.getBoundingClientRect() : null;
      const ctrlRect = controls ? controls.getBoundingClientRect() : null;
      const hStyle = drawerHandle ? window.getComputedStyle(drawerHandle).display : 'none';

      return {
        window: { w: window.innerWidth, h: window.innerHeight },
        canvas: cRect ? { w: cRect.width, h: cRect.height, top: cRect.top, bottom: cRect.bottom } : null,
        controls: ctrlRect ? { top: ctrlRect.top, bottom: ctrlRect.bottom, height: ctrlRect.height } : null,
        drawerHandleDisplay: hStyle,
        isCanvasFullHeight: cRect && Math.abs(cRect.height - window.innerHeight) <= 1,
        isControlsDockedBottom: ctrlRect && Math.abs(ctrlRect.bottom - window.innerHeight) <= 1
      };
    })()`,
    returnByValue: true
  });

  console.log('📊 iPad 9 (1080x810) - Panel Expandido:', JSON.stringify(checkExpanded.result.value, null, 2));

  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('C:\\Users\\augus\\.gemini\\antigravity\\brain\\16b29ddc-a869-41af-b974-080625862029\\screenshot-ipad-9-expanded.png', Buffer.from(snap1.data, 'base64'));
  console.log('📸 Guardado: screenshot-ipad-9-expanded.png');

  // 2. Probar colapsar el panel con tap en el handle
  console.log('\n--- Colapsando panel de controles vía handle ---');
  await send('Runtime.evaluate', {
    expression: `document.getElementById('ctrl-drawer-toggle')?.click()`
  });
  await new Promise(r => setTimeout(r, 500));

  const checkCollapsed = await send('Runtime.evaluate', {
    expression: `(() => {
      const controls = document.querySelector('.sim-controls-panel');
      const ctrlRect = controls ? controls.getBoundingClientRect() : null;
      return {
        collapsedHeight: ctrlRect ? ctrlRect.height : null,
        bottom: ctrlRect ? ctrlRect.bottom : null
      };
    })()`,
    returnByValue: true
  });
  console.log('📊 Panel Colapsado (altura compacta):', JSON.stringify(checkCollapsed.result.value, null, 2));

  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('C:\\Users\\augus\\.gemini\\antigravity\\brain\\16b29ddc-a869-41af-b974-080625862029\\screenshot-ipad-9-collapsed.png', Buffer.from(snap2.data, 'base64'));
  console.log('📸 Guardado: screenshot-ipad-9-collapsed.png');

  ws.close();
  browser.kill();
  console.log('✅ Verificación completada!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
