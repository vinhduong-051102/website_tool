import React, { useState, useEffect } from "react";
import { Modal, Form, Select, Input, Switch, Button, Space, message, TreeSelect, Divider } from "antd";
import { getActionHandler, getAllActionHandlers } from "../action-engine/registry";
import { EventActionConfig, Page, StateVariable, ASTNode } from "../types";
import { useEditorStore, createASTCommand } from "../store/useEditorStore";
import { buildStateTree, StateTreeItem } from "../utils/state";
import { Plus, Globe, Settings, FileText, Database } from "lucide-react";

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
  
  // Sub-modal states for "Create New" features
  const [stateModalVisible, setStateModalVisible] = useState(false);
  const [pageModalVisible, setPageModalVisible] = useState(false);
  const [modalModalVisible, setModalModalVisible] = useState(false);
  const [apiModalVisible, setApiModalVisible] = useState(false);
  
  const [stateForm] = Form.useForm();
  const [pageForm] = Form.useForm();
  const [modalForm] = Form.useForm();
  const [apiForm] = Form.useForm();

  const [selectedType, setSelectedType] = useState<string | null>(null);
  
  const watchedValueSource = Form.useWatch("valueSource", form);
  const watchedConditionEnabled = Form.useWatch("conditionEnabled", form);
  const watchedConditionOperator = Form.useWatch("conditionOperator", form);

  const { pages, activePageId, apis, addApi, executeCommand } = useEditorStore();
  const actionHandlers = getAllActionHandlers();

  const activePage = pages.find((p) => p.id === activePageId);
  const stateSchema = activePage?.stateSchema || [];

  useEffect(() => {
    if (visible) {
      if (initialAction) {
        setSelectedType(initialAction.type);
        // Pre-fill parameters & condition fields
        form.setFieldsValue({
          type: initialAction.type,
          ...initialAction.params,
          conditionEnabled: initialAction.condition?.enabled || false,
          conditionStatePath: initialAction.condition?.statePath,
          conditionOperator: initialAction.condition?.operator || "truthy",
          conditionCompareValue: initialAction.condition?.compareValue,
        });
      } else {
        setSelectedType(null);
        form.resetFields();
        form.setFieldsValue({
          conditionEnabled: false,
          conditionOperator: "truthy",
        });
      }
    }
  }, [visible, initialAction, form]);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    const handler = getActionHandler(type);
    const defaults: Record<string, unknown> = {};
    handler?.paramSchema.forEach((param) => {
      if (param.defaultValue !== undefined) {
        defaults[param.key] = param.defaultValue;
      }
    });
    form.resetFields();
    form.setFieldsValue({
      type,
      ...defaults,
      conditionEnabled: false,
      conditionOperator: "truthy",
    });
  };

  const handleSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        const {
          type,
          conditionEnabled,
          conditionStatePath,
          conditionOperator,
          conditionCompareValue,
          ...params
        } = values;

        const actionConfig: EventActionConfig = {
          id: initialAction?.id || `action-${Math.random().toString(36).substr(2, 9)}`,
          type,
          params,
        };

        if (conditionEnabled) {
          actionConfig.condition = {
            enabled: true,
            statePath: conditionStatePath,
            operator: conditionOperator,
            compareValue: conditionCompareValue,
          };
        } else {
          actionConfig.condition = {
            enabled: false,
            statePath: "",
            operator: "truthy",
          };
        }

        onSave(actionConfig);
        message.success("Action configured successfully.");
        onClose();
      })
      .catch((info) => {
        console.warn("Validation failed:", info);
      });
  };

  // State Tree Mapper
  const stateTree = buildStateTree(stateSchema);
  const mapStateTreeToSelect = (items: StateTreeItem[]): any[] => {
    return items.map((item) => {
      const isFolder = item.type === "object" && item.children && item.children.length > 0;
      let typeIcon = "📂";
      if (item.type === "string") typeIcon = "🔤";
      else if (item.type === "number") typeIcon = "🔢";
      else if (item.type === "boolean") typeIcon = "☑️";
      else if (item.type === "array") typeIcon = "📊";

      return {
        title: (
          <span className="flex items-center justify-between w-full text-xs">
            <span>
              <span className="mr-1">{typeIcon}</span>
              <span>{item.title}</span>
            </span>
            <span className="text-[9px] text-gray-500 font-mono">({item.type})</span>
          </span>
        ),
        value: item.value,
        key: item.key,
        selectable: !isFolder,
        children: item.children ? mapStateTreeToSelect(item.children) : undefined,
      };
    });
  };
  const stateSelectNodes = mapStateTreeToSelect(stateTree);

  // Pages Options
  const pageOptions = pages.map((p) => ({
    label: `${p.name} (${p.path})`,
    value: p.id,
  }));

  // Modals List (Extracted from stateSchema modal.*.open)
  const existingModals = Array.from(
    new Set(
      stateSchema
        .filter((s) => s.key.startsWith("modal.") && s.key.endsWith(".open"))
        .map((s) => s.key.split(".")[1])
    )
  );
  const modalOptions = existingModals.map((name) => ({
    label: name,
    value: name,
  }));

  // Component Tree Mapper for nodeId targets
  const getComponentTreeNodes = (node: ASTNode): any => {
    return {
      title: `${node.props.name || node.type} (${node.id.split("-")[1] || node.id})`,
      value: node.id,
      key: node.id,
      children: node.children ? node.children.map(getComponentTreeNodes) : undefined,
    };
  };
  const componentTreeNodes = activePage?.ast ? [getComponentTreeNodes(activePage.ast)] : [];

  // APIs List
  const apiOptions = (apis || []).map((api) => ({
    label: `${api.name} (${api.method} ${api.url})`,
    value: api.url,
  }));

  // Create Handlers
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
          key: values.key,
          type: values.type,
          defaultValue,
        };

        const nextPages = JSON.parse(JSON.stringify(pages));
        const page = nextPages.find((p: any) => p.id === activePageId);
        if (page) {
          if (!page.stateSchema) page.stateSchema = [];
          if (page.stateSchema.some((v: any) => v.key === newVariable.key)) {
            message.warning(`State variable "${newVariable.key}" already exists.`);
            return;
          }
          page.stateSchema.push(newVariable);
          executeCommand(createASTCommand("Create Global State Variable", nextPages));
          message.success(`State variable "${newVariable.key}" created.`);
          stateForm.resetFields();
          setStateModalVisible(false);
        }
      });
  };

  const handleSavePage = () => {
    pageForm
      .validateFields()
      .then((values) => {
        const pageName = values.name;
        const pagePath = values.path.startsWith("/") ? values.path : `/${values.path}`;
        
        if (pages.some((p) => p.path === pagePath)) {
          message.warning(`Page with path "${pagePath}" already exists.`);
          return;
        }

        const nextPages = JSON.parse(JSON.stringify(pages));
        const newPage: Page = {
          id: pageName.toLowerCase().replace(/\s+/g, "-"),
          name: pageName,
          path: pagePath,
          ast: {
            id: `root-${Math.random().toString(36).substr(2, 5)}`,
            type: "Container",
            props: { name: `${pageName} Body` },
            styles: {
              desktop: { minHeight: "100vh", padding: "24px", backgroundColor: "#1f2937", color: "#ffffff", display: "flex", flexDirection: "column", gap: "16px" }
            },
            children: []
          },
          stateSchema: [],
        };
        
        nextPages.push(newPage);
        executeCommand(createASTCommand("Create New Page", nextPages));
        message.success(`Page "${pageName}" created.`);
        
        // Auto fill form navigate path
        form.setFieldsValue({ path: newPage.path });
        
        pageForm.resetFields();
        setPageModalVisible(false);
      });
  };

  const handleSaveModal = () => {
    modalForm
      .validateFields()
      .then((values) => {
        const modalName = values.name.toLowerCase().replace(/\s+/g, "-");
        const nextPages = JSON.parse(JSON.stringify(pages));
        const page = nextPages.find((p: any) => p.id === activePageId);
        if (page) {
          if (!page.stateSchema) page.stateSchema = [];
          
          const modalStateKey = `modal.${modalName}.open`;
          if (page.stateSchema.some((v: any) => v.key === modalStateKey)) {
            message.warning(`Modal state "${modalName}" already exists.`);
            return;
          }

          page.stateSchema.push({
            key: modalStateKey,
            type: "boolean",
            defaultValue: false,
          });

          executeCommand(createASTCommand("Create Modal State", nextPages));
          message.success(`Modal state for "${modalName}" created.`);
          
          // Auto fill parameter
          form.setFieldsValue({ name: modalName });
          
          modalForm.resetFields();
          setModalModalVisible(false);
        }
      });
  };

  const handleSaveApi = () => {
    apiForm
      .validateFields()
      .then((values) => {
        addApi({
          name: values.name,
          url: values.url,
          method: values.method || "GET",
          headers: values.headers,
          body: values.body,
        });
        message.success(`API "${values.name}" configured.`);
        
        // Auto fill form url
        form.setFieldsValue({
          url: values.url,
          method: values.method || "GET",
          headers: values.headers,
          body: values.body,
        });

        apiForm.resetFields();
        setApiModalVisible(false);
      });
  };

  const handleApiSelect = (apiUrl: string) => {
    const api = apis.find((a) => a.url === apiUrl);
    if (api) {
      form.setFieldsValue({
        method: api.method,
        headers: api.headers,
        body: api.body,
      });
    }
  };

  const activeHandler = selectedType ? getActionHandler(selectedType) : null;

  return (
    <>
      <Modal
        title={initialAction ? "Edit Action" : "Add Action"}
        open={visible}
        onCancel={onClose}
        onOk={handleSubmit}
        width={500}
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
                if (selectedType === "setState") {
                  if (param.key === "value" && watchedValueSource !== "custom") return null;
                  if (param.key === "sourceStatePath" && watchedValueSource !== "state") return null;
                }

                // Render Visual Controls based on key or type
                let controlInput = <Input placeholder={param.placeholder} />;
                let extra: React.ReactNode = undefined;

                if (param.type === "boolean") {
                  controlInput = <Switch />;
                } else if (param.type === "select") {
                  controlInput = (
                    <Select
                      placeholder={param.placeholder || "Select option"}
                      options={param.options}
                    />
                  );
                } else if (param.type === "json") {
                  controlInput = (
                    <Input.TextArea
                      rows={3}
                      placeholder={param.placeholder || '{"key": "value"}'}
                      className="font-mono text-xs"
                    />
                  );
                } else if (param.type === "state-path") {
                  // State key TreeSelect
                  controlInput = (
                    <TreeSelect
                      style={{ width: "100%" }}
                      dropdownStyle={{ maxHeight: 300, overflow: "auto" }}
                      placeholder="Select State Path..."
                      treeData={stateSelectNodes}
                      treeDefaultExpandAll
                      showSearch
                      allowClear
                      treeNodeFilterProp="title"
                    />
                  );
                  extra = (
                    <div className="flex justify-end">
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setStateModalVisible(true)}
                        className="p-0 text-xs flex items-center space-x-1"
                      >
                        <Plus size={12} />
                        <span>Create New State Variable</span>
                      </Button>
                    </div>
                  );
                } else if (param.key === "targetPageId" && selectedType === "navigate") {
                  // Page dropdown
                  controlInput = (
                    <Select
                      placeholder="Select page..."
                      options={pageOptions}
                      showSearch
                      optionFilterProp="label"
                    />
                  );
                  extra = (
                    <div className="flex justify-end">
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setPageModalVisible(true)}
                        className="p-0 text-xs flex items-center space-x-1"
                      >
                        <Plus size={12} />
                        <span>Create New Page</span>
                      </Button>
                    </div>
                  );
                } else if (param.key === "name" && (selectedType === "openModal" || selectedType === "closeModal")) {
                  // Modal dropdown
                  controlInput = (
                    <Select
                      placeholder="Select modal name..."
                      options={modalOptions}
                      showSearch
                      optionFilterProp="label"
                    />
                  );
                  extra = (
                    <div className="flex justify-end">
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setModalModalVisible(true)}
                        className="p-0 text-xs flex items-center space-x-1"
                      >
                        <Plus size={12} />
                        <span>Create New Modal</span>
                      </Button>
                    </div>
                  );
                } else if (param.key === "nodeId" && (selectedType === "hideComponent" || selectedType === "showComponent")) {
                  // Component target tree select
                  controlInput = (
                    <TreeSelect
                      style={{ width: "100%" }}
                      dropdownStyle={{ maxHeight: 300, overflow: "auto" }}
                      placeholder="Select target component..."
                      treeData={componentTreeNodes}
                      treeDefaultExpandAll
                      showSearch
                      allowClear
                      treeNodeFilterProp="title"
                    />
                  );
                } else if (param.key === "url" && selectedType === "callApi") {
                  // API dropdown
                  controlInput = (
                    <Select
                      placeholder="Select API endpoint..."
                      options={apiOptions}
                      onChange={handleApiSelect}
                      showSearch
                      optionFilterProp="label"
                    />
                  );
                  extra = (
                    <div className="flex justify-end">
                      <Button
                        type="link"
                        size="small"
                        onClick={() => setApiModalVisible(true)}
                        className="p-0 text-xs flex items-center space-x-1"
                      >
                        <Plus size={12} />
                        <span>Configure New API</span>
                      </Button>
                    </div>
                  );
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
                    extra={extra}
                  >
                    {controlInput}
                  </Form.Item>
                );
              })}
            </div>
          )}

          {/* Conditional Block Section */}
          <Divider style={{ margin: "16px 0" }} />
          <div className="bg-yellow-500/5 dark:bg-yellow-500/10 p-4 rounded-lg border border-yellow-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Run Conditional Check
              </span>
              <Form.Item name="conditionEnabled" valuePropName="checked" noStyle>
                <Switch size="small" />
              </Form.Item>
            </div>

            {watchedConditionEnabled && (
              <div className="space-y-3 mt-3">
                <Form.Item
                  name="conditionStatePath"
                  label={<span className="text-[11px] text-gray-600 dark:text-gray-400">If state path:</span>}
                  rules={[{ required: true, message: "Please select a state path" }]}
                >
                  <TreeSelect
                    style={{ width: "100%" }}
                    dropdownStyle={{ maxHeight: 200, overflow: "auto" }}
                    placeholder="Select State Path..."
                    treeData={stateSelectNodes}
                    treeDefaultExpandAll
                    showSearch
                    allowClear
                    treeNodeFilterProp="title"
                  />
                </Form.Item>

                <Form.Item
                  name="conditionOperator"
                  label={<span className="text-[11px] text-gray-600 dark:text-gray-400">Operator:</span>}
                  rules={[{ required: true }]}
                >
                  <Select
                    options={[
                      { label: "Is Truthy", value: "truthy" },
                      { label: "Is Falsy", value: "falsy" },
                      { label: "Equals", value: "equals" },
                      { label: "Not Equals", value: "notEquals" },
                      { label: "Greater Than", value: "gt" },
                      { label: "Less Than", value: "lt" },
                    ]}
                  />
                </Form.Item>

                {watchedConditionOperator !== "truthy" && watchedConditionOperator !== "falsy" && (
                  <Form.Item
                    name="conditionCompareValue"
                    label={<span className="text-[11px] text-gray-600 dark:text-gray-400">Compare Value:</span>}
                    rules={[{ required: true, message: "Please enter comparison value" }]}
                  >
                    <Input placeholder="Compare against (e.g. true, false, 42, text)" />
                  </Form.Item>
                )}
              </div>
            )}
          </div>
        </Form>
      </Modal>

      {/* State Variable Creator Sub-Modal */}
      <Modal
        title="Create New State Variable"
        open={stateModalVisible}
        onCancel={() => setStateModalVisible(false)}
        onOk={handleSaveStateVariable}
        okText="Create State"
        cancelText="Cancel"
        destroyOnHidden
      >
        <Form form={stateForm} layout="vertical" className="pt-4">
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
            tooltip="Provide starting value"
          >
            <Input placeholder="Leave empty for undefined" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Page Creator Sub-Modal */}
      <Modal
        title="Create New Page"
        open={pageModalVisible}
        onCancel={() => setPageModalVisible(false)}
        onOk={handleSavePage}
        okText="Create Page"
        cancelText="Cancel"
        destroyOnHidden
      >
        <Form form={pageForm} layout="vertical" className="pt-4">
          <Form.Item
            name="name"
            label="Page Name"
            rules={[{ required: true, message: "Please enter page name" }]}
          >
            <Input placeholder="Dashboard" />
          </Form.Item>

          <Form.Item
            name="path"
            label="Page Path (e.g. /dashboard)"
            rules={[{ required: true, message: "Please enter page path" }]}
          >
            <Input placeholder="/dashboard" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal Creator Sub-Modal */}
      <Modal
        title="Create New Modal"
        open={modalModalVisible}
        onCancel={() => setModalModalVisible(false)}
        onOk={handleSaveModal}
        okText="Create Modal"
        cancelText="Cancel"
        destroyOnHidden
      >
        <Form form={modalForm} layout="vertical" className="pt-4">
          <Form.Item
            name="name"
            label="Modal Name"
            rules={[{ required: true, message: "Please enter modal name" }]}
          >
            <Input placeholder="login" />
          </Form.Item>
        </Form>
      </Modal>

      {/* API Creator Sub-Modal */}
      <Modal
        title="Configure New API"
        open={apiModalVisible}
        onCancel={() => setApiModalVisible(false)}
        onOk={handleSaveApi}
        okText="Configure API"
        cancelText="Cancel"
        destroyOnHidden
      >
        <Form form={apiForm} layout="vertical" className="pt-4">
          <Form.Item
            name="name"
            label="API Name"
            rules={[{ required: true, message: "Please enter API name" }]}
          >
            <Input placeholder="Get Products" />
          </Form.Item>

          <Form.Item
            name="url"
            label="API URL"
            rules={[{ required: true, message: "Please enter API URL" }]}
          >
            <Input placeholder="https://api.example.com/products" />
          </Form.Item>

          <Form.Item
            name="method"
            label="Method"
            initialValue="GET"
          >
            <Select
              options={[
                { label: "GET", value: "GET" },
                { label: "POST", value: "POST" },
                { label: "PUT", value: "PUT" },
                { label: "DELETE", value: "DELETE" },
                { label: "PATCH", value: "PATCH" },
              ]}
            />
          </Form.Item>

          <Form.Item
            name="headers"
            label="Headers (JSON string)"
          >
            <Input.TextArea placeholder='{"Content-Type": "application/json"}' rows={2} />
          </Form.Item>

          <Form.Item
            name="body"
            label="Request Body (JSON string)"
          >
            <Input.TextArea placeholder='{"key": "value"}' rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default ActionConfigurator;
