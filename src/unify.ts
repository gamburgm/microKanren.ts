import { MultiEquation, TempMultiEquation, UnifiableList, VarWrap, UnifiableTerm, Symbol, UnifiableFun } from './types';

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

export function isList(t: UnifiableTerm): t is UnifiableList { return Array.isArray(t) && t.length === 2; }


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

export function reduce(M: UnifiableFun[]): [UnifiableTerm, TempMultiEquation[]] {
  if (M.length === 0) throw ERRORS.NO_TERMS; // ??? Should I be throwing?

  // what do you do about there being these mixed up?
  // no guarantee that they're all the same type or length
  if (isSym(M[0])) {
    if (!M.every((s: Symbol) => s === M[0])) throw ERRORS.SYM_MATCH;
    return [M[0], []];
  }

  // We know we have a UnifiableList
  if (!M.every((l: UnifiableList) => M[0][0] === l[0])) throw ERRORS.FUNC_MATCH;
  const tempMults: TempMultiEquation[] = matchTerms(M.map((l: UnifiableList) => l[1]));

  const cpArgs: UnifiableTerm[] = [];
  const frontiers: TempMultiEquation[] = [];

  for (let i = tempMults.length - 1; i >= 0; i--) {
    const tm = tempMults[i];
    if (tm.S.length === 0) {
      let [cpArg, frontier] = reduce(tm.M);
      cpArgs.push(cpArg);
      frontier.push(...frontier);
    } else {
      cpArgs.push(tm.S[0]);
      frontiers.push(tm);
    }
  }
    
  return [buildTerm(M[0][0], cpArgs), frontiers.reverse()];
}

export function buildTerm(fn: UnifiableTerm, args: UnifiableTerm[]): UnifiableTerm {
  if (args.length === 0) return fn;
  else {
    let BASE: UnifiableList = [];
    return args.reduceRight((l: UnifiableList, arg: UnifiableTerm) => {
      return [arg, l];
    }, BASE);
  }
}

// match up every Term in the list of Terms down to atomic units
export function matchTerms(listOfArgs: UnifiableList[]): TempMultiEquation[] {
  const temp: TempMultiEquation[] = [];
  while (listOfArgs[0].length > 0) {
    const tempMult: TempMultiEquation = { S: [], M: [] };

    listOfArgs.forEach((l: UnifiableList) => {
      if (l === []) throw ERRORS.DIFF_NO_ARGS;

      if (isWrappedVar(l[0])) tempMult.S.push(l[0]);
      else tempMult.M.push(l[0]);
    });

    temp.push(tempMult);
    listOfArgs = listOfArgs.map((l: UnifiableList) => l[1]);
  }

  return temp;
}
