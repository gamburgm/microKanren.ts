import { U, MultiEquation, MultiTerm, List, TempMeq, Pointer, MultiVar, Queue, Node } from './types';

export const ERRORS: Record<string, string> = {
  NO_MULTS: 'Error: No Multiequations to return!',
  EMPTY_QUEUE_ERROR: 'Queue is empty!',
};

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
