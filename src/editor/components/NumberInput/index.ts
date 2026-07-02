import { BuilderComponent } from "../types";
import { metadata } from "./metadata";
import { defaultProps, defaultStyles } from "./defaultProps";
import { propertySchema } from "./propertySchema";
import { Renderer } from "./renderer";
import { codeGenerator } from "./generator";
import { validator } from "./validator";

export const NumberInputComponent: BuilderComponent = {
  metadata,
  defaultProps,
  defaultStyles,
  propertySchema,
  validator,
  supportedEvents: ["onChange", "onFocus", "onBlur", "onClick"],
  renderer: Renderer,
  codeGenerator,
};

export default NumberInputComponent;
