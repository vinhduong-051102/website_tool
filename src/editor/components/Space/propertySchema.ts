import { PropertyConfig } from "../types";

export const propertySchema: PropertyConfig[] = [
  {
    key: "direction",
    name: "Direction",
    type: "enum",
    target: "props",
    section: "Layout",
    enum: ["horizontal", "vertical"],
  },
  {
    key: "size",
    name: "Size",
    type: "enum",
    target: "props",
    section: "Layout",
    enum: ["small", "middle", "large"],
  },
  {
    key: "align",
    name: "Align",
    type: "enum",
    target: "props",
    section: "Layout",
    enum: ["start", "end", "center", "baseline"],
  },
  { key: "wrap", name: "Wrap Elements", type: "boolean", target: "props", section: "Layout" },
];
