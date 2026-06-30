import { ASTNode, Page, StateVariable, BindingConfig, EventConfig } from "../types";

// Helper to get safe javascript path for a binding, e.g. state.currentUser?.name
export const getBindingExpression = (binding: BindingConfig): string => {
  const parts = binding.expression.split(".");
  const safePath = "state." + parts.join("?.");

  if (binding.transform) {
    switch (binding.transform) {
      case "!value":
        return `!${safePath}`;
      case "String":
        return `String(${safePath})`;
      case "Number":
        return `Number(${safePath})`;
      case "Boolean":
        return `Boolean(${safePath})`;
      case "JSON":
        return `JSON.stringify(${safePath})`;
      default:
        return safePath;
    }
  }
  return safePath;
};

// Traverses AST to find all modal node IDs
export const collectModalIds = (node: ASTNode, modalIds: Set<string> = new Set()): Set<string> => {
  if (node.type === "Modal") {
    modalIds.add(node.id);
  }
  if (node.children) {
    node.children.forEach((child) => collectModalIds(child, modalIds));
  }
  return modalIds;
};

// Build nested initial state from schema and modals
export const buildInitialStateCode = (schema: StateVariable[], rootNode: ASTNode): string => {
  const state: Record<string, any> = {};

  // Add state schema variables
  schema.forEach((v) => {
    const keys = v.key.split(".");
    let current = state;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) current[key] = {};
      current = current[key];
    }
    current[keys[keys.length - 1]] = v.defaultValue;
  });

  // Add modal states (controlled via state.modal.[id].open)
  const modalIds = collectModalIds(rootNode);
  if (modalIds.size > 0) {
    state.modal = state.modal || {};
    modalIds.forEach((id) => {
      state.modal[id] = { open: false };
    });
  }

  return JSON.stringify(state, null, 2);
};

// Generate event handler function name
export const getHandlerName = (nodeId: string, eventName: string): string => {
  const cleanId = nodeId.replace(/[^a-zA-Z0-9]/g, "_");
  return `handle_${cleanId}_${eventName}`;
};

// Generate JS code for a single event handler function
export const generateEventHandlerCode = (node: ASTNode, eventConfig: EventConfig): string => {
  const handlerName = getHandlerName(node.id, eventConfig.event);
  let body = "";

  eventConfig.actions.forEach((action) => {
    body += `    // Action: ${action.type}\n`;
    switch (action.type) {
      case "set-state": {
        const path = action.params.targetPath;
        const valExpr = action.params.valueExpression;
        body += `    updateState("${path}", ${valExpr});\n`;
        break;
      }
      case "call-api": {
        const url = action.params.url;
        const method = action.params.method || "GET";
        const bodyExpr = action.params.bodyExpression;
        const resPath = action.params.responsePath;

        body += `    try {\n`;
        body += `      const res = await fetch("${url}", {\n`;
        body += `        method: "${method}",\n`;
        body += `        headers: { "Content-Type": "application/json" },\n`;
        if (bodyExpr) {
          body += `        body: JSON.stringify(${bodyExpr}),\n`;
        }
        body += `      });\n`;
        body += `      const resData = await res.json();\n`;
        if (resPath) {
          body += `      updateState("${resPath}", resData);\n`;
        }
        body += `    } catch (err) {\n`;
        body += `      console.error("API Call error:", err);\n`;
        body += `    }\n`;
        break;
      }
      case "show-alert": {
        const msg = action.params.message || "";
        body += `    alert(${JSON.stringify(msg)});\n`;
        break;
      }
      case "redirect": {
        const dest = action.params.url || "";
        body += `    window.location.href = ${JSON.stringify(dest)};\n`;
        break;
      }
      case "console-log": {
        const expr = action.params.messageExpression || '""';
        body += `    console.log(${expr});\n`;
        break;
      }
      case "open-modal": {
        const mId = action.params.modalId;
        body += `    updateState("modal.${mId}.open", true);\n`;
        break;
      }
      case "close-modal": {
        const mId = action.params.modalId;
        body += `    updateState("modal.${mId}.open", false);\n`;
        break;
      }
      default:
        body += `    // Unsupported action type: ${action.type}\n`;
    }
    body += `\n`;
  });

  return `  const ${handlerName} = async (e: any) => {\n    const event = e;\n${body}  };`;
};

