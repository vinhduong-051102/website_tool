import { PropertyConfig } from "../types";
import { commonFormProperties, validationSchemaProperties } from "../FormHelper";

export const propertySchema: PropertyConfig[] = [
  ...commonFormProperties,
  { key: "prefix", name: "Prefix Text", type: "string", target: "props", section: "Content" },
  { key: "suffix", name: "Suffix Text", type: "string", target: "props", section: "Content" },
  ...validationSchemaProperties,
];
