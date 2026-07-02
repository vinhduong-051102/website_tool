import { PropertyConfig } from "../types";
import { commonFormProperties, validationSchemaProperties } from "../FormHelper";

export const propertySchema: PropertyConfig[] = [
  ...commonFormProperties,
  ...validationSchemaProperties,
];
