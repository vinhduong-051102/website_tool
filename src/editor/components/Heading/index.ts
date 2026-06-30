import { BuilderComponent } from "../types";
import { metadata } from "./metadata";
import { defaultProps, defaultStyles } from "./defaultProps";
import { propertySchema } from "./property";
import { Renderer } from "./renderer";
import { codeGenerator } from "./generator";

export const HeadingComponent: BuilderComponent = {
  metadata,
  defaultProps,
  defaultStyles,
  propertySchema,
  validator: {
    canAcceptChild: () => false, // Heading does not accept children
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onClick"],
  renderer: Renderer,
  codeGenerator,
};

export default HeadingComponent;
