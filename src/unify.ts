import { System, MultiEquation, TempMultiEquation, Term, Var } from './types';
import { isSym, isVar, isPair } from './microKanren';

export const ERRORS: Record<string, string> = {
  NO_MULTS: 'Error: No Multiequations remain!',
  HEAD_INVALID: 'Error: Head is either erased on has references to it!',
  NONE_FOUND: 'Error: No valid multiequations found!',
  DIFF_NO_ARGS: 'Error: arguments to functions have different lengths!',
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
  const tempMults: TempMultiEquation[] = matchTerms(M);

  let cpArgs: Term;
  let frontiers: TempMultiEquation[] = [];
  // I think I need to go back to front
  tempMults.reverse().forEach((tm: TempMultiEquation) => {
    let cpArg: Term;
    let frontier: TempMultiEquation[];

    if (tm.S.length === 0) {
      [cpArg, frontier] = reduce(tm.M);
    } else {
      cpArg = tm.S[0];
      frontier = [tm];
    }

    cpArgs = [cpArg, cpArgs];
    frontiers = frontiers.concat(frontier);
  });

  return [[M[0][0], cpArgs], frontiers];
}

export function matchTerms(M: Term[]): TempMultiEquation[] {
  const temp: TempMultiEquation[] = [];
  let termsToMatch: Term[] = M;

  while (termsToMatch[0]) {
    termsToMatch = termsToMatch.map((t: Term) => t[1]);
    const seenPair = isPair(termsToMatch[0]);

    const tempMult: TempMultiEquation = { S: [], M: [] };

    termsToMatch.forEach((t: Term) => {
      if ((seenPair && !isPair(t)) || (!seenPair && isPair(t))) throw ERRORS.DIFF_NO_ARGS;
      if (isPair(t)) {
        if (isVar(t[0])) tempMult.S.push(t[0]);
        else tempMult.M.push(t[0]);
      }
      else {
        if (isVar(t)) tempMult.S.push(t);
        else tempMult.M.push(t);
      }
    });

    temp.push(tempMult);
    if (!seenPair) break;
  }

  return temp;
}

// 1. make sure all the top-level terms in M agree (and same # of args)
// 2. if so, then take each sequence of args, divide them, and push onto a list
// 3. while this list is not empty:
//    a. common part is one of the vars
//    b. frontier is the whole thing
//    c. add this common part and frontier to respective lists
//    CAVEAT: if vars empty, then reduce the terms
// 4. append the agreed-upon function onto the term, return that and the frontier

