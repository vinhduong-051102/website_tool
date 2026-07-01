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
    canAcceptChild: () => true, // Loading can now accept any child components
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onClick"],
  renderer: Renderer,
  codeGenerator,
};

export default LoadingComponent;
