import React, { useState, useEffect } from "react";
import { Upload, message } from "antd";
import { LoadingOutlined, PlusOutlined } from "@ant-design/icons";
import { BuilderComponent } from "../types";
import { useGlobalState } from "../../state/useGlobalState";
import { 
  FormFieldWrapper, 
  validateFormField, 
  commonFormProperties, 
  validationSchemaProperties 
} from "../FormHelper";

export const AvatarUploadComponent: BuilderComponent = {
  metadata: {
    type: "AvatarUpload",
    name: "Avatar Upload",
    category: "Form",
    icon: "UserCircle2",
  },
  defaultProps: {
    label: "Profile Picture",
    value: "",
    required: false,
    disabled: false,
    hidden: false,
    helperText: "",
    maxFileSize: 1, // in MB
  },
  defaultStyles: {},
  propertySchema: [
    ...commonFormProperties.filter(p => p.key !== "value" && p.key !== "defaultValue" && p.key !== "allowClear" && p.key !== "placeholder" && p.key !== "size"),
    { key: "maxFileSize", name: "Max Size (MB)", type: "number", target: "props", section: "Content" },
    ...validationSchemaProperties.filter(p => p.key === "customValidationMessage"),
  ],
  validator: {
    canAcceptChild: () => false,
    canBeDroppedIn: () => true,
  },
  supportedEvents: ["onChange"],
  renderer: ({ node, isSelected, isHovered }) => {
    const [imageUrl, setImageUrl] = useState<string>(String(node.props.value ?? ""));
    const [loading, setLoading] = useState(false);
    const setState = useGlobalState((state) => state.setState);

    useEffect(() => {
      setImageUrl(String(node.props.value ?? ""));
    }, [node.props.value]);

    const error = validateFormField(imageUrl ? "filled" : "", node.props);

    const handleChange = (info: any) => {
      setLoading(true);
      
      const file = info.file;
      const maxMB = Number(node.props.maxFileSize || 1);
      if (file.size && file.size / 1024 / 1024 > maxMB) {
        message.error(`Image exceeds ${maxMB}MB limit.`);
        setLoading(false);
        return;
      }

      // Mock delay and completion
      setTimeout(() => {
        const dummyUrl = "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix";
        setImageUrl(dummyUrl);
        setLoading(false);

        const binding = node.bindings?.find((b) => b.prop === "value");
        if (binding) {
          setState(binding.expression, dummyUrl);
        }
      }, 500);
    };

    const uploadButton = (
      <div className="text-gray-400 hover:text-white transition-colors">
        {loading ? <LoadingOutlined /> : <PlusOutlined />}
        <div style={{ marginTop: 8 }} className="text-xs">Upload</div>
      </div>
    );

    return (
      <FormFieldWrapper node={node} isSelected={isSelected} isHovered={isHovered} error={error}>
        <Upload
          name="avatar"
          listType="picture-circle"
          className="avatar-uploader"
          showUploadList={false}
          beforeUpload={() => false}
          onChange={handleChange}
          disabled={Boolean(node.props.disabled)}
          accept="image/*"
        >
          {imageUrl ? (
            <img src={imageUrl} alt="avatar" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            uploadButton
          )}
        </Upload>
      </FormFieldWrapper>
    );
  },
  codeGenerator: (node, children, styles) => {
    const disabled = node.props.disabled ? " disabled" : "";

    return `<Upload name="avatar" listType="picture-circle" showUploadList={false} accept="image/*"${disabled} className="${styles || ""}">
  <PlusOutlined />
</Upload>`;
  },
};

export default AvatarUploadComponent;
