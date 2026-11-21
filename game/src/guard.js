// guard.js — museum guards: patrol routes, vision cones, a detection
// meter, and four states: patrol, suspicious, alert (chase) and search.
//
// The meter fills while the player is inside the cone with a clear line
// of sight: faster up close, in lamplight, and while the player walks;
// slower far away, in shadow, and while sneaking. It drains when the
// player leaves sight. Half full makes the guard curious and walk over
// to look; full makes him chase. A chase that loses the player turns
// into a search of the last seen spot, then a return to patrol.

import { TILE, moveCircle, losClear, lightAt, conePolygon } from './map.js';

export const GUARD_VIEW_RANGE = 200;
export const GUARD_HALF_ANGLE = 0.61; // ~35 degrees
export const GUARD_RADIUS = 14;
const PATROL_PAUSE = 1.1;
const SUSPICIOUS_AT = 0.5;
const ALERT_AT = 1.0;
const CHASE_SPEED = 188;
const INVESTIGATE_SPEED = 112;

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class Guard {
  constructor(def, index) {
    this.index = index;
    this.waypoints = def.waypoints.map(([tx, ty]) => ({
      x: tx * TILE + TILE / 2,
      y: ty * TILE + TILE / 2,
    }));
    this.patrolSpeed = def.speed || 72;
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.homeX = this.x;
    this.homeY = this.y;
    this.wpIndex = 1 % this.waypoints.length;
    this.facing = 0;
    this.state = 'patrol';
    this.meter = 0;
    this.pauseTimer = 0;
    this.scanPhase = Math.random() * Math.PI * 2;
    this.lastSeen = null;
    this.lastSeenAt = -99;
    this.investigateTarget = null;
    this.searchTimer = 0;
    this.stuckTimer = 0;
    this.prevX = this.x;
    this.prevY = this.y;
    this.time = 0;
  }

  reset() {
    this.x = this.waypoints[0].x;
    this.y = this.waypoints[0].y;
    this.wpIndex = 1 % this.waypoints.length;
    this.facing = 0;
    this.state = 'patrol';
    this.meter = 0;
    this.pauseTimer = 0;
    this.lastSeen = null;
    this.investigateTarget = null;
    this.searchTimer = 0;
    this.stuckTimer = 0;
  }

  // Does this guard currently see the player, and how fast does the
  // meter fill? Returns 0 when the player is not visible.
  seeRate(world) {
    const p = world.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > GUARD_VIEW_RANGE) return 0;
    // Very close: the guard notices the player even outside the cone.
    const inCone = dist < 28 || Math.abs(angleDiff(Math.atan2(dy, dx), this.facing)) < GUARD_HALF_ANGLE;
    if (!inCone) return 0;
    if (!losClear(world.map.grid, this.x, this.y, p.x, p.y)) return 0;
    let rate = 0.45 + (1 - dist / GUARD_VIEW_RANGE) * 1.05;
    const light = lightAt(world.map.grid, p.x, p.y);
    if (light === 'light') rate *= 1.6;
    else if (light === 'shadow') rate *= 0.45;
    if (p.sneaking) rate *= 0.55;
    else if (p.moving) rate *= 1.25;
    if (world.time < world.alarmUntil) rate *= 1.5;
    return rate;
  }

  hearNoise(x, y, radius) {
    if (this.state === 'alert') return;
    const d = Math.hypot(x - this.x, y - this.y);
    if (d > radius) return;
    this.becomeSuspicious({ x, y }, 0.45);
  }

  becomeSuspicious(target, meter = 0.5) {
    if (this.state === 'alert') return;
    if (this.state !== 'suspicious') {
      this.state = 'suspicious';
      this.investigateTarget = { x: target.x, y: target.y };
      this.searchTimer = 0;
    }
    this.meter = Math.max(this.meter, meter);
  }

  becomeAlert(world) {
    if (this.state === 'alert') return;
    this.state = 'alert';
    this.meter = 1;
    this.lastSeen = { x: world.player.x, y: world.player.y };
    this.lastSeenAt = world.time;
    world.audio.alert();
    world.alarmUntil = world.time + 6;
    world.onAlarmRaised();
  }

  moveToward(world, tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 3) return true;
    const step = Math.min(dist, speed * dt);
    const moved = moveCircle(world.map.grid, this.x, this.y, (dx / dist) * step, (dy / dist) * step, GUARD_RADIUS);
    this.x = moved.x;
    this.y = moved.y;
    this.facing = Math.atan2(dy, dx);
    return dist - step < 3;
  }

  update(dt, world) {
    this.time = world.time;
    const p = world.player;

    // Vision: fill or drain the meter.
    const rate = this.seeRate(world);
    if (rate > 0) {
      this.meter = Math.min(1, this.meter + rate * dt);
      if (this.meter >= ALERT_AT) {
        this.becomeAlert(world);
      } else if (this.meter >= SUSPICIOUS_AT && this.state === 'patrol') {
        this.becomeSuspicious({ x: p.x, y: p.y });
        world.audio.suspicious();
      }
      if (this.state === 'alert') {
        this.lastSeen = { x: p.x, y: p.y };
        this.lastSeenAt = world.time;
      }
    } else if (this.state !== 'alert') {
      this.meter = Math.max(0, this.meter - 0.3 * dt);
    }

    // Unstick check while chasing or investigating.
    const movedDist = Math.hypot(this.x - this.prevX, this.y - this.prevY);
    if ((this.state === 'alert' || this.state === 'suspicious') && movedDist < 2 * dt && this.meter > 0) {
      this.stuckTimer += dt;
    } else {
      this.stuckTimer = 0;
    }
    this.prevX = this.x;
    this.prevY = this.y;

    switch (this.state) {
      case 'patrol': {
        if (this.pauseTimer > 0) {
          this.pauseTimer -= dt;
          // Look around while waiting at a waypoint.
          this.facing += Math.sin(this.time * 1.4 + this.scanPhase) * 0.35 * dt;
          break;
        }
        const wp = this.waypoints[this.wpIndex];
        if (this.moveToward(world, wp.x, wp.y, this.patrolSpeed, dt)) {
          this.pauseTimer = PATROL_PAUSE;
          this.wpIndex = (this.wpIndex + 1) % this.waypoints.length;
        }
        break;
      }
      case 'suspicious': {
        const target = this.investigateTarget;
        if (!target) { this.state = 'patrol'; break; }
        if (this.moveToward(world, target.x, target.y, INVESTIGATE_SPEED, dt) || this.stuckTimer > 1.2) {
          this.searchTimer += dt;
          this.facing += Math.sin(this.time * 2.2) * 1.4 * dt;
          if (this.searchTimer > 2.5) {
            this.state = 'return';
            this.meter = Math.max(0.25, this.meter - 0.5);
            this.investigateTarget = null;
          }
        }
        break;
      }
      case 'alert': {
        if (this.lastSeen && world.time - this.lastSeenAt < 2.5) {
          this.moveToward(world, p.x, p.y, CHASE_SPEED, dt);
        } else {
          this.state = 'search';
          this.searchTimer = 0;
        }
        if (this.stuckTimer > 1.0) {
          this.state = 'search';
          this.searchTimer = 0;
        }
        // Catching the player.
        if (Math.hypot(p.x - this.x, p.y - this.y) < GUARD_RADIUS + 15) {
          world.onCaught(this);
        }
        break;
      }
      case 'search': {
        if (this.lastSeen && this.moveToward(world, this.lastSeen.x, this.lastSeen.y, INVESTIGATE_SPEED, dt)) {
          this.searchTimer += dt;
          this.facing += Math.sin(this.time * 2.0) * 1.6 * dt;
          if (this.searchTimer > 3) {
            this.state = 'return';
            this.meter = 0.3;
          }
        }
        break;
      }
      case 'return': {
        // Walk back to the nearest waypoint, then resume the route.
        let best = 0;
        let bestD = Infinity;
        this.waypoints.forEach((wp, i) => {
          const d = Math.hypot(wp.x - this.x, wp.y - this.y);
          if (d < bestD) { bestD = d; best = i; }
        });
        const wp = this.waypoints[best];
        if (this.moveToward(world, wp.x, wp.y, this.patrolSpeed, dt)) {
          this.wpIndex = (best + 1) % this.waypoints.length;
          this.state = 'patrol';
        }
        break;
      }
      default:
        break;
    }
  }

  conePoints(world) {
    return conePolygon(world.map.grid, this.x, this.y, this.facing, GUARD_VIEW_RANGE, GUARD_HALF_ANGLE);
  }
}
