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

export const URLInputComponent: BuilderComponent = {
  metadata: {
    type: "URLInput",
    name: "URL Input",
    category: "Form",
    icon: "Link2",
  },
  defaultProps: {
    label: "Website URL",
    placeholder: "https://example.com",
    value: "",
    required: false,
    disabled: false,
    readOnly: false,
    hidden: false,
    size: "middle",
    allowClear: true,
    helperText: "",
    urlValidation: true, // Enabled by default
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties,
    ...validationSchemaProperties,
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange", "onFocus", "onBlur", "onClick", "onKeyDown", "onKeyUp", "onPressEnter"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [localValue, setLocalValue] = useState(String(node.props.value ?? ""));
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      setLocalValue(String(node.props.value ?? ""));
    }, [node.props.value]);

    const error = validateFormField(localValue, node.props);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalValue(val);
      
      const binding = node.bindings?.find((b) => b.prop === "value");
      if (binding) {
        setState(binding.expression, val);
      }
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        <Input
          type="url"
          value={localValue}
          onChange={handleChange}
          placeholder={String(node.props.placeholder ?? "")}
          disabled={Boolean(node.props.disabled)}
          readOnly={Boolean(node.props.readOnly)}
          size={(node.props.size as any) || "middle"}
          allowClear={Boolean(node.props.allowClear)}
          status={error ? "error" : (node.props.status as any) || undefined}
        />
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const size = node.props.size ? ` size="${node.props.size}"` : "";
    const placeholder = node.props.placeholder ? ` placeholder="${node.props.placeholder}"` : "";
    const disabled = node.props.disabled ? " disabled" : "";
    const readOnly = node.props.readOnly ? " readOnly" : "";
    const allowClear = node.props.allowClear ? " allowClear" : "";

    return `<Input type="url"${size}${placeholder}${disabled}${readOnly}${allowClear} className="${styles || ""}" />`;
  },
};

export default URLInputComponent;
