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
  /** Track the scope of each path */
  variableScopes: Record<string, "global" | "local">;

  // Actions
  getState: (path: string) => unknown;
  setState: (path: string, value: unknown) => void;
  toggleState: (path: string) => void;
  resetState: (path?: string) => void;
  getSnapshot: () => Record<string, unknown>;
  initializeFromSchema: (localSchema: StateVariable[], globalSchema?: StateVariable[]) => void;
  updateSchemaPreserveData: (localSchema: StateVariable[], globalSchema?: StateVariable[]) => void;
}

/**
 * Runtime Global State — separate from the editor store.
 * Used exclusively by the Event/Action/Binding engine at runtime.
 * Not persisted to localStorage.
 */
export const useGlobalState = create<GlobalStateStore>()((set, get) => ({
  data: {},
  defaults: {},
  variableScopes: {},

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

  initializeFromSchema: (localSchema: StateVariable[], globalSchema: StateVariable[] = []): void => {
    let nextData: Record<string, unknown> = {};
    let nextDefaults: Record<string, unknown> = {};
    const nextScopes: Record<string, "global" | "local"> = {};
    const currentData = get().data;

    // Process Global Variables (keep values if already initialized)
    for (const variable of globalSchema) {
      const cleanKey = variable.key.startsWith("state.") ? variable.key.substring(6) : variable.key;
      nextScopes[cleanKey] = "global";
      nextDefaults = setByPath(nextDefaults, cleanKey, variable.defaultValue);
      
      const currentValue = getByPath(currentData, cleanKey);
      nextData = setByPath(nextData, cleanKey, currentValue !== undefined ? currentValue : variable.defaultValue);
    }

    // Process Local Variables (always reset to default value on initialization)
    for (const variable of localSchema) {
      const cleanKey = variable.key.startsWith("state.") ? variable.key.substring(6) : variable.key;
      nextScopes[cleanKey] = "local";
      nextDefaults = setByPath(nextDefaults, cleanKey, variable.defaultValue);
      nextData = setByPath(nextData, cleanKey, variable.defaultValue);
    }

    set({
      data: nextData,
      defaults: nextDefaults,
      variableScopes: nextScopes,
    });
  },

  updateSchemaPreserveData: (localSchema: StateVariable[], globalSchema: StateVariable[] = []): void => {
    let nextData: Record<string, unknown> = {};
    let nextDefaults: Record<string, unknown> = {};
    const nextScopes: Record<string, "global" | "local"> = {};
    const currentData = get().data;

    // Process Global (keep values)
    for (const variable of globalSchema) {
      const cleanKey = variable.key.startsWith("state.") ? variable.key.substring(6) : variable.key;
      nextScopes[cleanKey] = "global";
      nextDefaults = setByPath(nextDefaults, cleanKey, variable.defaultValue);
      
      const currentValue = getByPath(currentData, cleanKey);
      nextData = setByPath(nextData, cleanKey, currentValue !== undefined ? currentValue : variable.defaultValue);
    }

    // Process Local (keep values)
    for (const variable of localSchema) {
      const cleanKey = variable.key.startsWith("state.") ? variable.key.substring(6) : variable.key;
      nextScopes[cleanKey] = "local";
      nextDefaults = setByPath(nextDefaults, cleanKey, variable.defaultValue);
      
      const currentValue = getByPath(currentData, cleanKey);
      nextData = setByPath(nextData, cleanKey, currentValue !== undefined ? currentValue : variable.defaultValue);
    }

    set({
      data: nextData,
      defaults: nextDefaults,
      variableScopes: nextScopes,
    });
  },
}));

// Helper functions for merging schemas
const isObject = (item: unknown): boolean => {
  return typeof item === "object" && item !== null && !Array.isArray(item);
};

const deepMerge = (target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> => {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceVal = source[key];
      const targetVal = target[key];
      if (isObject(sourceVal)) {
        if (!(key in target)) {
          output[key] = sourceVal;
        } else {
          output[key] = deepMerge(targetVal as Record<string, unknown>, sourceVal as Record<string, unknown>);
        }
      } else {
        output[key] = sourceVal;
      }
    });
  }
  return output;
};
