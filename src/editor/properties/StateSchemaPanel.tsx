import React, { useState } from "react";
import { useEditorStore, createASTCommand } from "../store/useEditorStore";
import { StateVariable } from "../types";
import { useGlobalState } from "../state/useGlobalState";
import {
  Database,
  Plus,
  Trash2,
  Edit,
  Layers,
  Settings,
  HelpCircle
} from "lucide-react";
import { Modal, Form, Input, Select, Button, Space, message, Table, Tag } from "antd";

const StateValueCell: React.FC<{ path: string }> = ({ path }) => {
  const value = useGlobalState((state) => {
    if (!path) return undefined;
    const cleanPath = path.startsWith("state.") ? path.substring(6) : path;
    const keys = cleanPath.split(".");
    let current: any = state.data;
    for (const key of keys) {
      if (current === null || current === undefined) return undefined;
      current = current[key];
    }
    return current;
  });

  if (value === null) {
    return (
      <span className="text-[10px] font-mono text-gray-500 bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">
        null
      </span>
    );
  }
  if (value === undefined) {
    return (
      <span className="text-[10px] font-mono text-gray-600 bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">
        undefined
      </span>
    );
  }
  const type = typeof value;
  if (type === "boolean") {
    return (
      <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${value ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
        {value ? "true" : "false"}
      </span>
    );
  }
  if (type === "number") {
    return (
      <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
        {value as number}
      </span>
    );
  }
  if (type === "string") {
    return (
      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 truncate max-w-[150px]" title={value as string}>
        "{value as string}"
      </span>
    );
  }
  if (Array.isArray(value)) {
    return (
      <details className="w-full cursor-pointer" onClick={(e) => e.stopPropagation()}>
        <summary className="text-[10px] text-blue-400 font-mono hover:text-blue-300 select-none">
          Array({value.length})
        </summary>
        <pre className="text-[9px] bg-gray-950 p-2 rounded mt-1 border border-gray-850 font-mono text-gray-400 max-h-32 overflow-y-auto whitespace-pre-wrap select-text w-full max-w-[300px]">
          {JSON.stringify(value, null, 2)}
        </pre>
      </details>
    );
  }
  if (type === "object") {
    return (
      <details className="w-full cursor-pointer" onClick={(e) => e.stopPropagation()}>
        <summary className="text-[10px] text-blue-400 font-mono hover:text-blue-300 select-none">
          Object ({Object.keys(value).length} keys)
        </summary>
        <pre className="text-[9px] bg-gray-950 p-2 rounded mt-1 border border-gray-850 font-mono text-gray-400 max-h-32 overflow-y-auto whitespace-pre-wrap select-text w-full max-w-[300px]">
          {JSON.stringify(value, null, 2)}
        </pre>
      </details>
    );
  }
  return <span className="text-[10px] text-gray-400">{String(value)}</span>;
};


export const StateSchemaPanel: React.FC = () => {
  const { pages, activePageId, executeCommand } = useEditorStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingVar, setEditingVar] = useState<StateVariable | null>(null);
  const [form] = Form.useForm();

  const activePage = pages.find((p) => p.id === activePageId);
  const stateSchema = activePage?.stateSchema || [];

  const clonePages = () => JSON.parse(JSON.stringify(pages));

  const updateStateSchema = (newSchema: StateVariable[]) => {
    const nextPages = clonePages();
    const page = nextPages.find((p: any) => p.id === activePageId);
    if (page) {
      page.stateSchema = newSchema;
      executeCommand(
        createASTCommand("Update Global State Schema", nextPages)
      );
    }
  };

  const handleOpenAddModal = () => {
    setEditingVar(null);
    form.resetFields();
    form.setFieldsValue({ type: "string" });
    setModalVisible(true);
  };

  const handleOpenEditModal = (record: StateVariable) => {
    setEditingVar(record);
    // Serialize defaultValue for JSON fields if needed
    let displayVal = record.defaultValue;
    if (record.type === "object" || record.type === "array") {
      displayVal = JSON.stringify(record.defaultValue, null, 2);
    } else {
      displayVal = String(record.defaultValue ?? "");
    }
    form.setFieldsValue({
      key: record.key,
      type: record.type,
      defaultValue: displayVal,
    });
    setModalVisible(true);
  };

  const handleSaveVariable = () => {
    form
      .validateFields()
      .then((values) => {
        let defaultValue: unknown = values.defaultValue;

        // Try to parse values based on type
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
          id: editingVar?.id || `var-${Math.random().toString(36).substr(2, 9)}`,
          name: editingVar?.name || values.key,
          scope: "local",
          key: values.key,
          type: values.type,
          defaultValue,
        };

        const nextSchema = [...stateSchema];

        if (editingVar) {
          const index = nextSchema.findIndex((v) => v.key === editingVar.key);
          if (index !== -1) {
            nextSchema[index] = newVariable;
          }
        } else {
          // Verify no duplicate keys
          if (nextSchema.some((v) => v.key === newVariable.key)) {
            message.warning(`State variable "${newVariable.key}" already exists.`);
            return;
          }
          nextSchema.push(newVariable);
        }

        updateStateSchema(nextSchema);
        setModalVisible(false);
        message.success("State variable saved.");
      })
      .catch((err) => {
        console.warn("Validation error:", err);
      });
  };

  const handleDeleteVariable = (key: string) => {
    const nextSchema = stateSchema.filter((v) => v.key !== key);
    updateStateSchema(nextSchema);
    message.success("State variable deleted.");
  };

  const columns = [
    {
      title: "Key Path",
      dataIndex: "key",
      key: "key",
      render: (text: string) => (
        <span className="font-mono text-xs text-gray-300 font-semibold">{text}</span>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 70,
      render: (type: string) => {
        let color = "blue";
        if (type === "boolean") color = "green";
        if (type === "number") color = "orange";
        if (type === "object") color = "purple";
        return <Tag color={color} className="capitalize text-[10px] font-medium px-1.5 py-0.5 border-0 bg-opacity-10">{type}</Tag>;
      },
    },
    {
      title: "Default",
      dataIndex: "defaultValue",
      key: "defaultValue",
      ellipsis: true,
      width: 100,
      render: (val: any, record: StateVariable) => {
        if (record.type === "object" || record.type === "array") {
          return <span className="font-mono text-[10px] text-gray-500">{JSON.stringify(val)}</span>;
        }
        return <span className="font-mono text-[10px] text-gray-400">{String(val ?? "")}</span>;
      },
    },
    {
      title: "Current Value",
      key: "currentValue",
      render: (_: any, record: StateVariable) => (
        <StateValueCell path={record.key} />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      width: 70,
      render: (_: any, record: StateVariable) => (
        <Space size={4}>
          <button
            onClick={() => handleOpenEditModal(record)}
            className="p-1 rounded text-gray-400 hover:text-blue-400 hover:bg-gray-800 transition-all"
            title="Edit variable"
          >
            <Edit size={12} />
          </button>
          <button
            onClick={() => handleDeleteVariable(record.key)}
            className="p-1 rounded text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all"
            title="Delete variable"
          >
            <Trash2 size={12} />
          </button>
        </Space>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-full bg-[#1f2937]/95 text-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-gray-300 font-semibold text-xs uppercase tracking-wider">
          <Database size={14} className="text-blue-500" />
          <span>Page State Variables</span>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-2 py-1 rounded bg-blue-600/90 text-white text-[10px] font-semibold flex items-center space-x-1 hover:bg-blue-500 transition-all shadow shadow-blue-500/10"
        >
          <Plus size={10} />
          <span>New Var</span>
        </button>
      </div>

      {/* Info Notice */}
      <div className="px-4 py-3 bg-blue-950/20 border-b border-blue-950/40 text-[10px] text-gray-400 flex items-start space-x-2 leading-relaxed">
        <HelpCircle size={14} className="text-blue-400 shrink-0 mt-0.5" />
        <span>
          Declare state paths here (e.g. <code>currentUser.name</code>) with their initial values. Components can bind to these variables or alter them via events.
        </span>
      </div>

      {/* Variables List */}
      <div className="flex-1 overflow-y-auto">
        {stateSchema.length === 0 ? (
          <div className="p-12 text-center">
            <Database className="mx-auto mb-3 text-gray-700" size={32} />
            <h4 className="text-xs font-semibold text-gray-400 mb-1">No State Variables</h4>
            <p className="text-[10px] text-gray-500 max-w-[180px] mx-auto leading-relaxed">
              Create variables to hold form values, table data, or UI loading states.
            </p>
          </div>
        ) : (
          <div className="p-2 ant-dark-table">
            <Table
              dataSource={stateSchema.map((v) => ({ ...v, key: v.key }))}
              columns={columns}
              pagination={false}
              size="small"
              className="bg-transparent"
              rowClassName="hover:bg-gray-800/40 border-b border-gray-850"
            />
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        title={editingVar ? "Edit State Variable" : "Create State Variable"}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={handleSaveVariable}
        okText="Save Variable"
        cancelText="Cancel"
        destroyOnHidden
      >
        <Form form={form} layout="vertical" className="pt-4">
          <Form.Item
            name="key"
            label="Variable Key Path"
            rules={[
              { required: true, message: "Please enter a key path" },
              { pattern: /^[a-zA-Z0-9_.]*$/, message: "Key can only contain letters, numbers, underscores and dots." }
            ]}
          >
            <Input placeholder="e.g. form.login.email or currentUser" disabled={!!editingVar} />
          </Form.Item>

          <Form.Item
            name="type"
            label="Data Type"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { label: "String (Text)", value: "string" },
                { label: "Number (Integer/Float)", value: "number" },
                { label: "Boolean (True/False)", value: "boolean" },
                { label: "Object (JSON Object)", value: "object" },
                { label: "Array (JSON List)", value: "array" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="defaultValue"
            label="Default Initial Value"
            help="For Objects/Arrays, enter valid JSON. For Booleans enter true or false."
          >
            <Input.TextArea rows={3} placeholder="Initial value..." className="font-mono text-xs" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StateSchemaPanel;
