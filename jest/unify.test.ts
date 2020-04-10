import { selectMult, ERRORS } from '../src/unify';

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
