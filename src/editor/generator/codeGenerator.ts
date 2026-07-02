import { ASTNode, Page, StateVariable } from "../types";
import { getComponent } from "../components/registry";
import { getResponsiveTailwindClasses } from "../utils/tailwind";
import { 
  postProcessNodeCode, 
  buildInitialStateCode, 
  generateAllEventHandlers 
} from "./stateGenerator";
import { useEditorStore } from "../store/useEditorStore";

export const wrapWithNextJsLink = (node: ASTNode, code: string, pages: Page[]): string => {
  const linkToPageId = node.props.linkToPageId;
  if (!linkToPageId) return code;

  const targetPage = pages.find((p) => p.id === linkToPageId);
  if (!targetPage) return code;

  const linkNewTab = !!node.props.linkNewTab;
  const linkRouteParams = node.props.linkRouteParams;
  const linkQueryParams = node.props.linkQueryParams;

  // Resolve path
  let hrefStr = targetPage.path;
  let routeParams: Record<string, any> = {};
  if (typeof linkRouteParams === "string") {
    try { routeParams = JSON.parse(linkRouteParams); } catch {}
  }
  let queryParams: Record<string, any> = {};
  if (typeof linkQueryParams === "string") {
    try { queryParams = JSON.parse(linkQueryParams); } catch {}
  }

  const convertExpression = (val: string): string => {
    const trimmed = val.trim();
    const match = trimmed.match(/^\{\{([^}]+)\}\}$/);
    if (match) {
      const expr = match[1].trim();
      const cleanExpr = expr.startsWith("state.") ? expr.substring(6) : expr;
      return `\${state?.${cleanExpr} ?? ''}`;
    }

    return val.replace(/\{\{([^}]+)\}\}/g, (m, expression) => {
      const expr = expression.trim();
      const cleanExpr = expr.startsWith("state.") ? expr.substring(6) : expr;
      return `\${state?.${cleanExpr} ?? ''}`;
    });
  };

  // Construct href expression
  let isDynamic = false;
  let resolvedHref = hrefStr;

  // Replace route params in path e.g. /products/[id]
  for (const [key, value] of Object.entries(routeParams)) {
    const valStr = String(value);
    if (valStr.includes("{{")) {
      isDynamic = true;
      resolvedHref = resolvedHref.replace(`[${key}]`, convertExpression(valStr));
    } else {
      resolvedHref = resolvedHref.replace(`[${key}]`, valStr);
    }
  }

  // Construct query string
  const queryParts: string[] = [];
  for (const [key, value] of Object.entries(queryParams)) {
    const valStr = String(value);
    if (valStr.includes("{{")) {
      isDynamic = true;
      queryParts.push(`${key}=${convertExpression(valStr)}`);
    } else {
      queryParts.push(`${key}=${valStr}`);
    }
  }

  if (queryParts.length > 0) {
    resolvedHref += (resolvedHref.includes("?") ? "&" : "?") + queryParts.join("&");
  }

  const hrefAttribute = isDynamic || resolvedHref.includes("${")
    ? `href={\`${resolvedHref}\`}`
    : `href="${resolvedHref}"`;

  const newTabAttr = linkNewTab ? ' target="_blank"' : "";

  return `<Link ${hrefAttribute}${newTabAttr} className="contents">
  ${code.split('\n').join('\n  ')}
</Link>`;
};

export const wrapWithFormLayout = (node: ASTNode, inputCode: string): string => {
  const { label, helperText, required, hidden } = node.props;
  if (hidden === true) return "";

  // Only wrap if it has a label or helperText
  if (!label && !helperText) return inputCode;

  const labelMarkup = label
    ? `\n  <span className="text-xs font-semibold text-gray-300 flex items-center">
    ${String(label)}
    ${required === true ? '<span className="text-red-500 ml-1 font-bold">*</span>' : ""}
  </span>`
    : "";

  const helperMarkup = helperText
    ? `\n  <span className="text-[10px] text-gray-500">
    ${String(helperText)}
  </span>`
    : "";

  return `<div className="flex flex-col gap-1 w-full">
  ${labelMarkup ? labelMarkup + "\n  " : ""}${inputCode.split('\n').join('\n  ')}${helperMarkup ? helperMarkup : ""}
</div>`;
};

