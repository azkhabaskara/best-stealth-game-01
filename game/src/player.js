// player.js — Wren, the hooded thief: movement, collision, sneaking,
// footsteps that guards can hear, knocking over vases, picking things up.

import { moveCircle, TILE } from './map.js';

export const PLAYER_RADIUS = 13;
export const WALK_SPEED = 152;
export const SNEAK_SPEED = 76;

export class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = PLAYER_RADIUS;
    this.facing = 0;
    this.moving = false;
    this.sneaking = false;
    this.stepTimer = 0;
    this.bobPhase = 0;
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.facing = 0;
    this.moving = false;
    this.sneaking = false;
    this.stepTimer = 0;
  }

  update(dt, input, world) {
    const vec = input.moveVector();
    this.sneaking = input.sneaking;
    this.moving = vec.x !== 0 || vec.y !== 0;
    if (this.moving) {
      this.facing = Math.atan2(vec.y, vec.x);
      this.bobPhase += dt * (this.sneaking ? 7 : 11);
      const speed = this.sneaking ? SNEAK_SPEED : WALK_SPEED;
      const moved = moveCircle(world.map.grid, this.x, this.y, vec.x * speed * dt, vec.y * speed * dt, this.radius);
      this.x = moved.x;
      this.y = moved.y;

      // Footsteps: walking is audible nearby, sneaking almost silent.
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.sneaking ? 0.55 : 0.42;
        const nearest = world.nearestGuardDist(this.x, this.y);
        world.audio.step(nearest, this.sneaking);
        if (!this.sneaking) world.emitNoise(this.x, this.y, 105);
        else world.emitNoise(this.x, this.y, 16);
      }
    }

    // Knocking into a vase topples it: a loud crash guards hear far away.
    for (const vase of world.vases) {
      if (vase.broken) continue;
      const d = Math.hypot(this.x - vase.x, this.y - vase.y);
      if (d < this.radius + 15) {
        vase.broken = true;
        world.audio.shatter();
        world.onVaseBroken(vase);
      }
    }

    // Walking over an artifact or a coin picks it up.
    for (const art of world.artifacts) {
      if (!art.taken && Math.hypot(this.x - art.x, this.y - art.y) < this.radius + 18) {
        art.taken = true;
        world.audio.chime(true);
        world.onArtifactTaken(art);
      }
    }
    for (const coin of world.coins) {
      if (!coin.taken && Math.hypot(this.x - coin.x, this.y - coin.y) < this.radius + 14) {
        coin.taken = true;
        world.audio.chime(false);
        world.onCoinTaken(coin);
      }
    }
  }

  tilePos() {
    return { tx: Math.floor(this.x / TILE), ty: Math.floor(this.y / TILE) };
  }
}
