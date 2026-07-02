import React, { useState, useEffect } from "react";
import { Input } from "antd";
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
    (node.props as any).triggerEvent?.("onChange", val);
  };

  const handleSearch = (val: string, e: any) => {
    (node.props as any).triggerEvent?.("onSearch", { value: val, event: e });
  };

  return (
    <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
      <Input.Search
        value={localValue}
        onChange={handleChange}
        onSearch={handleSearch}
        placeholder={String(node.props.placeholder ?? "")}
        disabled={Boolean(node.props.disabled)}
        readOnly={Boolean(node.props.readOnly)}
        size={(node.props.size as any) || "middle"}
        allowClear={Boolean(node.props.allowClear)}
        enterButton={node.props.enterButton !== false}
        status={error ? "error" : (node.props.status as any) || undefined}
        onFocus={(e) => (node.props as any).triggerEvent?.("onFocus", e)}
        onBlur={(e) => (node.props as any).triggerEvent?.("onBlur", e)}
      />
    </FormFieldWrapper>
  );
};

export default Renderer;
