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
  updateSchemaPreserveData: (schema: StateVariable[]) => void;
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
    const cleanPath = path.startsWith("state.") ? path.substring(6) : path;
    return getByPath(get().data, cleanPath);
  },

  setState: (path: string, value: unknown): void => {
    const cleanPath = path.startsWith("state.") ? path.substring(6) : path;
    console.log('[useGlobalState.setState] cleanPath:', cleanPath, 'value:', value);
    console.log('[useGlobalState.setState] BEFORE data:', JSON.stringify(get().data));
    set((state) => ({
      data: setByPath(state.data, cleanPath, value),
    }));
    console.log('[useGlobalState.setState] AFTER data:', JSON.stringify(get().data));
  },

  toggleState: (path: string): void => {
    const cleanPath = path.startsWith("state.") ? path.substring(6) : path;
    const current = getByPath(get().data, cleanPath);
    set((state) => ({
      data: setByPath(state.data, cleanPath, !current),
    }));
  },

  resetState: (path?: string): void => {
    if (path) {
      const cleanPath = path.startsWith("state.") ? path.substring(6) : path;
      const defaultValue = getByPath(get().defaults, cleanPath);
      set((state) => ({
        data: setByPath(state.data, cleanPath, defaultValue),
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
      const cleanKey = variable.key.startsWith("state.") ? variable.key.substring(6) : variable.key;
      const keys = cleanKey.split(".");
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

  updateSchemaPreserveData: (schema: StateVariable[]): void => {
    const defaults: Record<string, unknown> = {};
    for (const variable of schema) {
      const cleanKey = variable.key.startsWith("state.") ? variable.key.substring(6) : variable.key;
      const keys = cleanKey.split(".");
      let current = defaults;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }
      current[keys[keys.length - 1]] = variable.defaultValue;
    }

    const mergedData = deepMerge(defaults, get().data);
    set({
      data: mergedData,
      defaults: JSON.parse(JSON.stringify(defaults)),
    });
  },
}));

// Helper functions for merging schemas
const isObject = (item: any): boolean => {
  return item && typeof item === "object" && !Array.isArray(item);
};

const deepMerge = (target: any, source: any): any => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
};
