import React, { useState, useEffect } from "react";
import { Select } from "antd";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  validateFormField, 
  commonFormProperties, 
  validationSchemaProperties 
} from "../FormHelper";

export const MultiSelectComponent: BuilderComponent = {
  metadata: {
    type: "MultiSelect",
    name: "Multi Select",
    category: "Form",
    icon: "SquareSplitHorizontal",
  },
  defaultProps: {
    label: "Tags / Categories",
    placeholder: "Select multiple...",
    value: [],
    required: false,
    disabled: false,
    hidden: false,
    size: "middle",
    allowClear: true,
    helperText: "",
    options: [
      { label: "Option A", value: "a" },
      { label: "Option B", value: "b" },
      { label: "Option C", value: "c" },
    ],
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties,
    { key: "options", name: "Options (JSON)", type: "textarea", target: "props", section: "Content" },
    ...validationSchemaProperties.filter(p => p.key === "customValidationMessage"),
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange", "onFocus", "onBlur"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [localValue, setLocalValue] = useState<any[]>(
      Array.isArray(node.props.value) ? node.props.value : []
    );
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      setLocalValue(Array.isArray(node.props.value) ? node.props.value : []);
    }, [node.props.value]);

    let parsedOptions = [];
    try {
      if (Array.isArray(node.props.options)) {
        parsedOptions = node.props.options;
      } else if (typeof node.props.options === "string") {
        parsedOptions = JSON.parse(node.props.options);
      }
    } catch (e) {
      parsedOptions = [
        { label: "Option A", value: "a" },
        { label: "Option B", value: "b" },
        { label: "Option C", value: "c" },
      ];
    }

    const error = validateFormField(localValue && localValue.length > 0 ? "filled" : "", node.props);

    const handleChange = (val: any[]) => {
      setLocalValue(val);
      
      const binding = node.bindings?.find((b) => b.prop === "value");
      if (binding) {
        setState(binding.expression, val);
      }
      (node.props as any).triggerEvent?.("onChange", val);
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        <Select
          mode="multiple"
          value={localValue}
          options={parsedOptions}
          onChange={handleChange}
          placeholder={String(node.props.placeholder ?? "")}
          disabled={Boolean(node.props.disabled)}
          size={(node.props.size as any) || "middle"}
          allowClear={Boolean(node.props.allowClear)}
          status={error ? "error" : (node.props.status as any) || undefined}
          style={{ width: "100%" }}
        />
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const disabled = node.props.disabled ? " disabled" : "";
    const size = node.props.size ? ` size="${node.props.size}"` : "";
    const placeholder = node.props.placeholder ? ` placeholder="${node.props.placeholder}"` : "";
    const allowClear = node.props.allowClear ? " allowClear" : "";
    
    let optionsCode = "[]";
    try {
      const opts = typeof node.props.options === "string" ? JSON.parse(node.props.options) : node.props.options;
      optionsCode = JSON.stringify(opts);
    } catch (e) {}

    return `<Select mode="multiple"${size}${placeholder}${disabled}${allowClear} options={${optionsCode}} style={{ width: "100%" }} className="${styles || ""}" />`;
  },
};

export default MultiSelectComponent;
