import { PropertyConfig } from "../types";

export const propertySchema: PropertyConfig[] = [
  { key: "vertical", name: "Vertical Layout", type: "boolean", target: "props", section: "Layout" },
  {
    key: "justify",
    name: "Justify Alignment",
    type: "enum",
    target: "props",
    section: "Layout",
    enum: ["start", "end", "center", "space-between", "space-around", "space-evenly"],
  },
  {
    key: "align",
    name: "Align Items",
    type: "enum",
    target: "props",
    section: "Layout",
    enum: ["start", "end", "center", "baseline", "stretch"],
  },
  {
    key: "wrap",
    name: "Wrap Mode",
    type: "enum",
    target: "props",
    section: "Layout",
    enum: ["nowrap", "wrap", "wrap-reverse"],
  },
  {
    key: "gap",
    name: "Gap Size",
    type: "enum",
    target: "props",
    section: "Layout",
    enum: ["small", "middle", "large"],
  },
  { key: "flex", name: "Flex Value", type: "string", target: "props", section: "Layout" },
];
