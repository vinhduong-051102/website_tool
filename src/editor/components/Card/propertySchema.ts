import { PropertyConfig } from "../types";

export const propertySchema: PropertyConfig[] = [
  { key: "title", name: "Card Title", type: "string", target: "props", section: "Content" },
  { key: "bordered", name: "Bordered", type: "boolean", target: "props", section: "Layout" },
  { key: "hoverable", name: "Hoverable", type: "boolean", target: "props", section: "Layout" },
  {
    key: "size",
    name: "Size",
    type: "enum",
    target: "props",
    section: "Layout",
    enum: ["default", "small"],
  },
  { key: "loading", name: "Loading State", type: "boolean", target: "props", section: "Layout" },
];
