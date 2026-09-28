import { Game } from './game/game';

function boot() {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const touch = document.getElementById('touch') as HTMLElement;
  const ui = document.getElementById('ui') as HTMLElement;
  try {
    new Game(canvas, touch, ui);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    ui.innerHTML = `<div class="overlay dim"><div class="panel"><h2>Oops!</h2><p>The game could not start on this device.</p><p style="color:#9fb0d6;font-size:13px">${msg}</p></div></div>`;
    window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', message: msg }));
  }
}

window.addEventListener('error', (e) => {
  window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'error', message: String(e.message) }));
});

boot();
