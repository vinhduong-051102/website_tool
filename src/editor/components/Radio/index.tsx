import React, { useState, useEffect } from "react";
import { Radio } from "antd";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  validateFormField, 
  commonFormProperties 
} from "../FormHelper";

export const RadioComponent: BuilderComponent = {
  metadata: {
    type: "Radio",
    name: "Radio",
    category: "Form",
    icon: "Radio",
  },
  defaultProps: {
    label: "",
    text: "Select Option",
    checked: false,
    disabled: false,
    hidden: false,
    helperText: "",
  },
  defaultStyles: {},
  propertySchema: [
    { key: "text", name: "Radio Text", type: "text", target: "props", section: "Content" },
    ...commonFormProperties.filter(p => p.key !== "placeholder" && p.key !== "value" && p.key !== "defaultValue" && p.key !== "allowClear"),
    { key: "checked", name: "Checked Status", type: "switch", target: "props", section: "Content" },
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

    const handleChange = (e: any) => {
      const val = e.target.checked;
      setLocalChecked(val);
      
      const binding = node.bindings?.find((b) => b.prop === "checked" || b.prop === "value");
      if (binding) {
        setState(binding.expression, val);
      }
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered}>
        <Radio
          checked={localChecked}
          onChange={handleChange}
          disabled={Boolean(node.props.disabled)}
        >
          <span className="text-xs text-gray-300">{String(node.props.text ?? "")}</span>
        </Radio>
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const disabled = node.props.disabled ? " disabled" : "";
    const text = node.props.text ? String(node.props.text) : "";

    return `<Radio${disabled} className="${styles || ""}">${text}</Radio>`;
  },
};

export default RadioComponent;
