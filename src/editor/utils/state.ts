import { StateVariable } from "../types";

export interface StateTreeItem {
  title: string;
  value: string; // The dot path, e.g. "form.login.email"
  key: string;
  type: "string" | "number" | "boolean" | "object" | "array";
  children?: StateTreeItem[];
  selectable?: boolean;
}

/**
 * Builds a hierarchical tree from a flat list of StateVariable objects.
 */
export const buildStateTree = (stateSchema: StateVariable[]): StateTreeItem[] => {
  const root: StateTreeItem[] = [];

  const addPath = (
    parts: string[],
    index: number,
    type: StateVariable["type"],
    currentLevel: StateTreeItem[],
    fullPathPrefix: string[]
  ) => {
    const part = parts[index];
    const isLast = index === parts.length - 1;
    const currentFullPath = [...fullPathPrefix, part].join(".");

    let existing = currentLevel.find((item) => item.title === part);
    if (!existing) {
      existing = {
        title: part,
        value: currentFullPath,
        key: currentFullPath,
        type: isLast ? type : "object",
        selectable: isLast,
        children: isLast ? undefined : [],
      };
      currentLevel.push(existing);
    } else {
      if (isLast) {
        existing.type = type;
        existing.selectable = true;
      }
    }

    if (!isLast && existing.children) {
      addPath(parts, index + 1, type, existing.children, [...fullPathPrefix, part]);
    }
  };

  stateSchema.forEach((v) => {
    const parts = v.key.split(".");
    addPath(parts, 0, v.type, root, []);
  });

  return root;
};

/**
 * Flatten the tree to get all dot-notated paths and their resolved types.
 */
export const getAllStatePaths = (stateSchema: StateVariable[]): { path: string; type: string }[] => {
  const tree = buildStateTree(stateSchema);
  const result: { path: string; type: string }[] = [];

  const traverse = (items: StateTreeItem[]) => {
    items.forEach((item) => {
      result.push({ path: item.value, type: item.type });
      if (item.children) {
        traverse(item.children);
      }
    });
  };

  traverse(tree);
  return result;
};

/**
 * Checks if a state variable type is compatible with a property key and type.
 */
export const isStateCompatible = (
  propKey: string,
  propType: string,
  stateType: string
): boolean => {
  const lowerKey = propKey.toLowerCase();
  
  if (
    lowerKey === "checked" ||
    lowerKey === "visible" ||
    lowerKey === "required" ||
    lowerKey === "disabled" ||
    lowerKey === "readonly" ||
    propType === "switch"
  ) {
    return stateType === "boolean";
  }
  
  if (lowerKey === "options" || lowerKey === "datasource") {
    return stateType === "array";
  }

  if (propType === "number" || propType === "slider") {
    return stateType === "number";
  }

  if (propType === "text" || propType === "textarea" || propType === "color") {
    return stateType === "string" || stateType === "number" || stateType === "boolean";
  }

  if (propType === "select") {
    return stateType === "string" || stateType === "number";
  }

  return true;
};
