import React, { useState, useEffect } from "react";
import { Switch } from "antd";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  commonFormProperties 
} from "../FormHelper";

export const SwitchComponent: BuilderComponent = {
  metadata: {
    type: "Switch",
    name: "Toggle Switch",
    category: "Form",
    icon: "ToggleLeft",
  },
  defaultProps: {
    label: "Status Toggle",
    checked: false,
    disabled: false,
    hidden: false,
    helperText: "",
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties.filter(p => p.key !== "placeholder" && p.key !== "value" && p.key !== "defaultValue" && p.key !== "allowClear" && p.key !== "status"),
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

    const handleChange = (checked: boolean) => {
      setLocalChecked(checked);
      
      const binding = node.bindings?.find((b) => b.prop === "checked" || b.prop === "value");
      if (binding) {
        setState(binding.expression, checked);
      }
      (node.props as any).triggerEvent?.("onChange", checked);
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered}>
        <div>
          <Switch
            checked={localChecked}
            onChange={handleChange}
            disabled={Boolean(node.props.disabled)}
            size={node.props.size === "small" ? "small" : "default"}
          />
        </div>
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const disabled = node.props.disabled ? " disabled" : "";
    const size = node.props.size === "small" ? ' size="small"' : "";

    return `<Switch${disabled}${size} className="${styles || ""}" />`;
  },
};

export default SwitchComponent;
