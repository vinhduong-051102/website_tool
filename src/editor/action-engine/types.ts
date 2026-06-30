import { EventActionConfig } from "../types";

/** Parameter schema for action configurator UI */
export interface ActionParamConfig {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "json" | "state-path" | "expression";
  placeholder?: string;
  defaultValue?: unknown;
  options?: { label: string; value: string }[];
  required?: boolean;
}

/** Context passed to every action handler during execution */
export interface ActionContext {
  /** Read/write runtime global state */
  getState: (path: string) => unknown;
  setState: (path: string, value: unknown) => void;
  toggleState: (path: string) => void;
  resetState: (path?: string) => void;
  /** Info about the triggering event */
  event: {
    nodeId: string;
    eventName: string;
    nativeEvent?: Event;
  };
  /** Dispatch a custom event on another component */
  dispatch: (targetNodeId: string, eventName: string) => Promise<void>;
}

/** Registered action handler */
export interface ActionHandler {
  type: string;
  label: string;
  icon: string;                           // Lucide icon name
  category: "State" | "UI" | "Navigation" | "Data" | "Flow" | "Utility";
  paramSchema: ActionParamConfig[];
  execute: (params: Record<string, unknown>, ctx: ActionContext) => Promise<void>;
}

/** Re-export for convenience */
export type { EventActionConfig };
