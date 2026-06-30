import { ASTNode, StateVariable } from "../types";
import { getComponent } from "../components/registry";
import { getResponsiveTailwindClasses } from "../utils/tailwind";
import { 
  postProcessNodeCode, 
  buildInitialStateCode, 
  generateAllEventHandlers 
} from "./stateGenerator";

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
    }
    node.children?.forEach(collectImports);
  };

  collectImports(rootNode);

  let importStatements = "import React, { useState } from 'react';\n";
  if (antdImports.size > 0) {
    importStatements += `import { ${Array.from(antdImports).sort().join(", ")} } from 'antd';\n`;
  }
  if (iconImports.size > 0) {
    importStatements += `import { ${Array.from(iconImports).sort().join(", ")} } from '@ant-design/icons';\n`;
  }

  return `${importStatements}
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
