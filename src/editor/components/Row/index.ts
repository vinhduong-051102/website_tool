import { BuilderComponent } from "../types";
import { metadata } from "./metadata";
import { defaultProps, defaultStyles } from "./defaultProps";
import { propertySchema } from "./property";
import { Renderer } from "./renderer";
import { codeGenerator } from "./generator";

export const RowComponent: BuilderComponent = {
  metadata,
  defaultProps,
  defaultStyles,
  propertySchema,
  validator: {
    canAcceptChild: (childType) => childType === "Column", // Strict Row -> Column validation
    canBeDroppedIn: () => true,
  },
  renderer: Renderer,
  codeGenerator,
};

export default RowComponent;
