import _ from 'lodash';
import { selectMultiEquation, ERRORS, enqueue, dequeue, reduce, createQueue, mergeMultiTerms, mergeMeq, compact } from '../src/unify';
import { Null, MultiEquation, List, U, MultiVar, MultiTerm, Queue, Cons, Pointer, TempMeq } from '../src/types';

function makeList<T>(arr: Array<T>): List<T> {
  return arr.reduce((rest: List<T>, elem: T) => {
    return {
      empty: false,
      value: elem,
      rest,
    };
  }, NULL);
}

function makeQueue<T>(arr: Array<T>): Queue<T> {
  const q: Queue<T> = { push: null, pop: null };
  arr.slice().reverse().forEach((elem: T) => {
    enqueue(q, elem);
  });

  return q;
}


const createVar = (v: number): MultiVar => {
  return {
    name: v,
    M: null,
  };
};

const createU = (zeroes: Array<Pointer<MultiEquation>>, eqs: Array<Pointer<MultiEquation>>): U => {
  const zeroCount: List<Pointer<MultiEquation>> = makeList(zeroes);
  const equations: List<Pointer<MultiEquation>> = makeList(eqs);

  return {
    meqNum: zeroes.length + eqs.length,
    zeroCount,
    equations,
  };
};

const createMeq = (vars: Array<MultiVar>, M: MultiTerm, counter: number): Pointer<MultiEquation> => {
  let S: List<MultiVar> = makeList(vars);

  const meq: MultiEquation = {
    varnum: vars.length,
    counter,
    S,
    M,
  };
  const ptr: Pointer<MultiEquation> = { val: meq };

  while (S.empty === false) {
    S.value.M = ptr;
    S = S.rest;
  }

  return ptr;
};


const NULL: Null = { empty: true };
const EMPTY_QUEUE: Queue<MultiVar> = { push: null, pop: null };


describe('Queue Functions', () => {
  let Q: Queue<number>;

  beforeEach(() => {
    Q = {
      push: null,
      pop: null,
    };
  });

  describe('enqueue', () => {
    it('works on empty queue', () => {
      enqueue(Q, 5);
      expect(Q).toEqual({
        push: {
          data: 5,
          prev: null,
          next: null,
        },
        pop: {
          data: 5,
          prev: null,
          next: null,
        },
      });
    });

    it('works on queue with an existing item', () => {
      Q.pop = Q.push = { data: 3, prev: null, next: null };
      enqueue(Q, 6);
      expect(Q).toEqual({
        push: {
          data: 6,
          next: { data: 3, next: null, prev: expect.anything() },
          prev: null,
        },
        pop: {
          data: 3,
          next: null,
          prev: { data: 6, prev: null, next: expect.anything() },
        },
      });
    });
  });

  describe('dequeue', () => {
    it('blows up on empty queue', () => {
      expect(() => dequeue(Q)).toThrowError(ERRORS.EMPTY_QUEUE_ERROR);
    });

    it('pops an element off', () => {
      enqueue(Q, 6);
      expect(dequeue(Q)).toEqual(6);
    });

    it('pops the right element off', () => {
      enqueue(Q, 3);
      enqueue(Q, 6);
      expect(dequeue(Q)).toEqual(3);
    });

    it('shrinks the queue to one element', () => {
      enqueue(Q, 3);
      enqueue(Q, 6);

      dequeue(Q);

      expect(Q).toEqual({
        push: {
          data: 6,
          prev: null,
          next: null,
        },
        pop: {
          data: 6,
          prev: null,
          next: null,
        },
      });
    });

    it('shrinks the queue to two elements', () => {
      enqueue(Q, 4);
      enqueue(Q, 5);
      enqueue(Q, 6);

      dequeue(Q);

      expect(Q).toEqual({
        push: {
          data: 6,
          next: { data: 5, next: null, prev: expect.anything() },
          prev: null,
        },
        pop: {
          data: 5,
          next: null,
          prev: { data: 6, prev: null, next: expect.anything() },
        },
      });
    });
  });
});

