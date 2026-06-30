import { BuilderComponent } from "../types";
import { metadata } from "./metadata";
import { defaultProps, defaultStyles } from "./defaultProps";
import { propertySchema } from "./property";
import { Renderer } from "./renderer";
import { codeGenerator } from "./generator";

export const ColumnComponent: BuilderComponent = {
  metadata,
  defaultProps,
  defaultStyles,
  propertySchema,
  validator: {
    canAcceptChild: () => true,
    canBeDroppedIn: (parentType) => parentType === "Row", // Strictly enforces Column -> Row hierarchy
  },
  renderer: Renderer,
  codeGenerator,
};

export default ColumnComponent;
