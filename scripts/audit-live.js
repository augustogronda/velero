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
    await new Promise(r => setTimeout(r, 400));
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

  console.log('🔌 Conectado a DevTools.');
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

  const logs = [];
  const errors = [];

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
    } else if (data.method === 'Runtime.consoleAPICalled') {
      const text = data.params.args.map(a => a.value || a.description || JSON.stringify(a)).join(' ');
      logs.push(`[${data.params.type.toUpperCase()}] ${text}`);
      if (data.params.type === 'error') {
        errors.push(`Console Error: ${text}`);
      }
    } else if (data.method === 'Runtime.exceptionThrown') {
      const desc = data.params.exceptionDetails?.exception?.description || data.params.exceptionDetails?.text;
      errors.push(`Uncaught Exception: ${desc}`);
    } else if (data.method === 'Network.responseReceived') {
      const { response } = data.params;
      if (response.status >= 400) {
        errors.push(`HTTP ${response.status} en ${response.url}`);
      }
    }
  };

  await new Promise(resolve => ws.onopen = resolve);

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  // Configurar Emulación iPad 9 (1024x768 landscape)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1024,
    height: 768,
    deviceScaleFactor: 2,
    mobile: true,
    screenOrientation: { type: 'landscapePrimary', angle: 90 }
  });

  console.log(`🌐 Navegando a ${URL}...`);
  await send('Page.navigate', { url: URL });
  await loadedPromise;
  console.log('✅ loadEventFired recibido.');

  // Esperar a que Three.js termine el DOMContentLoaded e inicialice
  await new Promise(r => setTimeout(r, 2000));

  // Diagnóstico DOM
  const evalResult = await send('Runtime.evaluate', {
    expression: `(() => {
      const canvas = document.querySelector('canvas');
      const hud = document.querySelector('.sim-header');
      const compass = document.querySelector('.sim-compass-card');
      const telemetry = document.querySelector('.sim-telemetry-card');
      const speed = document.getElementById('tel-speed')?.textContent;
      const point = document.getElementById('tel-point')?.textContent;
      const heading = document.getElementById('val-hdg')?.textContent;
      const wind = document.getElementById('val-twd')?.textContent;
      const evalText = document.getElementById('tel-eval')?.textContent?.trim();
      const controls = document.querySelector('.sim-controls-panel');
      const tabs = Array.from(document.querySelectorAll('.mode-tab')).map(t => ({
        mode: t.dataset.mode,
        text: t.textContent.trim(),
        selected: t.getAttribute('aria-selected')
      }));

      return {
        canvasFound: !!canvas,
        canvasDimensions: canvas ? { clientW: canvas.clientWidth, clientH: canvas.clientHeight } : null,
        hudFound: !!hud,
        compassVisible: compass ? getComputedStyle(compass).display : 'none',
        telemetryVisible: telemetry ? getComputedStyle(telemetry).display : 'none',
        controlsVisible: controls ? getComputedStyle(controls).display : 'none',
        telemetryValues: { speed, point, heading, wind, evalText },
        tabs
      };
    })()`,
    returnByValue: true
  });

  console.log('📊 Diagnóstico de componentes:', JSON.stringify(evalResult.result.value, null, 2));

  // Captura 1: Modo Viento (Default)
  const snap1 = await send('Page.captureScreenshot', { format: 'png' });
  const path1 = 'C:\\Users\\augus\\.gemini\\antigravity\\brain\\16b29ddc-a869-41af-b974-080625862029\\screenshot-wind.png';
  writeFileSync(path1, Buffer.from(snap1.data, 'base64'));
  console.log(`📸 Screenshot 1 guardado en ${path1}`);

  // Probar cambiar a RIPA y verificar que responda
  console.log('🔄 Cambiando a Modo RIPA...');
  await send('Runtime.evaluate', {
    expression: `document.querySelector('button[data-mode="ripa"]').click()`
  });
  await new Promise(r => setTimeout(r, 600));

  const ripaEval = await send('Runtime.evaluate', {
    expression: `(() => {
      const card = document.querySelector('.sim-ripa-card');
      const progress = document.getElementById('ripa-progress-badge')?.textContent;
      const question = document.getElementById('ripa-question')?.textContent;
      const options = Array.from(document.querySelectorAll('.ripa-opt-btn')).map(b => b.textContent);
      return {
        ripaVisible: card ? getComputedStyle(card).display : 'none',
        progress,
        question,
        optionsCount: options.length
      };
    })()`,
    returnByValue: true
  });
  console.log('⚖️ Estado RIPA:', JSON.stringify(ripaEval.result.value, null, 2));

  // Simular respuesta al ejercicio 1 de RIPA (hacer clic en la opción correcta)
  console.log('👉 Resolviendo Ejercicio 1 de RIPA...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      const opt = document.querySelector('.ripa-opt-btn[data-idx="0"]');
      if (opt) opt.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  const progressAfter = await send('Runtime.evaluate', {
    expression: `document.getElementById('ripa-progress-badge')?.textContent`,
    returnByValue: true
  });
  console.log('🏆 Progreso tras resolver:', progressAfter.result.value);

  // Volver a modo Viento y probar colapsar panel de brújula
  console.log('🔄 Probando colapso de panel brújula...');
  await send('Runtime.evaluate', {
    expression: `(() => {
      document.querySelector('button[data-mode="wind"]').click();
      const colBtn = document.querySelector('.sim-compass-card .panel-size-btn[data-size="collapsed"]');
      if (colBtn) colBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 500));

  const compassSize = await send('Runtime.evaluate', {
    expression: `document.querySelector('.sim-compass-card')?.getAttribute('data-size')`,
    returnByValue: true
  });
  console.log('📐 Tamaño brújula actual:', compassSize.result.value);

  // Captura final
  const snap2 = await send('Page.captureScreenshot', { format: 'png' });
  const path2 = 'C:\\Users\\augus\\.gemini\\antigravity\\brain\\16b29ddc-a869-41af-b974-080625862029\\screenshot-interactive.png';
  writeFileSync(path2, Buffer.from(snap2.data, 'base64'));
  console.log(`📸 Screenshot interactivo guardado en ${path2}`);

  ws.close();
  browser.kill();

  console.log('\n--- RESUMEN DE LA AUDITORÍA EN VIVO ---');
  console.log(`Total de logs: ${logs.length}`);
  logs.forEach(l => console.log('  ', l));
  console.log(`\nTotal de errores: ${errors.length}`);
  errors.forEach(e => console.error('  ❌', e));

  if (errors.length === 0) {
    console.log('✨ EXCELENTE: 0 errores detectados en la auditoría en vivo!');
  }
}

run().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
