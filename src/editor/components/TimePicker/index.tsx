import React, { useState, useEffect } from "react";
import { TimePicker } from "antd";
import dayjs from "dayjs";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  validateFormField, 
  commonFormProperties, 
  validationSchemaProperties 
} from "../FormHelper";

export const TimePickerComponent: BuilderComponent = {
  metadata: {
    type: "TimePicker",
    name: "Time Picker",
    category: "Form",
    icon: "Clock",
  },
  defaultProps: {
    label: "Select Time",
    placeholder: "Select time",
    value: null,
    required: false,
    disabled: false,
    hidden: false,
    size: "middle",
    allowClear: true,
    helperText: "",
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties.filter(p => p.key !== "defaultValue"),
    ...validationSchemaProperties.filter(p => p.key === "customValidationMessage"),
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange", "onFocus", "onBlur"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [localValue, setLocalValue] = useState<dayjs.Dayjs | null>(
      node.props.value ? dayjs(String(node.props.value), "HH:mm:ss") : null
    );
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      setLocalValue(node.props.value ? dayjs(String(node.props.value), "HH:mm:ss") : null);
    }, [node.props.value]);

    const error = validateFormField(localValue ? "selected" : "", node.props);

    const handleChange = (time: any, timeString: any) => {
      setLocalValue(time);
      
      const binding = node.bindings?.find((b) => b.prop === "value");
      if (binding) {
        const valStr = Array.isArray(timeString) ? timeString[0] : timeString;
        setState(binding.expression, valStr);
      }
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        <TimePicker
          value={localValue}
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

    return `<TimePicker${size}${placeholder}${disabled}${allowClear} style={{ width: "100%" }} className="${styles || ""}" />`;
  },
};

export default TimePickerComponent;
