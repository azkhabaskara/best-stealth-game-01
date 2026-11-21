// camera.js — ceiling security cameras (levels two and three).
//
// A camera sweeps its vision cone back and forth and cannot be switched
// off: the player times the sweep. Its detection meter fills like a
// guard's, slower in shadow and while sneaking. When the meter fills,
// the alarm sounds and the nearest guard comes to check the spot, then
// the camera needs a few seconds before it can trigger again.

import { TILE, losClear, lightAt, conePolygon } from './map.js';

export const CAMERA_RANGE = 230;
export const CAMERA_HALF_ANGLE = 0.5; // ~29 degrees

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class SecurityCamera {
  constructor(def) {
    this.x = def.tx * TILE + TILE / 2;
    this.y = def.ty * TILE + TILE / 2;
    this.baseAngle = def.baseAngle || 0;
    this.sweep = def.sweep || 1.0;
    this.speed = def.speed || 0.5;
    this.phase = def.phase || 0;
    this.angle = this.baseAngle;
    this.meter = 0;
    this.cooldown = 0;
    this.alarmFlash = 0;
  }

  reset() {
    this.meter = 0;
    this.cooldown = 0;
    this.alarmFlash = 0;
  }

  update(dt, world) {
    this.angle = this.baseAngle + Math.sin(world.time * this.speed + this.phase) * this.sweep;
    if (this.cooldown > 0) this.cooldown -= dt;
    if (this.alarmFlash > 0) this.alarmFlash -= dt;

    const p = world.player;
    const dx = p.x - this.x;
    const dy = p.y - this.y;
    const dist = Math.hypot(dx, dy);
    let rate = 0;
    if (dist < CAMERA_RANGE && this.cooldown <= 0) {
      const inCone = Math.abs(angleDiff(Math.atan2(dy, dx), this.angle)) < CAMERA_HALF_ANGLE;
      if (inCone && losClear(world.map.grid, this.x, this.y, p.x, p.y)) {
        rate = 0.35 + (1 - dist / CAMERA_RANGE) * 0.55;
        const light = lightAt(world.map.grid, p.x, p.y);
        if (light === 'light') rate *= 1.5;
        else if (light === 'shadow') rate *= 0.5;
        if (p.sneaking) rate *= 0.7;
        else if (p.moving) rate *= 1.2;
      }
    }
    if (rate > 0) {
      this.meter = Math.min(1, this.meter + rate * dt);
      if (this.meter >= 1) {
        this.meter = 0.5;
        this.cooldown = 4;
        this.alarmFlash = 1.2;
        world.audio.alert();
        world.alarmUntil = world.time + 6;
        world.onCameraAlarm(this, { x: p.x, y: p.y });
      }
    } else {
      this.meter = Math.max(0, this.meter - 0.25 * dt);
    }
  }

  conePoints(world) {
    return conePolygon(world.map.grid, this.x, this.y, this.angle, CAMERA_RANGE, CAMERA_HALF_ANGLE);
  }
}
