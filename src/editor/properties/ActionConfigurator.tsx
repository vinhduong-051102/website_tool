import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Input, Switch, Button, Space, message } from "antd";
import { getActionHandler, getAllActionHandlers } from "../action-engine/registry";
import { EventActionConfig } from "../types";

interface ActionConfiguratorProps {
  visible: boolean;
  onClose: () => void;
  onSave: (actionConfig: EventActionConfig) => void;
  initialAction?: EventActionConfig;
}

export const ActionConfigurator: React.FC<ActionConfiguratorProps> = ({
  visible,
  onClose,
  onSave,
  initialAction,
}) => {
  const [form] = Form.useForm();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const watchedValueSource = Form.useWatch('valueSource', form);

  const actionHandlers = getAllActionHandlers();

  useEffect(() => {
    if (visible) {
      if (initialAction) {
        setSelectedType(initialAction.type);
        // Pre-fill parameters
        form.setFieldsValue({
          type: initialAction.type,
          ...initialAction.params,
        });
      } else {
        setSelectedType(null);
        form.resetFields();
      }
    }
  }, [visible, initialAction, form]);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    // Reset parameter fields to default values
    const handler = getActionHandler(type);
    const defaults: Record<string, unknown> = {};
    handler?.paramSchema.forEach((param) => {
      if (param.defaultValue !== undefined) {
        defaults[param.key] = param.defaultValue;
      }
    });
    form.resetFields();
    form.setFieldsValue({ type, ...defaults });
  };

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const { type, ...params } = values;
        onSave({
          id: initialAction?.id || `action-${Math.random().toString(36).substr(2, 9)}`,
          type,
          params,
        });
        message.success("Action configured successfully.");
        onClose();
      })
      .catch((info) => {
        console.warn("Validation failed:", info);
      });
  };

  const activeHandler = selectedType ? getActionHandler(selectedType) : null;

  return (
    <Modal
      title={initialAction ? "Edit Action" : "Add Action"}
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      width={480}
      okText="Save Action"
      cancelText="Cancel"
      destroyOnHidden
      styles={{ body: { paddingTop: 16 } }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="type"
          label="Action Type"
          rules={[{ required: true, message: "Please select an action type" }]}
        >
          <Select
            placeholder="Select action type"
            onChange={handleTypeChange}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={actionHandlers.map((h) => ({
              label: `${h.label} (${h.category})`,
              value: h.type,
            }))}
          />
        </Form.Item>

        {activeHandler && (
          <div className="bg-gray-50 dark:bg-gray-900/40 p-4 rounded-lg border border-gray-100 dark:border-gray-800 mb-4">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Parameters
            </h4>
            {activeHandler.paramSchema.map((param) => {
              const rules = param.required
                ? [{ required: true, message: `${param.label} is required` }]
                : [];

              // Conditional visibility for setState action
              if (selectedType === 'setState') {
                if (param.key === 'value' && watchedValueSource !== 'custom') return null;
                if (param.key === 'sourceStatePath' && watchedValueSource !== 'state') return null;
              }

              return (
                <Form.Item
                  key={param.key}
                  name={param.key}
                  label={
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {param.label}
                    </span>
                  }
                  rules={rules}
                  valuePropName={param.type === "boolean" ? "checked" : "value"}
                >
                  {param.type === "boolean" ? (
                    <Switch />
                  ) : param.type === "select" ? (
                    <Select
                      placeholder={param.placeholder || "Select option"}
                      options={param.options}
                    />
                  ) : param.type === "json" ? (
                    <Input.TextArea
                      rows={3}
                      placeholder={param.placeholder || '{"key": "value"}'}
                      className="font-mono text-xs"
                    />
                  ) : param.type === "state-path" ? (
                    <Input
                      placeholder={param.placeholder || "form.login.email"}
                      addonBefore="state."
                    />
                  ) : (
                    <Input placeholder={param.placeholder} />
                  )}
                </Form.Item>
              );
            })}
          </div>
        )}
      </Form>
    </Modal>
  );
};

export default ActionConfigurator;
