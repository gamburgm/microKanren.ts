import { selectMultiEquation, ERRORS } from '../src/unify';
import { Null, MultiEquation, List, U, MultiVar, MultiTerm, Queue, Node } from '../src/types';

const EMPTY_QUEUE_ERROR = 'Queue is empty!';

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

function enqueue<T>(q: Queue<T>, elem: T): void {
  const node: Node<T> = { data: elem, next: null, prev: null };
  if (!q.push) q.push = q.pop = node;
  else {
    node.next = q.push;
    q.push.prev = node;
    q.push = node;
  }
}

function isEmptyQueue<T>(q: Queue<T>): boolean {
  return q.pop === null;
}

function dequeue<T>(q: Queue<T>): T {
  if (!q.pop) throw EMPTY_QUEUE_ERROR; 

  const elem: T = q.pop.data;
  
  if (q.pop.prev) {
    q.pop = q.pop.prev;
    q.pop.next = null;
  } else {
    q.push = q.pop = null;
  }

  return elem;
}

const createVar = (v: number): MultiVar => {
  return {
    name: v,
    M: null,
  };
};

const createU = (zeroes: Array<MultiEquation>, eqs: Array<MultiEquation>): U => {
  const zeroCount: List<MultiEquation> = makeList(zeroes);
  const equations: List<MultiEquation> = makeList(eqs);

  return {
    meqNum: zeroes.length + eqs.length,
    zeroCount,
    equations,
  };
};

const createMeq = (vars: Array<MultiVar>, M: MultiTerm, counter: number): MultiEquation => {
  let S: List<MultiVar> = makeList(vars);

  const meq: MultiEquation = {
    varnum: vars.length,
    counter,
    S,
    M,
  };

  while (S.empty === false) {
    S.value.M = meq;
    S = S.rest;
  }

  return meq;
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
      expect(() => dequeue(Q)).toThrowError(EMPTY_QUEUE_ERROR);
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
  let VAR_SIX: MultiVar;

  let TERM_ONE: MultiTerm;
  let TERM_TWO: MultiTerm;
  let TERM_THREE: MultiTerm;
  let TERM_FOUR: MultiTerm;

  beforeEach(() => {
    VAR_ONE   = createVar(1);
    VAR_TWO   = createVar(2);
    VAR_THREE = createVar(3);
    VAR_FOUR  = createVar(4);
    VAR_FIVE  = createVar(5);
    VAR_SIX   = createVar(6);

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
  });

  describe('selectMultiEquation', () => {
    it('fails if there are no multiequations with no references', () => {
      expect(() => selectMultiEquation({ meqNum: 0, zeroCount: NULL, equations: NULL })).toThrowError(ERRORS.NO_MULTS);
    });

    it.only('returns the correct multiequation', () => {
      expect(selectMultiEquation(
        createU(
          [createMeq([VAR_ONE], TERM_ONE, 0), createMeq([VAR_TWO], TERM_TWO, 0)],
          [createMeq([VAR_THREE], TERM_THREE, 1)],
        )))
        .toEqual(createMeq([VAR_TWO], TERM_TWO, 0));
    });

    it('reduces the multiequation count', () => {
    });

    it('does not contain the returned multiequation any longer', () => {
    });
  });
});
