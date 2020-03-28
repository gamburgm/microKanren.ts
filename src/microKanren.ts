import _ from 'lodash';
import { Substitution, Goal, State, Term, Association, Maybe } from './types';

export function makeVar(n: number): number { return n; } // is this really necessary?
export function isVar(t: Term): boolean { return typeof t === 'number'; } // same here

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

export function equality(t1: Term, t2: Term): Goal {
  return (input: State): Stream => {
    const subst: Substitution = input.sub;
    const newSubst: Substitution = unify(find(t1, subst), find(t2, subst), subst);
  };
}


