import { U, MultiEquation, MultiTerm, List, TempMeq, Pointer, MultiVar, Queue, Node, Cons } from './types';

export const ERRORS: Record<string, string> = {
  NO_MULTS: 'Error: No Multiequations to return!',
  EMPTY_QUEUE_ERROR: 'Queue is empty!',
  DIFF_FUNCS: 'Function symbols are not equal!',
};

export function append<T>(pushQ: Queue<T>, receiveQ: Queue<T>): void {
  if (!receiveQ.push) {
    receiveQ.push = pushQ.push;
    receiveQ.pop = pushQ.pop;
  } else {
    if (pushQ.pop) {
      receiveQ.push.prev = pushQ.pop;
      pushQ.pop.next = receiveQ.push;
      receiveQ.push = pushQ.push;
    }
  }
}

export function enqueue<T>(q: Queue<T>, elem: T): void {
  const node: Node<T> = { data: elem, next: null, prev: null };
  if (!q.push) q.push = q.pop = node;
  else {
    node.next = q.push;
    q.push.prev = node;
    q.push = node;
  }
}

export function isEmptyQueue<T>(q: Queue<T>): boolean {
  return q.pop === null;
}

export function dequeue<T>(q: Queue<T>): T {
  if (!q.pop) throw ERRORS.EMPTY_QUEUE_ERROR; 

  const elem: T = q.pop.data;
  
  if (q.pop.prev) {
    q.pop = q.pop.prev;
    q.pop.next = null;
  } else {
    q.push = q.pop = null;
  }

  return elem;
}

export function createQueue(v: MultiVar): Queue<MultiVar> {
  const q: Queue<MultiVar> = { push: null, pop: null };
  enqueue(q, v);
  return q;
}

export function selectMultiEquation(U: U): MultiEquation {
  if (U.zeroCount.empty === true) throw ERRORS.NO_MULTS;

  const nextMult: MultiEquation = U.zeroCount.value;
  U.zeroCount = U.zeroCount.rest;
  U.meqNum -= 1;

  return nextMult;
}

// TODO testing...
export function reduce(M: MultiTerm, ptr: Pointer<List<TempMeq>>): void {
  let currArg: List<TempMeq> = M.args;

  while (currArg.empty === false) {
    if (isEmptyQueue(currArg.value.S)) {
      reduce(currArg.value.M, ptr);
    } else {
      ptr.val = { empty: false, value: currArg.value, rest: ptr.val };
      // excellent code...
      currArg.value = { S: createQueue(currArg.value.S.pop.data), M: null };
    }

    currArg = currArg.rest;
  }
}

export function mergeMultiTerms(M1: MultiTerm, M2: MultiTerm): MultiTerm {
  if (!M1) return M2;
  if (M2) {
    if (M1.fsymb !== M2.fsymb) throw ERRORS.DIFF_FUNCS;
    let args1 = M1.args;
    let args2 = M2.args;

    while (args1.empty === false) {
      append(args1.value.S, (args2 as Cons<TempMeq>).value.S);
      (args2 as Cons<TempMeq>).value.M = mergeMultiTerms(args1.value.M, (args2 as Cons<TempMeq>).value.M);
      args1 = args1.rest;
      args2 = (args2 as Cons<TempMeq>).rest;
    }
  }

  return M2;
}

export function mergeMeq(M1: MultiEquation, M2: MultiEquation, U: U): MultiEquation {
  if (M1 !== M2) {
    // TODO I don't know if this works
    if (M1.varnum < M2.varnum) {
      const swap = M1;
      M1 = M2;
      M2 = swap;
    }

    M1.counter += M2.counter;
    M1.varnum += M2.varnum;
    let otherVars: List<MultiVar> = M2.S;

    while (otherVars.empty === false) {
      const V = otherVars.value;
      otherVars = otherVars.rest;
      V.M = M1;
      M1.S = { empty: false, value: V, rest: M1.S };
    }

    U.meqNum -= 1;
    M1.M = mergeMultiTerms(M1.M, M2.M);
    return M1;
  }
}
