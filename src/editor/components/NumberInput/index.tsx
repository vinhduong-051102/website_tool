import React, { useState, useEffect } from "react";
import { InputNumber } from "antd";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  validateFormField, 
  commonFormProperties, 
  validationSchemaProperties 
} from "../FormHelper";

export const NumberInputComponent: BuilderComponent = {
  metadata: {
    type: "NumberInput",
    name: "Number Input",
    category: "Form",
    icon: "Hash",
  },
  defaultProps: {
    label: "Number Input",
    placeholder: "Enter number...",
    value: null,
    required: false,
    disabled: false,
    readOnly: false,
    hidden: false,
    size: "middle",
    helperText: "",
    min: undefined,
    max: undefined,
    step: 1,
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties,
    { key: "min", name: "Min Value", type: "number", target: "props", section: "Content" },
    { key: "max", name: "Max Value", type: "number", target: "props", section: "Content" },
    { key: "step", name: "Step Interval", type: "number", target: "props", section: "Content" },
    ...validationSchemaProperties,
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange", "onFocus", "onBlur", "onClick"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [localValue, setLocalValue] = useState<number | null>(
      node.props.value !== undefined && node.props.value !== null ? Number(node.props.value) : null
    );
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      setLocalValue(
        node.props.value !== undefined && node.props.value !== null ? Number(node.props.value) : null
      );
    }, [node.props.value]);

    const error = validateFormField(localValue, node.props);

    const handleChange = (val: number | null) => {
      setLocalValue(val);
      
      const binding = node.bindings?.find((b) => b.prop === "value");
      if (binding) {
        setState(binding.expression, val);
      }
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        <InputNumber
          value={localValue}
          onChange={handleChange}
          placeholder={String(node.props.placeholder ?? "")}
          disabled={Boolean(node.props.disabled)}
          readOnly={Boolean(node.props.readOnly)}
          size={(node.props.size as any) || "middle"}
          min={node.props.min !== undefined ? Number(node.props.min) : undefined}
          max={node.props.max !== undefined ? Number(node.props.max) : undefined}
          step={node.props.step !== undefined ? Number(node.props.step) : undefined}
          status={error ? "error" : (node.props.status as any) || undefined}
          style={{ width: "100%" }}
        />
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const size = node.props.size ? ` size="${node.props.size}"` : "";
    const placeholder = node.props.placeholder ? ` placeholder="${node.props.placeholder}"` : "";
    const disabled = node.props.disabled ? " disabled" : "";
    const readOnly = node.props.readOnly ? " readOnly" : "";
    const min = node.props.min !== undefined ? ` min={${node.props.min}}` : "";
    const max = node.props.max !== undefined ? ` max={${node.props.max}}` : "";
    const step = node.props.step !== undefined ? ` step={${node.props.step}}` : "";

    return `<InputNumber${size}${placeholder}${disabled}${readOnly}${min}${max}${step} style={{ width: "100%" }} className="${styles || ""}" />`;
  },
};

export default NumberInputComponent;
