import { BuilderComponent } from "../types";
import { metadata } from "./metadata";
import { defaultProps, defaultStyles } from "./defaultProps";
import { propertySchema } from "./property";
import { Renderer } from "./renderer";
import { codeGenerator } from "./generator";

export const FlexComponent: BuilderComponent = {
  metadata,
  defaultProps,
  defaultStyles,
  propertySchema,
  validator: {
    canAcceptChild: () => true, // Flex accepts all components
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onClick", "onMouseEnter", "onMouseLeave"],
  renderer: Renderer,
  codeGenerator,
};

export default FlexComponent;
