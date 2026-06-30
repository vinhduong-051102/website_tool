import { PropertyConfig } from "../types";

export const propertySchema: PropertyConfig[] = [
  {
    key: "gap",
    name: "Flex Gap",
    type: "text",
    target: "styles",
    defaultValue: "16px",
    section: "Layout",
  },
  {
    key: "padding",
    name: "Padding",
    type: "text",
    target: "styles",
    defaultValue: "8px",
    section: "Layout",
  },
  {
    key: "backgroundColor",
    name: "BG Color",
    type: "color",
    target: "styles",
    defaultValue: "transparent",
    section: "Styles",
  },
];
