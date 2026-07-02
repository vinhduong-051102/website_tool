import { ComponentValidator } from "../types";

export const validator: ComponentValidator = {
  canAcceptChild: () => false,
  canBeDroppedIn: () => true,
};

export default validator;
