import { ComponentValidator } from "../types";

export const validator: ComponentValidator = {
  canAcceptChild: (childType: string) => childType === "Column",
  canBeDroppedIn: () => true,
};

export default validator;
