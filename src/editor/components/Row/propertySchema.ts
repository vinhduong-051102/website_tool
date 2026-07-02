import { PropertyConfig } from "../types";

export const propertySchema: PropertyConfig[] = [
  { key: "gutter", name: "Gutter Space", type: "number", target: "props", section: "Layout" },
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
    name: "Align Vertically",
    type: "enum",
    target: "props",
    section: "Layout",
    enum: ["top", "middle", "bottom", "stretch"],
  },
  { key: "wrap", name: "Wrap Columns", type: "boolean", target: "props", section: "Layout" },
];
