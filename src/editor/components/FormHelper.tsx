import React from "react";
import { ASTNode } from "../types";
import { PropertyConfig } from "./types";
import { useEditorStore } from "../store/useEditorStore";
import { getResolvedStyles } from "../utils/styles";

interface FormFieldWrapperProps {
  node: ASTNode;
  isSelected: boolean;
  isHovered: boolean;
  error?: string | null;
  children: React.ReactNode;
}

export const FormFieldWrapper: React.FC<FormFieldWrapperProps> = ({
  node,
  isSelected,
  isHovered,
  error,
  children,
}) => {
  const activeBreakpoint = useEditorStore((state) => state.activeBreakpoint);
  const resolvedStyles = getResolvedStyles(node, activeBreakpoint);

  const { label, helperText, hidden, width, height, required } = node.props;

  if (hidden === true) return null;

  // Visual highlights for design time selection/hover
  const outlineClass = isSelected
    ? "outline-2 outline-blue-500 outline-solid ring-4 ring-blue-500/10 z-10"
    : isHovered
    ? "outline-1 outline-blue-400 outline-dashed z-10"
    : "";

  const containerStyle: React.CSSProperties = {
    width: (width as string) || "100%",
    height: (height as string) || "auto",
    ...resolvedStyles,
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    textAlign: "left",
  };

  return (
    <div
      style={containerStyle}
      className={`p-1.5 rounded transition-all duration-150 ${outlineClass} ${
        (node.props.className as string) || ""
      }`}
    >
      {!!label && (
        <span className="text-xs font-semibold text-gray-300 select-none flex items-center">
          {String(label)}
          {required === true && <span className="text-red-500 ml-1 font-bold">*</span>}
        </span>
      )}

      {children}

      {(error || !!helperText) && (
        <span
          className={`text-[10px] select-none leading-normal font-medium tracking-wide ${
            error ? "text-red-400 font-semibold" : "text-gray-500"
          }`}
        >
          {error || String(helperText)}
        </span>
      )}
    </div>
  );
};

export const validateFormField = (value: any, props: Record<string, any>): string | null => {
  if (props.required && (value === undefined || value === null || value === "")) {
    return props.customValidationMessage || "This field is required";
  }

  if (value !== undefined && value !== null && value !== "") {
    const strVal = String(value);

    // Min Length / Max Length
    if (props.minLength !== undefined && strVal.length < Number(props.minLength)) {
      return props.customValidationMessage || `Minimum length is ${props.minLength} characters`;
    }
    if (props.maxLength !== undefined && strVal.length > Number(props.maxLength)) {
      return props.customValidationMessage || `Maximum length is ${props.maxLength} characters`;
    }

    // Min Value / Max Value
    if (props.minValue !== undefined && Number(value) < Number(props.minValue)) {
      return props.customValidationMessage || `Minimum value is ${props.minValue}`;
    }
    if (props.maxValue !== undefined && Number(value) > Number(props.maxValue)) {
      return props.customValidationMessage || `Maximum value is ${props.maxValue}`;
    }

    // Email Validation
    if (props.emailValidation && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
      return props.customValidationMessage || "Invalid email address";
    }

    // URL Validation
    if (props.urlValidation && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/.test(strVal)) {
      return props.customValidationMessage || "Invalid URL";
    }

    // Phone Validation
    if (props.phoneValidation && !/^[+]?[0-9]{9,15}$/.test(strVal)) {
      return props.customValidationMessage || "Invalid phone number";
    }

    // Regex Pattern
    if (props.regexPattern) {
      try {
        const regex = new RegExp(props.regexPattern);
        if (!regex.test(strVal)) {
          return props.customValidationMessage || "Invalid format";
        }
      } catch (e) {
        // Ignore invalid regex configs
      }
    }
  }

  return null;
};

// Common schema fields shared by all form components
export const commonFormProperties: PropertyConfig[] = [
  { key: "label", name: "Label", type: "string", target: "props", section: "Content" },
  { key: "placeholder", name: "Placeholder", type: "string", target: "props", section: "Content" },
  { key: "value", name: "Value", type: "string", target: "props", section: "Content" },
  { key: "defaultValue", name: "Default Value", type: "string", target: "props", section: "Content" },
  { key: "helperText", name: "Helper Text", type: "string", target: "props", section: "Content" },
  { key: "required", name: "Required", type: "boolean", target: "props", section: "Content" },
  { key: "disabled", name: "Disabled", type: "boolean", target: "props", section: "Content" },
  { key: "readOnly", name: "Read Only", type: "boolean", target: "props", section: "Content" },
  { key: "hidden", name: "Hidden", type: "boolean", target: "props", section: "Content" },
  { key: "allowClear", name: "Allow Clear", type: "boolean", target: "props", section: "Content" },
  {
    key: "size",
    name: "Size",
    type: "enum",
    target: "props",
    section: "Content",
    enum: ["small", "middle", "large"],
  },
  {
    key: "status",
    name: "Status Status",
    type: "enum",
    target: "props",
    section: "Content",
    enum: [
      { label: "Default", value: "" },
      { label: "Warning", value: "warning" },
      { label: "Error", value: "error" },
    ],
  },
  { key: "width", name: "Width", type: "string", target: "props", section: "Layout" },
  { key: "height", name: "Height", type: "string", target: "props", section: "Layout" },
];

export const validationSchemaProperties: PropertyConfig[] = [
  { key: "customValidationMessage", name: "Err Msg", type: "string", target: "props", section: "Styles" },
  { key: "minLength", name: "Min Length", type: "number", target: "props", section: "Styles" },
  { key: "maxLength", name: "Max Length", type: "number", target: "props", section: "Styles" },
  { key: "minValue", name: "Min Value", type: "number", target: "props", section: "Styles" },
  { key: "maxValue", name: "Max Value", type: "number", target: "props", section: "Styles" },
  { key: "regexPattern", name: "Regex Pattern", type: "string", target: "props", section: "Styles" },
];
