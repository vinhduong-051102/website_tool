import { create } from "zustand";
import { StateVariable } from "../types";

// ─── Dot-notation utilities ──────────────────────────────────────────

/** Get a value from a nested object using a dot-notated path */
const getByPath = (obj: Record<string, unknown>, path: string): unknown => {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
};

/** Set a value in a nested object using a dot-notated path (immutable) */
const setByPath = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> => {
  const keys = path.split(".");
  if (keys.length === 1) {
    return { ...obj, [keys[0]]: value };
  }

  const [head, ...rest] = keys;
  const child = (obj[head] ?? {}) as Record<string, unknown>;
  return {
    ...obj,
    [head]: setByPath(child, rest.join("."), value),
  };
};

// ─── Store Definition ────────────────────────────────────────────────

interface GlobalStateStore {
  /** The runtime state data */
  data: Record<string, unknown>;
  /** The initial defaults (for reset) */
  defaults: Record<string, unknown>;

  // Actions
  getState: (path: string) => unknown;
  setState: (path: string, value: unknown) => void;
  toggleState: (path: string) => void;
  resetState: (path?: string) => void;
  getSnapshot: () => Record<string, unknown>;
  initializeFromSchema: (schema: StateVariable[]) => void;
}

/**
 * Runtime Global State — separate from the editor store.
 * Used exclusively by the Event/Action/Binding engine at runtime.
 * Not persisted to localStorage.
 */
export const useGlobalState = create<GlobalStateStore>()((set, get) => ({
  data: {},
  defaults: {},

  getState: (path: string): unknown => {
    return getByPath(get().data, path);
  },

  setState: (path: string, value: unknown): void => {
    set((state) => ({
      data: setByPath(state.data, path, value),
    }));
  },

  toggleState: (path: string): void => {
    const current = getByPath(get().data, path);
    set((state) => ({
      data: setByPath(state.data, path, !current),
    }));
  },

  resetState: (path?: string): void => {
    if (path) {
      const defaultValue = getByPath(get().defaults, path);
      set((state) => ({
        data: setByPath(state.data, path, defaultValue),
      }));
    } else {
      set({ data: JSON.parse(JSON.stringify(get().defaults)) });
    }
  },

  getSnapshot: (): Record<string, unknown> => {
    return get().data;
  },

  initializeFromSchema: (schema: StateVariable[]): void => {
    const defaults: Record<string, unknown> = {};
    for (const variable of schema) {
      const keys = variable.key.split(".");
      let current = defaults;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = variable.defaultValue;
    }
    set({
      data: JSON.parse(JSON.stringify(defaults)),
      defaults: JSON.parse(JSON.stringify(defaults)),
    });
  },
}));
