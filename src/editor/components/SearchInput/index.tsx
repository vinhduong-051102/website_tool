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

export const SearchInputComponent: BuilderComponent = {
  metadata: {
    type: "SearchInput",
    name: "Search Input",
    category: "Form",
    icon: "Search",
  },
  defaultProps: {
    label: "Search",
    placeholder: "Search anything...",
    value: "",
    required: false,
    disabled: false,
    readOnly: false,
    hidden: false,
    size: "middle",
    allowClear: true,
    helperText: "",
    enterButton: true,
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties,
    { key: "enterButton", name: "Show Button", type: "switch", target: "props", section: "Content" },
    ...validationSchemaProperties,
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange", "onFocus", "onBlur", "onClick", "onSearch"],
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
        <Input.Search
          value={localValue}
          onChange={handleChange}
          placeholder={String(node.props.placeholder ?? "")}
          disabled={Boolean(node.props.disabled)}
          readOnly={Boolean(node.props.readOnly)}
          size={(node.props.size as any) || "middle"}
          allowClear={Boolean(node.props.allowClear)}
          enterButton={Boolean(node.props.enterButton)}
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
    const enterButton = node.props.enterButton ? " enterButton" : "";

    return `<Input.Search${size}${placeholder}${disabled}${readOnly}${allowClear}${enterButton} className="${styles || ""}" />`;
  },
};

export default SearchInputComponent;
