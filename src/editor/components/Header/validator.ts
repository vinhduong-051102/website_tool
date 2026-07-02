import { ComponentValidator } from "../types";

export const validator: ComponentValidator = {
  canAcceptChild: () => true,
  canBeDroppedIn: (parentType: string) => parentType === "Layout",
};

export default validator;
