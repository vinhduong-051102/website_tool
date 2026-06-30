import React, { useState } from "react";
import { useEditorStore, createASTCommand } from "../store/useEditorStore";
import { getComponent } from "../components/registry";
import { findNodeById } from "../utils/ast";
import { ASTNode, BindingConfig } from "../types";
import {
  Link2,
  Plus,
  Trash2,
  ChevronRight,
  Database,
  ArrowRight
} from "lucide-react";
import { Select, Input, Button, Modal, Form, message } from "antd";

interface BindingsPanelProps {
  node: ASTNode;
}

export const BindingsPanel: React.FC<BindingsPanelProps> = ({ node }) => {
  const { pages, activePageId, executeCommand } = useEditorStore();

  const componentDef = getComponent(node.type);
  const propertySchema = componentDef?.propertySchema || [];

  // Filter schema to get fields that target component "props"
  const bindableProps = propertySchema.filter((p) => p.target === "props");

  const [modalVisible, setModalVisible] = useState(false);
  const [editingBinding, setEditingBinding] = useState<BindingConfig | null>(null);
  const [form] = Form.useForm();

  if (bindableProps.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Link2 className="mx-auto mb-2 text-gray-600" size={24} />
        <span className="text-xs">No bindable props found on this component.</span>
      </div>
    );
  }

  const clonePages = () => JSON.parse(JSON.stringify(pages));

  const updateNodeBindings = (newBindings: BindingConfig[]) => {
    const nextPages = clonePages();
    const activePage = nextPages.find((p: any) => p.id === activePageId);
    if (!activePage) return;

    const targetNode = findNodeById(activePage.ast, node.id);
    if (targetNode) {
      targetNode.bindings = newBindings;
      executeCommand(
        createASTCommand("Update Data Bindings", nextPages)
      );
    }
  };

  const handleOpenAddModal = () => {
    setEditingBinding(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleOpenEditModal = (binding: BindingConfig) => {
    setEditingBinding(binding);
    form.setFieldsValue(binding);
    setModalVisible(true);
  };

  const handleSaveBinding = () => {
    form
      .validateFields()
      .then((values) => {
        const currentBindings = node.bindings ? [...node.bindings] : [];

        if (editingBinding) {
          // Update existing
          const index = currentBindings.findIndex((b) => b.prop === editingBinding.prop);
          if (index !== -1) {
            currentBindings[index] = values as BindingConfig;
          }
        } else {
          // Add new (verify no duplicates for the same prop)
          const exists = currentBindings.some((b) => b.prop === values.prop);
          if (exists) {
            message.warning(`Property "${values.prop}" is already bound.`);
            return;
          }
          currentBindings.push(values as BindingConfig);
        }

        updateNodeBindings(currentBindings);
        setModalVisible(false);
        message.success("Binding saved.");
      })
      .catch((err) => {
        console.warn("Validation error:", err);
      });
  };

  const handleDeleteBinding = (propName: string) => {
    const currentBindings = node.bindings ? [...node.bindings] : [];
    const nextBindings = currentBindings.filter((b) => b.prop !== propName);
    updateNodeBindings(nextBindings);
    message.success("Binding deleted.");
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-gray-300 font-semibold text-xs uppercase tracking-wider">
          <Link2 size={14} className="text-blue-500" />
          <span>Data Bindings</span>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-2 py-1 rounded bg-blue-600/90 text-white text-[10px] font-semibold flex items-center space-x-1 hover:bg-blue-500 transition-all shadow shadow-blue-500/10"
        >
          <Plus size={10} />
          <span>New Binding</span>
        </button>
      </div>

      <div className="flex-1 p-4 space-y-3">
        {(!node.bindings || node.bindings.length === 0) ? (
          <div className="p-8 text-center bg-gray-900/20 rounded-lg border border-gray-850">
            <Database className="mx-auto mb-2.5 text-gray-700" size={24} />
            <p className="text-xs text-gray-500 max-w-[200px] mx-auto leading-relaxed">
              Link this component's attributes (like Text or Href) to dynamic global variables.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {node.bindings.map((binding) => {
              const schemaField = bindableProps.find((p) => p.key === binding.prop);
              return (
                <div
                  key={binding.prop}
                  className="flex items-center justify-between bg-gray-900/40 p-3 rounded-lg border border-gray-800 hover:border-gray-700/60 transition-all"
                >
                  <div className="flex flex-col space-y-1.5 overflow-hidden mr-3">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-semibold text-gray-300">
                        {schemaField?.name || binding.prop}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        ({binding.prop})
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-[10px] font-mono text-blue-400">
                      <ArrowRight size={10} className="text-gray-600 shrink-0" />
                      <span className="bg-gray-950 px-1 py-0.5 rounded border border-gray-850 truncate max-w-[150px]">
                        state.{binding.expression}
                      </span>
                      {binding.transform && (
                        <span className="bg-gray-950 px-1 py-0.5 rounded border border-gray-850 text-yellow-500/80">
                          {binding.transform}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-1shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(binding)}
                      className="p-1.5 rounded text-gray-500 hover:text-blue-400 hover:bg-gray-800 transition-all text-xs font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteBinding(binding.prop)}
                      className="p-1.5 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Binding Modal */}
      <Modal
        title={editingBinding ? "Edit Data Binding" : "Create Data Binding"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSaveBinding}
        okText="Apply Binding"
        cancelText="Cancel"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="pt-4">
          <Form.Item
            name="prop"
            label="Target Attribute"
            rules={[{ required: true, message: "Please select a component attribute" }]}
          >
            <Select
              placeholder="Choose which prop to override"
              disabled={!!editingBinding}
              options={bindableProps.map((p) => ({
                label: `${p.name} (${p.key})`,
                value: p.key,
              }))}
            />
          </Form.Item>

          <Form.Item
            name="expression"
            label="Global State Path"
            rules={[{ required: true, message: "Please enter a state path" }]}
          >
            <Input placeholder="e.g. form.login.email or currentUser.name" addonBefore="state." />
          </Form.Item>

          <Form.Item
            name="transform"
            label="Value Transform (Optional)"
          >
            <Select
              placeholder="No transform (pass value directly)"
              allowClear
              options={[
                { label: "Negate Boolean (!value)", value: "!value" },
                { label: "Convert to String (String(value))", value: "String" },
                { label: "Convert to Number (Number(value))", value: "Number" },
                { label: "Convert to Boolean (Boolean(value))", value: "Boolean" },
                { label: "Serialize as JSON String (JSON.stringify(value))", value: "JSON" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BindingsPanel;
