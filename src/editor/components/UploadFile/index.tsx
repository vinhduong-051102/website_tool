import React, { useState, useEffect } from "react";
import { Upload, Button, message } from "antd";
import { UploadOutlined, InboxOutlined } from "@ant-design/icons";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  validateFormField, 
  commonFormProperties, 
  validationSchemaProperties 
} from "../FormHelper";

export const UploadFileComponent: BuilderComponent = {
  metadata: {
    type: "UploadFile",
    name: "Upload File",
    category: "Form",
    icon: "UploadCloud",
  },
  defaultProps: {
    label: "Attachment",
    placeholder: "Click to upload",
    value: [],
    required: false,
    disabled: false,
    hidden: false,
    helperText: "",
    accept: "*",
    maxCount: 3,
    maxFileSize: 5, // in MB
    multiple: true,
    dragUpload: false,
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties.filter(p => p.key !== "value" && p.key !== "defaultValue" && p.key !== "allowClear" && p.key !== "placeholder" && p.key !== "size"),
    { key: "placeholder", name: "Button Label", type: "text", target: "props", section: "Content" },
    { key: "accept", name: "Accepted Formats", type: "text", target: "props", section: "Content" },
    { key: "maxCount", name: "Max Files Limit", type: "number", target: "props", section: "Content" },
    { key: "maxFileSize", name: "Max Size (MB)", type: "number", target: "props", section: "Content" },
    { key: "multiple", name: "Multi-select", type: "switch", target: "props", section: "Content" },
    { key: "dragUpload", name: "Drag & Drop Zone", type: "switch", target: "props", section: "Content" },
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
            typeof f === "string" ? { uid: String(i), name: f, status: "done" } : f
          )
        );
      } else {
        setFileList([]);
      }
    }, [node.props.value]);

    const error = validateFormField(fileList.length > 0 ? "uploaded" : "", node.props);

    const handleChange = ({ fileList: newFileList }: any) => {
      // Validate file size
      const maxMB = Number(node.props.maxFileSize || 5);
      const filtered = newFileList.filter((file: any) => {
        if (file.size && file.size / 1024 / 1024 > maxMB) {
          message.error(`${file.name} exceeds ${maxMB}MB limit.`);
          return false;
        }
        return true;
      });

      const updatedList = filtered.map((f: any) =>
        f.status === "uploading" ? { ...f, status: "done" } : f
      );

      setFileList(updatedList);

      const binding = node.bindings?.find((b) => b.prop === "value");
      const finalFiles = updatedList.map((f: any) => f.name);
      if (binding) {
        setState(binding.expression, finalFiles);
      }
      (node.props as any).triggerEvent?.("onChange", finalFiles);
    };

    const uploadProps = {
      fileList,
      onChange: handleChange,
      multiple: Boolean(node.props.multiple),
      maxCount: Number(node.props.maxCount || 3),
      accept: String(node.props.accept || "*"),
      beforeUpload: () => false, // Prevent real upload in preview
      disabled: Boolean(node.props.disabled),
    };

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        {node.props.dragUpload ? (
          <Upload.Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon text-gray-400">
              <InboxOutlined style={{ fontSize: 28 }} />
            </p>
            <p className="ant-upload-text text-xs text-gray-300">
              Click or drag file to this area to upload
            </p>
          </Upload.Dragger>
        ) : (
          <Upload {...uploadProps}>
            <Button icon={<UploadOutlined />} disabled={Boolean(node.props.disabled)} className="w-full bg-gray-900 border-gray-700 text-gray-300 hover:text-white">
              {String(node.props.placeholder || "Click to upload")}
            </Button>
          </Upload>
        )}
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const disabled = node.props.disabled ? " disabled" : "";
    const multiple = node.props.multiple ? " multiple" : "";
    const accept = node.props.accept ? ` accept="${node.props.accept}"` : "";
    const maxCount = node.props.maxCount ? ` maxCount={${node.props.maxCount}}` : "";

    if (node.props.dragUpload) {
      return `<Upload.Dragger${disabled}${multiple}${accept}${maxCount} className="${styles || ""}">
  <p className="ant-upload-drag-icon"><InboxOutlined /></p>
  <p className="ant-upload-text">Click or drag file to this area to upload</p>
</Upload.Dragger>`;
    }

    return `<Upload${disabled}${multiple}${accept}${maxCount} className="${styles || ""}">
  <Button icon={<UploadOutlined />}>${node.props.placeholder || "Click to upload"}</Button>
</Upload>`;
  },
};

export default UploadFileComponent;
