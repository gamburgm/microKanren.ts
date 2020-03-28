import _ from 'lodash';
import { Substitution, Goal, State, Term, Association, Maybe, Var, Pair } from './types';

export function makeVar(n: number): number { return n; } // is this really necessary?
export function isVar(t: Term): t is number { return typeof t === 'number'; } // same here

export function isPair(t: Term): t is Pair { return Array.isArray(t) && t.length === 2; }

export function assv(t: Term, sub: Substitution): Maybe<Association> {
  return _.find(sub, (asc: Association) => asc[0] === t) || false;
}

export function find(t: Term, sub: Substitution): Term {
  const found: Maybe<Association> = isVar(t) && assv(t, sub);
  if (found) {
    return find(found[1], sub);
  }

  return t;
}

export function occurs(v: Var, t: Term, s: Substitution): boolean {
  if (isVar(t)) {
    return v === t;
  } else if (isPair(t)) {
    return occurs(v, find(t[0], s), s) || occurs(v, find(t[1], s), s);
  } else {
    return false;
  }
}

export function ext_s(v: Var, t: Term, s: Substitution): Maybe<Substitution> {
  if (occurs(v, t, s)) {
    return false;
  } else {
    return s.concat([v, t]);
  }
}

export function unify(t1: Term, t2: Term, sub: Substitution): Maybe<Substitution> {
  if (t1 === t2) return sub;
  else if (isVar(t1)) return ext_s(t1, t2, sub);
  else if (isVar(t2)) return unify(t2, t1, sub);
  else if (isPair(t1) && isPair(t2)) {
    const unifiedVars: Maybe<Substitution> = unify(find(t1[0], sub), find(t2[0], sub), sub);
    return unifiedVars && sub && unify(find(t1[1], sub), find(t2[1], sub), sub);
  } else {
    return false;
  }
}

export function equality(t1: Term, t2: Term): Goal {
  return (input: State): Stream => {
    const subst: Substitution = input.sub;
    const newSubst: Substitution = unify(find(t1, subst), find(t2, subst), subst);
  };
}


