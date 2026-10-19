import { Difficulty, difficulties, difficultyTitle, nextDifficulty } from '../model/Difficulty';
import { Game } from '../game/Game';
import { colOf, rowOf } from '../model/Sudoku';
import { Storage } from '../game/Storage';
import { ICONS } from './icons';

export class App {
  private game: Game;
  private root: HTMLElement;

  private cellEls: HTMLElement[] = [];
  private valueEls: HTMLElement[] = [];
  private notesEls: HTMLElement[][] = [];
  private numEls: HTMLButtonElement[] = [];

  private timerEl!: HTMLElement;
  private difficultyLabel!: HTMLElement;
  private pauseBtn!: HTMLButtonElement;
  private menu!: HTMLElement;
  private notesBtn!: HTMLButtonElement;
  private overlayPause!: HTMLElement;
  private overlayWin!: HTMLElement;
  private overlayStats!: HTMLElement;
  private winCard!: HTMLElement;
  private statsCard!: HTMLElement;

  constructor(root: HTMLElement, game: Game) {
    this.root = root;
    this.game = game;
  }

  private el<T extends HTMLElement = HTMLElement>(sel: string): T {
    return this.root.querySelector(sel) as T;
  }

  mount(): void {
    this.root.innerHTML = this.skeleton();
    this.timerEl = this.el('#timer');
    this.difficultyLabel = this.el('#difficultyLabel');
    this.pauseBtn = this.el<HTMLButtonElement>('#pauseBtn');
    this.menu = this.el('#menu');
    this.notesBtn = this.el<HTMLButtonElement>('#ctrlNotes');
    this.overlayPause = this.el('#overlayPause');
    this.overlayWin = this.el('#overlayWin');
    this.overlayStats = this.el('#overlayStats');
    this.winCard = this.el('#winCard');
    this.statsCard = this.el('#statsCard');

    this.el('#gridHost').appendChild(this.buildGrid());
    this.el('#numpad').appendChild(this.buildNumpad());

    this.wireEvents();
    this.game.startTimer();
    this.render();
    window.setInterval(() => this.renderTimer(), 500);
  }

  private skeleton(): string {
    return `
      <div class="app">
        <header class="header">
          <button class="difficulty-btn" id="difficultyBtn">
            <span id="difficultyLabel">Easy</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
          <div class="timer" id="timer">0:00</div>
          <button class="icon-btn" id="pauseBtn">${ICONS.pause}</button>
        </header>
        <div class="menu" id="menu"></div>
        <div class="grid-wrap"><div id="gridHost"></div></div>
        <div class="controls" id="controls">
          <button class="control" id="ctrlUndo">${ICONS.undo}<span>Undo</span></button>
          <button class="control" id="ctrlErase">${ICONS.erase}<span>Erase</span></button>
          <button class="control" id="ctrlNotes">${ICONS.notes}<span>Notes</span></button>
          <button class="control" id="ctrlHint">${ICONS.hint}<span>Hint</span></button>
        </div>
        <div class="numpad" id="numpad"></div>
        <div class="overlay pause hidden" id="overlayPause">
          <div class="overlay-card">
            <h2>Paused</h2>
            <button class="pill-btn" id="resumeBtn">Resume</button>
          </div>
        </div>
        <div class="overlay win hidden" id="overlayWin"><div class="overlay-card" id="winCard"></div></div>
        <div class="overlay win hidden" id="overlayStats"><div class="overlay-card" id="statsCard"></div></div>
      </div>
    `;
  }

