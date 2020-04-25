import { U, MultiEquation } from './types';

export const ERRORS: Record<string, string> = {
  NO_MULTS: 'Error: No Multiequations to return!',
};

export function selectMultiEquation(U: U): MultiEquation {
  if (U.zeroCount.empty === true) throw ERRORS.NO_MULTS;

  const nextMult: MultiEquation = U.zeroCount.value;
  U.zeroCount = U.zeroCount.rest;
  U.meqNum -= 1;

  return nextMult;
}
