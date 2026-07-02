import { PropertyConfig } from "../types";
import { commonFormProperties, validationSchemaProperties } from "../FormHelper";

export const propertySchema: PropertyConfig[] = [
  ...commonFormProperties,
  { key: "min", name: "Min Value", type: "number", target: "props", section: "Content" },
  { key: "max", name: "Max Value", type: "number", target: "props", section: "Content" },
  { key: "step", name: "Step Interval", type: "number", target: "props", section: "Content" },
  ...validationSchemaProperties,
];