export const generateReactCode = (node: ASTNode, indent: number = 0): string => {
  const componentDef = getComponent(node.type);
  if (!componentDef) {
    return "";
  }

  // Generate children code recursively
  let childrenCode = "";
  if (node.children && node.children.length > 0) {
    childrenCode = node.children
      .map((child) => generateReactCode(child, indent + 2))
      .filter(Boolean)
      .join("\n");
  }

  // Resolve responsive styles to Tailwind utility classes
  const tailwindClasses = getResponsiveTailwindClasses(node.styles);

  // Generate component code
  let code = componentDef.codeGenerator(node, childrenCode, tailwindClasses);

  // Post-process to inject bindings and event handlers
  code = postProcessNodeCode(node, code);

  // Wrap with Form Layout if it's a form component
  if (componentDef.metadata.category === "Form") {
    code = wrapWithFormLayout(node, code);
  }

  // Wrap with Next.js Link if configured
  if (node.props.linkToPageId) {
    const pages = useEditorStore.getState().pages;
    code = wrapWithNextJsLink(node, code, pages);
  }

  // Indent lines properly
  const spaces = " ".repeat(indent);
  return code
    .split("\n")
    .map((line) => `${spaces}${line}`)
    .join("\n");
};

export interface GeneratePageOptions {
  isExport: boolean;
  layoutId?: string;
  projectLayouts?: any[];
  globalVariables?: StateVariable[];
}

export const checkLinkUsage = (node: ASTNode): boolean => {
  if (node.props?.linkToPageId) return true;
  return node.children?.some(checkLinkUsage) ?? false;
};

