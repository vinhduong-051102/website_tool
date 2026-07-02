import { PropertyConfig } from "../types";
import { commonFormProperties, validationSchemaProperties } from "../FormHelper";

export const propertySchema: PropertyConfig[] = [
  ...commonFormProperties,
  { key: "enterButton", name: "Show Button", type: "boolean", target: "props", section: "Content" },
  ...validationSchemaProperties,
];
