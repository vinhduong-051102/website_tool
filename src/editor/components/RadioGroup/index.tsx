import React, { useState, useEffect } from "react";
import { Radio } from "antd";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  validateFormField, 
  commonFormProperties, 
  validationSchemaProperties 
} from "../FormHelper";

export const RadioGroupComponent: BuilderComponent = {
  metadata: {
    type: "RadioGroup",
    name: "Radio Group",
    category: "Form",
    icon: "Radio",
  },
  defaultProps: {
    label: "Choose Option",
    value: "",
    required: false,
    disabled: false,
    hidden: false,
    helperText: "",
    options: [
      { label: "Option A", value: "a" },
      { label: "Option B", value: "b" },
    ],
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties.filter(p => p.key !== "placeholder" && p.key !== "allowClear"),
    { key: "options", name: "Options (JSON)", type: "textarea", target: "props", section: "Content" },
    ...validationSchemaProperties.filter(p => p.key === "customValidationMessage"),
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [localValue, setLocalValue] = useState<any>(node.props.value ?? "");
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      setLocalValue(node.props.value ?? "");
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
      ];
    }

    const error = validateFormField(localValue, node.props);

    const handleChange = (e: any) => {
      const val = e.target.value;
      setLocalValue(val);
      
      const binding = node.bindings?.find((b) => b.prop === "value");
      if (binding) {
        setState(binding.expression, val);
      }
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        <Radio.Group
          value={localValue}
          options={parsedOptions}
          onChange={handleChange}
          disabled={Boolean(node.props.disabled)}
        />
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const disabled = node.props.disabled ? " disabled" : "";
    let optionsCode = "[]";
    try {
      const opts = typeof node.props.options === "string" ? JSON.parse(node.props.options) : node.props.options;
      optionsCode = JSON.stringify(opts);
    } catch (e) {}

    return `<Radio.Group${disabled} options={${optionsCode}} className="${styles || ""}" />`;
  },
};

export default RadioGroupComponent;
