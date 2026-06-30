import { BindingConfig } from "../types";

/**
 * Resolve data bindings against global state, merging bound values into the node's props.
 * Original props are preserved as defaults; bindings override them.
 */
export const resolveBindings = (
  bindings: BindingConfig[] | undefined,
  originalProps: Record<string, unknown>,
  getState: (path: string) => unknown
): Record<string, unknown> => {
  if (!bindings || bindings.length === 0) return originalProps;

  const resolved = { ...originalProps };

  for (const binding of bindings) {
    let value = getState(binding.expression);

    // Apply transform if specified
    if (binding.transform) {
      switch (binding.transform) {
        case "!value":
          value = !value;
          break;
        case "String":
          value = String(value ?? "");
          break;
        case "Number":
          value = Number(value);
          break;
        case "Boolean":
          value = Boolean(value);
          break;
        case "JSON":
          value = JSON.stringify(value);
          break;
        default:
          break;
      }
    }

    // Only override if the binding resolved to a non-undefined value
    if (value !== undefined) {
      resolved[binding.prop] = value;
    }
  }

  return resolved;
};
