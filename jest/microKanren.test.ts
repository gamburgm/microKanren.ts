import { Substitution, Var } from '../src/types';
import { find, assv, occurs, ext_s, unify, equality, call_fresh, disj, conj } from '../src/microKanren';

// Constants/Data Examples
const sub0: Substitution = [];
const sub1: Substitution = [[0, 'a']];
const sub2: Substitution = [[1, 'b']];
const sub3: Substitution = [[1, 'a'], [0, 'b']];
const sub4: Substitution = [[1, 0], [0, 'a']];

describe('assv', () => {
  it('returns false on empty', () => {
    expect(assv(3, [])).toEqual(false);
  });

  it('returns false if not found', () => {
    expect(assv(3, [[1, 'a'], [2, 1]])).toEqual(false);
  });

  it('returns a pair if value found', () => {
    expect(assv(3, [[0, 'g'], [3, 4], [4, 'a']])).toEqual([3, 4]);
  });
});

describe('find', () => {
  it('returns the variable', () => {
    expect(find(5, sub0)).toEqual(5);
  });

  it('returns the variable if nothing found', () => {
    expect(find(5, sub1)).toEqual(5);
  });

  it('returns the value it finds', () => {
    expect(find(1, sub2)).toEqual('b');
  });

  it('returns the value it deeply maps to', () => {
    expect(find(1, sub4)).toEqual('a');
  });
});

describe('occurs', () => {
  it('returns false if t is a non-pair value', () => {
    expect(occurs(5, 'x', [])).toEqual(false);
  });

  it('returns true if the var and the term are the same', () => {
    expect(occurs(5, 5, [])).toEqual(true);
  });

  it('returns false if the term is a pair that does not map to anything', () => {
    expect(occurs(5, [0, 'a'], [])).toEqual(false);
  });

  it('returns true if the latter value of a pair maps to the correct thing', () => {
    expect(occurs(5, [3, 5], [])).toEqual(true);
  });

  // why is this the case?
  it('returns true if the former value of a pair maps to the correct thing but the latter does not', () => {
    expect(occurs(5, [5, 3], [])).toEqual(true);
  });

  it('resolves the value of the terms', () => {
    expect(occurs(5, [1, 2], [[1, 'b'], [2, 5]])).toEqual(true);
  });

  it('resolves the value of the terms deeply', () => {
    expect(occurs(3, [1, 'a'], [[1, 0], [0, 3]])).toEqual(true);
  });
});

describe('ext_s', () => {
  it('returns false if variable in the term', () => {
    expect(ext_s(5, 5, [])).toEqual(false);
  });

  it('returns a new substitution if variable not in term', () => {
    expect(ext_s(5, [1, 2], [])).toEqual([[5, [1, 2]]]);
  });
});

describe('unify', () => {
  it('returns existing substitution if the terms are identical', () => {
    expect(unify(5, 5, [[0, 'a']])).toEqual([[0, 'a']]);
    expect(unify([1, 2], [1, 2], [[0, 'a']])).toEqual([[0, 'a']]);
    expect(unify('a', 'a', [[0, 'a']])).toEqual([[0, 'a']]);
  });

  it('extends the substitution if one is only a var', () => {
    const theVar: Var = 5;
    expect(unify(theVar, 'a', [])).toEqual([[theVar, 'a']]);
  });

  it('assigns the latter var to the former term', () => {
    const theVar: Var = 6;
    expect(unify('b', theVar, [])).toEqual([[theVar, 'b']]);
  });

  // possible pair examples:
  // 1. nested pairs
  // 2. pairs that just don't match
  // 3. pairs that match straight up
  // 4. pairs that need lookups to match
  it('does not unify a pair that does not match', () => {
    expect(unify(['a', 'b'], ['c', 'd'], [])).toEqual(false);
  });

  it('does not unify a pair that cannot be unified', () => {
    expect(unify([1, 'a'], ['b', 'c'], [])).toEqual(false);
  });

  it('does unify a pair with exactly correct values', () => {
    expect(unify(['a', 'b'], ['a', 'b'], [])).toEqual([]);
  });

  it('does unify a pair with overlapping values', () => {
    expect(unify([1, 'b'], ['a', 0], [])).toEqual([[1, 'a'], [0, 'b']]);
  });

  // another interesting example: numbers that match each other

  // unify ['a', 'b', 'c', 4, 5], [1, 2, 'c', 'd', 'e']
  // underlying array: ['a', 'b', 'c', 'd', 'e']
  it('does crazy stuff', () => {
    expect(unify(['a', ['b', ['c', [4, 5]]]], [1, [2, ['c', ['d', 'e']]]], [])).toEqual([[1, 'a'], [2, 'b'], [4, 'd'], [5, 'e']]);
  });

  it('skips values that it knows are equivalent', () => {
    expect(unify(['a', ['b', [3, [4, 5]]]], [1, [2, [3, ['d', 'e']]]], [])).toEqual([[1, 'a'], [2, 'b'], [4, 'd'], [5, 'e']]);
  });

  it('unifies with a lookup', () => {
    expect(unify([1, 'a'], [2, 'a'], [[2, 1]])).toEqual([[2, 1]]);
  });
});

describe('equality', () => {
  it('does not declare a solution for a false equivalence', () => {
    expect(equality(false, 'a')([[], 0])).toEqual(null);
  });

  it('equates two equivalent symbols', () => {
    expect(equality('a', 'a')([[], 0])).toEqual([[[], 0]]);
  });

  it('equates a variable with a symbol', () => {
    expect(equality('a', 5)([[], 0])).toEqual([[[[5, 'a']], 0]]);
  });

  it('equates two equivalent pairs', () => {
    expect(equality(['a', 'b'], ['a', 'b'])([[], 0])).toEqual([[[], 0]]);
  });
});

describe('call_fresh', () => {
  it('adds a new variable to the substitution', () => {
    expect(call_fresh((num: Var) => equality(num, 'a'))([[], 0])).toEqual([[[[0, 'a']], 1]]);
  });
});

describe('disj', () => {
  it('appends all valid states from two goals as the final output stream', () => {
    expect(disj(
             call_fresh((x: Var) => equality(x, 'z')),
             call_fresh((x: Var) => equality(x, ['s', 'z']))
           )([[], 0])
          ).toEqual([[[[0, 'z']], 1], [[[0, ['s', 'z']]], 1]]);
  });
});

describe('conj', () => {
  it('executes two goals in the same context', () => {
    expect(call_fresh((x: Var) => {
      return call_fresh((y: Var) => {
        return conj(equality(x, y), equality(x, 'z'));
      });
    })([[], 0])).toEqual([[[[0, 1], [1, 'z']], 2]]);
  });
});

// functions to write more tests for:
// 1. call_fresh
// 2. disj
// 3. conj
// call_fresh: fuck with it, what else
