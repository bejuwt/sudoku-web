import './style.css';
import { Game } from './game/Game';
import { App } from './ui/App';

const root = document.getElementById('app');
if (root) {
  const app = new App(root, Game.loadOrNew());
  app.mount();
}
