// shots.js — deterministic screenshot scenes.
//
// Each scene puts the game into a fixed state and the page renders one
// frame of it (the game is opened with ?shot=<name>). Nothing here is
// random and nothing advances in time, so the same scene always renders
// the same image. These are real renders of the game's own code.

import { TILE } from './map.js';

function at(tx, ty) {
  return { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2 };
}

export function setupShot(game, name) {
  // A fixed clock so shimmer, glow pulses and coins never drift.
  game.time = 8.0;
  game.muted = true;

  if (name === 'cover') {
    // Level one, mid-play: Wren sneaking beside a display case, two
    // guard cones in view, the Star Sapphire glowing, the exit lit.
    game.loadLevel(0);
    game.screen = 'playing';
    game.levelTime = 87;
    game.coinsCollected = 1;
    game.coins[0].taken = true;
    const p = at(10, 6);
    game.player.x = p.x;
    game.player.y = p.y;
    game.player.facing = Math.PI / 2;
    game.player.sneaking = true;
    const g1 = at(20, 3);
    game.guards[0].x = g1.x;
    game.guards[0].y = g1.y;
    game.guards[0].facing = 2.6;
    game.guards[0].state = 'suspicious';
    game.guards[0].meter = 0.62;
    const g2 = at(16, 15);
    game.guards[1].x = g2.x;
    game.guards[1].y = g2.y;
    game.guards[1].facing = -Math.PI / 2 - 0.2;
    game.guards[1].state = 'patrol';
    game.guards[1].meter = 0.12;
    // The exit glows for the cover even though the gem is still there.
    game.exitLitOverride = true;
    return;
  }

  if (name === 'title') {
    game.loadLevel(0);
    game.screen = 'title';
    return;
  }

  if (name === 'near') {
    // Level two, a near miss: an alert guard closes in with a full
    // meter while Wren crouches at the edge of the shadow by the vaults.
    game.loadLevel(1);
    game.screen = 'playing';
    game.levelTime = 143;
    game.coinsCollected = 1;
    game.coins[1].taken = true;
    const p = at(6, 15);
    game.player.x = p.x;
    game.player.y = p.y;
    game.player.facing = -Math.PI / 2;
    game.player.sneaking = true;
    const g = at(8, 13);
    game.guards[1].x = g.x;
    game.guards[1].y = g.y;
    game.guards[1].facing = Math.atan2(p.y - g.y, p.x - g.x);
    game.guards[1].state = 'alert';
    game.guards[1].meter = 1;
    game.guards[1].lastSeen = { x: p.x, y: p.y };
    game.guards[1].lastSeenAt = game.time;
    game.guards[0].meter = 0.78;
    game.guards[0].state = 'suspicious';
    game.cameras[0].meter = 0.7;
    game.cameras[0].angle = Math.PI / 2;
    return;
  }

  if (name === 'win') {
    game.loadLevel(0);
    game.screen = 'win';
    game.score = 12480;
    game.totalTime = 247;
    game.totalCaught = 1;
    game.rank = 'Bayangan';
    game.rankBlurb = 'Hampir tak terlihat — hanya sesekali bayangan melintas di ujung mata.';
    return;
  }

  // Unknown shot name: fall back to the title screen.
  game.loadLevel(0);
  game.screen = 'title';
}
