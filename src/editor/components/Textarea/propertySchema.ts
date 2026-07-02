import { PropertyConfig } from "../types";
import { commonFormProperties, validationSchemaProperties } from "../FormHelper";

export const propertySchema: PropertyConfig[] = [
  ...commonFormProperties,
  { key: "rows", name: "Text Rows", type: "number", target: "props", section: "Content" },
  ...validationSchemaProperties,
];
