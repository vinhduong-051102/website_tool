import { BuilderComponent } from "../types";
import { metadata } from "./metadata";
import { defaultProps, defaultStyles } from "./defaultProps";
import { propertySchema } from "./property";
import { Renderer } from "./renderer";
import { codeGenerator } from "./generator";

export const LoadingComponent: BuilderComponent = {
  metadata,
  defaultProps,
  defaultStyles,
  propertySchema,
  validator: {
    canAcceptChild: () => false, // Loading does not accept children
    canBeDroppedIn: () => true,
  },
  supportedEvents: [],
  renderer: Renderer,
  codeGenerator,
};

export default LoadingComponent;
