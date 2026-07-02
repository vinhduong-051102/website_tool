import { BuilderComponent } from "../types";
import { metadata } from "./metadata";
import { defaultProps, defaultStyles } from "./defaultProps";
import { propertySchema } from "./propertySchema";
import { Renderer } from "./renderer";
import { codeGenerator } from "./generator";
import { validator } from "./validator";

export const FooterComponent: BuilderComponent = {
  metadata,
  defaultProps,
  defaultStyles,
  propertySchema,
  validator,
  supportedEvents: ["onClick", "onMouseEnter", "onMouseLeave"],
  renderer: Renderer,
  codeGenerator,
};

export default FooterComponent;
