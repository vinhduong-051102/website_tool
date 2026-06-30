import React, { useState, useEffect } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  validateFormField, 
  commonFormProperties, 
  validationSchemaProperties 
} from "../FormHelper";

export const DateTimePickerComponent: BuilderComponent = {
  metadata: {
    type: "DateTimePicker",
    name: "Date Time Picker",
    category: "Form",
    icon: "CalendarRange",
  },
  defaultProps: {
    label: "Select Date & Time",
    placeholder: "Select date & time",
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
      node.props.value ? dayjs(String(node.props.value)) : null
    );
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      setLocalValue(node.props.value ? dayjs(String(node.props.value)) : null);
    }, [node.props.value]);

    const error = validateFormField(localValue ? "selected" : "", node.props);

    const handleChange = (date: any, dateString: any) => {
      setLocalValue(date);
      
      const binding = node.bindings?.find((b) => b.prop === "value");
      const valStr = Array.isArray(dateString) ? dateString[0] : dateString;
      if (binding) {
        setState(binding.expression, valStr);
      }
      (node.props as any).triggerEvent?.("onChange", valStr);
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        <DatePicker
          showTime
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

    return `<DatePicker showTime${size}${placeholder}${disabled}${allowClear} style={{ width: "100%" }} className="${styles || ""}" />`;
  },
};

export default DateTimePickerComponent;
