import { StateVariable } from "../types";

/** Shape of the runtime global state store */
export interface GlobalStateAPI {
  /** Get a value at a dot-notated path */
  getState: (path: string) => unknown;
  /** Set a value at a dot-notated path */
  setState: (path: string, value: unknown) => void;
  /** Toggle a boolean value at a dot-notated path */
  toggleState: (path: string) => void;
  /** Reset state to initial defaults. If path provided, reset only that key. */
  resetState: (path?: string) => void;
  /** Get the entire state object (snapshot) */
  getSnapshot: () => Record<string, unknown>;
  /** Initialize state from a schema of variable declarations */
  initializeFromSchema: (schema: StateVariable[]) => void;
}