export const generatePageCode = (
  rootNode: ASTNode,
  pageName: string,
  stateSchema: StateVariable[],
  options: GeneratePageOptions
): string => {
  const pageBodyCode = generateReactCode(rootNode, 4);

  // Build the initial state object structure
  const initialStateJSON = buildInitialStateCode(stateSchema, rootNode);

  // Collect and generate event handlers
  const handlers = generateAllEventHandlers(rootNode);
  const eventHandlersCode = handlers.join("\n\n");

  // Collect dynamic Antd and Icon imports
  const antdImports = new Set<string>();
  const iconImports = new Set<string>();

  const collectImports = (node: ASTNode) => {
    switch (node.type) {
      case "TextInput":
      case "PasswordInput":
      case "EmailInput":
      case "Textarea":
      case "SearchInput":
      case "PhoneInput":
      case "URLInput":
      case "OTPInput":
        antdImports.add("Input");
        break;
      case "NumberInput":
        antdImports.add("InputNumber");
        break;
      case "Checkbox":
      case "CheckboxGroup":
        antdImports.add("Checkbox");
        break;
      case "Radio":
      case "RadioGroup":
        antdImports.add("Radio");
        break;
      case "Select":
      case "MultiSelect":
        antdImports.add("Select");
        break;
      case "Switch":
        antdImports.add("Switch");
        break;
      case "DatePicker":
      case "DateTimePicker":
      case "RangePicker":
        antdImports.add("DatePicker");
        break;
      case "TimePicker":
        antdImports.add("TimePicker");
        break;
      case "UploadFile":
        antdImports.add("Upload");
        antdImports.add("Button");
        iconImports.add("UploadOutlined");
        iconImports.add("InboxOutlined");
        break;
      case "UploadImage":
      case "AvatarUpload":
        antdImports.add("Upload");
        iconImports.add("PlusOutlined");
        break;
      case "Slider":
        antdImports.add("Slider");
        break;
      case "Rate":
        antdImports.add("Rate");
        break;
      case "ColorPicker":
        antdImports.add("ColorPicker");
        break;
      case "Button":
        antdImports.add("Button");
        break;
      case "Flex":
      case "Container":
        antdImports.add("Flex");
        break;
      case "Row":
        antdImports.add("Row");
        break;
      case "Column":
        antdImports.add("Col");
        break;
      case "Layout":
      case "Header":
      case "Sidebar":
      case "Content":
      case "Footer":
        antdImports.add("Layout");
        break;
      case "Space":
        antdImports.add("Space");
        break;
      case "Divider":
        antdImports.add("Divider");
        break;
      case "Card":
        antdImports.add("Card");
        break;
    }

    if (node.events && node.events.length > 0) {
      node.events.forEach((evt) => {
        if (evt.actions && evt.actions.length > 0) {
          const isUsed = evt.actions.some(
            (action) => action.type === "setState" && action.params.valueSource === "event"
          );
          if (isUsed && evt.event === "onChange") {
            if (node.type === "Checkbox") {
              antdImports.add("CheckboxChangeEvent");
            } else if (node.type === "Radio" || node.type === "RadioGroup") {
              antdImports.add("RadioChangeEvent");
            }
          }
        }
      });
    }

    node.children?.forEach(collectImports);
  };

  collectImports(rootNode);

  // Formatting Imports
  let importStatements = "";
  const cleanName = pageName.replace(/[^a-zA-Z0-9]/g, "");
  const globalVariables = options.globalVariables || [];

  if (options.isExport) {
    const hasLocalVars = stateSchema.length > 0;
    importStatements += `"use client";\n\nimport React, { useEffect${hasLocalVars ? ", useState" : ""} } from 'react';\nimport { useGlobalState } from '@/store/useGlobalState';\nimport { useRouter } from 'next/navigation';\n`;
    if (options.layoutId && options.projectLayouts) {
      const layout = options.projectLayouts.find((l) => l.id === options.layoutId);
      if (layout) {
        const cleanLayoutName = layout.name.replace(/[^a-zA-Z0-9]/g, "");
        importStatements += `import ${cleanLayoutName}Layout from '@/components/layouts/${layout.id}';\n`;
      }
    }
    if (checkLinkUsage(rootNode)) {
      importStatements += `import Link from 'next/link';\n`;
    }
  } else {
    importStatements += "import React, { useState, useEffect } from 'react';\nimport { useGlobalState } from '../state/useGlobalState';\n";
  }

  if (antdImports.size > 0) {
    importStatements += `import { ${Array.from(antdImports).sort().join(", ")} } from 'antd';\n`;
  }

  if (iconImports.size > 0) {
    importStatements += `import { ${Array.from(iconImports).sort().join(", ")} } from '@ant-design/icons';\n`;
  }

  // Wrap with page layout if applicable
  let wrappedBody = "";
  let componentBody = "";

  if (options.layoutId && options.projectLayouts) {
    const layout = options.projectLayouts.find((l) => l.id === options.layoutId);
    if (layout) {
      const cleanLayoutName = layout.name.replace(/[^a-zA-Z0-9]/g, "");
      wrappedBody = `  return (
    <${cleanLayoutName}Layout>
${pageBodyCode}
    </${cleanLayoutName}Layout>
  );`;
    }
  }

  if (!wrappedBody) {
    wrappedBody = `  return (
${pageBodyCode}
  );`;
  }

  if (options.isExport) {
    const pageStateInterface = generateStateInterface(stateSchema);
    
    componentBody = `${pageStateInterface}

export default function ${cleanName}Page() {
  const globalState = useGlobalState((s) => s.data);
  const updateGlobalState = useGlobalState((s) => s.setState);
  const [localState, setLocalState] = useState<PageState>(${initialStateJSON});
  const router = useRouter();

  // Combine local and global state
  const state = {
    ...globalState,
    ...localState,
  };

  const updateState = (path: string, value: any) => {
    const cleanPath = path.startsWith("state.") ? path.substring(6) : path;
    const firstKey = cleanPath.split(".")[0];
    const isGlobal = ${JSON.stringify(globalVariables.map(v => v.key.split(".")[0]))}.includes(firstKey);
    
    if (isGlobal) {
      updateGlobalState(cleanPath, value);
    } else {
      setLocalState((prev: any) => {
        const next = { ...prev };
        const keys = cleanPath.split('.');
        let current = next;
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i];
          if (!current[key] || typeof current[key] !== "object" || current[key] === null) {
            current[key] = {};
          } else {
            current[key] = { ...current[key] };
          }
          current = current[key];
        }
        current[keys[keys.length - 1]] = value;
        return next;
      });
    }
  };

  // Initialize page-specific state schema and global variables
  useEffect(() => {
    useGlobalState.getState().initializeFromSchema([], ${JSON.stringify(globalVariables, null, 2)});
  }, []);

  ${eventHandlersCode ? eventHandlersCode + "\n\n" : ""}${wrappedBody}
}`;
  } else {
    componentBody = `export default function ${cleanName}Page() {
  const state = useGlobalState((s) => s.data);
  const updateState = useGlobalState((s) => s.setState);
  const router = useRouter();

  // Initialize page-specific state schema on mount
  useEffect(() => {
    useGlobalState.getState().initializeFromSchema(${JSON.stringify(stateSchema, null, 2)}, ${JSON.stringify(globalVariables, null, 2)});
  }, []);

  ${eventHandlersCode ? eventHandlersCode + "\n\n" : ""}${wrappedBody}
}`;
  }

  const fullCode = `${importStatements}\n${componentBody}\n`;
  return postProcessCodeChecks(fullCode);
};

