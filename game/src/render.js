// render.js — everything drawn on the canvas: the museum floor, light
// pools and shadow zones, props, vision cones, characters, the HUD and
// every screen. No images are loaded; all art is drawn with canvas
// shapes so the game stays a handful of offline files.

import { TILE, VIEW_W, VIEW_H } from './map.js';

export const HUD_BAR_H = 46;
export const HUD_OBJ_H = 26;

export function pointInButton(b, x, y) {
  return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
}

export function findButton(buttons, x, y) {
  return buttons.find((b) => pointInButton(b, x, y)) || null;
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawButton(ctx, b, hover, label, opts = {}) {
  ctx.save();
  ctx.fillStyle = hover ? '#f5b942' : (opts.fill || '#2e3442');
  rr(ctx, b.x, b.y, b.w, b.h, 8);
  ctx.fill();
  ctx.strokeStyle = hover ? '#ffe1a1' : '#5a6378';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = hover ? '#1a1d27' : '#eef1f7';
  ctx.font = `bold ${opts.fontSize || 17}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, b.x + b.w / 2, b.y + b.h / 2 + 1);
  ctx.restore();
}

function drawDiamond(ctx, x, y, size, color, glow) {
  ctx.save();
  if (glow) {
    ctx.shadowColor = color;
    ctx.shadowBlur = 16;
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.7, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.7, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawHeart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.fillStyle = filled ? '#e5484d' : 'rgba(229,72,77,0.25)';
  ctx.strokeStyle = filled ? '#ff8a8a' : '#5a2a2c';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y + size * 0.9);
  ctx.bezierCurveTo(x - size * 1.2, y, x - size * 0.55, y - size, x, y - size * 0.35);
  ctx.bezierCurveTo(x + size * 0.55, y - size, x + size * 1.2, y, x, y + size * 0.9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------- world

export function drawWorld(ctx, game) {
  const { map, time } = game;
  const grid = map.grid;

  // Floor: two dark marble tones in a checker, with grout lines.
  for (let ty = 0; ty < map.rows; ty++) {
    for (let tx = 0; tx < map.cols; tx++) {
      const x = tx * TILE;
      const y = ty * TILE;
      const ch = grid[ty][tx];
      ctx.fillStyle = (tx + ty) % 2 === 0 ? '#272c39' : '#232833';
      ctx.fillRect(x, y, TILE, TILE);
      if (ch === '*') {
        ctx.fillStyle = 'rgba(255,196,96,0.07)';
        ctx.fillRect(x, y, TILE, TILE);
        const g = ctx.createRadialGradient(x + TILE / 2, y + TILE / 2, 4, x + TILE / 2, y + TILE / 2, TILE * 1.05);
        g.addColorStop(0, 'rgba(255,196,96,0.26)');
        g.addColorStop(1, 'rgba(255,196,96,0)');
        ctx.fillStyle = g;
        ctx.fillRect(x, y, TILE, TILE);
      } else if (ch === ',') {
        ctx.fillStyle = 'rgba(8,14,34,0.32)';
        ctx.fillRect(x, y, TILE, TILE);
      }
    }
  }

  // Pond shimmer.
  for (let ty = 0; ty < map.rows; ty++) {
    for (let tx = 0; tx < map.cols; tx++) {
      if (grid[ty][tx] !== 'P') continue;
      const x = tx * TILE;
      const y = ty * TILE;
      ctx.fillStyle = '#16425f';
      ctx.fillRect(x, y, TILE, TILE);
      ctx.strokeStyle = 'rgba(120,200,235,0.35)';
      ctx.lineWidth = 1.5;
      const wob = Math.sin(time * 1.6 + tx * 0.7 + ty * 0.4) * 3;
      ctx.beginPath();
      ctx.moveTo(x + 6, y + TILE / 2 + wob);
      ctx.lineTo(x + TILE - 6, y + TILE / 2 - wob);
      ctx.stroke();
    }
  }

  // Walls, cases, statues.
  for (let ty = 0; ty < map.rows; ty++) {
    for (let tx = 0; tx < map.cols; tx++) {
      const ch = grid[ty][tx];
      const x = tx * TILE;
      const y = ty * TILE;
      if (ch === '#') {
        ctx.fillStyle = '#3d4356';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = '#4d5468';
        ctx.fillRect(x, y, TILE, 5);
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, TILE - 1, TILE - 1);
      } else if (ch === 'D') {
        ctx.fillStyle = 'rgba(188,211,230,0.30)';
        ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.strokeStyle = 'rgba(215,232,246,0.85)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, TILE - 8, TILE - 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + 8, y + TILE - 8);
        ctx.lineTo(x + TILE - 12, y + 8);
        ctx.stroke();
        ctx.fillStyle = 'rgba(220,235,250,0.5)';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (ch === 'S') {
        ctx.fillStyle = '#5d6274';
        ctx.fillRect(x + 7, y + TILE - 12, TILE - 14, 10);
        ctx.fillStyle = '#878da0';
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + 15, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(x + TILE / 2 - 6, y + 18, 12, 10);
      }
    }
  }

  // Entrance mat and exit doors.
  const ent = map.entrance;
  ctx.fillStyle = '#5a4632';
  ctx.fillRect(ent.x - 18, ent.y - 14, 36, 28);
  ctx.strokeStyle = '#8a6f4d';
  ctx.lineWidth = 2;
  ctx.strokeRect(ent.x - 18, ent.y - 14, 36, 28);
  ctx.fillStyle = '#d8c49a';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('MASUK', ent.x, ent.y + 3);

  const exit = map.exit;
  const allTaken = game.artifacts.every((a) => a.taken) || game.exitLitOverride;
  ctx.save();
  if (allTaken) {
    ctx.shadowColor = '#39d98a';
    ctx.shadowBlur = 22;
  }
  ctx.fillStyle = allTaken ? '#1f9d5f' : '#3a3f4d';
  rr(ctx, exit.x - 19, exit.y - 16, 38, 32, 4);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = allTaken ? '#7cf2b2' : '#6a7080';
  ctx.lineWidth = 2;
  rr(ctx, exit.x - 19, exit.y - 16, 38, 32, 4);
  ctx.stroke();
  ctx.strokeStyle = allTaken ? '#b8ffda' : '#4a4f5e';
  ctx.beginPath();
  ctx.moveTo(exit.x, exit.y - 16);
  ctx.lineTo(exit.x, exit.y + 16);
  ctx.stroke();
  ctx.fillStyle = allTaken ? '#eafff3' : '#8a90a0';
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(allTaken ? 'BUKA' : 'KUNCI', exit.x, exit.y - 21);

  // Vases, coins, artifacts.
  for (const vase of game.vases) {
    if (vase.broken) {
      ctx.fillStyle = '#8a4a30';
      ctx.beginPath();
      ctx.ellipse(vase.x - 6, vase.y + 6, 7, 3, 0.4, 0, Math.PI * 2);
      ctx.ellipse(vase.x + 7, vase.y - 3, 5, 3, -0.3, 0, Math.PI * 2);
      ctx.fill();
      continue;
    }
    ctx.fillStyle = '#b5653a';
    ctx.beginPath();
    ctx.ellipse(vase.x, vase.y + 2, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d98a5a';
    ctx.fillRect(vase.x - 5, vase.y - 16, 10, 6);
    ctx.fillStyle = '#7ec850';
    ctx.beginPath();
    ctx.arc(vase.x - 3, vase.y - 19, 4, 0, Math.PI * 2);
    ctx.arc(vase.x + 4, vase.y - 21, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const coin of game.coins) {
    if (coin.taken) continue;
    ctx.save();
    ctx.shadowColor = '#f5c542';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#f5c542';
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = '#a67c1a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(coin.x, coin.y, 7, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const art of game.artifacts) {
    if (art.taken) continue;
    const pulse = 1 + Math.sin(time * 3 + art.x) * 0.12;
    drawDiamond(ctx, art.x, art.y, 13 * pulse, '#59d6ff', true);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.arc(art.x - 3, art.y - 4, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Vision cones: cameras first, then guards.
  for (const cam of game.cameras) {
    const pts = cam.conePoints(game);
    ctx.save();
    ctx.fillStyle = cam.alarmFlash > 0 ? 'rgba(255,80,50,0.34)' : 'rgba(255,150,60,0.20)';
    ctx.strokeStyle = 'rgba(255,170,80,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  for (const guard of game.guards) {
    const pts = guard.conePoints(game);
    let fill = 'rgba(255,200,60,0.16)';
    let edge = 'rgba(255,210,90,0.35)';
    if (guard.state === 'alert') { fill = 'rgba(255,70,50,0.32)'; edge = 'rgba(255,110,80,0.55)'; }
    else if (guard.state === 'suspicious' || guard.state === 'search') { fill = 'rgba(255,150,40,0.26)'; edge = 'rgba(255,170,70,0.45)'; }
    ctx.save();
    ctx.fillStyle = fill;
    ctx.strokeStyle = edge;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Cameras (ceiling domes on a short mount).
  for (const cam of game.cameras) {
    ctx.strokeStyle = '#39415a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y - 11);
    ctx.lineTo(cam.x, cam.y - 18);
    ctx.stroke();
    ctx.fillStyle = '#20242f';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#5a6378';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 11, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = cam.alarmFlash > 0 ? '#ff5032' : '#ffb03a';
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8dce6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cam.x, cam.y);
    ctx.lineTo(cam.x + Math.cos(cam.angle) * 16, cam.y + Math.sin(cam.angle) * 16);
    ctx.stroke();
    if (cam.meter > 0.05) {
      ctx.strokeStyle = '#ff5032';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cam.x, cam.y, 15, -Math.PI / 2, -Math.PI / 2 + cam.meter * Math.PI * 2);
      ctx.stroke();
    }
  }

  // Guards.
  for (const guard of game.guards) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(guard.x, guard.y + 10, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2b4a7a';
    ctx.strokeStyle = '#9db8dd';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(guard.x, guard.y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Cap with brim pointing where he looks.
    ctx.fillStyle = '#1d3355';
    ctx.beginPath();
    ctx.arc(guard.x, guard.y - 2, 9, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(guard.x + Math.cos(guard.facing) * 8 - 3, guard.y + Math.sin(guard.facing) * 8 - 3, 9, 5);
    // Facing tick.
    ctx.strokeStyle = '#dfe8f5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * 17, guard.y + Math.sin(guard.facing) * 17);
    ctx.stroke();
    // Detection meter arc above the head.
    if (guard.meter > 0.03) {
      const col = guard.meter > 0.66 ? '#ff5032' : guard.meter > 0.33 ? '#ff9d2e' : '#ffd23c';
      ctx.strokeStyle = col;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(guard.x, guard.y, 20, -Math.PI / 2, -Math.PI / 2 + guard.meter * Math.PI * 2);
      ctx.stroke();
    }
    // State mark.
    if (guard.state === 'alert') {
      ctx.fillStyle = '#ff5032';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 26);
    } else if (guard.state === 'suspicious' || guard.state === 'search') {
      ctx.fillStyle = '#ffd23c';
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, guard.y - 26);
    }
    ctx.restore();
  }

  // The player: a dark hooded figure with a thin bright rim and a soft
  // halo, so it stays readable on the dark floor at a glance.
  const p = game.player;
  ctx.save();
  const halo = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, 30);
  halo.addColorStop(0, 'rgba(159,216,255,0.20)');
  halo.addColorStop(1, 'rgba(159,216,255,0)');
  ctx.fillStyle = halo;
  ctx.fillRect(p.x - 30, p.y - 30, 60, 60);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 10, 12, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  const bob = p.moving ? Math.sin(p.bobPhase) * 1.5 : 0;
  ctx.translate(p.x, p.y + bob * 0.4);
  ctx.fillStyle = '#12141c';
  ctx.strokeStyle = '#cfeaff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  // Hood point toward the facing direction.
  ctx.fillStyle = '#1c1f2b';
  ctx.beginPath();
  ctx.moveTo(Math.cos(p.facing) * 20, Math.sin(p.facing) * 20);
  ctx.lineTo(Math.cos(p.facing + 2.5) * 10, Math.sin(p.facing + 2.5) * 10);
  ctx.lineTo(Math.cos(p.facing - 2.5) * 10, Math.sin(p.facing - 2.5) * 10);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#e8f2ff';
  ctx.beginPath();
  ctx.arc(Math.cos(p.facing) * 4, Math.sin(p.facing) * 4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Soft vignette so the night mood reads at a glance.
  const vg = ctx.createRadialGradient(
    VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.42,
    VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.95,
  );
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(0,0,0,0.34)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

// ------------------------------------------------------------------- HUD

export function drawHUD(ctx, game) {
  const buttons = [];
  ctx.save();
  ctx.fillStyle = 'rgba(8,10,18,0.88)';
  ctx.fillRect(0, 0, VIEW_W, HUD_BAR_H);
  ctx.fillStyle = '#39415a';
  ctx.fillRect(0, HUD_BAR_H, VIEW_W, 2);

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#eef1f7';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`${game.levelDef.levelNo} · ${game.levelDef.name}`, 14, HUD_BAR_H / 2 + 1);

  // Artifacts collected.
  let ax = 250;
  const totalArt = game.artifacts.length;
  const gotArt = game.artifacts.filter((a) => a.taken).length;
  for (let i = 0; i < totalArt; i++) {
    drawDiamond(ctx, ax + i * 24, HUD_BAR_H / 2, 8, i < gotArt ? '#59d6ff' : 'rgba(89,214,255,0.25)', i < gotArt);
    ctx.strokeStyle = 'rgba(89,214,255,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(ax + i * 24, HUD_BAR_H / 2 - 8);
    ctx.lineTo(ax + i * 24 + 5.6, HUD_BAR_H / 2);
    ctx.lineTo(ax + i * 24, HUD_BAR_H / 2 + 8);
    ctx.lineTo(ax + i * 24 - 5.6, HUD_BAR_H / 2);
    ctx.closePath();
    ctx.stroke();
  }
  ax += totalArt * 24 + 8;

  // Coins.
  ctx.fillStyle = '#f5c542';
  ctx.beginPath();
  ctx.arc(ax + 7, HUD_BAR_H / 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#eef1f7';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(String(game.coinsCollected), ax + 18, HUD_BAR_H / 2 + 1);
  ax += 58;

  // Timer.
  const t = Math.floor(game.levelTime);
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');
  ctx.fillStyle = '#c8d0e0';
  ctx.fillText(`${mm}:${ss}`, ax, HUD_BAR_H / 2 + 1);
  ax += 62;

  // Hearts.
  for (let i = 0; i < 3; i++) {
    drawHeart(ctx, ax + 12 + i * 26, HUD_BAR_H / 2 - 1, 9, i < game.hearts);
  }
  ax += 92;

  // Alarm eye: fills red while any guard or camera is alarmed.
  const maxMeter = Math.max(
    0,
    ...game.guards.map((g) => g.meter),
    ...game.cameras.map((c) => c.meter),
  );
  const anyAlert = game.guards.some((g) => g.state === 'alert') || game.cameras.some((c) => c.alarmFlash > 0);
  const ex = ax + 16;
  const ey = HUD_BAR_H / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  ctx.beginPath();
  ctx.ellipse(ex, ey, 15, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = anyAlert ? '#ff5032' : '#ffd23c';
  ctx.globalAlpha = 0.25 + 0.75 * maxMeter;
  ctx.beginPath();
  ctx.arc(ex, ey, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#8a90a0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(ex, ey, 15, 9, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Mute and pause buttons.
  const hover = game.input.hover;
  const muteBtn = { id: 'mute', x: VIEW_W - 196, y: 8, w: 88, h: 30 };
  const pauseBtn = { id: 'pause', x: VIEW_W - 98, y: 8, w: 88, h: 30 };
  drawButton(ctx, muteBtn, pointInButton(muteBtn, hover.x, hover.y), game.muted ? 'MUTED' : 'SOUND', { fontSize: 13 });
  drawButton(ctx, pauseBtn, pointInButton(pauseBtn, hover.x, hover.y), 'PAUSE', { fontSize: 13 });
  buttons.push(muteBtn, pauseBtn);

  // Objective line under the bar.
  ctx.fillStyle = 'rgba(10,12,20,0.66)';
  ctx.fillRect(0, HUD_BAR_H + 2, VIEW_W, HUD_OBJ_H - 4);
  ctx.fillStyle = '#d5dbe8';
  ctx.font = '13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(game.levelDef.objective, VIEW_W / 2, HUD_BAR_H + 2 + (HUD_OBJ_H - 4) / 2);
  ctx.restore();
  return buttons;
}

// --------------------------------------------------------------- screens

function dimBackground(ctx) {
  ctx.fillStyle = 'rgba(6,8,14,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function centerText(ctx, text, y, size, color, bold = true) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? 'bold ' : ''}${size}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, VIEW_W / 2, y);
}

export function drawTitle(ctx, game) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#0d1020');
  g.addColorStop(1, '#1a2033');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // A decorative cone and a sneaking figure, drawn with the same shapes
  // the game uses.
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = 'rgba(255,200,60,0.20)';
  ctx.beginPath();
  ctx.moveTo(960, 300);
  ctx.lineTo(1180, 180);
  ctx.lineTo(1180, 420);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2b4a7a';
  ctx.beginPath();
  ctx.arc(960, 300, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#12141c';
  ctx.strokeStyle = '#9fd8ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(330, 560, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  centerText(ctx, 'SHADOW GALLERY', 180, 64, '#f5b942');
  centerText(ctx, 'Seorang pencuri. Satu museum. Jangan ketahuan.', 240, 20, '#d5dbe8', false);
  centerText(ctx, 'Wren menyelinap masuk di malam hari untuk mencuri Star Sapphire.', 300, 18, '#9aa3b5', false);
  centerText(ctx, 'Kumpulkan semua artefak, lalu keluar lewat pintu hijau.', 328, 18, '#9aa3b5', false);

  const lines = [
    'WASD / panah — bergerak (8 arah)',
    'Tahan Shift — menyelinap (pelan, sunyi, sulit terlihat)',
    'P / Esc — jeda      M — bisu      R — ulang level',
    'Hindari kerucut kuning penjaga dan kamera. Vas yang jatuh berisik!',
  ];
  lines.forEach((line, i) => centerText(ctx, line, 400 + i * 30, 16, '#c8d0e0', false));

  const hover = game.input.hover;
  const startBtn = { id: 'start', x: VIEW_W / 2 - 110, y: 560, w: 220, h: 56 };
  drawButton(ctx, startBtn, pointInButton(startBtn, hover.x, hover.y), 'MULAI MALAM INI', { fontSize: 19, fill: '#f5b942' });
  centerText(ctx, '3 level · keyboard + mouse · tanpa suara? tekan M', 650, 14, '#7c8499', false);
  return [startBtn];
}

export function drawPause(ctx, game) {
  dimBackground(ctx);
  centerText(ctx, 'JEDA', 220, 48, '#eef1f7');
  centerText(ctx, 'Museum menunggu. Penjaga tidak.', 275, 17, '#9aa3b5', false);
  const hover = game.input.hover;
  const mk = (id, label, y) => ({ id, x: VIEW_W / 2 - 130, y, w: 260, h: 48 });
  const resume = mk('resume', 'Lanjut', 330);
  const restart = mk('restart', 'Ulang Level', 392);
  const title = mk('title', 'Kembali ke Judul', 454);
  const mute = mk('mute', game.muted ? 'Suara: Mati' : 'Suara: Hidup', 516);
  drawButton(ctx, resume, pointInButton(resume, hover.x, hover.y), 'LANJUT', { fontSize: 17 });
  drawButton(ctx, restart, pointInButton(restart, hover.x, hover.y), 'ULANG LEVEL', { fontSize: 17 });
  drawButton(ctx, title, pointInButton(title, hover.x, hover.y), 'KEMBALI KE JUDUL', { fontSize: 17 });
  drawButton(ctx, mute, pointInButton(mute, hover.x, hover.y), game.muted ? 'SUARA: MATI' : 'SUARA: HIDUP', { fontSize: 17 });
  return [resume, restart, title, mute];
}

export function drawLevelComplete(ctx, game) {
  dimBackground(ctx);
  centerText(ctx, 'LEVEL SELESAI!', 230, 46, '#39d98a');
  centerText(ctx, `${game.levelDef.name} — semua artefak aman di tangan Wren.`, 285, 18, '#d5dbe8', false);
  const t = Math.floor(game.levelTime);
  centerText(ctx, `Waktu  ${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}    Tertangkap  ${game.levelCaught}    Skor level  ${game.levelScore}`, 350, 20, '#eef1f7', false);
  centerText(ctx, `Skor total  ${game.score}`, 390, 20, '#f5b942');
  const hover = game.input.hover;
  const next = { id: 'next', x: VIEW_W / 2 - 110, y: 460, w: 220, h: 54 };
  drawButton(ctx, next, pointInButton(next, hover.x, hover.y), 'LEVEL BERIKUTNYA', { fontSize: 17, fill: '#f5b942' });
  return [next];
}

export function drawGameOver(ctx, game) {
  dimBackground(ctx);
  centerText(ctx, 'NYAWA HABIS', 250, 48, '#ff5032');
  centerText(ctx, 'Penjaga museum akhirnya menangkap Wren untuk ketiga kalinya.', 310, 18, '#d5dbe8', false);
  centerText(ctx, `Skor sejauh ini  ${game.score}`, 350, 20, '#f5b942');
  const hover = game.input.hover;
  const retry = { id: 'retry', x: VIEW_W / 2 - 110, y: 430, w: 220, h: 54 };
  drawButton(ctx, retry, pointInButton(retry, hover.x, hover.y), 'COBA LAGI', { fontSize: 18, fill: '#f5b942' });
  return [retry];
}

export function drawWin(ctx, game) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#0d1a12');
  g.addColorStop(1, '#14261c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centerText(ctx, 'MUSEUM DIBOBOL!', 170, 56, '#39d98a');
  centerText(ctx, 'Wren keluar membawa Star Sapphire — dan tidak satu pun penjaga', 230, 19, '#d5dbe8', false);
  centerText(ctx, 'yang sempat melihat wajahnya.', 258, 19, '#d5dbe8', false);
  centerText(ctx, `Peringkat:  ${game.rank}`, 330, 34, '#f5b942');
  const t = Math.floor(game.totalTime);
  centerText(ctx, `Skor total  ${game.score}      Waktu  ${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}      Tertangkap  ${game.totalCaught}`, 400, 20, '#eef1f7', false);
  centerText(ctx, game.rankBlurb, 440, 16, '#9aa3b5', false);
  const hover = game.input.hover;
  const again = { id: 'again', x: VIEW_W / 2 - 110, y: 520, w: 220, h: 54 };
  drawButton(ctx, again, pointInButton(again, hover.x, hover.y), 'MAIN LAGI', { fontSize: 18, fill: '#f5b942' });
  return [again];
}

export function drawCaught(ctx, game) {
  ctx.fillStyle = 'rgba(120,10,10,0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centerText(ctx, 'TERTANGKAP!', VIEW_H / 2 - 20, 58, '#ff6b5e');
  centerText(ctx, 'Penjaga menemukanmu. Kembali ke pintu masuk…', VIEW_H / 2 + 40, 19, '#ffd9d4', false);
}