  private buildGrid(): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'grid';
    for (let i = 0; i < 81; i++) {
      const r = rowOf(i);
      const c = colOf(i);
      const cell = document.createElement('div');
      cell.className = 'cell';
      if (c === 8) cell.classList.add('last-col');
      if (r === 8) cell.classList.add('last-row');
      if (c === 2 || c === 5) cell.classList.add('br-thick');
      if (r === 2 || r === 5) cell.classList.add('bb-thick');

      const value = document.createElement('span');
      value.className = 'value';
      const notes = document.createElement('div');
      notes.className = 'notes';
      const noteSpans: HTMLElement[] = [];
      for (let n = 1; n <= 9; n++) {
        const s = document.createElement('span');
        notes.appendChild(s);
        noteSpans.push(s);
      }
      cell.append(value, notes);
      cell.addEventListener('click', () => this.onCellTap(i));

      this.cellEls.push(cell);
      this.valueEls.push(value);
      this.notesEls.push(noteSpans);
      grid.appendChild(cell);
    }
    return grid;
  }

  private buildNumpad(): HTMLElement {
    const pad = document.createElement('div');
    pad.className = 'numpad';
    for (let n = 1; n <= 9; n++) {
      const btn = document.createElement('button');
      btn.className = 'num';
      btn.innerHTML = `<span>${n}</span><span class="count"></span>`;
      btn.addEventListener('click', () => this.onNumber(n));
      this.numEls.push(btn);
      pad.appendChild(btn);
    }
    return pad;
  }

  private wireEvents(): void {
    this.el('#difficultyBtn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.menu.classList.toggle('open');
    });
    document.addEventListener('click', (e) => {
      if (!this.menu.contains(e.target as Node)) this.closeMenu();
    });
    this.pauseBtn.addEventListener('click', () => {
      if (this.game.status === 'paused') this.game.resume();
      else this.game.pause();
      this.render();
    });
    this.el('#resumeBtn').addEventListener('click', () => {
      this.game.resume();
      this.render();
    });
    this.el('#ctrlUndo').addEventListener('click', () => {
      this.game.undo();
      this.render();
    });
    this.el('#ctrlErase').addEventListener('click', () => {
      this.game.erase();
      this.render();
    });
    this.notesBtn.addEventListener('click', () => {
      this.game.togglePencil();
      this.render();
    });
    this.el('#ctrlHint').addEventListener('click', () => {
      this.game.hint();
      this.render();
    });
    window.addEventListener('keydown', (e) => this.onKey(e));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.game.pause();
        this.render();
      }
    });
  }

  private onCellTap(index: number): void {
    this.game.select(index);
    this.render();
  }

  private onNumber(n: number): void {
    this.game.enter(n);
    this.render();
  }

  private onKey(e: KeyboardEvent): void {
    if (!this.overlayStats.classList.contains('hidden')) return;
    const k = e.key;
    if (k >= '1' && k <= '9') {
      this.onNumber(Number(k));
      e.preventDefault();
      return;
    }
    if (k === 'Backspace' || k === 'Delete' || k === '0') {
      this.game.erase();
      this.render();
      e.preventDefault();
      return;
    }
    if (k === 'n' || k === 'N') {
      this.game.togglePencil();
      this.render();
      return;
    }
    if (k === 'u' || k === 'U') {
      this.game.undo();
      this.render();
      return;
    }
    if (k.startsWith('Arrow') && this.game.selected !== null) {
      let r = rowOf(this.game.selected);
      let c = colOf(this.game.selected);
      if (k === 'ArrowUp') r = Math.max(0, r - 1);
      if (k === 'ArrowDown') r = Math.min(8, r + 1);
      if (k === 'ArrowLeft') c = Math.max(0, c - 1);
      if (k === 'ArrowRight') c = Math.min(8, c + 1);
      this.game.select(r * 9 + c);
      this.render();
      e.preventDefault();
    }
  }

  private newGame(difficulty: Difficulty): void {
    this.closeMenu();
    this.game.pause();
    this.game = Game.newGame(difficulty);
    this.game.startTimer();
    this.render();
  }

  private render(): void {
    this.renderGrid();
    this.renderHeader();
    this.renderControls();
    this.renderNumpad();
    this.renderMenu();
    this.renderOverlays();
  }

  private renderGrid(): void {
    const g = this.game;
    const sel = g.selected;
    const selValue = sel !== null ? g.values[sel] : 0;
    const selRow = sel !== null ? rowOf(sel) : -1;
    const selCol = sel !== null ? colOf(sel) : -1;
    const selBox = sel !== null ? Math.floor(selRow / 3) * 3 + Math.floor(selCol / 3) : -1;

    for (let i = 0; i < 81; i++) {
      const cell = this.cellEls[i];
      const v = g.values[i];
      const r = rowOf(i);
      const c = colOf(i);
      const b = Math.floor(r / 3) * 3 + Math.floor(c / 3);

      cell.classList.toggle('given', g.isGiven[i]);
      cell.classList.toggle('error', g.isError(i));

      const isSelected = sel === i;
      const isSame = !isSelected && selValue !== 0 && v === selValue;
      const isPeer = !isSelected && !isSame && (r === selRow || c === selCol || b === selBox);
      cell.classList.toggle('selected', isSelected);
      cell.classList.toggle('same', isSame);
      cell.classList.toggle('peer', isPeer);

      this.valueEls[i].textContent = v !== 0 ? String(v) : '';
      const notes = this.notesEls[i];
      const showNotes = v === 0 && g.notes[i].size > 0;
      for (let n = 1; n <= 9; n++) {
        notes[n - 1].textContent = showNotes && g.notes[i].has(n) ? String(n) : '';
      }
    }
  }

  private renderHeader(): void {
    this.difficultyLabel.textContent = difficultyTitle(this.game.difficulty);
    this.renderTimer();
    this.pauseBtn.innerHTML = this.game.status === 'paused' ? ICONS.play : ICONS.pause;
    this.pauseBtn.disabled = this.game.status === 'won';
  }

  private renderTimer(): void {
    if (this.timerEl) this.timerEl.textContent = this.game.timeString;
  }

  private renderControls(): void {
    this.notesBtn.classList.toggle('active', this.game.pencilMode);
    const playing = this.game.status === 'playing';
    (this.el('#ctrlUndo') as HTMLButtonElement).disabled = !playing;
    (this.el('#ctrlErase') as HTMLButtonElement).disabled = !playing;
    (this.el('#ctrlHint') as HTMLButtonElement).disabled = !playing;
    this.notesBtn.disabled = !playing;
  }

  private renderNumpad(): void {
    for (let n = 1; n <= 9; n++) {
      const remaining = this.game.remainingCount(n);
      const btn = this.numEls[n - 1];
      btn.classList.toggle('complete', remaining === 0);
      const count = btn.querySelector('.count') as HTMLElement;
      count.textContent = String(remaining);
    }
  }

  private renderOverlays(): void {
    this.overlayPause.classList.toggle('hidden', this.game.status !== 'paused');
    const won = this.game.status === 'won';
    this.overlayWin.classList.toggle('hidden', !won);
    if (won) this.renderWinContent();
  }

  private renderWinContent(): void {
    const g = this.game;
    this.winCard.innerHTML = `
      <h2>You solved it!</h2>
      <p class="sub">${difficultyTitle(g.difficulty)}</p>
      <div class="big-time">${g.timeString}</div>
      <p class="sub">Mistakes: ${g.mistakes} &nbsp;·&nbsp; Hints: ${g.hintsUsed}</p>
      <button class="pill-btn" id="winNew">New ${difficultyTitle(g.difficulty)} Game</button>
      <button class="pill-btn" id="winNext">Play ${difficultyTitle(nextDifficulty(g.difficulty))}</button>
    `;
    this.el('#winNew').addEventListener('click', () => this.newGame(g.difficulty));
    this.el('#winNext').addEventListener('click', () => this.newGame(nextDifficulty(g.difficulty)));
  }

  private renderMenu(): void {
    const items = difficulties
      .map(
        (d) =>
          `<div class="menu-item" data-difficulty="${d}"><span>${difficultyTitle(d)}</span>${
            d === this.game.difficulty ? '<span class="check">&#10003;</span>' : ''
          }</div>`,
      )
      .join('');
    this.menu.innerHTML = `
      ${items}
      <div class="menu-sep"></div>
      <div class="menu-item" id="menuCheck"><span>Auto-check</span><span class="check">${
        this.game.autoCheck ? '&#10003;' : ''
      }</span></div>
      <div class="menu-item" id="menuStats"><span>Statistics</span></div>
      <div class="menu-item" id="menuNew"><span>New Game</span></div>
    `;
    this.menu.querySelectorAll('[data-difficulty]').forEach((node) => {
      node.addEventListener('click', () =>
        this.newGame((node as HTMLElement).dataset.difficulty as Difficulty),
      );
    });
    this.el('#menuCheck').addEventListener('click', () => {
      this.game.autoCheck = !this.game.autoCheck;
      this.render();
    });
    this.el('#menuStats').addEventListener('click', () => this.showStats());
    this.el('#menuNew').addEventListener('click', () => this.newGame(this.game.difficulty));
  }

  private showStats(): void {
    this.closeMenu();
    const stats = Storage.loadStats();
    const fmt = (t: number | null | undefined): string =>
      t == null ? '\u2014' : `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
    const sections = difficulties
      .map((d) => {
        const s = stats[d] || { started: 0, won: 0, totalTime: 0 };
        const avg = s.won > 0 ? Math.round(s.totalTime / s.won) : null;
        return `
          <div class="stats-section">${difficultyTitle(d)}</div>
          <div class="stats-row"><span>Games played</span><span class="val">${s.started}</span></div>
          <div class="stats-row"><span>Games won</span><span class="val">${s.won}</span></div>
          <div class="stats-row"><span>Best time</span><span class="val">${fmt(s.bestTime)}</span></div>
          <div class="stats-row"><span>Average time</span><span class="val">${fmt(avg)}</span></div>
        `;
      })
      .join('');
    this.statsCard.innerHTML =
      `<h2>Statistics</h2><div class="stats-list">${sections}</div><button class="pill-btn" id="statsClose">Done</button>`;
    this.el('#statsClose').addEventListener('click', () => this.overlayStats.classList.add('hidden'));
    this.overlayStats.classList.remove('hidden');
  }

  private closeMenu(): void {
    this.menu.classList.remove('open');
  }
}
