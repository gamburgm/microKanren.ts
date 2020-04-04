import _ from 'lodash';
import { Substitution, Goal, State, Term, Association, Maybe, Var, Pair, Stream, MEQ } from './types';
import util from 'util';

export function makeVar(n: number): number { return n; } 
export function isVar(t: Term): t is number { return typeof t === 'number'; } 

export function isPair(t: Term): t is Pair { return Array.isArray(t) && t.length === 2; }

export function isSym(t: Term): t is string { return typeof t === 'string'; }

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

// 'normal' way to do substitution:
// wherever you see the variable, replace with the term

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

// construct a new goal by passing the next variable to the goal constructor
export function call_fresh(goal_ctor: (new_var: Var) => Goal): Goal {
  return (input: State): Stream => {
    return goal_ctor(input[1])([input[0], input[1] + 1]);
  }
}

// append the valid States that result from the execution of the two goals
export function disj(goal1: Goal, goal2: Goal): Goal {
  return (input: State): Stream => {
    return [...goal1(input), ...goal2(input)];
  }
}

// execute the second goal on the resulting states from the first goal
export function conj(goal1: Goal, goal2: Goal): Goal {
  return (input: State): Stream => {
    return goal1(input).reduce((prev_stream: Stream, next_state: State): Stream => {
      return prev_stream.concat(goal2(next_state));
    }, []);
  }
}

/* ======== Martelli's Multiequation Procedures ========= */
export function common_part(t1: Term, t2: Term): Maybe<Term> {
  if (isVar(t1)) {
    if (isVar(t2)) return Math.min(t1, t2);
    else return t1;
  } else if (isSym(t1)) {
    if (t1 === t2) return t1;
    else if (isVar(t2)) return t2;
    else return false;
  } else if (isPair(t1)) {
    if (isVar(t2)) return t2;
    else if (isSym(t2)) return false;
    else {
      const lhs_part: Term = common_part(t1[0], t2[0]);
      const rhs_part: Term = common_part(t1[1], t2[1]);
      return lhs_part && rhs_part && [lhs_part, rhs_part];
    }
  } else {
    return false;
  }
}

// frontier should definitely return set stuff
// need new data
// returns:
// Listof multiequation
// multiequation = [Listof Var . Listof Term]
// but, they should be unique, so we should be returning a set.

// why is everything a term?
// what is the correct return type here?
export function frontier(t1: Term, t2: Term): Array<MEQ> {
  if (isVar(t1)) {
    if (isVar(t2)) return [[t1, null]];
    else return [[t1, t2]];
  } else if (isSym(t1)) {
    if (isSym(t2)) return [];
    else if (isVar(t2)) return [[t2, t1]];
    else return [];
  } else if (isPair(t1)) {
    if (isVar(t2)) return [[t2, t1]];
    if (isSym(t2)) return [];
    else {
      return [...frontier(t1[0], t2[0]), ...frontier(t1[1], t2[1])];
    }
  }
}

export function algorithm_b(meqs: Array<MEQ>): Array<MEQ> {
  const final_meqs: Array<MEQ> = [];
  
  return final_meqs;
}

function pretty_print(contents: any): void {
  console.log(util.inspect(contents, false, null, true));
}
