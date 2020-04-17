import { selectMult, matchTerms, ERRORS, reduce, buildTerm } from '../src/unify';
import { MultiEquation, VarWrap, Var, UnifiableTerm } from '../src/types';

const createVar = (v: Var): VarWrap => ({ name: v, mult: null });
const assignVar = (v: VarWrap, meq: MultiEquation): void => { v.mult = meq };

const buildMeq = (vars: VarWrap[], terms: UnifiableTerm[], counter: number, erased: boolean): MultiEquation => {
  const meq: MultiEquation = { erased, S: { counter, vars }, M: terms };
  vars.forEach((v: VarWrap) => assignVar(v, meq));
  return meq;
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

describe.only('selectMult', () => {
  it('explodes if multiequation is empty', () => {
    expect(() => selectMult([])).toThrowError(ERRORS.NO_MULTS);
  });

  it('explodes if head erased', () => {
    const FIRST_MEQ = buildMeq([VAR_ONE, VAR_TWO], [VAR_THREE], 0, false);
    const SECOND_MEQ = buildMeq([VAR_THREE, VAR_FOUR], ['x'], 1, true);

    expect(() => selectMult([FIRST_MEQ, SECOND_MEQ])).toThrowError(ERRORS.HEAD_INVALID);
  });

  it('explodes if references remain to head', () => {
    const FIRST_MEQ = buildMeq([VAR_ONE], [VAR_ONE], 0, false);
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
    expect(() => matchTerms([['a', 1], ['a', [1, 2]]])).toThrowError(ERRORS.DIFF_NO_ARGS);
  });

  it('succeeds on equal list lengths', () => {
    expect(matchTerms([['a', [1, ['b', 'c']]], ['a', ['x', ['b', 5]]]])).toEqual([
      {
        S: [1],
        M: ['x'],
      },
      {
        S: [],
        M: ['b', 'b'],
      },
      {
        S: [5],
        M: ['c'],
      },
    ]);
  });

  it('succeeds on a greater number of equal-length lists', () => {
    expect(matchTerms([['a', [1, ['c', 'd']]], ['a', ['x', [2, 3]]], ['a', [3, [5, 6]]]])).toEqual([
      {
        S: [1, 3],
        M: ['x'],
      },
      {
        S: [2, 5],
        M: ['c'],
      },
      {
        S: [3, 6],
        M: ['d'],
      },
    ]);
  });

  it('can store functions in arguments', () => {
    expect(matchTerms([['a', [['x', ['y', 'z']], 1]], ['a', [2, 4]]])).toEqual([
      {
        S: [2],
        M: [['x', ['y', 'z']]],
      },
      {
        S: [1, 4],
        M: []
      },
    ]);
  });

  // this is IMPOSSIBLE to express with my data
  it('can store functions as the final argument in a list', () => {
    expect(matchTerms([['a', [['x', ['y', 'z']], 1]], ['a', [2, ['r', ['e', 'f']]]]])).toEqual([
      {
        S: [2],
        M: [['x', ['y', 'z']]],
      },
      {
        S: [1],
        M: [['r', ['e', 'f']]]
      },
    ]);
  });
});

describe('buildTerm', () => {
  it('just returns the function if no symbol', () => {
    expect(buildTerm('a', [])).toEqual('a');
  });

  it('constructs the proper term', () => {
    expect(buildTerm('a', ['d', 'c', 'b'])).toEqual(['a', ['b', ['c', 'd']]]);
  });

  it('builds a simple function if only one arg', () => {
    expect(buildTerm('a', ['b'])).toEqual(['a', 'b']);
  });
});

describe('reduce', () => {
  it('blows up when reducing a list of unequal symbols', () => {
    expect(() => reduce(['a', 'b'])).toThrowError(ERRORS.SYM_MATCH);
  });

  it('blows up on non-matching function symbols', () => {
    expect(() => reduce([['a', ['b', 'c']], ['x', ['b', 'c']]])).toThrowError(ERRORS.FUNC_MATCH);
  });

  it('blows up when there are no terms to reduce', () => {
    expect(() => reduce([])).toThrowError(ERRORS.NO_TERMS);
  });

  it('returns a proper reduction of symbols', () => {
    expect(reduce(['a', 'a'])).toEqual(['a', []]);
  });

  it('returns a proper reduction of functions', () => {
    expect(reduce([['a', [['g', [1, 2]], 3]], ['a', [4, 3]]])).toEqual([
      ['a', [4, 3]],
      [
        {
          S: [4],
          M: [['g', [1, 2]]],
        },
        {
          S: [3, 3],
          M: [],
        },
      ],
    ]);
  });

  it('enters the recursive reduce case', () => {
    expect(reduce([['a', [['x', 'y'], 2]], ['a', [['x', 1], 2]]])).toEqual([
      ['a', [['x', 1], 2]],
      [
        {
          S: [1],
          M: ['y'],
        },
        {
          S: [2, 2],
          M: []
        },
      ],
    ]);
  });


  // Other tests:
  // 1. the recursive reduce case
  // 2. ...
});
