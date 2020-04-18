import { selectMult, matchTerms, ERRORS, reduce, buildTerm } from '../src/unify';
import { MultiEquation, VarWrap, Var, UnifiableTerm, UnifiableList, UnifiableFun } from '../src/types';

const createVar = (v: Var): VarWrap => ({ name: v, mult: null });
const assignVar = (v: VarWrap, meq: MultiEquation): void => { v.mult = meq };

const buildMeq = (vars: VarWrap[], terms: UnifiableFun[], counter: number, erased: boolean): MultiEquation => {
  const meq: MultiEquation = { erased, S: { counter, vars }, M: terms };
  vars.forEach((v: VarWrap) => assignVar(v, meq));
  return meq;
};

const makeList = (...terms: UnifiableTerm[]): UnifiableList => {
  return terms.slice().reverse().reduce<UnifiableList>((u: UnifiableList, t: UnifiableTerm): UnifiableList => {
    return [t, u];
  }, []);
};

let VAR_ONE:   VarWrap;
let VAR_TWO:   VarWrap;
let VAR_THREE: VarWrap;
let VAR_FOUR:  VarWrap;
let VAR_FIVE:  VarWrap;
let VAR_SIX:   VarWrap;

beforeEach(() => {
  VAR_ONE = createVar(1);
  VAR_TWO = createVar(2);
  VAR_THREE = createVar(3);
  VAR_FOUR = createVar(4);
  VAR_FIVE = createVar(5);
  VAR_SIX = createVar(6);
});

describe('selectMult', () => {
  it('explodes if multiequation is empty', () => {
    expect(() => selectMult([])).toThrowError(ERRORS.NO_MULTS);
  });

  it('explodes if head erased', () => {
    const FIRST_MEQ = buildMeq([VAR_ONE, VAR_TWO], [makeList('a', VAR_THREE)], 0, false);
    const SECOND_MEQ = buildMeq([VAR_THREE, VAR_FOUR], ['x'], 1, true);

    expect(() => selectMult([FIRST_MEQ, SECOND_MEQ])).toThrowError(ERRORS.HEAD_INVALID);
  });

  it('explodes if references remain to head', () => {
    const FIRST_MEQ = buildMeq([VAR_ONE], [makeList('a', VAR_ONE)], 0, false);
    const SECOND_MEQ = buildMeq([VAR_TWO], ['x'], 1, false);

    expect(() => selectMult([FIRST_MEQ, SECOND_MEQ])).toThrowError(ERRORS.HEAD_INVALID);
  });

  it('explodes if everything but head erased', () => {
    const FIRST_MEQ = buildMeq([VAR_ONE], ['x'], 0, true);
    const SECOND_MEQ = buildMeq([VAR_TWO], ['y'], 0, false);

    expect(() => selectMult([FIRST_MEQ, SECOND_MEQ])).toThrowError(ERRORS.NONE_FOUND);
  });

  it('finds a good head', () => {
    const FIRST_MEQ = buildMeq([VAR_TWO], ['y'], 0, false);
    const SECOND_MEQ = buildMeq([VAR_ONE], ['x'], 0, false);

    expect(selectMult([FIRST_MEQ, SECOND_MEQ])).toEqual(FIRST_MEQ);
  });
});

