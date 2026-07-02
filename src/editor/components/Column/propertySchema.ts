import { PropertyConfig } from "../types";

export const propertySchema: PropertyConfig[] = [
  { key: "span", name: "Span (1-24)", type: "number", target: "props", section: "Layout" },
  { key: "offset", name: "Offset (1-24)", type: "number", target: "props", section: "Layout" },
  { key: "order", name: "Order", type: "number", target: "props", section: "Layout" },
  { key: "push", name: "Push", type: "number", target: "props", section: "Layout" },
  { key: "pull", name: "Pull", type: "number", target: "props", section: "Layout" },
  { key: "flex", name: "Flex value", type: "string", target: "props", section: "Layout" },
  { key: "xs", name: "Span (XS Screen)", type: "number", target: "props", section: "Layout" },
  { key: "sm", name: "Span (SM Screen)", type: "number", target: "props", section: "Layout" },
  { key: "md", name: "Span (MD Screen)", type: "number", target: "props", section: "Layout" },
  { key: "lg", name: "Span (LG Screen)", type: "number", target: "props", section: "Layout" },
  { key: "xl", name: "Span (XL Screen)", type: "number", target: "props", section: "Layout" },
  { key: "xxl", name: "Span (XXL Screen)", type: "number", target: "props", section: "Layout" },
];
