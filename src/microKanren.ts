import _ from 'lodash';
import { Substitution, Goal, State, Term, Association, Maybe, Var, Pair, Stream } from './types';

export function makeVar(n: number): number { return n; } // is this really necessary?
export function isVar(t: Term): t is number { return typeof t === 'number'; } // same here

export function isPair(t: Term): t is Pair { return Array.isArray(t) && t.length === 2; }

// returns the association including the var t or false
export function assv(t: Term, sub: Substitution): Maybe<Association> {
  return _.find(sub, (asc: Association) => asc[0] === t) || false;
}

// searches for the value of term t according to substitution sub
export function find(t: Term, sub: Substitution): Term {
  const found: Maybe<Association> = isVar(t) && assv(t, sub);
  if (found) {
    return find(found[1], sub);
  }

  return t;
}

// determines if v occurs within t according to the substitution s
export function occurs(v: Var, t: Term, s: Substitution): boolean {
  if (isVar(t)) {
    return v === t;
  } else if (isPair(t)) {
    return occurs(v, find(t[0], s), s) || occurs(v, find(t[1], s), s);
  } else {
    return false;
  }
}

// extend the substitution with v mapping to t
export function ext_s(v: Var, t: Term, s: Substitution): Maybe<Substitution> {
  if (occurs(v, t, s)) {
    return false;
  } else {
    return s.concat([[v, t]]);
  }
}

// return a substitution that equates the two terms, or return false
export function unify(t1: Term, t2: Term, sub: Substitution): Maybe<Substitution> {
  if (t1 === t2) return sub;
  else if (isVar(t1)) return ext_s(t1, t2, sub);
  else if (isVar(t2)) return unify(t2, t1, sub);
  else if (isPair(t1) && isPair(t2)) {
    const unifiedVars: Maybe<Substitution> = unify(find(t1[0], sub), find(t2[0], sub), sub);
    return unifiedVars && sub && unify(find(t1[1], unifiedVars), find(t2[1], unifiedVars), unifiedVars);
  } else {
    return false;
  }
}

// return a function that consumes a state and returns a new state with the terms unified
export function equality(t1: Term, t2: Term): Goal {
  return (input: State): Stream => {
    const s: Substitution = input[0];
    const newS: Maybe<Substitution> = unify(find(t1, s), find(t2, s), s);
    if (newS) {
      return [[newS, input[1]]];
    } else {
      return null;
    }
  };
}

export function call_fresh(v: Var, g: Goal): Goal {
  return (input: State): Stream => {
    // TODO
  };
}
