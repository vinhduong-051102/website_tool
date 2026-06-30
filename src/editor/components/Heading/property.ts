import { PropertyConfig } from "../types";

export const propertySchema: PropertyConfig[] = [
  {
    key: "text",
    name: "Heading Text",
    type: "text",
    target: "props",
    defaultValue: "Heading Title",
    section: "Content",
  },
  {
    key: "tag",
    name: "Heading Tag",
    type: "select",
    target: "props",
    defaultValue: "h2",
    options: [
      { label: "Heading 1 (h1)", value: "h1" },
      { label: "Heading 2 (h2)", value: "h2" },
      { label: "Heading 3 (h3)", value: "h3" },
      { label: "Heading 4 (h4)", value: "h4" },
    ],
    section: "Content",
  },
  {
    key: "fontSize",
    name: "Font Size",
    type: "text",
    target: "styles",
    defaultValue: "24px",
    section: "Typography",
  },
  {
    key: "fontWeight",
    name: "Weight",
    type: "select",
    target: "styles",
    defaultValue: "700",
    options: [
      { label: "Medium", value: "500" },
      { label: "Semibold", value: "600" },
      { label: "Bold", value: "700" },
      { label: "Extra Bold", value: "800" },
    ],
    section: "Typography",
  },
  {
    key: "color",
    name: "Text Color",
    type: "color",
    target: "styles",
    defaultValue: "#ffffff",
    section: "Styles",
  },
];