export const generateFullPageCode = (
  rootNode: ASTNode,
  pageName: string = "Page",
  stateSchema: StateVariable[] = []
): string => {
  const globalVars = useEditorStore.getState().globalVariables || [];
  return generatePageCode(rootNode, pageName, stateSchema, { 
    isExport: false,
    globalVariables: globalVars
  });
};

export const generateStateInterface = (schema: StateVariable[]): string => {
  if (!schema || schema.length === 0) {
    return `type PageState = Record<string, any>;`;
  }

  // Build a nested object structure representing the types
  const typeObj: Record<string, any> = {};

  schema.forEach((v) => {
    const keys = v.key.split(".");
    let current = typeObj;
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }
    
    // Map state schema types to typescript types
    let tsType = "any";
    if (v.type === "string") tsType = "string";
    else if (v.type === "number") tsType = "number";
    else if (v.type === "boolean") tsType = "boolean";
    else if (v.type === "array") tsType = "any[]";
    else if (v.type === "object") tsType = "Record<string, any>";
    else if (v.type === "date") tsType = "string | null";

    current[keys[keys.length - 1]] = tsType;
  });

  const renderTypeObj = (obj: any, indent: string = "  "): string => {
    let str = "{\n";
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === "object" && value !== null) {
        str += `${indent}${key}: ${renderTypeObj(value, indent + "  ")};\n`;
      } else {
        str += `${indent}${key}?: ${value};\n`;
      }
    }
    str += `${indent.substring(2)}}`;
    return str;
  };

  return `type PageState = ${renderTypeObj(typeObj)};`;
};

