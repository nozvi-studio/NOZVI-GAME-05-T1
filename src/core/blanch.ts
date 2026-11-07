import balance from '../../config/balance.json';

import type { Grade } from './types';

export type BlanchGrade = Grade;

export interface BlanchConfig {
  idealSeconds: number;
  perfectToleranceSeconds: number;
  goodToleranceSeconds: number;
}

// MEC-001: grade the noodle-blanching step by how close the hold time is to the ideal.
export function gradeBlanch(heldSeconds: number, config: BlanchConfig = balance.blanch): BlanchGrade {
  const error = Math.abs(heldSeconds - config.idealSeconds);
  if (error <= config.perfectToleranceSeconds) return 'perfect';
  if (error <= config.goodToleranceSeconds) return 'good';
  return 'bad';
}
