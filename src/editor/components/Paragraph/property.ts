import { PropertyConfig } from "../types";

export const propertySchema: PropertyConfig[] = [
  {
    key: "text",
    name: "Body Content",
    type: "textarea",
    target: "props",
    defaultValue: "Lorem ipsum dolor sit amet...",
    section: "Content",
  },
  {
    key: "fontSize",
    name: "Font Size",
    type: "text",
    target: "styles",
    defaultValue: "14px",
    section: "Typography",
  },
  {
    key: "fontWeight",
    name: "Weight",
    type: "select",
    target: "styles",
    defaultValue: "400",
    options: [
      { label: "Light (300)", value: "300" },
      { label: "Normal (400)", value: "400" },
      { label: "Medium (500)", value: "500" },
    ],
    section: "Typography",
  },
  {
    key: "lineHeight",
    name: "Line Height",
    type: "text",
    target: "styles",
    defaultValue: "1.6",
    section: "Typography",
  },
  {
    key: "color",
    name: "Text Color",
    type: "color",
    target: "styles",
    defaultValue: "#9ca3af",
    section: "Styles",
  },
];
