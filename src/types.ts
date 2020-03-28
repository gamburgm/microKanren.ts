export type Goal = (input: State) => Stream; 

export interface State {
  sub: Substitution,
  num: number
}

export type Substitution = Association[];
export type Association = [number, Var | Symbol];

export type Stream =
  | MatureStream
  | ImmatureStream;

export type MatureStream = 
  | null
  | { state: State, stream: Stream };

export type ImmatureStream = () => Stream;


export type Var = number;
export type Symbol = string;
export type Bool = boolean;

export type Empty = [];

export type Pair = [Term, Term];

export type Term = Var | Bool | Symbol | Empty | Pair;

export type Maybe<T> = T | false;
