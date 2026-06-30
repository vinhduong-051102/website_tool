import React, { useState, useEffect } from "react";
import { Slider } from "antd";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  commonFormProperties 
} from "../FormHelper";

export const SliderComponent: BuilderComponent = {
  metadata: {
    type: "Slider",
    name: "Range Slider",
    category: "Form",
    icon: "Sliders",
  },
  defaultProps: {
    label: "Adjust Range",
    value: 50,
    disabled: false,
    hidden: false,
    helperText: "",
    min: 0,
    max: 100,
    step: 1,
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties.filter(p => p.key !== "placeholder" && p.key !== "defaultValue" && p.key !== "allowClear" && p.key !== "status" && p.key !== "size"),
    { key: "min", name: "Min Value", type: "number", target: "props", section: "Content" },
    { key: "max", name: "Max Value", type: "number", target: "props", section: "Content" },
    { key: "step", name: "Step Interval", type: "number", target: "props", section: "Content" },
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [localValue, setLocalValue] = useState<number>(
      node.props.value !== undefined ? Number(node.props.value) : 50
    );
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      setLocalValue(node.props.value !== undefined ? Number(node.props.value) : 50);
    }, [node.props.value]);

    const handleChange = (val: number) => {
      setLocalValue(val);
      
      const binding = node.bindings?.find((b) => b.prop === "value");
      if (binding) {
        setState(binding.expression, val);
      }
      (node.props as any).triggerEvent?.("onChange", val);
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered}>
        <Slider
          value={localValue}
          onChange={handleChange}
          disabled={Boolean(node.props.disabled)}
          min={node.props.min !== undefined ? Number(node.props.min) : 0}
          max={node.props.max !== undefined ? Number(node.props.max) : 100}
          step={node.props.step !== undefined ? Number(node.props.step) : 1}
        />
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const disabled = node.props.disabled ? " disabled" : "";
    const min = node.props.min !== undefined ? ` min={${node.props.min}}` : "";
    const max = node.props.max !== undefined ? ` max={${node.props.max}}` : "";
    const step = node.props.step !== undefined ? ` step={${node.props.step}}` : "";

    return `<Slider${disabled}${min}${max}${step} className="${styles || ""}" />`;
  },
};

export default SliderComponent;
