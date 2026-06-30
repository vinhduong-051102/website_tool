import { PropertyConfig } from "../types";

export const propertySchema: PropertyConfig[] = [
  {
    key: "flex",
    name: "Flex Sizing",
    type: "text",
    target: "styles",
    defaultValue: "1",
    section: "Layout",
  },
  {
    key: "width",
    name: "Width",
    type: "text",
    target: "styles",
    defaultValue: "",
    section: "Layout",
  },
  {
    key: "padding",
    name: "Padding",
    type: "text",
    target: "styles",
    defaultValue: "16px",
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
