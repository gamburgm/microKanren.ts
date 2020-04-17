import { MultiEquation, TempMultiEquation, UnifiablePair, VarWrap, UnifiableTerm } from './types';

export const ERRORS: Record<string, string> = {
  NO_MULTS:     'Error: No Multiequations remain!',
  HEAD_INVALID: 'Error: Head is either erased on has references to it!',
  NONE_FOUND:   'Error: No valid multiequations found!',
  DIFF_NO_ARGS: 'Error: arguments to functions have different lengths!',
  SYM_MATCH:    'Error: symbols don\'t match!',
  FUNC_MATCH:   'Error: function symbols don\' match!',
  NO_TERMS:     'Error: No terms to reduce!',
};

export function isWrappedVar(x: UnifiableTerm): x is VarWrap {
  x = x as VarWrap;
  return typeof x === 'object' && typeof x.name === 'number';
}

export function isSym(t: UnifiableTerm): t is string { return typeof t === 'string'; }

export function isPair(t: UnifiableTerm): t is UnifiablePair { return Array.isArray(t) && t.length === 2; }


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

export function reduce(M: UnifiableTerm[]): [UnifiableTerm, TempMultiEquation[]] {
  // must be either symbols or functions
  // if vars show up in reduce, you're boned, cuz it's always RHS.
  if (M.length === 0) throw ERRORS.NO_TERMS; // ???

  if (isSym(M[0])) {
    M.slice(1).forEach((t: UnifiableTerm) => { if (M[0] !== t) throw ERRORS.SYM_MATCH; });
    return [M[0], []];
  }

  // we know it's a function (read: pair)
  M.slice(1).forEach((t: UnifiableTerm) => { if (M[0][0] !== t[0]) throw ERRORS.FUNC_MATCH; });
  const tempMults: TempMultiEquation[] = matchTerms(M);

  const cpArgs: UnifiableTerm[] = [];
  const frontiers: TempMultiEquation[] = [];

  tempMults.slice().reverse().forEach((tm: TempMultiEquation) => {
    let cpArg: UnifiableTerm;
    let frontier: TempMultiEquation[];

    if (tm.S.length === 0) {
      [cpArg, frontier] = reduce(tm.M);
    } else {
      cpArg = tm.S[0];
      frontier = [tm];
    }

    cpArgs.push(cpArg);
    frontiers.push(...frontier);
  });

  return [buildTerm(M[0][0], cpArgs), frontiers.reverse()];
}

export function compact() {
}

export function buildTerm(fn: UnifiableTerm, args: UnifiableTerm[]): UnifiableTerm {
  if (args.length === 0) return fn;
  else if (args.length === 1) return [fn, args[0]];
  else {
    // Typescript can't tell that CP should be a valid Term because you have a list of length 2
    let cp: UnifiableTerm = args.slice().reverse().slice(args.length - 2) as UnifiablePair;
    cp = args.slice().reverse().slice(0, args.length - 2).reduce((newCp: UnifiableTerm, t: UnifiableTerm) => {
      return [t, newCp];
    }, cp);

    return [fn, cp];
  }
}

export function matchTerms(M: UnifiableTerm[]): TempMultiEquation[] {
  const temp: TempMultiEquation[] = [];
  let termsToMatch: UnifiableTerm[] = M;

  while (termsToMatch[0]) {
    termsToMatch = termsToMatch.map((t: UnifiableTerm) => t[1]);
    const seenPair = isPair(termsToMatch[0]);

    const tempMult: TempMultiEquation = { S: [], M: [] };

    termsToMatch.forEach((t: UnifiableTerm) => {
      if ((seenPair && !isPair(t)) || (!seenPair && isPair(t))) throw ERRORS.DIFF_NO_ARGS;
      if (isPair(t)) {
        if (isWrappedVar(t[0])) tempMult.S.push(t[0]);
        else tempMult.M.push(t[0]);
      }
      else {
        if (isWrappedVar(t)) tempMult.S.push(t);
        else tempMult.M.push(t);
      }
    });

    temp.push(tempMult);
    if (!seenPair) break;
  }

  return temp;
}
