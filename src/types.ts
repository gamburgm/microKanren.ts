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

// ====== BAD Martelli Types ======
/*
export interface System {
  T: MultiEquation[];
  U: MultiEquation[];
}

export interface MultiEquation {
  erased: boolean;
  S: SetOfVars;
  M: UnifiableFun[];
}

export interface SetOfVars {
  counter: number;
  vars: VarWrap[];
}

export interface TempMultiEquation {
  S: VarWrap[];
  M: UnifiableFun[];
}

export interface VarWrap {
  name: Var;
  mult: MultiEquation;
}

export type UnifiableList = [UnifiableTerm, UnifiableList] | [];
export type UnifiableFun = UnifiableList | Symbol;
export type UnifiableTerm = VarWrap | Symbol | UnifiableList; // an empty list signifies the end of a linked list

// has a variable type including a pointer to the defining multiequation
*/

// ====== Martelli Types Take 2 ======
export interface System {
  T: List<MultiEquation>;
  U: U;
}

export interface U {
  meqNum: number;
  zeroCount: List<Pointer<MultiEquation>>;
  equations: List<Pointer<MultiEquation>>;
}

export interface MultiTerm {
  fsymb: string;
  args: List<TempMeq>;
}

export interface MultiEquation {
  counter: number;
  varnum: number;
  S: List<MultiVar>;
  M: MultiTerm;
}

export interface TempMeq {
  S: Queue<MultiVar>;
  M: MultiTerm;
}

export interface MultiVar {
  name: number;
  M: Pointer<MultiEquation>;
}

export interface Cons<T> {
  empty: false;
  value: T;
  rest: List<T>
}

export interface Null {
  empty: true;
}

export type List<T> = Cons<T> | Null;

export type ListNode<T> = Node<T> | null;

export interface Node<T> {
  data: T;
  next: ListNode<T>;
  prev: ListNode<T>;
}

export interface Queue<T> {
  push: ListNode<T>;
  pop: ListNode<T>;
}

export interface Pointer<T> {
  val: T
}