describe('unification', () => {
  let VAR_ONE: MultiVar;
  let VAR_TWO: MultiVar;
  let VAR_THREE: MultiVar;
  let VAR_FOUR: MultiVar;
  let VAR_FIVE: MultiVar;
  let VAR_SEVEN: MultiVar;
  let VAR_EIGHT: MultiVar;

  let TERM_ONE: MultiTerm;
  let TERM_TWO: MultiTerm;
  let TERM_THREE: MultiTerm;
  let TERM_FOUR: MultiTerm;
  let TERM_FIVE: MultiTerm;
  let TERM_SIX: MultiTerm;
  let TERM_SEVEN: MultiTerm;
  let TERM_EIGHT: MultiTerm;

  let PTR: Pointer<List<TempMeq>>;

  let MEQ_ONE: Pointer<MultiEquation>;
  let MEQ_TWO: Pointer<MultiEquation>;
  let MEQ_THREE: Pointer<MultiEquation>;
  let MEQ_FOUR: Pointer<MultiEquation>;

  let TEMP_LIST_ONE: List<TempMeq>;
  let TEMP_LIST_TWO: List<TempMeq>;
  let TEMP_LIST_THREE: List<TempMeq>;

  beforeEach(() => {
    VAR_ONE   = createVar(1);
    VAR_TWO   = createVar(2);
    VAR_THREE = createVar(3);
    VAR_FOUR  = createVar(4);
    VAR_FIVE  = createVar(5);
    VAR_SEVEN = createVar(7);
    VAR_EIGHT = createVar(8);

    PTR = { val: NULL };

    TERM_ONE = {
      fsymb: 'f',
      args: makeList([
        {
          S: EMPTY_QUEUE,
          M: { fsymb: 'x', args: NULL },
        },
        {
          S: EMPTY_QUEUE,
          M: { fsymb: 'y', args: NULL },
        },
      ]),
    };

    TERM_TWO = {
      fsymb: 'g',
      args: makeList([
        {
          S: makeQueue([VAR_THREE]),
          M: null,
        }
      ]),
    };

    TERM_THREE = {
      fsymb: 'f',
      args: makeList([
        {
          S: makeQueue([VAR_FOUR]),
          M: null,
        },
        {
          S: EMPTY_QUEUE,
          M: { fsymb: 'x', args: NULL },
        },
      ]),
    };

    TERM_FOUR = {
      fsymb: 'y',
      args: NULL,
    };

    TERM_FIVE = {
      fsymb: 'q',
      args: makeList([
        {
          S: EMPTY_QUEUE,
          M: {
            fsymb: 'z',
            args: makeList([
              {
                S: makeQueue([VAR_ONE]),
                M: { fsymb: 'v', args: NULL }
              },
            ]),
          },
        }
      ]),
    };

    TERM_SIX = {
      fsymb: 'z',
      args: makeList([
        {
          S: makeQueue([VAR_ONE, VAR_TWO]),
          M: { fsymb: 'v', args: NULL },
        },
      ]),
    };

    TERM_SEVEN = {
      fsymb: 'g',
      args: makeList([
        {
          S: makeQueue([VAR_TWO]),
          M: null,
        },
      ]),
    };

    TERM_EIGHT = {
      fsymb: 'z',
      args: makeList([
        {
          S: makeQueue([VAR_THREE]),
          M: { fsymb: 'v', args: NULL },
        },
      ]),
    };

    MEQ_ONE = createMeq([], null, 0);
    MEQ_TWO = createMeq([], null, 0);

    MEQ_THREE = createMeq([VAR_SEVEN, VAR_EIGHT], TERM_EIGHT, 3);
    MEQ_FOUR  = createMeq([VAR_FIVE], TERM_SIX, 2);

    TEMP_LIST_ONE = {
      empty: false,
      value: {
        S: createQueue(VAR_EIGHT),
        M: TERM_SIX,
      },
      rest: NULL,
    };

    TEMP_LIST_TWO = {
      empty: false,
      value: {
        S: createQueue(VAR_FIVE),
        M: TERM_SIX,
      },
      rest: TEMP_LIST_ONE,
    };

    TEMP_LIST_THREE = {
      empty: false,
      value: {
        S: createQueue(VAR_FIVE),
        M: TERM_SIX,
      },
      rest: NULL,
    };
  });

  describe('selectMultiEquation', () => {
    let U: U;

    beforeEach(() => {
      U = createU(
        [createMeq([VAR_ONE], TERM_ONE, 0), createMeq([VAR_TWO], TERM_TWO, 0)],
        [createMeq([VAR_THREE], TERM_THREE, 1)],
      );
    });
      
    it('blows up on empty', () => {
      expect(() => selectMultiEquation({ meqNum: 0, zeroCount: NULL, equations: NULL })).toThrowError(ERRORS.NO_MULTS);
    });

    it('returns the correct multiequation', () => {
      expect(selectMultiEquation(U)).toEqual(createMeq([VAR_TWO], TERM_TWO, 0));
    });

    it('reduces the multiequation count', () => {
      selectMultiEquation(U);
      expect(U.meqNum).toEqual(2);
    });

    it('does not contain the returned multiequation any longer', () => {
      selectMultiEquation(U);
      expect((U.zeroCount as Cons<Pointer<MultiEquation>>).value).toEqual(createMeq([VAR_ONE], TERM_ONE, 0));
    });
  });

  describe('reduce', () => {
    it('does not extract a frontier if args of multiterm empty', () => {
      reduce(TERM_FOUR, PTR);
      expect(PTR).toEqual({ val: NULL });
    });

    it('extracts a simple frontier from a multiterm with arguments', () => {
      reduce(TERM_THREE, PTR);
      expect(PTR.val).toEqual(makeList([
        {
          S: makeQueue([VAR_FOUR]),
          M: null,
        },
      ]));
    });

    it('extracts the common part of the arguments of a multiterm', () => {
      reduce(TERM_THREE, PTR);
      expect((TERM_THREE.args as Cons<TempMeq>).value.S).toEqual({ push: null, pop: null });
      expect(((TERM_THREE.args as Cons<TempMeq>).rest as Cons<TempMeq>).value.S).toEqual(createQueue(VAR_FOUR));
    });

    it('reduces a tempmeq with no LHS', () => {
      reduce(TERM_FIVE, PTR);
      expect(PTR.val).toEqual(makeList([
        {
          S: makeQueue([VAR_ONE]),
          M: { fsymb: 'v', args: NULL },
        },
      ]));
    });

    it('reduces a multiterm which equates variables to symbols', () => {
      reduce(TERM_SIX, PTR);
      expect(PTR.val).toEqual(makeList([
        {
          S: makeQueue([VAR_ONE, VAR_TWO]),
          M: { fsymb: 'v', args: NULL },
        },
      ]));
    });

    it('reduces a multiterm and determines the common part', () => {
      reduce(TERM_SIX, PTR);
      expect((TERM_SIX.args as Cons<TempMeq>).value.S).toEqual(createQueue(VAR_TWO));
    });
  });

  describe('mergeMultiTerms', () => {
    it('returns the second multiterm if first one is empty', () => {
      expect(mergeMultiTerms(null, TERM_ONE)).toEqual(TERM_ONE);
    });

    it('blows up if function symbols do not match', () => {
      expect(() => mergeMultiTerms(TERM_ONE, TERM_TWO)).toThrowError(ERRORS.DIFF_FUNCS);
    });

    it('combines the vars across multiple arguments of terms', () => {
      expect(mergeMultiTerms(TERM_TWO, TERM_SEVEN)).toEqual({
        fsymb: 'g',
        args: makeList([
          {
            S: makeQueue([VAR_THREE, VAR_TWO]),
            M: null,
          },
        ]),
      });
    });

    it('merges the multiterms together', () => {
      expect(mergeMultiTerms(TERM_SIX, TERM_EIGHT)).toEqual({
        fsymb: 'z',
        args: makeList([
          {
            S: makeQueue([VAR_ONE, VAR_TWO, VAR_THREE]),
            M: { fsymb: 'v', args: NULL },
          },
        ]),
      });
    });

    it('returns the correct value if the second value is null', () => {
      expect(mergeMultiTerms(TERM_SIX, null)).toEqual(TERM_SIX);
    });
  });

  describe('mergeMeq', () => {
    it('does nothing on empty multiequations', () => {
      const res: Pointer<MultiEquation> = _.cloneDeep(MEQ_ONE);
      mergeMeq(MEQ_ONE, MEQ_TWO, createU([], []));
      expect(MEQ_ONE).toEqual(res);
    });

    it('merges a multiequation with contents with one without contents', () => {
      mergeMeq(MEQ_THREE, MEQ_ONE, createU([], []));
      expect(MEQ_THREE).toEqual(createMeq([VAR_SEVEN, VAR_EIGHT], TERM_EIGHT, 3));
    });

    it('produces the same result when flipped', () => {
      mergeMeq(MEQ_ONE, MEQ_THREE, createU([], []));
      expect(MEQ_ONE).toEqual(createMeq([VAR_SEVEN, VAR_EIGHT], TERM_EIGHT, 3))
    });

    it('works for larger multiequations', () => {
      mergeMeq(MEQ_THREE, MEQ_FOUR, createU([], []));
      expect(MEQ_THREE).toEqual(createMeq([VAR_SEVEN, VAR_EIGHT, VAR_FIVE], mergeMultiTerms(TERM_EIGHT, TERM_SIX), 5))
    });

    it('modifies the counter on the multiequation', () => {
      mergeMeq(MEQ_THREE, MEQ_FOUR, createU([], []));
      expect(MEQ_THREE.val.counter).toEqual(5);
    });

    it('modifies the varnum on the multiequation', () => {
      mergeMeq(MEQ_THREE, MEQ_FOUR, createU([], []));
      expect(MEQ_THREE.val.varnum).toEqual(3);
    });

    it('corrects the MEQ pointers for other vars', () => {
      mergeMeq(MEQ_THREE, MEQ_FOUR, createU([], []));
      let vars: List<MultiVar> = MEQ_THREE.val.S;
      expect(vars.empty).toBeFalsy();

      while (vars.empty === false) {
        expect(vars.value.M).toEqual(MEQ_THREE);
        vars = vars.rest;
      }
    });

    it('reduces the multiequation number count', () => {
      const U: U = createU([MEQ_ONE], [MEQ_THREE, MEQ_FOUR]);
      mergeMeq(MEQ_THREE, MEQ_FOUR, U);
      expect(U.meqNum).toEqual(2); 
    });
  });

  describe('compact', () => {
    it('does not do anything if no frontier', () => {
      const U = createU([], []);
      const expected: U = _.cloneDeep(U);
      compact(NULL, U);
      expect(U).toEqual(expected);
    });

    it('reduces the counter on the variable\'s multiequation', () => {
      const U = createU([], [MEQ_THREE]);      
      compact(TEMP_LIST_ONE, U);
      expect((U.equations as Cons<Pointer<MultiEquation>>).value.val.counter).toEqual(2);
    });

    it('reduces the count on the other variable\'s multiequation', () => {
      const U = createU([], [MEQ_THREE]);
      compact(TEMP_LIST_TWO, U);
      let vars: List<MultiVar> = MEQ_THREE.val.S;

      expect(vars.empty).toBeFalsy();
      while (vars.empty === false) {
        if ((vars.value.M.val.S as Cons<MultiVar>).value.name === 5) {
          expect(vars.value.M.val.counter).toEqual(1);
          break;
        }
        vars = vars.rest;
      }
    });

    it('merges two multiequations together', () => {
      const threeCopy: Pointer<MultiEquation> = _.cloneDeep(MEQ_THREE);
      const fourCopy: Pointer<MultiEquation> = _.cloneDeep(MEQ_FOUR);
      const U = createU([], [MEQ_THREE]);
      compact(TEMP_LIST_THREE, U);
      mergeMeq(fourCopy, threeCopy, U);
      expect(MEQ_THREE).toEqual(fourCopy);
    });

    it('merges multiterms together', () => {
    });

    it('appends the value to the zeroCount list if the count is zero', () => {
    });
  });
});
