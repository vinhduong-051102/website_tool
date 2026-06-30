import React, { useState, useEffect } from "react";
import { Input } from "antd";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  validateFormField, 
  commonFormProperties, 
  validationSchemaProperties 
} from "../FormHelper";

export const TextareaComponent: BuilderComponent = {
  metadata: {
    type: "Textarea",
    name: "Textarea",
    category: "Form",
    icon: "AlignLeft",
  },
  defaultProps: {
    label: "Description",
    placeholder: "Enter details...",
    value: "",
    required: false,
    disabled: false,
    readOnly: false,
    hidden: false,
    helperText: "",
    rows: 4,
    allowClear: true,
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties,
    { key: "rows", name: "Text Rows", type: "number", target: "props", section: "Content" },
    ...validationSchemaProperties,
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange", "onFocus", "onBlur", "onClick", "onKeyDown", "onKeyUp"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [localValue, setLocalValue] = useState(String(node.props.value ?? ""));
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      setLocalValue(String(node.props.value ?? ""));
    }, [node.props.value]);

    const error = validateFormField(localValue, node.props);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setLocalValue(val);
      
      const binding = node.bindings?.find((b) => b.prop === "value");
      if (binding) {
        setState(binding.expression, val);
      }
      (node.props as any).triggerEvent?.("onChange", val);
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        <Input.TextArea
          value={localValue}
          onChange={handleChange}
          placeholder={String(node.props.placeholder ?? "")}
          disabled={Boolean(node.props.disabled)}
          readOnly={Boolean(node.props.readOnly)}
          allowClear={Boolean(node.props.allowClear)}
          rows={node.props.rows !== undefined ? Number(node.props.rows) : 4}
          status={error ? "error" : (node.props.status as any) || undefined}
        />
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const placeholder = node.props.placeholder ? ` placeholder="${node.props.placeholder}"` : "";
    const disabled = node.props.disabled ? " disabled" : "";
    const readOnly = node.props.readOnly ? " readOnly" : "";
    const allowClear = node.props.allowClear ? " allowClear" : "";
    const rows = node.props.rows !== undefined ? ` rows={${node.props.rows}}` : "";

    return `<Input.TextArea${placeholder}${disabled}${readOnly}${allowClear}${rows} className="${styles || ""}" />`;
  },
};

export default TextareaComponent;
