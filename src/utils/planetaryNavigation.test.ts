import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeEquineBiomechanics,
  computeSphericalBasis,
  evaluateShaderMatchedElevation,
  latLonToNormal,
  stepSphericalRider,
  type SphericalRiderState,
} from './planetaryNavigation';

describe('planetaryNavigation pure logic', () => {
  it('computes unit orthonormal basis vectors on the sphere surface', () => {
    const basis = computeSphericalBasis(0.25, -0.4, 0.6);
    const normLen = Math.hypot(basis.normal.x, basis.normal.y, basis.normal.z);
    const fwdLen = Math.hypot(basis.forward.x, basis.forward.y, basis.forward.z);
    const rightLen = Math.hypot(basis.right.x, basis.right.y, basis.right.z);

    assert.ok(Math.abs(normLen - 1.0) < 1e-6, 'normal should be unit length');
    assert.ok(Math.abs(fwdLen - 1.0) < 1e-6, 'forward should be unit length');
    assert.ok(Math.abs(rightLen - 1.0) < 1e-6, 'right should be unit length');

    // Dot products between normal, forward, and right should be ~0
    const dotNF =
      basis.normal.x * basis.forward.x +
      basis.normal.y * basis.forward.y +
      basis.normal.z * basis.forward.z;
    const dotNR =
      basis.normal.x * basis.right.x +
      basis.normal.y * basis.right.y +
      basis.normal.z * basis.right.z;
    const dotFR =
      basis.forward.x * basis.right.x +
      basis.forward.y * basis.right.y +
      basis.forward.z * basis.right.z;

    assert.ok(Math.abs(dotNF) < 1e-6, 'normal and forward must be orthogonal');
    assert.ok(Math.abs(dotNR) < 1e-6, 'normal and right must be orthogonal');
    assert.ok(Math.abs(dotFR) < 1e-6, 'forward and right must be orthogonal');
  });

  it('evaluates deterministic continuous land and ocean elevations across the sphere', () => {
    // Spawn point near (lat=0.15, lon=0) is guaranteed fertile land
    const spawnNormal = latLonToNormal(0.15, 0.0);
    const spawnEval = evaluateShaderMatchedElevation(
      spawnNormal.x,
      spawnNormal.y,
      spawnNormal.z,
      28,
      0,
    );
    assert.ok(spawnEval.elevation > 0, 'spawn location should be above sea level');
    assert.equal(spawnEval.isWater, false);
    assert.ok(spawnEval.surfaceRadius > 28, 'land surface radius should include vertex displacement');

    // Sample 120 points across the sphere to verify continuous land + ocean mix
    let landCount = 0;
    let oceanCount = 0;
    for (let i = 0; i < 120; i++) {
      const lat = ((i / 120) - 0.5) * Math.PI * 0.85;
      const lon = (i * 2.39996) % (Math.PI * 2) - Math.PI;
      const n = latLonToNormal(lat, lon);
      const ev = evaluateShaderMatchedElevation(n.x, n.y, n.z, 28, 0);
      if (ev.isWater) oceanCount++;
      else landCount++;
    }
    assert.ok(landCount > 50, `expected majority land mass, got ${landCount}/120`);
    assert.ok(oceanCount > 5, `expected ocean basins present, got ${oceanCount}/120`);
  });

  it('advances horse and rider along the spherical surface and updates gait phase and jump', () => {
    const initial: SphericalRiderState = {
      lat: 0.15,
      lon: 0.0,
      heading: 0.2,
      speed: 0,
      gaitPhase: 0,
      jumpOffset: 0,
      jumpVel: 0,
    };

    const stepped = stepSphericalRider(
      initial,
      { forward: 1, turn: 0.3, gallop: true, jump: true },
      0.05,
      28,
      0,
    );

    assert.ok(stepped.nextState.speed > 0, 'speed should increase when moving forward');
    assert.ok(stepped.nextState.heading > initial.heading, 'heading should turn right');
    assert.ok(stepped.nextState.gaitPhase > 0, 'gaitPhase should advance while moving');
    assert.ok(stepped.nextState.jumpOffset > 0, 'jump should lift rider above surface');

    const distFromOrigin = Math.hypot(stepped.position.x, stepped.position.y, stepped.position.z);
    assert.ok(distFromOrigin > 28, '3D position should sit above base sphere radius');
  });

  it('computes equine biomechanics for natural walk, gallop, whinnying rear, and jump arc', () => {
    const walkState = computeEquineBiomechanics({
      speedAbs: 4.5,
      gallop: false,
      gaitPhase: 1.2,
      jumpOffset: 0,
      jumpVel: 0,
      whinnyTimeRemaining: 0,
    });
    assert.ok(walkState.moveFactor > 0.3, 'walk should produce positive moveFactor');
    assert.equal(walkState.gallopBlend, 0, 'walk should have 0 gallopBlend');

    const gallopState = computeEquineBiomechanics({
      speedAbs: 10.5,
      gallop: true,
      gaitPhase: 2.4,
      jumpOffset: 0,
      jumpVel: 0,
      whinnyTimeRemaining: 0,
    });
    assert.ok(gallopState.gallopBlend > 0.8, 'gallop should activate high gallopBlend');

    const whinnyState = computeEquineBiomechanics({
      speedAbs: 0,
      gallop: false,
      gaitPhase: 0,
      jumpOffset: 0,
      jumpVel: 0,
      whinnyTimeRemaining: 0.9,
      whinnyDuration: 1.8,
    });
    assert.ok(whinnyState.whinnyIntensity > 0.9, 'mid-whinny should reach peak intensity');
    assert.ok(whinnyState.rearAngleRad > 0.4, 'whinny should rear horse upward on hind legs');
    assert.ok(whinnyState.saddleHeightY > 1.15, 'saddle should rise during whinny rear');

    const jumpApex = computeEquineBiomechanics({
      speedAbs: 6.0,
      gallop: false,
      gaitPhase: 1.0,
      jumpOffset: 0.85,
      jumpVel: 0.0,
      whinnyTimeRemaining: 0,
    });
    assert.ok(jumpApex.jumpArc > 0.4 && jumpApex.jumpArc < 0.6, 'apex of jump should be near 0.5 arc');
  });
});

