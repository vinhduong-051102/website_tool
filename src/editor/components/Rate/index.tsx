import React, { useState, useEffect } from "react";
import { Rate } from "antd";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  commonFormProperties 
} from "../FormHelper";

export const RateComponent: BuilderComponent = {
  metadata: {
    type: "Rate",
    name: "Star Rating",
    category: "Form",
    icon: "Star",
  },
  defaultProps: {
    label: "Rating",
    value: 0,
    disabled: false,
    hidden: false,
    helperText: "",
    count: 5,
    allowHalf: false,
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties.filter(p => p.key !== "placeholder" && p.key !== "defaultValue" && p.key !== "allowClear" && p.key !== "status" && p.key !== "size"),
    { key: "count", name: "Star Count", type: "number", target: "props", section: "Content" },
    { key: "allowHalf", name: "Allow Half Stars", type: "switch", target: "props", section: "Content" },
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [localValue, setLocalValue] = useState<number>(
      node.props.value !== undefined ? Number(node.props.value) : 0
    );
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      setLocalValue(node.props.value !== undefined ? Number(node.props.value) : 0);
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
        <div>
          <Rate
            value={localValue}
            onChange={handleChange}
            disabled={Boolean(node.props.disabled)}
            count={node.props.count !== undefined ? Number(node.props.count) : 5}
            allowHalf={Boolean(node.props.allowHalf)}
          />
        </div>
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const disabled = node.props.disabled ? " disabled" : "";
    const count = node.props.count !== undefined ? ` count={${node.props.count}}` : "";
    const allowHalf = node.props.allowHalf ? " allowHalf" : "";

    return `<Rate${disabled}${count}${allowHalf} className="${styles || ""}" />`;
  },
};

export default RateComponent;
