import React, { useState, useEffect } from "react";
import { InputNumber } from "antd";
import { ASTNode } from "../../types";
import { useGlobalState } from "../../state/useGlobalState";
import { FormFieldWrapper, validateFormField } from "../FormHelper";

export const Renderer = ({
  node,
  isSelected,
  isHovered,
}: {
  node: ASTNode;
  isSelected: boolean;
  isHovered: boolean;
}) => {
  const [localValue, setLocalValue] = useState<number | null>(
    node.props.value !== undefined && node.props.value !== null ? Number(node.props.value) : null
  );
  const setState = useGlobalState((state) => state.setState);

  useEffect(() => {
    setLocalValue(
      node.props.value !== undefined && node.props.value !== null ? Number(node.props.value) : null
    );
  }, [node.props.value]);

  const error = validateFormField(localValue, node.props);

  const handleChange = (val: number | null) => {
    setLocalValue(val);
    
    const binding = node.bindings?.find((b) => b.prop === "value");
    if (binding) {
      setState(binding.expression, val);
    }
    (node.props as any).triggerEvent?.("onChange", val);
  };

  return (
    <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
      <InputNumber
        value={localValue}
        onChange={handleChange}
        placeholder={String(node.props.placeholder ?? "")}
        disabled={Boolean(node.props.disabled)}
        readOnly={Boolean(node.props.readOnly)}
        size={(node.props.size as any) || "middle"}
        min={node.props.min !== undefined ? Number(node.props.min) : undefined}
        max={node.props.max !== undefined ? Number(node.props.max) : undefined}
        step={node.props.step !== undefined ? Number(node.props.step) : undefined}
        status={error ? "error" : (node.props.status as any) || undefined}
        style={{ width: "100%" }}
        onFocus={(e) => (node.props as any).triggerEvent?.("onFocus", e)}
        onBlur={(e) => (node.props as any).triggerEvent?.("onBlur", e)}
      />
    </FormFieldWrapper>
  );
};

export default Renderer;
