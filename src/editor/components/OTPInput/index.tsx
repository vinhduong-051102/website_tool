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

export const OTPInputComponent: BuilderComponent = {
  metadata: {
    type: "OTPInput",
    name: "OTP Verification",
    category: "Form",
    icon: "KeyRound",
  },
  defaultProps: {
    label: "Verification Code",
    value: "",
    required: false,
    disabled: false,
    hidden: false,
    helperText: "",
    length: 6,
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties.filter(p => p.key !== "placeholder" && p.key !== "defaultValue" && p.key !== "allowClear" && p.key !== "size"),
    { key: "length", name: "Code Length", type: "number", target: "props", section: "Content" },
    ...validationSchemaProperties.filter(p => p.key === "customValidationMessage"),
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [localValue, setLocalValue] = useState<string>(
      node.props.value ? String(node.props.value) : ""
    );
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      setLocalValue(node.props.value ? String(node.props.value) : "");
    }, [node.props.value]);

    const error = validateFormField(localValue, node.props);

    const handleChange = (val: string) => {
      setLocalValue(val);
      
      const binding = node.bindings?.find((b) => b.prop === "value");
      if (binding) {
        setState(binding.expression, val);
      }
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        <Input.OTP
          value={localValue}
          onChange={handleChange}
          disabled={Boolean(node.props.disabled)}
          length={node.props.length !== undefined ? Number(node.props.length) : 6}
          status={error ? "error" : (node.props.status as any) || undefined}
        />
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const disabled = node.props.disabled ? " disabled" : "";
    const length = node.props.length !== undefined ? ` length={${node.props.length}}` : "";

    return `<Input.OTP${disabled}${length} className="${styles || ""}" />`;
  },
};

export default OTPInputComponent;
