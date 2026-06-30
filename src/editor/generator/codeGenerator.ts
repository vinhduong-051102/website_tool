import { ASTNode, StateVariable } from "../types";
import { getComponent } from "../components/registry";
import { getResponsiveTailwindClasses } from "../utils/tailwind";
import { 
  postProcessNodeCode, 
  buildInitialStateCode, 
  generateAllEventHandlers 
} from "./stateGenerator";

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

  // Indent lines properly
  const spaces = " ".repeat(indent);
  return code
    .split("\n")
    .map((line) => `${spaces}${line}`)
    .join("\n");
};

export const generateFullPageCode = (
  rootNode: ASTNode,
  pageName: string = "Page",
  stateSchema: StateVariable[] = []
): string => {
  const pageBodyCode = generateReactCode(rootNode, 4);

  // Build the initial state object structure
  const initialStateJSON = buildInitialStateCode(stateSchema, rootNode);

  // Collect and generate event handlers
  const handlers = generateAllEventHandlers(rootNode);
  const eventHandlersCode = handlers
    .map((code) => {
      // Indent each event handler function
      return code;
    })
    .join("\n\n");

  return `import React, { useState } from 'react';

export default function ${pageName}Component() {
  const [state, setState] = useState<any>(${initialStateJSON});

  const updateState = (path: string, value: any) => {
    setState((prev: any) => {
      const next = { ...prev };
      const keys = path.split('.');
      let current = next;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!current[key]) current[key] = {};
        current[key] = { ...current[key] };
        current = current[key];
      }
      current[keys[keys.length - 1]] = value;
      return next;
    });
  };

${eventHandlersCode ? eventHandlersCode + "\n\n" : ""}  return (
${pageBodyCode}
  );
}
`;
};
