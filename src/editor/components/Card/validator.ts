import { ComponentValidator } from "../types";

export const validator: ComponentValidator = {
  canAcceptChild: () => true,
  canBeDroppedIn: () => true,
};

export default validator;