// Traverse AST to collect all event handlers
export const generateAllEventHandlers = (node: ASTNode, codes: string[] = []): string[] => {
  if (node.events && node.events.length > 0) {
    node.events.forEach((evt) => {
      if (evt.actions && evt.actions.length > 0) {
        codes.push(generateEventHandlerCode(node, evt));
      }
    });
  }

  if (node.children) {
    node.children.forEach((child) => generateAllEventHandlers(child, codes));
  }

  return codes;
};

// Post-process the code generator output of a node to apply bindings & events
export const postProcessNodeCode = (node: ASTNode, baseCode: string): string => {
  let processed = baseCode;

  // 1. Process Event Handlers (Attributes on root tag)
  if (node.events && node.events.length > 0) {
    node.events.forEach((evt) => {
      if (evt.actions && evt.actions.length > 0) {
        const handlerName = getHandlerName(node.id, evt.event);
        const attrName = evt.event; // e.g. onClick

        // Insert into the root opening tag
        const tagRegex = /^(\s*<[a-zA-Z0-9\-]+)([^>]*)(>)/;
        const match = processed.match(tagRegex);
        if (match) {
          const opening = match[1];
          const attrs = match[2];
          const closing = match[3];

          // Check if attribute already exists, replace or append
          const attrRegex = new RegExp(`\\b${attrName}\\s*=\\s*(?:"[^"]*"|'[^']*'|{[^}]*})`, "g");
          let newAttrs = attrs;
          if (attrRegex.test(attrs)) {
            newAttrs = attrs.replace(attrRegex, `${attrName}={${handlerName}}`);
          } else {
            newAttrs = attrs + ` ${attrName}={${handlerName}}`;
          }

          processed = processed.replace(tagRegex, `${opening}${newAttrs}${closing}`);
        }
      }
    });
  }

  // 2. Process Data Bindings (Attributes and text contents)
  if (node.bindings && node.bindings.length > 0) {
    node.bindings.forEach((binding) => {
      const expr = getBindingExpression(binding);

      if (binding.prop === "text") {
        // Replace inner content between opening and closing tag of the root element
        // e.g. <span ...>Hello</span> -> <span ...>{state.path}</span>
        const innerRegex = /^(\s*<[a-zA-Z0-9\-]+[^>]*>)([\s\S]*)(<\/[a-zA-Z0-9\-]+>\s*)$/;
        const match = processed.match(innerRegex);
        if (match) {
          const opening = match[1];
          const closing = match[3];
          processed = `${opening}{${expr}}${closing}`;
        }
      } else {
        // Tag attribute binding (e.g. href, src, placeholder, disabled)
        const attrName = binding.prop;
        const tagRegex = /^(\s*<[a-zA-Z0-9\-]+)([^>]*)(>)/;
        const match = processed.match(tagRegex);
        if (match) {
          const opening = match[1];
          const attrs = match[2];
          const closing = match[3];

          const attrRegex = new RegExp(`\\b${attrName}\\s*=\\s*(?:"[^"]*"|'[^']*'|{[^}]*})`, "g");
          let newAttrs = attrs;
          if (attrRegex.test(attrs)) {
            newAttrs = attrs.replace(attrRegex, `${attrName}={${expr}}`);
          } else {
            newAttrs = attrs + ` ${attrName}={${expr}}`;
          }

          processed = processed.replace(tagRegex, `${opening}${newAttrs}${closing}`);
        }
      }
    });
  }

  return processed;
};
