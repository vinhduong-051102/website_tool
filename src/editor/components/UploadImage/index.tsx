import React, { useState, useEffect } from "react";
import { Upload, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  validateFormField, 
  commonFormProperties, 
  validationSchemaProperties 
} from "../FormHelper";

export const UploadImageComponent: BuilderComponent = {
  metadata: {
    type: "UploadImage",
    name: "Upload Image",
    category: "Form",
    icon: "ImagePlus",
  },
  defaultProps: {
    label: "Image Upload",
    value: [],
    required: false,
    disabled: false,
    hidden: false,
    helperText: "",
    maxCount: 4,
    maxFileSize: 2, // in MB
    multiple: true,
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties.filter(p => p.key !== "value" && p.key !== "defaultValue" && p.key !== "allowClear" && p.key !== "placeholder" && p.key !== "size"),
    { key: "maxCount", name: "Max Images Limit", type: "number", target: "props", section: "Content" },
    { key: "maxFileSize", name: "Max Size (MB)", type: "number", target: "props", section: "Content" },
    { key: "multiple", name: "Multi-select", type: "switch", target: "props", section: "Content" },
    ...validationSchemaProperties.filter(p => p.key === "customValidationMessage"),
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [fileList, setFileList] = useState<any[]>([]);
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      if (Array.isArray(node.props.value)) {
        setFileList(
          node.props.value.map((f: any, i: number) =>
            typeof f === "string" ? { uid: String(i), name: f, status: "done", url: f } : f
          )
        );
      } else {
        setFileList([]);
      }
    }, [node.props.value]);

    const error = validateFormField(fileList.length > 0 ? "uploaded" : "", node.props);

    const handleChange = ({ fileList: newFileList }: any) => {
      const maxMB = Number(node.props.maxFileSize || 2);
      const filtered = newFileList.filter((file: any) => {
        if (file.size && file.size / 1024 / 1024 > maxMB) {
          message.error(`${file.name} exceeds ${maxMB}MB limit.`);
          return false;
        }
        return true;
      });

      const updatedList = filtered.map((f: any) =>
        f.status === "uploading" ? { ...f, status: "done", url: "https://picsum.photos/200" } : f
      );

      setFileList(updatedList);

      const binding = node.bindings?.find((b) => b.prop === "value");
      const finalImages = updatedList.map((f: any) => f.url || f.name);
      if (binding) {
        setState(binding.expression, finalImages);
      }
      (node.props as any).triggerEvent?.("onChange", finalImages);
    };

    const uploadProps = {
      fileList,
      listType: "picture-card" as const,
      onChange: handleChange,
      multiple: Boolean(node.props.multiple),
      maxCount: Number(node.props.maxCount || 4),
      accept: "image/*",
      beforeUpload: () => false,
      disabled: Boolean(node.props.disabled),
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        <Upload {...uploadProps}>
          {fileList.length < Number(node.props.maxCount || 4) && (
            <div className="text-gray-400 hover:text-white transition-colors">
              <PlusOutlined style={{ fontSize: 20 }} />
              <div style={{ marginTop: 8 }} className="text-xs">Upload</div>
            </div>
          )}
        </Upload>
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const disabled = node.props.disabled ? " disabled" : "";
    const multiple = node.props.multiple ? " multiple" : "";
    const maxCount = node.props.maxCount ? ` maxCount={${node.props.maxCount}}` : "";

    return `<Upload listType="picture-card" accept="image/*"${disabled}${multiple}${maxCount} className="${styles || ""}">
  <div>
    <PlusOutlined />
    <div style={{ marginTop: 8 }}>Upload</div>
  </div>
</Upload>`;
  },
};

export default UploadImageComponent;
