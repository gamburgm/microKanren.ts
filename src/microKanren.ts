import { Substitution, Goal, State, Term, Association } from './types';

export function makeVar(n: number): number { return n; } // is this really necessary?
export function isVar(t: Term): boolean { return typeof t === 'number'; } // same here

export function assv(t: Term, sub: Substitution): Association {
  sub.forEach((asc: Association) => {
    if (
  });
}

export function find(t: Term, sub: Substitution): Term {
  const found: Substitution = isVar(t) && assv(t, sub);
  // wtf is the type of substitution
  const found: any = isVar(t) && assv(t, sub);
  return found ? find(found[1], sub) : t;
}

export function equality(t1: Term, t2: Term): Goal {
  return (input: State): Stream => {
    const subst: Substitution = input.sub;
    const newSubst: Substitution = unify(find(t1, subst), find(t2, subst), subst);
  };
}


