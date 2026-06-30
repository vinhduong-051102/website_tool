import React, { useState, useEffect } from "react";
import { ColorPicker } from "antd";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  commonFormProperties 
} from "../FormHelper";

export const ColorPickerComponent: BuilderComponent = {
  metadata: {
    type: "ColorPicker",
    name: "Color Picker",
    category: "Form",
    icon: "Palette",
  },
  defaultProps: {
    label: "Pick Color",
    value: "#1677ff",
    disabled: false,
    hidden: false,
    helperText: "",
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties.filter(p => p.key !== "placeholder" && p.key !== "defaultValue" && p.key !== "allowClear" && p.key !== "status" && p.key !== "size"),
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [localValue, setLocalValue] = useState<string>(
      node.props.value ? String(node.props.value) : "#1677ff"
    );
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      setLocalValue(node.props.value ? String(node.props.value) : "#1677ff");
    }, [node.props.value]);

    const handleChange = (color: any, hex: string) => {
      setLocalValue(hex);
      
      const binding = node.bindings?.find((b) => b.prop === "value");
      if (binding) {
        setState(binding.expression, hex);
      }
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered}>
        <div>
          <ColorPicker
            value={localValue}
            onChange={handleChange}
            disabled={Boolean(node.props.disabled)}
          />
        </div>
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const disabled = node.props.disabled ? " disabled" : "";

    return `<ColorPicker${disabled} className="${styles || ""}" />`;
  },
};

export default ColorPickerComponent;
