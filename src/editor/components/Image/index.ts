import { BuilderComponent } from "../types";
import { metadata } from "./metadata";
import { defaultProps, defaultStyles } from "./defaultProps";
import { propertySchema } from "./property";
import { Renderer } from "./renderer";
import { codeGenerator } from "./generator";

export const ImageComponent: BuilderComponent = {
  metadata,
  defaultProps,
  defaultStyles,
  propertySchema,
  validator: {
    canAcceptChild: () => false, // Image does not accept children
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onClick", "onLoad", "onError"],
  renderer: Renderer,
  codeGenerator,
};

export default ImageComponent;
