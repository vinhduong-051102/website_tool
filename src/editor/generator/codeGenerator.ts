import { ASTNode } from "../types";
import { getComponent } from "../components/registry";
import { getResponsiveTailwindClasses } from "../utils/tailwind";

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
  const code = componentDef.codeGenerator(node, childrenCode, tailwindClasses);

  // Indent lines properly
  const spaces = " ".repeat(indent);
  return code
    .split("\n")
    .map((line) => `${spaces}${line}`)
    .join("\n");
};

export const generateFullPageCode = (rootNode: ASTNode, pageName: string = "Page"): string => {
  const pageBodyCode = generateReactCode(rootNode, 4);

  return `import React from 'react';

export default function ${pageName}Component() {
  return (
${pageBodyCode}
  );
}
`;
};
