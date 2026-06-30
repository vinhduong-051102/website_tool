import { BuilderComponent } from "../types";
import { metadata } from "./metadata";
import { defaultProps, defaultStyles } from "./defaultProps";
import { propertySchema } from "./property";
import { Renderer } from "./renderer";
import { codeGenerator } from "./generator";

export const ContainerComponent: BuilderComponent = {
  metadata,
  defaultProps,
  defaultStyles,
  propertySchema,
  validator: {
    canAcceptChild: () => true, // Container accepts all components
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onClick", "onScroll"],
  renderer: Renderer,
  codeGenerator,
};

export default ContainerComponent;
