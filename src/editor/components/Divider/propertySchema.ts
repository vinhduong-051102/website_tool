import { PropertyConfig } from "../types";

export const propertySchema: PropertyConfig[] = [
  {
    key: "type",
    name: "Type",
    type: "enum",
    target: "props",
    section: "Layout",
    enum: ["horizontal", "vertical"],
  },
  {
    key: "orientation",
    name: "Orientation",
    type: "enum",
    target: "props",
    section: "Layout",
    enum: ["left", "right", "center"],
  },
  { key: "dashed", name: "Dashed", type: "boolean", target: "props", section: "Layout" },
  { key: "plain", name: "Plain Text", type: "boolean", target: "props", section: "Layout" },
];
