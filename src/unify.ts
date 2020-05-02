import { U, MultiEquation, MultiTerm, List, TempMeq, Pointer, MultiVar, Queue, Node, Cons, System } from './types';

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

export function selectMultiEquation(U: U): Pointer<MultiEquation> {
  if (U.zeroCount.empty === true) throw ERRORS.NO_MULTS;

  const nextMult: Pointer<MultiEquation> = U.zeroCount.value;
  U.zeroCount = U.zeroCount.rest;
  U.meqNum -= 1;

  return nextMult;
}

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

  return M2 ? M2 : M1;
}

export function mergeMeq(M1: Pointer<MultiEquation>, M2: Pointer<MultiEquation>, U: U): void {
  if (M1 !== M2) {
    if (M1.val.varnum < M2.val.varnum) {
      const swap: MultiEquation = M1.val;
      M1.val = M2.val;
      M2.val = swap;
    }

    M1.val.counter += M2.val.counter;
    M1.val.varnum += M2.val.varnum;
    let otherVars: List<MultiVar> = M2.val.S;

    while (otherVars.empty === false) {
      const V: MultiVar = otherVars.value;
      otherVars = otherVars.rest;
      V.M = M1;
      M1.val.S = { empty: false, value: V, rest: M1.val.S };
    }

    U.meqNum -= 1;
    M1.val.M = mergeMultiTerms(M1.val.M, M2.val.M);
  }
}

export function compact(frontier: List<TempMeq>, U: U): void {
  while (frontier.empty === false) {
    const variables: Queue<MultiVar> = frontier.value.S;
    const V: MultiVar = dequeue(variables); 
    const mult: Pointer<MultiEquation> = V.M;
    mult.val.counter -= 1;

    while (variables.push !== null) {
      const otherV: MultiVar = dequeue(variables);
      const otherMult: Pointer<MultiEquation> = otherV.M;
      otherMult.val.counter -= 1;
      mergeMeq(mult, otherMult, U);
    }

    mult.val.M = mergeMultiTerms(mult.val.M, frontier.value.M);
    if (mult.val.counter === 0) {
      U.zeroCount = { empty: false, value: mult, rest: U.zeroCount };
    }

    frontier = frontier.rest;
  }
}

export function unify(R: System): List<MultiEquation> {
  while (R.U.meqNum !== 0) {
    const meq: Pointer<MultiEquation> = selectMultiEquation(R.U);
    if (meq.val.M !== null) {
      const frontierPtr: Pointer<List<TempMeq>> = { val: { empty: true } };
      reduce(meq.val.M, frontierPtr);
      compact(frontierPtr.val, R.U);
    }
    R.T = { empty: false, value: meq.val, rest: R.T };
  }

  return R.T;
}
