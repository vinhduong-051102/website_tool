import React, { useState, useEffect } from "react";
import { Checkbox } from "antd";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  validateFormField, 
  commonFormProperties, 
  validationSchemaProperties 
} from "../FormHelper";

export const CheckboxGroupComponent: BuilderComponent = {
  metadata: {
    type: "CheckboxGroup",
    name: "Checkbox Group",
    category: "Form",
    icon: "CheckSquare",
  },
  defaultProps: {
    label: "Select Options",
    value: [],
    required: false,
    disabled: false,
    hidden: false,
    helperText: "",
    options: [
      { label: "Option 1", value: "opt1" },
      { label: "Option 2", value: "opt2" },
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
        { label: "Option 1", value: "opt1" },
        { label: "Option 2", value: "opt2" },
      ];
    }

    const error = validateFormField(localValue && localValue.length > 0 ? "filled" : "", node.props);

    const handleChange = (checkedValues: any[]) => {
      setLocalValue(checkedValues);
      
      const binding = node.bindings?.find((b) => b.prop === "value");
      if (binding) {
        setState(binding.expression, checkedValues);
      }
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        <Checkbox.Group
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

    return `<Checkbox.Group${disabled} options={${optionsCode}} className="${styles || ""}" />`;
  },
};

export default CheckboxGroupComponent;
