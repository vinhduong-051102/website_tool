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

export const RangePickerComponent: BuilderComponent = {
  metadata: {
    type: "RangePicker",
    name: "Range Picker",
    category: "Form",
    icon: "CalendarDays",
  },
  defaultProps: {
    label: "Select Date Range",
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
    ...commonFormProperties.filter(p => p.key !== "defaultValue" && p.key !== "placeholder"),
    ...validationSchemaProperties.filter(p => p.key === "customValidationMessage"),
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange", "onFocus", "onBlur"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [localValue, setLocalValue] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      if (Array.isArray(node.props.value) && node.props.value.length === 2) {
        setLocalValue([
          node.props.value[0] ? dayjs(String(node.props.value[0])) : null,
          node.props.value[1] ? dayjs(String(node.props.value[1])) : null,
        ]);
      } else {
        setLocalValue(null);
      }
    }, [node.props.value]);

    const error = validateFormField(localValue && localValue[0] && localValue[1] ? "range-filled" : "", node.props);

    const handleChange = (dates: any, dateStrings: [string, string]) => {
      setLocalValue(dates);
      
      const binding = node.bindings?.find((b) => b.prop === "value");
      if (binding) {
        setState(binding.expression, dateStrings);
      }
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        <DatePicker.RangePicker
          value={localValue}
          onChange={handleChange}
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
    const allowClear = node.props.allowClear ? " allowClear" : "";

    return `<DatePicker.RangePicker${size}${disabled}${allowClear} style={{ width: "100%" }} className="${styles || ""}" />`;
  },
};

export default RangePickerComponent;
