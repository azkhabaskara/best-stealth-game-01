// game.js — the orchestrator: the main loop, screen changes, level
// flow, hearts, score and rank, and the shared "world" the player,
// guards and cameras all read from.
//
// Screens: title, playing, paused, caught (a short flash), level
// complete, game over, win. The game runs on one canvas with no
// network requests and no files beyond this folder.

import { VIEW_W, VIEW_H, parseMap } from './map.js';
import { LEVELS } from './levels.js';
import { Input } from './input.js';
import { Player } from './player.js';
import { Guard } from './guard.js';
import { SecurityCamera } from './camera.js';
import { SoundEngine } from './audio.js';
import {
  drawWorld, drawHUD, drawTitle, drawPause, drawLevelComplete,
  drawGameOver, drawWin, drawCaught, findButton,
} from './render.js';
import { setupShot } from './shots.js';

const RANK_BLURBS = {
  Hantu: 'Tidak sekali pun tertangkap, dan cepat. Museum bahkan tidak tahu Wren pernah ada.',
  Bayangan: 'Hampir tak terlihat — hanya sesekali bayangan melintas di ujung mata.',
  Profesional: 'Pekerjaan bersih dengan beberapa kejadian. Museum masih menghitung kerugiannya.',
  Amatir: 'Berisik, tapi Star Sapphire tetap berhasil dibawa pulang.',
};

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.input = new Input(canvas);
    this.audio = new SoundEngine();
    this.screen = 'title';
    this.levelIndex = 0;
    this.levelDef = LEVELS[0];
    this.map = null;
    this.player = null;
    this.guards = [];
    this.cameras = [];
    this.artifacts = [];
    this.coins = [];
    this.vases = [];
    this.hearts = 3;
    this.coinsCollected = 0;
    this.levelTime = 0;
    this.totalTime = 0;
    this.levelCaught = 0;
    this.totalCaught = 0;
    this.score = 0;
    this.levelScore = 0;
    this.rank = '';
    this.rankBlurb = '';
    this.muted = false;
    this.time = 0;
    this.alarmUntil = 0;
    this.caughtTimer = 0;
    this.buttons = [];
    this.exitLitOverride = false;
    this.lastTime = 0;
    this.shotMode = null;

    const params = new URLSearchParams(window.location.search);
    const shot = params.get('shot');
    if (shot) {
      this.shotMode = shot;
      this.loadLevel(0);
      setupShot(this, shot);
      this.render();
      window.__shotReady = true;
      return;
    }
    if (params.get('debug') === '1') {
      window.__shadowGallery = { game: this, version: 1 };
    }
    this.loadLevel(0);
    this.screen = 'title';
    requestAnimationFrame((t) => this.loop(t));
  }

  // ---- level setup -------------------------------------------------

  loadLevel(index) {
    this.levelIndex = index;
    this.levelDef = LEVELS[index];
    this.map = parseMap(this.levelDef.map);
    this.artifacts = this.map.artifacts;
    this.coins = this.map.coins;
    this.vases = this.map.vases;
    this.player = new Player(this.map.entrance.x, this.map.entrance.y);
    this.guards = this.levelDef.patrols.map((def, i) => new Guard(def, i));
    this.cameras = this.levelDef.cameras.map((def) => new SecurityCamera(def));
    this.hearts = 3;
    this.coinsCollected = 0;
    this.levelTime = 0;
    this.levelCaught = 0;
    this.levelScore = 0;
    this.alarmUntil = 0;
    this.caughtTimer = 0;
  }

  startNewGame() {
    this.score = 0;
    this.totalCaught = 0;
    this.totalTime = 0;
    this.loadLevel(0);
    this.screen = 'playing';
  }

  // ---- world callbacks used by player / guards / cameras ----------

  emitNoise(x, y, radius) {
    for (const guard of this.guards) guard.hearNoise(x, y, radius);
  }

  nearestGuardDist(x, y) {
    let best = Infinity;
    for (const guard of this.guards) {
      best = Math.min(best, Math.hypot(guard.x - x, guard.y - y));
    }
    return best;
  }

  onVaseBroken(vase) {
    for (const guard of this.guards) guard.hearNoise(vase.x, vase.y, 340);
    this.alarmUntil = this.time + 4;
  }

  onArtifactTaken() {
    // The exit unlocks once every artifact is taken; render reads it.
  }

  onCoinTaken() {
    this.coinsCollected += 1;
  }

  onAlarmRaised() {
    // The HUD eye reads guard meters directly; nothing else to do.
  }

  onCameraAlarm(camera, pos) {
    let best = null;
    let bestD = Infinity;
    for (const guard of this.guards) {
      const d = Math.hypot(guard.x - pos.x, guard.y - pos.y);
      if (d < bestD) { bestD = d; best = guard; }
    }
    if (best) best.becomeSuspicious(pos, 0.6);
  }

  onCaught() {
    if (this.screen !== 'playing') return;
    this.screen = 'caught';
    this.caughtTimer = 1.4;
    this.hearts -= 1;
    this.levelCaught += 1;
    this.totalCaught += 1;
    this.audio.caught();
  }

  respawnAfterCaught() {
    if (this.hearts <= 0) {
      this.screen = 'gameover';
      return;
    }
    this.player.reset(this.map.entrance.x, this.map.entrance.y);
    for (const guard of this.guards) guard.reset();
    for (const cam of this.cameras) cam.reset();
    this.alarmUntil = 0;
    this.screen = 'playing';
  }

  levelScoreNow() {
    const art = this.artifacts.filter((a) => a.taken).length;
    const timeBonus = Math.max(0, 2400 - Math.floor(this.levelTime) * 15);
    return Math.max(0, art * 1000 + this.coinsCollected * 100 + timeBonus - this.levelCaught * 400);
  }

  finishLevel() {
    this.levelScore = this.levelScoreNow();
    this.score += this.levelScore;
    this.totalTime += this.levelTime;
    if (this.levelIndex >= LEVELS.length - 1) {
      this.rank = this.computeRank();
      this.rankBlurb = RANK_BLURBS[this.rank];
      this.screen = 'win';
      this.audio.win();
    } else {
      this.screen = 'levelComplete';
      this.audio.win();
    }
  }

  computeRank() {
    if (this.totalCaught === 0 && this.totalTime < 300) return 'Hantu';
    if (this.totalCaught <= 2) return 'Bayangan';
    if (this.totalCaught <= 5) return 'Profesional';
    return 'Amatir';
  }

  toggleMute() {
    this.muted = !this.muted;
    this.audio.setMuted(this.muted);
  }

  // ---- main loop ---------------------------------------------------

  loop(timestamp) {
    const dt = Math.min(0.05, (timestamp - this.lastTime) / 1000 || 0.016);
    this.lastTime = timestamp;
    this.time += dt;
    this.update(dt);
    this.render();
    this.input.endFrame();
    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    const input = this.input;

    // Global keys.
    if (input.consumePressed('KeyM')) this.toggleMute();

    // Mouse clicks on whatever buttons the last frame drew.
    for (const click of input.takeClicks()) {
      const btn = findButton(this.buttons, click.x, click.y);
      if (btn) this.pressButton(btn.id);
    }

    switch (this.screen) {
      case 'title': {
        if (input.consumePressed('Enter') || input.consumePressed('NumpadEnter')) {
          this.audio.ensure();
          this.audio.click();
          this.startNewGame();
        }
        break;
      }
      case 'playing': {
        if (input.consumePressed('KeyP') || input.consumePressed('Escape')) {
          this.screen = 'paused';
          break;
        }
        if (input.consumePressed('KeyR')) {
          this.loadLevel(this.levelIndex);
          break;
        }
        this.levelTime += dt;
        this.player.update(dt, input, this);
        for (const guard of this.guards) guard.update(dt, this);
        for (const cam of this.cameras) cam.update(dt, this);
        // Reached the exit with every artifact?
        if (this.artifacts.every((a) => a.taken)) {
          const d = Math.hypot(this.player.x - this.map.exit.x, this.player.y - this.map.exit.y);
          if (d < 26) this.finishLevel();
        }
        break;
      }
      case 'paused': {
        if (input.consumePressed('KeyP') || input.consumePressed('Escape')) {
          this.screen = 'playing';
        }
        if (input.consumePressed('KeyR')) {
          this.loadLevel(this.levelIndex);
          this.screen = 'playing';
        }
        break;
      }
      case 'caught': {
        this.caughtTimer -= dt;
        if (this.caughtTimer <= 0) this.respawnAfterCaught();
        break;
      }
      case 'levelComplete': {
        if (input.consumePressed('Enter') || input.consumePressed('NumpadEnter')) {
          this.loadLevel(this.levelIndex + 1);
          this.screen = 'playing';
        }
        break;
      }
      case 'gameover': {
        if (input.consumePressed('Enter') || input.consumePressed('NumpadEnter')) {
          this.loadLevel(this.levelIndex);
          this.screen = 'playing';
        }
        break;
      }
      case 'win': {
        if (input.consumePressed('Enter') || input.consumePressed('NumpadEnter')) {
          this.screen = 'title';
        }
        break;
      }
      default:
        break;
    }
  }

  pressButton(id) {
    this.audio.ensure();
    this.audio.click();
    switch (id) {
      case 'start':
        this.startNewGame();
        break;
      case 'resume':
        if (this.screen === 'paused') this.screen = 'playing';
        break;
      case 'restart':
        this.loadLevel(this.levelIndex);
        this.screen = 'playing';
        break;
      case 'title':
        this.screen = 'title';
        break;
      case 'mute':
        this.toggleMute();
        break;
      case 'pause':
        if (this.screen === 'playing') this.screen = 'paused';
        break;
      case 'next':
        if (this.screen === 'levelComplete') {
          this.loadLevel(this.levelIndex + 1);
          this.screen = 'playing';
        }
        break;
      case 'retry':
        if (this.screen === 'gameover') {
          this.loadLevel(this.levelIndex);
          this.screen = 'playing';
        }
        break;
      case 'again':
        if (this.screen === 'win') this.screen = 'title';
        break;
      default:
        break;
    }
  }

  // ---- drawing -----------------------------------------------------

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    this.buttons = [];
    switch (this.screen) {
      case 'title':
        this.buttons = drawTitle(ctx, this);
        break;
      case 'playing':
      case 'caught':
        drawWorld(ctx, this);
        this.buttons = drawHUD(ctx, this);
        if (this.screen === 'caught') drawCaught(ctx, this);
        break;
      case 'paused':
        drawWorld(ctx, this);
        drawHUD(ctx, this);
        this.buttons = drawPause(ctx, this);
        break;
      case 'levelComplete':
        drawWorld(ctx, this);
        drawHUD(ctx, this);
        this.buttons = drawLevelComplete(ctx, this);
        break;
      case 'gameover':
        drawWorld(ctx, this);
        drawHUD(ctx, this);
        this.buttons = drawGameOver(ctx, this);
        break;
      case 'win':
        this.buttons = drawWin(ctx, this);
        break;
      default:
        break;
    }
  }
}