export const postProcessCodeChecks = (code: string): string => {
  let processed = code;

  // 1. Remove unused async
  const asyncRegex = /\basync\s*\(([^)]*)\)\s*=>\s*\{([\s\S]*?)\}/g;
  processed = processed.replace(asyncRegex, (match, params, body) => {
    const hasAwait = /\bawait\b/.test(body);
    if (!hasAwait) {
      return `(${params}) => {${body}}`;
    }
    return match;
  });

  // 2. Fix unused imports in import { A, B } from 'antd'; or '@ant-design/icons'
  const importRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"];?/g;
  processed = processed.replace(importRegex, (match, importList, source) => {
    if (source !== "antd" && source !== "@ant-design/icons") {
      return match;
    }
    const items = importList.split(",").map((x: string) => x.trim()).filter(Boolean);
    const usedItems: string[] = [];

    items.forEach((item: string) => {
      const escaped = item.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const itemWordRegex = new RegExp(`\\b${escaped}\\b`, "g");
      const count = (processed.match(itemWordRegex) || []).length;
      if (count > 1) {
        usedItems.push(item);
      }
    });

    if (usedItems.length === 0) {
      return "";
    }
    return `import { ${usedItems.sort().join(", ")} } from '${source}';`;
  });

  // 3. Fix missing imports (scan for standard Antd tags used in JSX)
  const standardAntdComponents = [
    "Input", "InputNumber", "Checkbox", "CheckboxGroup", "Radio", "RadioGroup",
    "Select", "Switch", "DatePicker", "TimePicker", "Upload", "Button",
    "Slider", "Rate", "ColorPicker", "Flex", "Row", "Col", "Layout",
    "Space", "Divider", "Card", "Typography", "Spin",
    "CheckboxChangeEvent", "RadioChangeEvent"
  ];

  const standardIcons = [
    "UploadOutlined", "InboxOutlined", "PlusOutlined"
  ];

  // Find all JSX tags in code, e.g. <Button or <Layout.Header or <Typography
  const tagRegex = /<([A-Z][a-zA-Z0-9]*)(?:\.[a-zA-Z0-9]+)?\b/g;
  const tagsUsed = new Set<string>();
  let match;
  while ((match = tagRegex.exec(processed)) !== null) {
    tagsUsed.add(match[1]);
  }

  // Also scan if CheckboxChangeEvent or RadioChangeEvent is referenced in typescript types
  standardAntdComponents.forEach(item => {
    const escaped = item.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const itemWordRegex = new RegExp(`\\b${escaped}\\b`);
    if (itemWordRegex.test(processed)) {
      tagsUsed.add(item);
    }
  });

  // Now, check if there is an existing import { ... } from 'antd';
  const antdImportRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]antd['"];?/g;
  const existingAntdItems = new Set<string>();
  const antdMatch = antdImportRegex.exec(processed);
  if (antdMatch) {
    antdMatch[1].split(",").map((x: string) => x.trim()).forEach(x => {
      if (x) existingAntdItems.add(x);
    });
  }

  const missingAntdItems = Array.from(tagsUsed).filter(tag => 
    standardAntdComponents.includes(tag) && !existingAntdItems.has(tag)
  );

  if (missingAntdItems.length > 0) {
    const allAntdItems = Array.from(new Set([...existingAntdItems, ...missingAntdItems])).sort();
    if (antdMatch) {
      // Replace existing import
      processed = processed.replace(antdImportRegex, `import { ${allAntdItems.join(", ")} } from 'antd';`);
    } else {
      // Insert new import right after React import
      processed = processed.replace(
        /(import\s+React[^\n]*\n)/,
        `$1import { ${missingAntdItems.sort().join(", ")} } from 'antd';\n`
      );
    }
  }

  // Same check for @ant-design/icons
  const iconImportRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]@ant-design\/icons['"];?/g;
  const existingIconItems = new Set<string>();
  const iconMatch = iconImportRegex.exec(processed);
  if (iconMatch) {
    iconMatch[1].split(",").map((x: string) => x.trim()).forEach(x => {
      if (x) existingIconItems.add(x);
    });
  }

  // Scan code for icon names
  const missingIconItems = standardIcons.filter(icon => 
    new RegExp(`\\b${icon}\\b`).test(processed) && !existingIconItems.has(icon)
  );

  if (missingIconItems.length > 0) {
    const allIconItems = Array.from(new Set([...existingIconItems, ...missingIconItems])).sort();
    if (iconMatch) {
      processed = processed.replace(iconImportRegex, `import { ${allIconItems.join(", ")} } from '@ant-design/icons';`);
    } else {
      const insertAnchor = processed.includes("from 'antd'") ? /(import[^\n]*from\s+['"]antd['"];?\n)/ : /(import\s+React[^\n]*\n)/;
      processed = processed.replace(
        insertAnchor,
        `$1import { ${missingIconItems.sort().join(", ")} } from '@ant-design/icons';\n`
      );
    }
  }

  // Destructure Layout components if needed
  if (processed.includes("import {") && processed.includes("Layout") && processed.includes("from 'antd'")) {
    if (!processed.includes("const { Header, Sider, Content, Footer } = Layout;")) {
      processed = processed.replace(
        /(import[^\n]*from\s+['"]antd['"];?\n)/,
        `$1const { Header, Sider, Content, Footer } = Layout;\n`
      );
    }
  }

  // Clean empty lines or duplicate imports if any
  processed = processed.replace(/^\s*import\s*\{\s*\}\s*from\s*['"][^'"]+['"];?\n/gm, "");

  return processed;
};
