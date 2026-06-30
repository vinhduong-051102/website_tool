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

export const CheckboxComponent: BuilderComponent = {
  metadata: {
    type: "Checkbox",
    name: "Checkbox",
    category: "Form",
    icon: "CheckSquare",
  },
  defaultProps: {
    label: "",
    text: "Accept Terms",
    checked: false,
    required: false,
    disabled: false,
    hidden: false,
    helperText: "",
  },
  defaultStyles: {},
  propertySchema: [
    { key: "text", name: "Checkbox Text", type: "text", target: "props", section: "Content" },
    ...commonFormProperties.filter(p => p.key !== "placeholder" && p.key !== "value" && p.key !== "defaultValue" && p.key !== "allowClear"),
    { key: "checked", name: "Checked Status", type: "switch", target: "props", section: "Content" },
    ...validationSchemaProperties.filter(p => p.key === "customValidationMessage"),
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange", "onClick"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [localChecked, setLocalChecked] = useState(Boolean(node.props.checked));
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      setLocalChecked(Boolean(node.props.checked));
    }, [node.props.checked]);

    const error = validateFormField(localChecked ? "checked" : "", node.props);

    const handleChange = (e: any) => {
      const val = e.target.checked;
      setLocalChecked(val);
      
      const binding = node.bindings?.find((b) => b.prop === "checked" || b.prop === "value");
      if (binding) {
        setState(binding.expression, val);
      }
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        <Checkbox
          checked={localChecked}
          onChange={handleChange}
          disabled={Boolean(node.props.disabled)}
        >
          <span className="text-xs text-gray-300">{String(node.props.text ?? "")}</span>
        </Checkbox>
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const disabled = node.props.disabled ? " disabled" : "";
    const text = node.props.text ? String(node.props.text) : "";

    return `<Checkbox${disabled} className="${styles || ""}">${text}</Checkbox>`;
  },
};

export default CheckboxComponent;
