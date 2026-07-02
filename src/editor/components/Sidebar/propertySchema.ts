import { PropertyConfig } from "../types";

export const propertySchema: PropertyConfig[] = [
  { key: "width", name: "Width (px)", type: "number", target: "props", section: "Layout" },
  { key: "collapsedWidth", name: "Collapsed Width (px)", type: "number", target: "props", section: "Layout" },
  { key: "collapsible", name: "Collapsible", type: "boolean", target: "props", section: "Layout" },
  { key: "collapsed", name: "Collapsed (State Variable)", type: "boolean", target: "props", section: "Layout" },
  { key: "defaultCollapsed", name: "Default Collapsed", type: "boolean", target: "props", section: "Layout" },
  { key: "reverseArrow", name: "Reverse Arrow", type: "boolean", target: "props", section: "Layout" },
  {
    key: "breakpoint",
    name: "Breakpoint",
    type: "enum",
    target: "props",
    section: "Layout",
    enum: ["xs", "sm", "md", "lg", "xl", "xxl"],
  },
  {
    key: "theme",
    name: "Theme",
    type: "enum",
    target: "props",
    section: "Styles",
    enum: ["light", "dark"],
  },
];
