import React from "react";
import { ASTNode } from "../types";

export interface PropertyConfig {
  key: string;               // Key path in props or styles
  name: string;              // Human-readable label
  type: "string" | "number" | "boolean" | "enum" | "color" | "textarea" | "object" | "array" | "select" | "text" | "switch" | "slider";
  target: "props" | "styles"; // Where to update (props or styles)
  defaultValue?: unknown;
  options?: { label: string; value: unknown }[]; // For old select dropdowns
  enum?: (string | { label: string; value: unknown })[]; // For new enum options
  min?: number;              // For slider/number
  max?: number;              // For slider/number
  step?: number;             // For slider/number
  description?: string;
  category?: string;
  section: "Content" | "Layout" | "Typography" | "Styles"; // Tab or accordion section
}

export interface ComponentValidator {
  canAcceptChild?: (childType: string) => boolean;
  canBeDroppedIn?: (parentType: string) => boolean;
  validateProps?: (props: Record<string, unknown>) => string | null; // Returns null if valid
}

export interface ComponentMetadata {
  type: string;              // Unique identifier (e.g. Button)
  name: string;              // Display name
  category: "Layout" | "Basic" | "Form" | "Media";
  icon: string;              // Lucide icon name or emoji
}

export interface BuilderComponent {
  metadata: ComponentMetadata;
  defaultProps: Record<string, unknown>;
  defaultStyles: Record<string, unknown>; // Baseline styles
  propertySchema: PropertyConfig[];
  validator: ComponentValidator;
  supportedEvents: string[];             // Events this component can handle (e.g. ["onClick", "onFocus"])
  renderer: React.ComponentType<{
    node: ASTNode;
    isSelected: boolean;
    isHovered: boolean;
    isOver?: boolean;
    children?: React.ReactNode;
  }>;
  codeGenerator: (
    node: ASTNode,
    childrenCode: string,
    breakpointStylesCode?: string
  ) => string;
}
