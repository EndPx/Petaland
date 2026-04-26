/**
 * processEvent — the central reducer.
 *
 * THE core pattern from Sunflower Land. Every gameplay action goes
 * through this function. Pure: same code runs on client (instant
 * UI feedback) and server (authority). They cannot diverge because
 * it is literally the same code.
 *
 * Constraints (read carefully):
 *   - PURE: no Math.random() without seed in action, no Date.now() — pass `now` in
 *   - Throws on invalid input — the throw IS the validation
 *   - Returns NEW state, never mutates
 *   - After every action, runs `checkProgress()` to enforce hoard limits
 *
 * Usage on client:
 *   try {
 *     const next = processEvent(state, { type: 'PLACE_TILE', ... }, Date.now());
 *     setState(next);          // optimistic
 *     await sendTransaction(); // confirm
 *   } catch (err) {
 *     showToast(err.message);  // rolled back implicitly (state unchanged)
 *   }
 *
 * Usage on server: identical, but server's `next` is the authoritative
 * state that gets written to Postgres + broadcast via WebSocket.
 */

import type { Action, PlotState } from './types';
import { checkProgress } from './hoardLimits';
import {
  handlePlaceTile,
  handleRemoveTile,
  handleMoveTile,
  handleExpandPlot,
  handleGainItem,
  handleSpendItem,
  handleGainSilver,
  handleSpendSilver,
  handleGainPetal,
  handleSpendPetal,
  handleGainXp,
  handleConsumeEnergy,
  handleRestoreEnergy,
} from './events';

/**
 * Runs `action` against `state`, validates the result, and returns
 * the new state. Throws on any validation failure.
 *
 * @param state    Current plot state
 * @param action   Typed action (the `type` discriminates the handler)
 * @param now      Current timestamp (ms) — passed in to keep this pure
 * @returns        New PlotState (input state is unchanged)
 * @throws         Error with descriptive message on validation failure
 */
export function processEvent(
  state: PlotState,
  action: Action,
  now: number,
): PlotState {
  let next: PlotState;

  switch (action.type) {
    case 'PLACE_TILE':
      next = handlePlaceTile(state, action, now);
      break;
    case 'REMOVE_TILE':
      next = handleRemoveTile(state, action, now);
      break;
    case 'MOVE_TILE':
      next = handleMoveTile(state, action, now);
      break;
    case 'EXPAND_PLOT':
      next = handleExpandPlot(state, now);
      break;
    case 'GAIN_ITEM':
      next = handleGainItem(state, action, now);
      break;
    case 'SPEND_ITEM':
      next = handleSpendItem(state, action, now);
      break;
    case 'GAIN_SILVER':
      next = handleGainSilver(state, action, now);
      break;
    case 'SPEND_SILVER':
      next = handleSpendSilver(state, action, now);
      break;
    case 'GAIN_PETAL':
      next = handleGainPetal(state, action, now);
      break;
    case 'SPEND_PETAL':
      next = handleSpendPetal(state, action, now);
      break;
    case 'GAIN_XP':
      next = handleGainXp(state, action, now);
      break;
    case 'CONSUME_ENERGY':
      next = handleConsumeEnergy(state, action, now);
      break;
    case 'RESTORE_ENERGY':
      next = handleRestoreEnergy(state, action, now);
      break;
    default: {
      // Exhaustive check — TS will complain if a new action type isn't handled
      const _exhaustive: never = action;
      throw new Error(`Unhandled action type: ${JSON.stringify(_exhaustive)}`);
    }
  }

  // Hoard-limit check — anti-cheat, runs after every successful transition
  checkProgress(state, next);

  return next;
}
