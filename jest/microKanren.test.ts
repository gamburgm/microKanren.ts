import { Substitution } from '../src/types';
import { find, assv } from '../src/microKanren';

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
