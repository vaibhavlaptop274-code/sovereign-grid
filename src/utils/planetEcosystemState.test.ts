import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceAsteroidPhase,
  buildWeeklyCouncilTranscript,
  computeSectorDummyLevel,
  createInitialPlanetEcosystem,
  launchAsteroidOperation,
  logShopProgress,
  placeClanWarReward,
  trainArmyUnits,
} from './planetEcosystemState';

test('planetEcosystemState pure logic', async (t) => {
  await t.test('computes dummy levels above Earth and increments when progress is logged in Training Room', () => {
    const initial = createInitialPlanetEcosystem();
    const beforeLv = computeSectorDummyLevel('library', initial);
    assert.ok(beforeLv.level >= 12);

    const updated = logShopProgress(
      initial,
      'shop_mistakes',
      'Electrostatics Gauss Law Sign Error',
      24,
      'Fixed surface normal orientation',
    );
    const afterLv = computeSectorDummyLevel('library', updated);
    assert.equal(afterLv.level, beforeLv.level + 2); // +1 base level, +1 log entry
    assert.equal(updated.logs[0].title, 'Electrostatics Gauss Law Sign Error');
  });

  await t.test('trains army units and transitions asteroid from scouted -> 5m combat -> 5h-5d mining -> completed', () => {
    let state = createInitialPlanetEcosystem();
    const initialInfantry = state.army.infantry;

    state = trainArmyUnits(state, 'infantry', 20, 500);
    assert.equal(state.army.infantry, initialInfantry + 20);

    // Launch attack on Ceres-V (scouted) using army + engineers
    state = launchAsteroidOperation(state, 'ast_ceres', 30, 5);
    const ceresFighting = state.asteroids.find((a) => a.id === 'ast_ceres');
    assert.equal(ceresFighting?.status, 'fighting');
    assert.equal(ceresFighting?.assignedArmy, 30);
    assert.equal(ceresFighting?.assignedEngineers, 5);

    // Finish 5-min combat -> enters long mining phase
    state = advanceAsteroidPhase(state, 'ast_ceres');
    const ceresMining = state.asteroids.find((a) => a.id === 'ast_ceres');
    assert.equal(ceresMining?.status, 'mining');

    // Finish mining phase -> credits gold and minerals
    const goldBefore = state.goldReserve;
    const mineralBefore = state.mineralStore;
    state = advanceAsteroidPhase(state, 'ast_ceres');
    const ceresDone = state.asteroids.find((a) => a.id === 'ast_ceres');
    assert.equal(ceresDone?.status, 'completed');
    assert.ok(state.goldReserve > goldBefore);
    assert.ok(state.mineralStore > mineralBefore);
  });

  await t.test('places clan war rewards on main planet or any square and generates non-private weekly council transcript', () => {
    let state = createInitialPlanetEcosystem();
    const libBefore = computeSectorDummyLevel('library', state).level;

    state = placeClanWarReward(state, 'cw_banner', 'library');
    const libAfter = computeSectorDummyLevel('library', state).level;
    assert.equal(libAfter, libBefore + 2);

    const transcript = buildWeeklyCouncilTranscript('Gaia', state);
    assert.equal(transcript.length, 5);
    // Ensure private logged mistake titles do not leak into the weekly council meeting
    for (const line of transcript) {
      assert.equal(line.statement.includes('Calculus Sign Flip'), false);
    }
  });
});
