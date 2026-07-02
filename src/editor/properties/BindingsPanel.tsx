import React, { useState } from "react";
import { useEditorStore, createASTCommand } from "../store/useEditorStore";
import { getComponent } from "../components/registry";
import { findNodeById } from "../utils/ast";
import { ASTNode, BindingConfig, StateVariable } from "../types";
import { useGlobalState } from "../state/useGlobalState";
import {
  Link2,
  Plus,
  Trash2,
  ArrowRight,
  Database
} from "lucide-react";
import { Select, Button, Modal, Form, message, TreeSelect, Input, Tag } from "antd";
import { buildStateTree, isStateCompatible, StateTreeItem } from "../utils/state";

interface BindingsPanelProps {
  node: ASTNode;
}

export const BindingsPanel: React.FC<BindingsPanelProps> = ({ node }) => {
  const { pages, activePageId, executeCommand, globalVariables, setGlobalVariables } = useEditorStore();

  const componentDef = getComponent(node.type);
  const propertySchema = componentDef?.propertySchema || [];

  // Filter schema to get fields that target component "props"
  const bindableProps = propertySchema.filter((p) => p.target === "props");

  const [modalVisible, setModalVisible] = useState(false);
  const [stateCreatorVisible, setStateCreatorVisible] = useState(false);
  const [editingBinding, setEditingBinding] = useState<BindingConfig | null>(null);
  
  const [form] = Form.useForm();
  const [stateForm] = Form.useForm();

  // Watch the selected property key to dynamically check type compatibility
  const selectedPropKey = Form.useWatch("prop", form);
  const selectedProp = bindableProps.find((p) => p.key === selectedPropKey);
  const selectedPropType = selectedProp?.type || "text";

  const activePage = pages.find((p) => p.id === activePageId);
  const localVariables = activePage?.stateSchema || [];

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
    const activePageNode = nextPages.find((p: any) => p.id === activePageId);
    if (!activePageNode) return;

    const targetNode = findNodeById(activePageNode.ast, node.id);
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
          const index = currentBindings.findIndex((b) => b.prop === editingBinding.prop);
          if (index !== -1) {
            currentBindings[index] = values as BindingConfig;
          }
        } else {
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

  // State Creator Handler
  const handleSaveStateVariable = () => {
    stateForm
      .validateFields()
      .then((values) => {
        let defaultValue: unknown = values.defaultValue;
        if (values.type === "boolean") {
          defaultValue = values.defaultValue === "true" || values.defaultValue === true;
        } else if (values.type === "number") {
          defaultValue = Number(values.defaultValue);
        } else if (values.type === "object" || values.type === "array") {
          try {
            defaultValue = JSON.parse(values.defaultValue);
          } catch {
            message.error("Default value must be valid JSON for Object/Array types.");
            return;
          }
        }

        const newVariable: StateVariable = {
          id: `var-${Math.random().toString(36).substr(2, 9)}`,
          name: values.name || values.key,
          key: values.key,
          scope: values.scope || "local",
          type: values.type,
          defaultValue,
        };

        if (newVariable.scope === "global") {
          if (globalVariables.some((v) => v.key === newVariable.key)) {
            message.warning(`Global variable "${newVariable.key}" already exists.`);
            return;
          }
          setGlobalVariables([...globalVariables, newVariable]);
        } else {
          const nextPages = clonePages();
          const page = nextPages.find((p: any) => p.id === activePageId);
          if (page) {
            if (!page.stateSchema) page.stateSchema = [];
            if (page.stateSchema.some((v: any) => v.key === newVariable.key)) {
              message.warning(`Local variable "${newVariable.key}" already exists.`);
              return;
            }
            page.stateSchema.push(newVariable);
            executeCommand(createASTCommand("Create Local State Variable", nextPages));
          }
        }

        message.success(`Variable "${newVariable.key}" created.`);
        
        // Pre-fill the expression in binding form
        form.setFieldsValue({ expression: newVariable.key });
        
        stateForm.resetFields();
        setStateCreatorVisible(false);
      })
      .catch((err) => {
        console.warn("State Variable validation error:", err);
      });
  };

  // Helper to map tree items to AntD TreeSelect nodes
  const mapTreeToSelectNodes = (
    items: StateTreeItem[],
    expectedPropKey: string,
    expectedPropType: string
  ): any[] => {
    return items.map((item) => {
      const isCompatible = isStateCompatible(expectedPropKey, expectedPropType, item.type);
      const isFolder = item.type === "object" && item.children && item.children.length > 0;
      
      let typeIcon = "📂";
      if (item.type === "string") typeIcon = "🔤";
      else if (item.type === "number") typeIcon = "🔢";
      else if (item.type === "boolean") typeIcon = "☑️";
      else if (item.type === "array") typeIcon = "📊";

      const labelElement = (
        <span className="flex items-center justify-between w-full pr-4 text-xs">
          <span>
            <span className="mr-1.5">{typeIcon}</span>
            <span className={!isCompatible && !isFolder ? "text-gray-400 dark:text-gray-600 line-through" : "text-gray-800 dark:text-gray-200"}>
              {item.title}
            </span>
          </span>
          <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 px-1 py-0.5 rounded ml-2 font-mono">
            {item.type}
          </span>
        </span>
      );

      return {
        title: labelElement,
        value: item.value,
        key: item.key,
        selectable: isFolder ? false : isCompatible,
        disabled: isFolder ? false : !isCompatible,
        children: item.children
          ? mapTreeToSelectNodes(item.children, expectedPropKey, expectedPropType)
          : undefined,
      };
    });
  };

  const globalData = useGlobalState((state) => state.data);

  const getNestedValue = (obj: any, path: string): any => {
    if (!path) return undefined;
    const cleanPath = path.startsWith("state.") ? path.substring(6) : path;
    const keys = cleanPath.split(".");
    let current = obj;
    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      current = current[key];
    }
    return current;
  };

  const renderValuePreview = (val: any) => {
    if (val === null) {
      return (
        <span className="text-[10px] font-mono text-gray-500 bg-gray-950 px-1 py-0.5 rounded border border-gray-850">
          null
        </span>
      );
    }
    if (val === undefined) {
      return (
        <span className="text-[10px] font-mono text-gray-600 bg-gray-950 px-1 py-0.5 rounded border border-gray-850">
          undefined
        </span>
      );
    }
    const type = typeof val;
    if (type === "boolean") {
      return (
        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${val ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
          {val ? "true" : "false"}
        </span>
      );
    }
    if (type === "number") {
      return (
        <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
          {val}
        </span>
      );
    }
    if (type === "string") {
      return (
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 truncate max-w-[120px]" title={val}>
          "{val}"
        </span>
      );
    }
    if (Array.isArray(val)) {
      return (
        <details className="w-full cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <summary className="text-[10px] text-blue-400 font-mono hover:text-blue-300 select-none">
            Array({val.length})
          </summary>
          <pre className="text-[9px] bg-gray-950 p-1.5 rounded mt-1 border border-gray-850 font-mono text-gray-400 max-h-28 overflow-y-auto whitespace-pre-wrap select-text w-full">
            {JSON.stringify(val, null, 2)}
          </pre>
        </details>
      );
    }
    if (type === "object") {
      return (
        <details className="w-full cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <summary className="text-[10px] text-blue-400 font-mono hover:text-blue-300 select-none">
            Object ({Object.keys(val).length} keys)
          </summary>
          <pre className="text-[9px] bg-gray-950 p-1.5 rounded mt-1 border border-gray-850 font-mono text-gray-400 max-h-28 overflow-y-auto whitespace-pre-wrap select-text w-full">
            {JSON.stringify(val, null, 2)}
          </pre>
        </details>
      );
    }
    return <span className="text-[10px] text-gray-400">{String(val)}</span>;
  };

  const localStateTree = buildStateTree(localVariables);
  const globalStateTree = buildStateTree(globalVariables);

  const selectNodes = [
    {
      title: "📄 Local Variables (Active Page)",
      value: "local-variables-group",
      key: "local-variables-group",
      selectable: false,
      children: selectedPropKey ? mapTreeToSelectNodes(localStateTree, selectedPropKey, selectedPropType) : [],
    },
    {
      title: "🌐 Global Variables (All Pages)",
      value: "global-variables-group",
      key: "global-variables-group",
      selectable: false,
      children: selectedPropKey ? mapTreeToSelectNodes(globalStateTree, selectedPropKey, selectedPropType) : [],
    }
  ];

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-gray-300 font-semibold text-xs uppercase tracking-wider font-mono">
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
          <div className="space-y-3">
            {node.bindings.map((binding) => {
              const schemaField = bindableProps.find((p) => p.key === binding.prop);
              const currentValue = getNestedValue(globalData, binding.expression);
              const stateVar = localVariables.find((v) => v.key === binding.expression) || 
                               globalVariables.find((v) => v.key === binding.expression);
              const resolvedType = stateVar?.type || (currentValue === null ? "null" : Array.isArray(currentValue) ? "array" : typeof currentValue);

              return (
                <div
                  key={binding.prop}
                  className="flex flex-col space-y-2 bg-gray-900/40 p-3 rounded-lg border border-gray-800 hover:border-gray-700/60 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-semibold text-gray-300">
                        {schemaField?.name || binding.prop}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500">
                        ({binding.prop})
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(binding)}
                        className="px-2 py-0.5 rounded text-gray-400 hover:text-blue-400 hover:bg-gray-800 transition-all text-[10px] font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteBinding(binding.prop)}
                        className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-all"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-850/60 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-bold select-none">State Path:</span>
                      <span className="font-mono text-blue-400 truncate max-w-[180px]" title={`state.${binding.expression}`}>
                        state.{binding.expression}
                      </span>
                    </div>
                     <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-bold select-none">Scope:</span>
                      <Tag color={stateVar?.scope === "global" ? "purple" : "blue"} className="border-0 text-[9px] scale-90">
                        {stateVar?.scope === "global" ? "Global" : "Local"}
                      </Tag>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 font-bold select-none">Data Type:</span>
                      <span className="font-mono text-gray-400 capitalize">
                        {resolvedType}
                      </span>
                    </div>
                    <div className="flex flex-col space-y-1">
                      <span className="text-gray-500 font-bold select-none">Current Value:</span>
                      <div className="flex items-center pl-1">
                        {renderValuePreview(currentValue)}
                      </div>
                    </div>
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

          {selectedPropKey && (
            <div className="mb-4">
              <Form.Item
                name="expression"
                label={
                  <div className="flex items-center justify-between w-full">
                    <span>Global State Path (Must match attribute type)</span>
                  </div>
                }
                rules={[{ required: true, message: "Please select a state path" }]}
                className="mb-1"
              >
                <TreeSelect
                  style={{ width: "100%" }}
                  dropdownStyle={{ maxHeight: 350, overflow: "auto" }}
                  placeholder="Select state variable..."
                  treeData={selectNodes}
                  treeDefaultExpandAll
                  showSearch
                  allowClear
                  treeNodeFilterProp="title"
                />
              </Form.Item>
              <div className="flex justify-end mt-1">
                <Button
                  type="link"
                  size="small"
                  onClick={() => setStateCreatorVisible(true)}
                  className="p-0 text-xs flex items-center space-x-1"
                >
                  <Plus size={12} />
                  <span>Create New State Variable</span>
                </Button>
              </div>
            </div>
          )}

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

      {/* Inline Create State Variable Modal */}
      <Modal
        title="Create New State Variable"
        open={stateCreatorVisible}
        onCancel={() => setStateCreatorVisible(false)}
        onOk={handleSaveStateVariable}
        okText="Create Variable"
        cancelText="Cancel"
        destroyOnHidden
      >
        <Form form={stateForm} layout="vertical" className="pt-4">
          <Form.Item
            name="scope"
            label="Variable Scope"
            rules={[{ required: true }]}
            initialValue="local"
          >
            <Select
              options={[
                { label: "📄 Local (Active Page)", value: "local" },
                { label: "🌐 Global (All Pages)", value: "global" }
              ]}
            />
          </Form.Item>

          <Form.Item
            name="key"
            label="State Key (e.g. form.login.email)"
            rules={[
              { required: true, message: "Please enter a state key" },
              { pattern: /^[a-zA-Z0-9_.]*$/, message: "Key can only contain alphanumeric characters, underscores, and dots" }
            ]}
          >
            <Input placeholder="form.login.email" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Display Label"
            rules={[{ required: true, message: "Please enter a display label" }]}
          >
            <Input placeholder="e.g. Email Input Value" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Data Type"
            rules={[{ required: true, message: "Please select a data type" }]}
          >
            <Select
              options={[
                { label: "String (Text)", value: "string" },
                { label: "Number (Integer/Decimal)", value: "number" },
                { label: "Boolean (True/False)", value: "boolean" },
                { label: "Object (JSON Object)", value: "object" },
                { label: "Array (List)", value: "array" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="defaultValue"
            label="Default Value"
            tooltip="Provide starting value (e.g., 'hello', 42, true, or valid JSON for Objects/Arrays)"
          >
            <Input placeholder="Leave empty for undefined" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default BindingsPanel;
