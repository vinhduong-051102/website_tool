import React from "react";

export type Breakpoint = "desktop" | "tablet" | "mobile";

export interface BreakpointStyles {
  desktop?: React.CSSProperties;
  tablet?: React.CSSProperties;
  mobile?: React.CSSProperties;
}

// ─── Event & Action Types ────────────────────────────────────────────

/** A single action instance within an event handler chain */
export interface EventActionConfig {
  id: string;                          // Unique action instance ID
  type: string;                        // Action type key (e.g. "setState", "callApi")
  params: Record<string, unknown>;     // Action-specific parameters
  condition?: {
    enabled: boolean;
    statePath: string;
    operator: "truthy" | "falsy" | "equals" | "notEquals" | "gt" | "lt";
    compareValue?: string;
  };
}

/** Event configuration stored on each AST node */
export interface EventConfig {
  event: string;                       // e.g. "onClick", "onChange", "onSubmit"
  actions: EventActionConfig[];        // Ordered list of actions to execute
}

// ─── Data Binding Types ──────────────────────────────────────────────

/** Data binding configuration stored on each AST node */
export interface BindingConfig {
  prop: string;                        // Target prop key (e.g. "text", "disabled", "src")
  expression: string;                  // State path expression (e.g. "currentUser.name")
  transform?: string;                  // Optional transform ("!value" for negation, etc.)
}

// ─── AST Node ────────────────────────────────────────────────────────

export interface ASTNode {
  id: string;
  type: string;
  props: Record<string, unknown> & {
    linkToPageId?: string;
    linkRouteParams?: string;
    linkQueryParams?: string;
    linkNewTab?: boolean;
  };
  styles: BreakpointStyles;
  children?: ASTNode[];
  events?: EventConfig[];              // Event handler chains
  bindings?: BindingConfig[];          // Data binding declarations
}

// ─── Global State Schema ─────────────────────────────────────────────

/** Declares a runtime state variable (stored at project/page level) */
export interface StateVariable {
  key: string;                         // Dot-notated path (e.g. "form.login.email")
  defaultValue: unknown;               // Initial value
  type: "string" | "number" | "boolean" | "object" | "array";
}

// ─── Layout ──────────────────────────────────────────────────────────

export interface Layout {
  id: string;
  name: string;
  regions: {
    header: boolean;
    sidebar: boolean;
    footer: boolean;
  };
  config: {
    headerHeight?: string;
    headerFixed?: boolean;
    headerBg?: string;
    headerBorder?: string;
    headerShadow?: string;

    sidebarWidth?: string;
    sidebarPosition?: "left" | "right";
    sidebarCollapsed?: boolean;
    sidebarBg?: string;
    sidebarFixed?: boolean;
    sidebarCollapsible?: boolean;

    footerHeight?: string;
    footerBg?: string;
    footerFixed?: boolean;

    layoutPadding?: string;
    layoutGap?: string;
    layoutBg?: string;
    layoutMaxWidth?: string;
  };
  headerAST: ASTNode;
  sidebarAST: ASTNode;
  footerAST: ASTNode;
}

// ─── Page ────────────────────────────────────────────────────────────

export interface Page {
  id: string;
  name: string;
  path: string;
  ast: ASTNode;
  stateSchema?: StateVariable[];       // Per-page state declarations
  layoutId?: string;                   // Linked layout ID
}

// ─── Project ─────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  template?: string;
  pages: Page[];
  layouts?: Layout[];
  apis: { name: string; url: string; method: string; headers?: string; body?: string }[];
  env?: Record<string, string>;
  theme?: Record<string, unknown>;
}

// ─── Command (Undo/Redo) ─────────────────────────────────────────────

export interface Command {
  name: string;
  execute(): void;
  undo(): void;
}
