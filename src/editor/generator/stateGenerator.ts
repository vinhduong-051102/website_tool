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
      case "setState": {
        const path = action.params.path as string;
        const valueSource = (action.params.valueSource as string) || "event";
        if (valueSource === "event") {
          body += `    updateState("${path}", e);\n`;
        } else if (valueSource === "state") {
          const sourcePath = action.params.sourceStatePath as string;
          const parts = (sourcePath || "").split(".");
          const safePath = "state." + parts.join("?.");
          body += `    updateState("${path}", ${safePath});\n`;
        } else {
          // custom value
          let val = action.params.value;
          if (typeof val === "string") {
            try { val = JSON.parse(val as string); } catch { /* keep */ }
          }
          body += `    updateState("${path}", ${JSON.stringify(val)});\n`;
        }
        break;
      }
      case "toggleState": {
        const path = action.params.path as string;
        const parts = (path || "").split(".");
        const safePath = "state." + parts.join("?.");
        body += `    updateState("${path}", !${safePath});\n`;
        break;
      }
      case "resetState": {
        const path = action.params.path as string;
        if (path) {
          body += `    updateState("${path}", undefined); // Reset to default\n`;
        } else {
          body += `    setState({}); // Full reset\n`;
        }
        break;
      }
      case "callApi": {
        const url = action.params.url as string;
        const method = (action.params.method as string) || "GET";
        const reqBody = action.params.body;
        const headers = action.params.headers;
        const responsePath = action.params.responsePath as string;
        const errorPath = action.params.errorPath as string;

        body += `    try {\n`;
        body += `      const res = await fetch("${url}", {\n`;
        body += `        method: "${method}",\n`;
        if (headers) {
          body += `        headers: ${typeof headers === "string" ? headers : JSON.stringify(headers)},\n`;
        } else {
          body += `        headers: { "Content-Type": "application/json" },\n`;
        }
        if (reqBody && method !== "GET") {
          body += `        body: ${typeof reqBody === "string" ? reqBody : `JSON.stringify(${JSON.stringify(reqBody)})`},\n`;
        }
        body += `      });\n`;
        body += `      const resData = await res.json();\n`;
        if (responsePath) {
          body += `      updateState("${responsePath}", resData);\n`;
        }
        if (errorPath) {
          body += `      updateState("${errorPath}", null);\n`;
        }
        body += `    } catch (err) {\n`;
        if (errorPath) {
          body += `      updateState("${errorPath}", err.message);\n`;
        }
        body += `      console.error("API Call error:", err);\n`;
        body += `    }\n`;
        break;
      }
      case "showToast": {
        const msg = (action.params.message as string) || "";
        const toastType = (action.params.toastType as string) || "info";
        body += `    // showToast: "${toastType}"\n`;
        body += `    alert(${JSON.stringify(msg)}); // Replace with toast library\n`;
        break;
      }
      case "navigate": {
        const url = (action.params.url as string) || "";
        const target = (action.params.target as string) || "_self";
        if (target === "_blank") {
          body += `    window.open(${JSON.stringify(url)}, "_blank");\n`;
        } else {
          body += `    window.location.href = ${JSON.stringify(url)};\n`;
        }
        break;
      }
      case "openModal": {
        const mId = action.params.componentId as string;
        body += `    updateState("modal.${mId}.open", true);\n`;
        break;
      }
      case "closeModal": {
        const mId = action.params.componentId as string;
        body += `    updateState("modal.${mId}.open", false);\n`;
        break;
      }
      case "hideComponent": {
        const cId = action.params.componentId as string;
        body += `    updateState("visibility.${cId}", false);\n`;
        break;
      }
      case "showComponent": {
        const cId = action.params.componentId as string;
        body += `    updateState("visibility.${cId}", true);\n`;
        break;
      }
      case "copyToClipboard": {
        const text = (action.params.text as string) || "";
        body += `    navigator.clipboard.writeText(${JSON.stringify(text)});\n`;
        break;
      }
      case "delay": {
        const ms = Number(action.params.duration) || 1000;
        body += `    await new Promise(resolve => setTimeout(resolve, ${ms}));\n`;
        break;
      }
      case "runCondition": {
        const statePath = action.params.statePath as string;
        const operator = (action.params.operator as string) || "truthy";
        const compareValue = action.params.compareValue;
        const thenSetPath = action.params.thenSetPath as string;
        const thenSetValue = action.params.thenSetValue;
        const elseSetPath = action.params.elseSetPath as string;
        const elseSetValue = action.params.elseSetValue;

        const parts = (statePath || "").split(".");
        const safePath = "state." + parts.join("?.");

        let condition = "";
        switch (operator) {
          case "truthy": condition = `!!${safePath}`; break;
          case "falsy": condition = `!${safePath}`; break;
          case "equals": condition = `${safePath} === ${JSON.stringify(compareValue)}`; break;
          case "notEquals": condition = `${safePath} !== ${JSON.stringify(compareValue)}`; break;
          case "gt": condition = `Number(${safePath}) > ${Number(compareValue)}`; break;
          case "lt": condition = `Number(${safePath}) < ${Number(compareValue)}`; break;
          default: condition = `!!${safePath}`;
        }

        body += `    if (${condition}) {\n`;
        if (thenSetPath) {
          let val = thenSetValue;
          if (typeof val === "string") { try { val = JSON.parse(val as string); } catch { /* */ } }
          body += `      updateState("${thenSetPath}", ${JSON.stringify(val)});\n`;
        }
        body += `    } else {\n`;
        if (elseSetPath) {
          let val = elseSetValue;
          if (typeof val === "string") { try { val = JSON.parse(val as string); } catch { /* */ } }
          body += `      updateState("${elseSetPath}", ${JSON.stringify(val)});\n`;
        }
        body += `    }\n`;
        break;
      }
      default:
        body += `    // Unsupported action type: ${action.type}\n`;
    }
    body += `\n`;
  });

  return `  const ${handlerName} = async (e: any) => {\n${body}  };`;
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
