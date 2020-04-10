import { System, MultiEquation, TempMultiEquation, Term, Var } from './types';
import { isSym, isVar } from './microKanren';

export const ERRORS: Record<string, string> = {
  NO_MULTS: 'Error: No Multiequations remain!',
  HEAD_INVALID: 'Error: Head is either erased on has references to it!',
  NONE_FOUND: 'Error: No valid multiequations found!',
};

// Select the next MultiEquation to reduce
export function selectMult(U: MultiEquation[]): MultiEquation {
  if (U.length === 0) throw ERRORS.NO_MULTS;
  let headOfList: number = U.length - 1;
  // WHY?
  if (U[headOfList].erased === true || U[headOfList].S.counter !== 0) throw ERRORS.HEAD_INVALID;
  // WHY?
  U[headOfList].erased = true;

  while (headOfList >= 0 && U[headOfList].erased) {
    headOfList -= 1;
  }

  if (headOfList < 0) throw ERRORS.NONE_FOUND;
  return U[headOfList];
}

export function reduce(M: Term[]): [Term, TempMultiEquation[]] {
  // must be either symbols or functions
  // if vars show up in reduce, you're boned, cuz it's always RHS.
  if (M.length === 0) throw 'WTF'; // ???

  if (isSym(M[0])) {
    M.slice(1).forEach((t: Term) => { if (M[0] !== t) throw 'BAD'; });
    return [M[0], []];
  }

  // we know it's a function (read: pair)
  M.slice(1).forEach((t: Term) => { if (M[0][0] !== t[0]) throw 'BAD'; });
  const tempMults: TempMultiEquation[] = [];
  const functionArgs: Term[] = M.map((t: Term) => t[0]);

  while (functionArgs[0]) {
    const tempMult: TempMultiEquation = { S: [], M: [] };
    functionArgs.forEach((t: Term, idx: number) => {
      const arg: Term = t[0];
      if (isVar(arg)) {
        tempMult.S.push(arg);
      } else { 
        tempMult.M.push(arg);
      }
      // functionArgs[idx] = functionArgs[idx][1];
      // TODO WHY IS THIS FUCKING WITH MY LINTING?
    });
    tempMults.push(tempMult);
  }
}

// 1. make sure all the top-level terms in M agree (and same # of args)
// 2. if so, then take each sequence of args, divide them, and push onto a list
// 3. while this list is not empty:
//    a. common part is one of the vars
//    b. frontier is the whole thing
//    c. add this common part and frontier to respective lists
//    CAVEAT: if vars empty, then reduce the terms
// 4. append the agreed-upon function onto the term, return that and the frontier