describe('matchTerms', () => {
  it('blows up on unequal lengths of lists', () => {
    expect(() => matchTerms([makeList('a', VAR_ONE), makeList('a', VAR_ONE, VAR_TWO)])).toThrowError(ERRORS.DIFF_NO_ARGS);
  });

  it('succeeds on equal list lengths', () => {
    expect(matchTerms([makeList(VAR_ONE, 'b', 'c'), makeList('x', 'b', VAR_FIVE)])).toEqual([
      {
        S: [VAR_ONE],
        M: ['x'],
      },
      {
        S: [],
        M: ['b', 'b'],
      },
      {
        S: [VAR_FIVE],
        M: ['c'],
      },
    ]);
  });

  // NOTE: things are in the correct order now LOL
  it('succeeds on matching a single var against a pair', () => {
    expect(matchTerms([makeList(VAR_ONE), makeList(makeList('a', 'b'))])).toEqual([
      {
        S: [VAR_ONE],
        M: [makeList('a', 'b')]
      },
    ]);
  });

  it('succeeds on a greater number of equal-length lists', () => {
    expect(matchTerms([makeList(VAR_ONE, 'c', 'd'), makeList('x', VAR_TWO, VAR_THREE), makeList(VAR_THREE, VAR_FIVE, VAR_SIX)])).toEqual([
      {
        S: [VAR_ONE, VAR_THREE],
        M: ['x'],
      },
      {
        S: [VAR_TWO, VAR_FIVE],
        M: ['c'],
      },
      {
        S: [VAR_THREE, VAR_SIX],
        M: ['d'],
      },
    ]);
  });

  it('can store functions in arguments', () => {
    expect(matchTerms([makeList(makeList('x', 'y', 'z'), VAR_ONE), makeList(VAR_TWO, VAR_FOUR)])).toEqual([
      {
        S: [VAR_TWO],
        M: [makeList('x', 'y', 'z')]
      },
      {
        S: [VAR_ONE, VAR_FOUR],
        M: []
      },
    ]);
  });

  it('can store functions as the final argument in a list', () => {
    expect(matchTerms([makeList(makeList('x', 'y', 'z'), VAR_ONE), makeList(VAR_TWO, makeList('r', 'e', 'f'))])).toEqual([
      {
        S: [VAR_TWO],
        M: [makeList('x', 'y', 'z')]
      },
      {
        S: [VAR_ONE],
        M: [makeList('r', 'e', 'f')]
      },
    ]);
  });
});

describe('buildTerm', () => {
  it('just returns the function if no symbol', () => {
    expect(buildTerm('a', [])).toEqual('a');
  });

  it('constructs the proper term', () => {
    expect(buildTerm('a', ['d', 'c', 'b'])).toEqual(['a', ['b', ['c', ['d', []]]]]);
  });

  it('builds a simple function if only one arg', () => {
    expect(buildTerm('a', ['b'])).toEqual(['a', ['b', []]]);
  });
});

describe('reduce', () => {
  it('blows up when reducing a list of unequal symbols', () => {
    expect(() => reduce(['a', 'b'])).toThrowError(ERRORS.SYM_MATCH);
  });

  it('blows up on non-matching function symbols', () => {
    expect(() => reduce([makeList('a', 'b', 'c'), makeList('x', 'b', 'c')])).toThrowError(ERRORS.FUNC_MATCH);
  });

  it('blows up when there are no terms to reduce', () => {
    expect(() => reduce([])).toThrowError(ERRORS.NO_TERMS);
  });

  it('returns a proper reduction of symbols', () => {
    expect(reduce(['a', 'a'])).toEqual(['a', []]);
  });

  it('returns a proper reduction of functions', () => {
    expect(reduce([makeList('a', makeList('g', VAR_ONE, VAR_TWO), VAR_THREE), makeList('a', VAR_FOUR, VAR_THREE)])).toEqual([
      makeList('a', VAR_FOUR, VAR_THREE),
      [
        {
          S: [VAR_FOUR],
          M: [makeList('g', VAR_ONE, VAR_TWO)],
        },
        {
          S: [VAR_THREE, VAR_THREE],
          M: [],
        },
      ],
    ]);
  });

  it('enters the recursive reduce case', () => {
    expect(reduce([makeList('a', makeList('x', 'y'), VAR_TWO), makeList('a', makeList('x', VAR_ONE), VAR_TWO)])).toEqual([
      makeList('a', makeList('x', VAR_ONE), VAR_TWO),
      [
        {
          S: [VAR_ONE],
          M: ['y'],
        },
        {
          S: [VAR_TWO, VAR_TWO],
          M: []
        },
      ],
    ]);
  });
});
