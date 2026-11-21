// map.js — tile grid: parsing, collision, light and shadow, line of sight.
//
// A level is an array of equal-length strings. One character per tile:
//   '#' wall            '.' floor           ',' shadow floor    '*' light pool
//   'D' display case    'S' statue          'P' pond            'E' entrance
//   'X' exit            'a' artifact        'o' coin            'v' vase
// Cases, statues and walls block movement and sight. The pond blocks
// movement only, so guards can still see across it. Vases, coins and
// artifacts sit on floor tiles and are read out as entities.

export const TILE = 40;
export const VIEW_W = 1280;
export const VIEW_H = 800;

const SOLID = new Set(['#', 'D', 'S', 'P']);
const SIGHT_BLOCKERS = new Set(['#', 'D', 'S']);

export function tileAt(grid, tx, ty) {
  if (ty < 0 || ty >= grid.length) return '#';
  const row = grid[ty];
  if (tx < 0 || tx >= row.length) return '#';
  return row[tx];
}

export function isSolidTile(ch) {
  return SOLID.has(ch);
}

export function blocksSightTile(ch) {
  return SIGHT_BLOCKERS.has(ch);
}

export function parseMap(rows) {
  const grid = rows.map((row) => row.split(''));
  const cols = grid[0].length;
  const found = { entrance: null, exit: null, artifacts: [], coins: [], vases: [] };
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < cols; x++) {
      const ch = grid[y][x];
      const cx = x * TILE + TILE / 2;
      const cy = y * TILE + TILE / 2;
      if (ch === 'E') found.entrance = { x: cx, y: cy, tx: x, ty: y };
      else if (ch === 'X') found.exit = { x: cx, y: cy, tx: x, ty: y };
      else if (ch === 'a') found.artifacts.push({ x: cx, y: cy, tx: x, ty: y, taken: false });
      else if (ch === 'o') found.coins.push({ x: cx, y: cy, tx: x, ty: y, taken: false });
      else if (ch === 'v') found.vases.push({ x: cx, y: cy, tx: x, ty: y, broken: false });
    }
  }
  return { grid, cols, rows: grid.length, ...found };
}

// Light at a world point: 'light' on a pool, 'shadow' in a dark zone, else 'normal'.
export function lightAt(grid, px, py) {
  const ch = tileAt(grid, Math.floor(px / TILE), Math.floor(py / TILE));
  if (ch === '*') return 'light';
  if (ch === ',') return 'shadow';
  return 'normal';
}

// True when the straight segment between two points crosses no sight blocker.
export function losClear(grid, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    if (blocksSightTile(tileAt(grid, Math.floor((x0 + dx * t) / TILE), Math.floor((y0 + dy * t) / TILE)))) {
      return false;
    }
  }
  return true;
}

// Cast one ray from (x, y) along angle until it hits a sight blocker or range.
export function castRay(grid, x, y, angle, range) {
  const step = 6;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  let d = step;
  while (d < range) {
    const px = x + cos * d;
    const py = y + sin * d;
    if (blocksSightTile(tileAt(grid, Math.floor(px / TILE), Math.floor(py / TILE)))) {
      return { x: px, y: py, dist: d };
    }
    d += step;
  }
  return { x: x + cos * range, y: y + sin * range, dist: range };
}

// Vision cone as a polygon: the eye point plus the raycast rim.
export function conePolygon(grid, x, y, angle, range, halfAngle, rays = 26) {
  const points = [{ x, y }];
  for (let i = 0; i <= rays; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / rays;
    const hit = castRay(grid, x, y, a, range);
    points.push({ x: hit.x, y: hit.y });
  }
  return points;
}

// Move a circle with sliding: try x then y so it slides along walls.
export function moveCircle(grid, x, y, dx, dy, r) {
  let nx = x;
  let ny = y;
  if (dx !== 0) {
    const tx = Math.floor((x + dx + Math.sign(dx) * r) / TILE);
    const tyTop = Math.floor((y - r + 1) / TILE);
    const tyBottom = Math.floor((y + r - 1) / TILE);
    let blocked = false;
    for (let ty = tyTop; ty <= tyBottom; ty++) {
      if (isSolidTile(tileAt(grid, tx, ty))) { blocked = true; break; }
    }
    if (!blocked) nx = x + dx;
    else {
      // Stop flush against the wall instead of sticking inside it.
      nx = dx > 0
        ? tx * TILE - r - 0.01
        : (tx + 1) * TILE + r + 0.01;
    }
  }
  if (dy !== 0) {
    const ty = Math.floor((y + dy + Math.sign(dy) * r) / TILE);
    const txLeft = Math.floor((nx - r + 1) / TILE);
    const txRight = Math.floor((nx + r - 1) / TILE);
    let blocked = false;
    for (let tx = txLeft; tx <= txRight; tx++) {
      if (isSolidTile(tileAt(grid, tx, ty))) { blocked = true; break; }
    }
    if (!blocked) ny = y + dy;
    else {
      ny = dy > 0
        ? ty * TILE - r - 0.01
        : (ty + 1) * TILE + r + 0.01;
    }
  }
  return { x: nx, y: ny };
}

export function circleHitsSolid(grid, x, y, r) {
  const tx0 = Math.floor((x - r) / TILE);
  const tx1 = Math.floor((x + r) / TILE);
  const ty0 = Math.floor((y - r) / TILE);
  const ty1 = Math.floor((y + r) / TILE);
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      if (isSolidTile(tileAt(grid, tx, ty))) return true;
    }
  }
  return false;
}
