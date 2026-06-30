import React from "react";

export type Breakpoint = "desktop" | "tablet" | "mobile";

export interface BreakpointStyles {
  desktop?: React.CSSProperties;
  tablet?: React.CSSProperties;
  mobile?: React.CSSProperties;
}

export interface ASTNode {
  id: string;
  type: string;
  props: Record<string, unknown>;
  styles: BreakpointStyles;
  children?: ASTNode[];
}

export interface Page {
  id: string;
  name: string;
  path: string;
  ast: ASTNode;
}

export interface Command {
  name: string;
  execute(): void;
  undo(): void;
}
