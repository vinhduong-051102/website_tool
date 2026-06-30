import { BuilderComponent } from "../types";
import { metadata } from "./metadata";
import { defaultProps, defaultStyles } from "./defaultProps";
import { propertySchema } from "./property";
import { Renderer } from "./renderer";
import { codeGenerator } from "./generator";

export const TextComponent: BuilderComponent = {
  metadata,
  defaultProps,
  defaultStyles,
  propertySchema,
  validator: {
    canAcceptChild: () => false, // Text does not accept children
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onClick"],
  renderer: Renderer,
  codeGenerator,
};

export default TextComponent;
