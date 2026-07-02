import { ASTNode, Page, StateVariable, BindingConfig, EventConfig } from "../types";
import { useEditorStore } from "../store/useEditorStore";

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
    let actionCode = "";
    switch (action.type) {
      case "setState": {
        const path = action.params.path as string;
        const valueSource = (action.params.valueSource as string) || "event";
        if (valueSource === "event") {
          actionCode += `    updateState("${path}", e);\n`;
        } else if (valueSource === "state") {
          const sourcePath = action.params.sourceStatePath as string;
          const parts = (sourcePath || "").split(".");
          const safePath = "state." + parts.join("?.");
          actionCode += `    updateState("${path}", ${safePath});\n`;
        } else {
          // custom value
          let val = action.params.value;
          if (typeof val === "string") {
            try { val = JSON.parse(val as string); } catch { /* keep */ }
          }
          actionCode += `    updateState("${path}", ${JSON.stringify(val)});\n`;
        }
        break;
      }
      case "toggleState": {
        const path = action.params.path as string;
        const parts = (path || "").split(".");
        const safePath = "state." + parts.join("?.");
        actionCode += `    updateState("${path}", !${safePath});\n`;
        break;
      }
      case "resetState": {
        const path = action.params.path as string;
        if (path) {
          actionCode += `    updateState("${path}", undefined); // Reset to default\n`;
        } else {
          actionCode += `    setState({}); // Full reset\n`;
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

        actionCode += `    try {\n`;
        actionCode += `      const res = await fetch("${url}", {\n`;
        actionCode += `        method: "${method}",\n`;
        if (headers) {
          actionCode += `        headers: ${typeof headers === "string" ? headers : JSON.stringify(headers)},\n`;
        } else {
          actionCode += `        headers: { "Content-Type": "application/json" },\n`;
        }
        if (reqBody && method !== "GET") {
          actionCode += `        body: ${typeof reqBody === "string" ? reqBody : `JSON.stringify(${JSON.stringify(reqBody)})`},\n`;
        }
        actionCode += `      });\n`;
        actionCode += `      const resData = await res.json();\n`;
        if (responsePath) {
          actionCode += `      updateState("${responsePath}", resData);\n`;
        }
        if (errorPath) {
          actionCode += `      updateState("${errorPath}", null);\n`;
        }
        actionCode += `    } catch (err) {\n`;
        if (errorPath) {
          actionCode += `      updateState("${errorPath}", err.message);\n`;
        }
        actionCode += `      console.error("API Call error:", err);\n`;
        actionCode += `    }\n`;
        break;
      }
      case "showToast": {
        const msg = (action.params.message as string) || "";
        const toastType = (action.params.toastType as string) || "info";
        actionCode += `    // showToast: "${toastType}"\n`;
        actionCode += `    alert(${JSON.stringify(msg)}); // Replace with toast library\n`;
        break;
      }
      case "navigate": {
        const targetPageId = (action.params.targetPageId as string) || "";
        const routeParamsRaw = action.params.routeParams;
        const queryParamsRaw = action.params.queryParams;
        const replace = !!action.params.replace;
        const newTab = !!action.params.newTab;

        const compileJsonExpression = (val: unknown): string => {
          if (!val) return "{}";
          let str = typeof val === "string" ? val : JSON.stringify(val);
          str = str.replace(/["']\{\{([^}]+)\}\}["']/g, (m: string, expr: string) => {
            const cleanExpr = expr.trim().startsWith("state.") ? expr.trim() : `state.${expr.trim()}`;
            return cleanExpr;
          });
          str = str.replace(/["']([^"']*(?:\{\{[^}]+\}\}[^"']*)+)["']/g, (m: string, content: string) => {
            const interpolated = content.replace(/\{\{([^}]+)\}\}/g, (im: string, expr: string) => {
              const cleanExpr = expr.trim().startsWith("state.") ? expr.trim() : `state.${expr.trim()}`;
              return `\${${cleanExpr}}`;
            });
            return `\`${interpolated}\``;
          });
          return str;
        };

        const pagesList = useEditorStore.getState().pages;

        if (newTab) {
          actionCode += `    // navigate to page ID: ${targetPageId}\n`;
          actionCode += `    (() => {\n`;
          actionCode += `      const pagesList = ${JSON.stringify(pagesList)};\n`;
          actionCode += `      const targetPage = pagesList.find(p => p.id === "${targetPageId}");\n`;
          actionCode += `      if (!targetPage) return;\n`;
          actionCode += `      let routePath = targetPage.path;\n`;
          actionCode += `      const routeParams = ${compileJsonExpression(routeParamsRaw)};\n`;
          actionCode += `      const queryParams = ${compileJsonExpression(queryParamsRaw)};\n`;
          actionCode += `      for (const [key, value] of Object.entries(routeParams)) {\n`;
          actionCode += `        routePath = routePath.replace(\`[\${key}]\`, String(value));\n`;
          actionCode += `      }\n`;
          actionCode += `      const queryParts = Object.entries(queryParams).map(([k, v]) => \`\${encodeURIComponent(k)}=\\\${encodeURIComponent(String(v))}\`);\n`;
          actionCode += `      if (queryParts.length > 0) {\n`;
          actionCode += `        routePath += (routePath.includes("?") ? "&" : "?") + queryParts.join("&");\n`;
          actionCode += `      }\n`;
          actionCode += `      window.open(routePath, "_blank");\n`;
          actionCode += `    })();\n`;
        } else {
          actionCode += `    // navigate to page ID: ${targetPageId}\n`;
          actionCode += `    (() => {\n`;
          actionCode += `      const pagesList = ${JSON.stringify(pagesList)};\n`;
          actionCode += `      const targetPage = pagesList.find(p => p.id === "${targetPageId}");\n`;
          actionCode += `      if (!targetPage) return;\n`;
          actionCode += `      let routePath = targetPage.path;\n`;
          actionCode += `      const routeParams = ${compileJsonExpression(routeParamsRaw)};\n`;
          actionCode += `      const queryParams = ${compileJsonExpression(queryParamsRaw)};\n`;
          actionCode += `      for (const [key, value] of Object.entries(routeParams)) {\n`;
          actionCode += `        routePath = routePath.replace(\`[\${key}]\`, String(value));\n`;
          actionCode += `      }\n`;
          actionCode += `      const queryParts = Object.entries(queryParams).map(([k, v]) => \`\${encodeURIComponent(k)}=\\\${encodeURIComponent(String(v))}\`);\n`;
          actionCode += `      if (queryParts.length > 0) {\n`;
          actionCode += `        routePath += (routePath.includes("?") ? "&" : "?") + queryParts.join("&");\n`;
          actionCode += `      }\n`;
          actionCode += `      router.${replace ? "replace" : "push"}(routePath);\n`;
          actionCode += `    })();\n`;
        }
        break;
      }
      case "openModal": {
        const mId = action.params.componentId as string;
        actionCode += `    updateState("modal.${mId}.open", true);\n`;
        break;
      }
      case "closeModal": {
        const mId = action.params.componentId as string;
        actionCode += `    updateState("modal.${mId}.open", false);\n`;
        break;
      }
      case "hideComponent": {
        const cId = action.params.componentId as string;
        actionCode += `    updateState("visibility.${cId}", false);\n`;
        break;
      }
      case "showComponent": {
        const cId = action.params.componentId as string;
        actionCode += `    updateState("visibility.${cId}", true);\n`;
        break;
      }
      case "showLoading": {
        const path = (action.params.statePath as string) || "loading";
        actionCode += `    updateState("${path}", true);\n`;
        break;
      }
      case "hideLoading": {
        const path = (action.params.statePath as string) || "loading";
        actionCode += `    updateState("${path}", false);\n`;
        break;
      }
      case "toggleLoading": {
        const path = (action.params.statePath as string) || "loading";
        const parts = path.split(".");
        const safePath = "state." + parts.join("?.");
        actionCode += `    updateState("${path}", !${safePath});\n`;
        break;
      }
      case "copyToClipboard": {
        const text = (action.params.text as string) || "";
        actionCode += `    navigator.clipboard.writeText(${JSON.stringify(text)});\n`;
        break;
      }
      case "delay": {
        const ms = Number(action.params.duration) || 1000;
        actionCode += `    await new Promise(resolve => setTimeout(resolve, ${ms}));\n`;
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

        actionCode += `    if (${condition}) {\n`;
        if (thenSetPath) {
          let val = thenSetValue;
          if (typeof val === "string") { try { val = JSON.parse(val as string); } catch { /* */ } }
          actionCode += `      updateState("${thenSetPath}", ${JSON.stringify(val)});\n`;
        }
        actionCode += `    } else {\n`;
        if (elseSetPath) {
          let val = elseSetValue;
          if (typeof val === "string") { try { val = JSON.parse(val as string); } catch { /* */ } }
          actionCode += `      updateState("${elseSetPath}", ${JSON.stringify(val)});\n`;
        }
        actionCode += `    }\n`;
        break;
      }
      case "toggleSidebar": {
        actionCode += `    updateState("layout.sidebarCollapsed", !state.layout?.sidebarCollapsed);\n`;
        break;
      }
      case "collapseSidebar": {
        actionCode += `    updateState("layout.sidebarCollapsed", true);\n`;
        break;
      }
      case "expandSidebar": {
        actionCode += `    updateState("layout.sidebarCollapsed", false);\n`;
        break;
      }
      default:
        actionCode += `    // Unsupported action type: ${action.type}\n`;
    }

    if (action.condition && action.condition.enabled) {
      const condPath = action.condition.statePath || "";
      const condParts = condPath.split(".");
      const safeCondPath = "state." + condParts.join("?.");
      const op = action.condition.operator || "truthy";
      const compareValue = action.condition.compareValue;

      let condExpr = "";
      switch (op) {
        case "truthy": condExpr = `!!${safeCondPath}`; break;
        case "falsy": condExpr = `!${safeCondPath}`; break;
        case "equals": condExpr = `${safeCondPath} === ${JSON.stringify(compareValue)}`; break;
        case "notEquals": condExpr = `${safeCondPath} !== ${JSON.stringify(compareValue)}`; break;
        case "gt": condExpr = `Number(${safeCondPath}) > ${Number(compareValue)}`; break;
        case "lt": condExpr = `Number(${safeCondPath}) < ${Number(compareValue)}`; break;
        default: condExpr = `!!${safeCondPath}`;
      }

      // Indent original code inside conditional block
      const indentedCode = actionCode
        .split("\n")
        .filter((line) => line.trim().length > 0)
        .map((line) => "  " + line)
        .join("\n");

      actionCode = `    if (${condExpr}) {\n${indentedCode}\n    }\n`;
    }

    body += `    // Action: ${action.type}\n` + actionCode + `\n`;
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
