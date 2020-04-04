export type Goal = (input: State) => Stream; 

export type State = [Substitution, number];

export type Substitution = Association[];
// IMPORTANT NOTE: 0 can't map to something that contains 0
export type Association = [number, Term];

export type Stream =
  | MatureStream;
  // | ImmatureStream;

// I have no idea if this type is correct
export type MatureStream = 
  | null
  | State[];

// export type ImmatureStream = () => Stream;


export type Var = number;
export type Symbol = string;
export type Bool = boolean;

export type Empty = [];

export type Pair = [Term, Term];

export type Term = Var | Bool | Symbol | Empty | Pair;

export type Maybe<T> = T | false;

// NOTE: these are pretty poorly designed types. Should definitely clean this up.

// ====== Martelli Types ======
export type MEQ = [Var, Term];
