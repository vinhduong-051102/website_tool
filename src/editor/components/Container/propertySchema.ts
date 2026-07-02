import { PropertyConfig } from "../types";

export const propertySchema: PropertyConfig[] = [
  { key: "name", name: "Container Name", type: "string", target: "props", section: "Content" },
  {
    key: "display",
    name: "Display",
    type: "enum",
    target: "styles",
    section: "Layout",
    enum: ["flex", "block", "none"],
  },
  {
    key: "flexDirection",
    name: "Direction",
    type: "enum",
    target: "styles",
    section: "Layout",
    enum: ["row", "column"],
  },
  {
    key: "justifyContent",
    name: "Justify Content",
    type: "enum",
    target: "styles",
    section: "Layout",
    enum: ["flex-start", "center", "flex-end", "space-between", "space-around"],
  },
  {
    key: "alignItems",
    name: "Align Items",
    type: "enum",
    target: "styles",
    section: "Layout",
    enum: ["stretch", "flex-start", "center", "flex-end"],
  },
  { key: "gap", name: "Gap", type: "string", target: "styles", section: "Layout" },
];
