import { selectMult, matchTerms, ERRORS } from '../src/unify';

describe('selectMult', () => {
  it('explodes if multiequation is empty', () => {
    expect(() => selectMult([])).toThrowError(ERRORS.NO_MULTS);
  });

  it('explodes if head erased', () => {
    expect(() => selectMult([
      { erased: false, S: { counter: 0, vars: [1, 2] }, M: [3] },
      { erased: true, S: { counter: 1, vars: [3, 4] }, M: ['x'] },
    ])).toThrowError(ERRORS.HEAD_INVALID);
  });

  it('explodes if references remain to head', () => {
    expect(() => selectMult([
      { erased: false, S: { counter: 0, vars: [1] }, M: [1] },
      { erased: false, S: { counter: 1, vars: [2] }, M: ['x'] },
    ])).toThrowError(ERRORS.HEAD_INVALID);
  });

  it('explodes if everything but head erased', () => {
    expect(() => selectMult([
      { erased: true, S: { counter: 0, vars: [1] }, M: ['x'] },
      { erased: false, S: { counter: 0, vars: [2] }, M: ['y'] },
    ])).toThrowError(ERRORS.NONE_FOUND);
  });

  it('finds a good head', () => {
    expect(selectMult([
      { erased: false, S: { counter: 0, vars: [2] }, M: ['y'] },
      { erased: false, S: { counter: 0, vars: [1] }, M: ['x'] },
    ])).toEqual({ erased: false, S: { counter: 0, vars: [2] }, M: ['y'] });
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
