import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const URL = 'http://localhost:3000/simulador.html';
const PORT = 9222;

async function run() {
  console.log('🚀 Iniciando Edge headless...');
  const browser = spawn(EDGE_PATH, [
    `--remote-debugging-port=${PORT}`,
    '--headless=new',
    '--window-size=1024,768',
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
  try {
    await send('Storage.clearDataForOrigin', { origin: 'http://localhost:3000', storageTypes: 'all' });
  } catch (e) {}

  console.log(`🌐 Navegando a ${URL}...`);
  await send('Page.navigate', { url: URL });
  await loadedPromise;
  await new Promise(r => setTimeout(r, 2000));

  async function checkLayout(viewName, width, height, isMobile, orientation) {
    console.log(`\n══════════════════════════════════════════════════`);
    console.log(`🔍 Probando Viewport: ${viewName} (${width}x${height})`);
    console.log(`══════════════════════════════════════════════════`);

    await send('Emulation.setDeviceMetricsOverride', {
      width,
      height,
      deviceScaleFactor: 2,
      mobile: isMobile,
      screenOrientation: orientation ? { type: orientation, angle: orientation.includes('landscape') ? 90 : 0 } : undefined
    });
    await new Promise(r => setTimeout(r, 800));

    const check = await send('Runtime.evaluate', {
      expression: `(() => {
        const header = document.querySelector('.sim-header');
        const compass = document.querySelector('.sim-compass-card');
        const telemetry = document.querySelector('.sim-telemetry-card');
        const compassBtns = Array.from(document.querySelectorAll('.sim-compass-card .panel-size-btn')).map(b => {
          const r = b.getBoundingClientRect();
          return { w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right) };
        });

        const hRect = header ? header.getBoundingClientRect() : null;
        const cRect = compass ? compass.getBoundingClientRect() : null;
        const tRect = telemetry ? telemetry.getBoundingClientRect() : null;

        const brand = document.querySelector('.sim-brand');
        const tabs = document.querySelector('.sim-mode-selector');
        const actions = document.querySelector('.sim-header-actions');
        const bRect = brand ? brand.getBoundingClientRect() : null;
        const tabsRect = tabs ? tabs.getBoundingClientRect() : null;
        const aRect = actions ? actions.getBoundingClientRect() : null;

        const compassOverlap = hRect && cRect ? (hRect.bottom > cRect.top && hRect.left < cRect.right && hRect.right > cRect.left) : false;
        const telemetryOverlap = hRect && tRect ? (hRect.bottom > tRect.top && hRect.left < tRect.right && hRect.right > tRect.left) : false;
        const buttonsOverflow = cRect ? compassBtns.some(b => b.r > cRect.right + 1) : false;

        return {
          header: hRect ? { top: Math.round(hRect.top), bottom: Math.round(hRect.bottom), height: Math.round(hRect.height), width: Math.round(hRect.width) } : null,
          brand: bRect ? { top: Math.round(bRect.top), bottom: Math.round(bRect.bottom), height: Math.round(bRect.height) } : null,
          tabs: tabsRect ? { top: Math.round(tabsRect.top), bottom: Math.round(tabsRect.bottom), height: Math.round(tabsRect.height) } : null,
          actions: aRect ? { top: Math.round(aRect.top), bottom: Math.round(aRect.bottom), height: Math.round(aRect.height) } : null,
          compass: cRect ? { top: Math.round(cRect.top), left: Math.round(cRect.left), right: Math.round(cRect.right), width: Math.round(cRect.width), height: Math.round(cRect.height) } : null,
          telemetry: tRect ? { top: Math.round(tRect.top), left: Math.round(tRect.left), right: Math.round(tRect.right), width: Math.round(tRect.width) } : null,
          compassOverlap,
          telemetryOverlap,
          compassBtns,
          buttonsOverflow
        };
      })()`,
      returnByValue: true
    });

    const res = check.result.value;
    console.log('Resultados de layout:', JSON.stringify(res, null, 2));

    if (res.compassOverlap) {
      console.error('❌ ERROR: Solapamiento entre header y tarjeta de brújula!');
    } else {
      console.log('✅ Header y brújula SIN solapamiento.');
    }

    if (res.telemetryOverlap) {
      console.error('❌ ERROR: Solapamiento entre header y tarjeta de telemetría!');
    } else {
      console.log('✅ Header y telemetría SIN solapamiento.');
    }

    if (res.buttonsOverflow) {
      console.error('❌ ERROR: Los botones de tamaño desbordan la tarjeta de brújula!');
    } else {
      console.log('✅ Botones de tamaño dentro de la tarjeta de brújula.');
    }

    const snap = await send('Page.captureScreenshot', { format: 'png' });
    const filename = `screenshot-${viewName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.png`;
    const fullPath = `C:\\Users\\augus\\.gemini\\antigravity\\brain\\16b29ddc-a869-41af-b974-080625862029\\${filename}`;
    writeFileSync(fullPath, Buffer.from(snap.data, 'base64'));
    console.log(`📸 Screenshot guardado en: ${filename}`);

    return res;
  }

  // 1. Probar iPad 9 Portrait (768x1024)
  await checkLayout('iPad-9-Portrait', 768, 1024, true, 'portraitPrimary');

  // 2. Probar iPad 9 Landscape (1024x768)
  await checkLayout('iPad-9-Landscape', 1024, 768, true, 'landscapePrimary');

  // Probar colapso de brújula en Landscape
  console.log('\n--- Probando colapso de brújula ---');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('.sim-compass-card .panel-size-btn[data-size="collapsed"]')?.click()`
  });
  await new Promise(r => setTimeout(r, 400));
  await checkLayout('iPad-9-Landscape-Collapsed', 1024, 768, true, 'landscapePrimary');

  // 3. Probar PC Desktop (1366x768)
  await checkLayout('PC-Desktop-1366', 1366, 768, false);

  ws.close();
  browser.kill();
  console.log('\n🏁 Pruebas de layout finalizadas exitosamente!');
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
