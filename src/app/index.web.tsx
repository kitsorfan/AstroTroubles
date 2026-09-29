import html from '@/generated/gameHtml';

/** On the web the game page runs in an iframe; it saves to the browser's own localStorage. */
export default function Game() {
  return (
    <iframe
      title="Hull Breach: Starbloom"
      srcDoc={html}
      allow="autoplay; fullscreen; gamepad"
      style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', border: 0, background: '#03040a' }}
    />
  );
}
