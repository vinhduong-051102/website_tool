import { PropertyConfig } from "../types";

export const propertySchema: PropertyConfig[] = [
  {
    key: "src",
    name: "Image URL",
    type: "text",
    target: "props",
    defaultValue: "https://images.unsplash.com/...",
    section: "Content",
  },
  {
    key: "alt",
    name: "Alt Text",
    type: "text",
    target: "props",
    defaultValue: "Placeholder Abstract Art",
    section: "Content",
  },
  {
    key: "width",
    name: "Width",
    type: "text",
    target: "styles",
    defaultValue: "100%",
    section: "Layout",
  },
  {
    key: "height",
    name: "Height",
    type: "text",
    target: "styles",
    defaultValue: "auto",
    section: "Layout",
  },
  {
    key: "borderRadius",
    name: "Rounded Radius",
    type: "text",
    target: "styles",
    defaultValue: "8px",
    section: "Styles",
  },
];
