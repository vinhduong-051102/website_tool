import React, { useState, useEffect } from "react";
import { useEditorStore, createASTCommand } from "../store/useEditorStore";
import { StateVariable, Page, ASTNode, Layout, BindingConfig, EventActionConfig } from "../types";
import { useGlobalState } from "../state/useGlobalState";
import {
  Database,
  Plus,
  Trash2,
  Edit,
  Globe,
  FileText,
  Search,
  Filter,
  Copy,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  TrendingUp,
  Link,
  RefreshCw,
  Code
} from "lucide-react";
import { Modal, Form, Input, Select, Button, Space, message, Table, Tag, Tooltip } from "antd";

// Utility component to display real-time values of variables
const RealTimeValueCell: React.FC<{ path: string }> = ({ path }) => {
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

  // Track changes to trigger a pulse animation
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    setPulse(true);
    const timer = setTimeout(() => setPulse(false), 500);
    return () => clearTimeout(timer);
  }, [value]);

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
  let formatted = String(value);
  if (type === "object") {
    formatted = JSON.stringify(value);
  }

  const baseStyle = "text-[10px] font-mono truncate max-w-[120px] transition-all duration-300 px-1.5 py-0.5 rounded border ";
  let colorStyle = "text-gray-400 bg-gray-900 border-gray-800";
  
  if (pulse) {
    colorStyle = "text-yellow-400 bg-yellow-400/20 border-yellow-400/30 scale-105";
  } else if (type === "boolean") {
    colorStyle = value 
      ? "bg-green-500/10 text-green-400 border-green-500/20" 
      : "bg-red-500/10 text-red-400 border-red-500/20";
  } else if (type === "number") {
    colorStyle = "text-amber-400 bg-amber-500/10 border-amber-500/20";
  } else if (type === "string") {
    colorStyle = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
  }

  return (
    <span className={`${baseStyle} ${colorStyle}`} title={formatted}>
      {type === "string" ? `"${formatted}"` : formatted}
    </span>
  );
};

interface VariableUsage {
  id: string;
  type: "binding" | "action" | "api";
  pageId: string;
  pageName: string;
  nodeId?: string;
  nodeType?: string;
  description: string;
}

export const VariableExplorer: React.FC = () => {
  const { 
    pages, 
    activePageId, 
    globalVariables, 
    setGlobalVariables, 
    executeCommand,
    setActivePageId,
    setSelectedNodeIds,
    apis,
    selectedVariableKey,
    setSelectedVariableKey,
    layouts
  } = useEditorStore();

  const activePage = pages.find((p) => p.id === activePageId);
  const localVariables = activePage?.stateSchema || [];

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [scopeFilter, setScopeFilter] = useState<"all" | "global" | "local">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Modals state
  const [varModalVisible, setVarModalVisible] = useState(false);
  const [inspectorVisible, setInspectorVisible] = useState(false);
  const [editingVar, setEditingVar] = useState<StateVariable | null>(null);
  const [selectedVarForInspect, setSelectedVarForInspect] = useState<StateVariable | null>(null);

  const [form] = Form.useForm();

  // Combine lists for general displays
  const allVariables: StateVariable[] = [
    ...globalVariables.map(v => ({ ...v, scope: "global" as const })),
    ...localVariables.map(v => ({ ...v, scope: "local" as const }))
  ];

  // Apply search and filter logic
  const filteredVariables = allVariables.filter(v => {
    const matchesSearch = v.key.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (v.name || v.key).toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (v.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesScope = scopeFilter === "all" || v.scope === scopeFilter;
    const matchesType = typeFilter === "all" || v.type === typeFilter;
    return matchesSearch && matchesScope && matchesType;
  });

  const handleOpenAddModal = (scope: "global" | "local") => {
    setEditingVar(null);
    form.resetFields();
    form.setFieldsValue({ 
      scope, 
      type: "string",
      id: `var-${Math.random().toString(36).substr(2, 9)}`
    });
    setVarModalVisible(true);
  };

  const handleOpenEditModal = (record: StateVariable, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingVar(record);
    let displayVal = record.defaultValue;
    if (record.type === "object" || record.type === "array") {
      displayVal = JSON.stringify(record.defaultValue, null, 2);
    } else {
      displayVal = String(record.defaultValue ?? "");
    }
    form.setFieldsValue({
      id: record.id,
      name: record.name,
      key: record.key,
      scope: record.scope,
      type: record.type,
      defaultValue: displayVal,
      description: record.description || ""
    });
    setVarModalVisible(true);
  };

  // Helper to recursively update bindings and events in an ASTNode tree
  const updateASTRefs = (
    node: ASTNode,
    oldKey: string,
    newKey: string | null
  ): ASTNode => {
    const updated = { ...node };

    // Update bindings
    if (updated.bindings) {
      if (newKey === null) {
        // Remove binding if key is deleted
        updated.bindings = updated.bindings.filter(
          (b) => b.expression !== oldKey && b.expression !== `state.${oldKey}` && `state.${b.expression}` !== oldKey
        );
      } else {
        // Update binding expression if renamed
        updated.bindings = updated.bindings.map((b) => {
          if (b.expression === oldKey) {
            return { ...b, expression: newKey };
          }
          if (b.expression === `state.${oldKey}`) {
            return { ...b, expression: `state.${newKey}` };
          }
          if (b.expression.startsWith(oldKey + ".")) {
            return { ...b, expression: newKey + b.expression.substring(oldKey.length) };
          }
          if (b.expression.startsWith(`state.${oldKey}.`)) {
            return { ...b, expression: `state.${newKey}` + b.expression.substring(`state.${oldKey}`.length) };
          }
          return b;
        });
      }
    }

    // Update events
    if (updated.events) {
      updated.events = updated.events.map((evt) => {
        const nextActions = evt.actions.map((act) => {
          const nextAct = { ...act };
          if (nextAct.params) {
            const nextParams = { ...nextAct.params };
            let hasChanged = false;

            // Handle setState actions
            if (nextAct.type === "setState" || nextAct.type === "setStateValue") {
              const statePath = nextParams.statePath as string;
              if (statePath) {
                const cleanPath = statePath.startsWith("state.") ? statePath.substring(6) : statePath;
                if (newKey === null) {
                  // Keep as is on delete
                } else {
                  if (cleanPath === oldKey) {
                    nextParams.statePath = statePath.startsWith("state.") ? `state.${newKey}` : newKey;
                    hasChanged = true;
                  } else if (cleanPath.startsWith(oldKey + ".")) {
                    const suffix = cleanPath.substring(oldKey.length);
                    nextParams.statePath = statePath.startsWith("state.") ? `state.${newKey}${suffix}` : `${newKey}${suffix}`;
                    hasChanged = true;
                  }
                }
              }
            }

            // General string parameters (string interpolation/expression templates)
            for (const paramKey of Object.keys(nextParams)) {
              const val = nextParams[paramKey];
              if (typeof val === "string") {
                if (newKey !== null) {
                  let nextVal = val;
                  const searchTerms = [
                    { from: `state.${oldKey}`, to: `state.${newKey}` },
                    { from: `{{state.${oldKey}}}`, to: `{{state.${newKey}}}` },
                    { from: `{{${oldKey}}}`, to: `{{${newKey}}}` }
                  ];
                  let changedVal = false;
                  for (const { from, to } of searchTerms) {
                    if (nextVal.includes(from)) {
                      nextVal = nextVal.split(from).join(to);
                      changedVal = true;
                    }
                  }
                  if (changedVal) {
                    nextParams[paramKey] = nextVal;
                    hasChanged = true;
                  }
                }
              }
            }

            if (hasChanged) {
              nextAct.params = nextParams;
            }
          }
          return nextAct;
        });

        return { ...evt, actions: nextActions };
      });
    }

    if (updated.children) {
      updated.children = updated.children.map((child) =>
        updateASTRefs(child, oldKey, newKey)
      );
    }

    return updated;
  };

  // Helper to update APIs references
  const updateApisRefs = (
    apisList: typeof apis,
    oldKey: string,
    newKey: string | null
  ) => {
    if (newKey === null) return apisList;
    return apisList.map((api) => {
      const nextApi = { ...api };
      const searchTerms = [
        { from: `state.${oldKey}`, to: `state.${newKey}` },
        { from: `{{state.${oldKey}}}`, to: `{{state.${newKey}}}` },
        { from: `{{${oldKey}}}`, to: `{{${newKey}}}` }
      ];
      for (const field of ["url", "headers", "body"] as const) {
        let val = nextApi[field];
        if (typeof val === "string") {
          for (const { from, to } of searchTerms) {
            if (val.includes(from)) {
              val = val.split(from).join(to);
            }
          }
          nextApi[field] = val;
        }
      }
      return nextApi;
    });
  };

  // Unified Variable Propagation Helper
  const propagateVariableEdit = (
    actionName: string,
    oldVariable: StateVariable,
    newVariable: StateVariable | null
  ) => {
    let nextPages = JSON.parse(JSON.stringify(pages)) as Page[];
    const oldKey = oldVariable.key;
    const newKey = newVariable ? newVariable.key : null;

    const oldScope = oldVariable.scope as string;
    const newScope = newVariable ? (newVariable.scope as string) : null;

    // Update Page schemas
    nextPages = nextPages.map((p) => {
      let nextSchema = p.stateSchema ? [...p.stateSchema] : [];
      if (oldScope === "local" && p.id === activePageId) {
        if (newVariable === null) {
          nextSchema = nextSchema.filter((v) => v.id !== oldVariable.id);
        } else {
          const idx = nextSchema.findIndex((v) => v.id === oldVariable.id);
          if (idx !== -1) {
            nextSchema[idx] = newVariable;
          } else {
            nextSchema.push(newVariable);
          }
        }
      } else if (newVariable && oldScope === "local" && newScope === "global") {
        if (p.id === activePageId) {
          nextSchema = nextSchema.filter((v) => v.id !== oldVariable.id);
        }
      } else if (newVariable && oldScope === "global" && newScope === "local") {
        if (p.id === activePageId && !nextSchema.some((v) => v.id === newVariable.id)) {
          nextSchema.push(newVariable);
        }
      }
      
      const updatedAST = updateASTRefs(p.ast, oldKey, newKey);
      return {
        ...p,
        stateSchema: nextSchema,
        ast: updatedAST
      };
    });

    // Update Layouts
    let nextLayouts = JSON.parse(JSON.stringify(layouts || [])) as Layout[];
    nextLayouts = nextLayouts.map((l) => {
      return {
        ...l,
        headerAST: updateASTRefs(l.headerAST, oldKey, newKey),
        sidebarAST: updateASTRefs(l.sidebarAST, oldKey, newKey),
        footerAST: updateASTRefs(l.footerAST, oldKey, newKey),
      };
    });

    // Update Global Variables
    let nextGlobal = [...globalVariables];
    if (oldScope === "global") {
      if (newVariable === null) {
        nextGlobal = nextGlobal.filter((v) => v.id !== oldVariable.id);
      } else {
        const idx = nextGlobal.findIndex((v) => v.id === oldVariable.id);
        if (idx !== -1) {
          nextGlobal[idx] = newVariable;
        } else {
          nextGlobal.push(newVariable);
        }
      }
    } else if (newVariable && oldScope === "local" && newScope === "global") {
      if (!nextGlobal.some((v) => v.id === newVariable.id)) {
        nextGlobal.push(newVariable);
      }
    } else if (newVariable && oldScope === "global" && newScope === "local") {
      nextGlobal = nextGlobal.filter((v) => v.id !== oldVariable.id);
    }

    // Update APIs
    const nextApis = updateApisRefs(apis || [], oldKey, newKey);

    // Dispatch unified AST command
    executeCommand(createASTCommand(actionName, nextPages, undefined, nextLayouts, nextGlobal, nextApis));
  };

  const handleSaveVariable = () => {
    form
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
          id: values.id || `var-${Math.random().toString(36).substr(2, 9)}`,
          name: values.name || values.key,
          key: values.key,
          scope: values.scope,
          type: values.type,
          defaultValue,
          description: values.description
        };

        const targetScope = values.scope;

        // Verify duplicates if key changed or new variable
        const isKeyChanged = !editingVar || editingVar.key !== newVariable.key || editingVar.scope !== newVariable.scope;
        if (isKeyChanged) {
          const isDuplicate = targetScope === "global"
            ? globalVariables.some(v => v.key === newVariable.key)
            : localVariables.some(v => v.key === newVariable.key);
          if (isDuplicate) {
            message.warning(`Variable "${newVariable.key}" already exists in ${targetScope} scope.`);
            return;
          }
        }

        if (editingVar) {
          propagateVariableEdit("Update Variable", editingVar, newVariable);
        } else {
          propagateVariableEdit("Create Variable", newVariable, newVariable);
        }

        setVarModalVisible(false);
        message.success(`Variable "${newVariable.name}" saved.`);
      })
      .catch((err) => {
        console.warn("Validation error:", err);
      });
  };

  const handleDeleteVariable = (record: StateVariable, e: React.MouseEvent) => {
    e.stopPropagation();
    Modal.confirm({
      title: "Delete Variable",
      content: `Are you sure you want to delete variable "${record.name || record.key}"? This might break bindings.`,
      okText: "Delete",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        propagateVariableEdit("Delete Variable", record, null);
        message.success(`Variable "${record.name || record.key}" deleted.`);
      }
    });
  };

  const handleDuplicateVariable = (record: StateVariable, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: StateVariable = {
      ...record,
      id: `var-${Math.random().toString(36).substr(2, 9)}`,
      name: `${record.name || record.key} Copy`,
      key: `${record.key}_copy`,
    };

    propagateVariableEdit("Duplicate Variable", duplicated, duplicated);
    message.success(`Variable duplicated as "${duplicated.name}".`);
  };

  // Helper functions to scan usages
  const scanNodeForUsages = (
    node: ASTNode,
    pageId: string,
    pageName: string,
    variableKey: string,
    usages: VariableUsage[]
  ) => {
    // Check bindings
    if (node.bindings) {
      for (const binding of node.bindings) {
        if (binding.expression === variableKey || binding.expression === `state.${variableKey}`) {
          usages.push({
            id: `binding-${node.id}-${binding.prop}`,
            type: "binding",
            pageId,
            pageName,
            nodeId: node.id,
            nodeType: node.type,
            description: `Bound to property "${binding.prop}"`,
          });
        }
      }
    }

    // Check event actions
    if (node.events) {
      for (const ev of node.events) {
        for (const action of ev.actions) {
          const statePath = action.params?.statePath as string;
          if (statePath) {
            const cleanPath = statePath.startsWith("state.") ? statePath.substring(6) : statePath;
            if (cleanPath === variableKey || cleanPath.startsWith(variableKey + ".")) {
              usages.push({
                id: `action-${action.id}`,
                type: "action",
                pageId,
                pageName,
                nodeId: node.id,
                nodeType: node.type,
                description: `Updated in "${ev.event}" event action`,
              });
            }
          }
          const paramsStr = JSON.stringify(action.params);
          if (paramsStr.includes(`state.${variableKey}`) || paramsStr.includes(`{{state.${variableKey}}}`) || paramsStr.includes(`{{${variableKey}}}`)) {
            if (!usages.some(u => u.id === `action-${action.id}`)) {
              usages.push({
                id: `action-${action.id}`,
                type: "action",
                pageId,
                pageName,
                nodeId: node.id,
                nodeType: node.type,
                description: `Read in "${ev.event}" event parameters`,
              });
            }
          }
        }
      }
    }

    if (node.children) {
      for (const child of node.children) {
        scanNodeForUsages(child, pageId, pageName, variableKey, usages);
      }
    }
  };

  const getVariableUsages = (variable: StateVariable): VariableUsage[] => {
    const usages: VariableUsage[] = [];
    
    // Scan all pages AST
    for (const page of pages) {
      scanNodeForUsages(page.ast, page.id, page.name, variable.key, usages);
    }

    // Scan APIs
    for (const api of apis || []) {
      const apiStr = JSON.stringify(api);
      if (apiStr.includes(`state.${variable.key}`) || apiStr.includes(`{{state.${variable.key}}}`) || apiStr.includes(`{{${variable.key}}}`)) {
        usages.push({
          id: `api-${api.name}`,
          type: "api",
          pageId: "api-panel",
          pageName: "API Integration",
          description: `Referenced in API "${api.name}" configuration`,
        });
      }
    }

    return usages;
  };

  const handleInspectVariable = (variable: StateVariable) => {
    setSelectedVarForInspect(variable);
    setInspectorVisible(true);
    // Set global highlight key so Properties panel can auto-route
    useEditorStore.getState().setSelectedVariableKey(variable.key);
  };

  const handleGoToUsage = (usage: VariableUsage) => {
    if (usage.nodeId) {
      // Keep selectedVariableKey active so Properties auto-routes to the right tab
      setActivePageId(usage.pageId);
      setSelectedNodeIds([usage.nodeId]);
      setInspectorVisible(false);
      message.success(`Selected component "${usage.nodeType}" on Page "${usage.pageName}"`);
    }
  };

  // Render variables list grouped or flat
  return (
    <div className="flex flex-col h-full bg-[#111827] text-gray-200">
      {/* Header */}
      <div className="p-3 border-b border-gray-800 flex items-center justify-between bg-gray-900/40">
        <div className="flex items-center space-x-2 text-gray-300 font-semibold text-xs uppercase tracking-wider font-mono">
          <Database size={14} className="text-blue-500 animate-pulse" />
          <span>Variables Explorer</span>
        </div>
        
        <div className="flex space-x-1">
          <Tooltip title="New Local Variable">
            <button
              onClick={() => handleOpenAddModal("local")}
              className="p-1 rounded bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center space-x-0.5 transition-all"
            >
              <Plus size={12} />
              <span>📄 Local</span>
            </button>
          </Tooltip>
          <Tooltip title="New Global Variable">
            <button
              onClick={() => handleOpenAddModal("global")}
              className="p-1 rounded bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 text-purple-400 text-xs font-semibold flex items-center space-x-0.5 transition-all"
            >
              <Plus size={12} />
              <span>🌐 Global</span>
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="p-2 border-b border-gray-850 bg-gray-950/20 space-y-2">
        <div className="relative">
          <Search size={12} className="absolute left-2.5 top-2.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-7 pr-2.5 py-1.5 bg-gray-900 border border-gray-800 rounded text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-all font-mono"
          />
        </div>

        <div className="flex space-x-1">
          <div className="flex-1">
            <Select
              size="small"
              value={scopeFilter}
              onChange={setScopeFilter}
              className="w-full font-mono text-[10px]"
              popupClassName="bg-gray-900 border border-gray-800"
              options={[
                { label: "All Scopes", value: "all" },
                { label: "🌐 Global Only", value: "global" },
                { label: "📄 Local Only", value: "local" },
              ]}
            />
          </div>
          <div className="flex-1">
            <Select
              size="small"
              value={typeFilter}
              onChange={setTypeFilter}
              className="w-full font-mono text-[10px]"
              popupClassName="bg-gray-900 border border-gray-800"
              options={[
                { label: "All Types", value: "all" },
                { label: "String", value: "string" },
                { label: "Number", value: "number" },
                { label: "Boolean", value: "boolean" },
                { label: "Object", value: "object" },
                { label: "Array", value: "array" },
              ]}
            />
          </div>
        </div>
      </div>

      {/* List content */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredVariables.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Database className="mx-auto mb-2 text-gray-700" size={24} />
            <span className="text-[10px]">No variables match the filters.</span>
          </div>
        ) : (
          filteredVariables.map((v) => {
            const usages = getVariableUsages(v);
            const isGlobal = v.scope === "global";
            const isHighlighted = v.key === selectedVariableKey;
            return (
              <div
                key={v.id}
                onClick={() => handleInspectVariable(v)}
                className={`group p-2.5 border rounded-lg cursor-pointer transition-all duration-150 flex flex-col space-y-1.5 ${
                  isHighlighted
                    ? "border-blue-500 bg-blue-950/20 shadow-[0_0_8px_rgba(59,130,246,0.35)]"
                    : isGlobal 
                      ? "bg-gray-900/60 border-purple-950/40 hover:border-purple-500/30" 
                      : "bg-gray-900/60 border-blue-950/40 hover:border-blue-500/30"
                }`}
              >
                {/* Variable top title */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 truncate max-w-[70%]">
                    {isGlobal ? (
                      <Globe size={11} className="text-purple-400 shrink-0" />
                    ) : (
                      <FileText size={11} className="text-blue-400 shrink-0" />
                    )}
                    <span className="font-mono text-xs font-semibold text-gray-200 truncate" title={v.key}>
                      {v.key}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip title="Duplicate">
                      <button
                        onClick={(e) => handleDuplicateVariable(v, e)}
                        className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all"
                      >
                        <Copy size={10} />
                      </button>
                    </Tooltip>
                    <button
                      onClick={(e) => handleOpenEditModal(v, e)}
                      className="p-1 rounded text-gray-500 hover:text-blue-400 hover:bg-gray-800 transition-all"
                    >
                      <Edit size={10} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteVariable(v, e)}
                      className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-all"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>

                {/* Sub details: type, usages and real-time value */}
                <div className="flex items-center justify-between text-[9px] text-gray-500">
                  <div className="flex items-center space-x-1">
                    <span className="px-1 py-0.2 bg-gray-950 border border-gray-850 rounded text-gray-400 font-mono scale-90 capitalize">
                      {v.type}
                    </span>
                    {usages.length > 0 && (
                      <span className="text-gray-600 font-mono">
                        ({usages.length} {usages.length === 1 ? "ref" : "refs"})
                      </span>
                    )}
                  </div>
                  <RealTimeValueCell path={v.key} />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CRUD Variable Modal */}
      <Modal
        title={editingVar ? "Edit Variable" : "Create Variable"}
        open={varModalVisible}
        onCancel={() => setVarModalVisible(false)}
        onOk={handleSaveVariable}
        okText="Save Variable"
        cancelText="Cancel"
        destroyOnClose
        className="dark-theme-modal"
      >
        <Form form={form} layout="vertical" className="pt-3">
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          
          <Form.Item
            name="key"
            label="Variable Path/Key"
            tooltip="Name referenced in code and bindings. Use dot-notation for nested objects, e.g. form.login.email"
            rules={[
              { required: true, message: "Please enter a key" },
              { pattern: /^[a-zA-Z0-9_.]*$/, message: "Keys can only contain alphanumeric characters, underscores, and dots" }
            ]}
          >
            <Input placeholder="e.g. currentUser or form.email" />
          </Form.Item>

          <Form.Item
            name="name"
            label="Human-Readable Label"
            rules={[{ required: true, message: "Please enter a display label" }]}
          >
            <Input placeholder="e.g. Current User Name" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-3">
            <Form.Item
              name="scope"
              label="Variable Scope"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { label: "📄 Local (Active Page)", value: "local" },
                  { label: "🌐 Global (All Pages)", value: "global" }
                ]}
                disabled={!!editingVar}
              />
            </Form.Item>

            <Form.Item
              name="type"
              label="Data Type"
              rules={[{ required: true }]}
            >
              <Select
                options={[
                  { label: "String (Text)", value: "string" },
                  { label: "Number (Numeric)", value: "number" },
                  { label: "Boolean (True/False)", value: "boolean" },
                  { label: "Object (JSON)", value: "object" },
                  { label: "Array (List)", value: "array" }
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="defaultValue"
            label="Default Initial Value"
            tooltip="Value assigned on startup. Use valid JSON for objects/arrays."
          >
            <Input.TextArea rows={2} placeholder="Default value..." className="font-mono text-xs" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description (Optional)"
          >
            <Input.TextArea rows={2} placeholder="Explain what this variable stores or how it is updated..." />
          </Form.Item>
        </Form>
      </Modal>

      {/* Visual Inspector, Usages & Data Flow Graph Modal */}
      {selectedVarForInspect && (
        <Modal
          title={
            <div className="flex items-center space-x-2 text-gray-200 font-semibold font-mono">
              <Database className="text-blue-500" size={16} />
              <span>Variable Inspector: {selectedVarForInspect.key}</span>
            </div>
          }
          open={inspectorVisible}
          onCancel={() => setInspectorVisible(false)}
          width={700}
          footer={null}
          destroyOnClose
          className="dark-theme-modal"
        >
          <div className="space-y-5 pt-3">
            {/* Properties Table */}
            <div className="grid grid-cols-3 gap-3 bg-gray-900/60 p-3 rounded-lg border border-gray-800 text-xs">
              <div className="space-y-1">
                <span className="text-gray-500 font-bold">Scope:</span>
                <div className="flex items-center space-x-1.5 text-gray-300">
                  {selectedVarForInspect.scope === "global" ? (
                    <>
                      <Globe size={12} className="text-purple-400" />
                      <Tag color="purple" className="border-0">Global</Tag>
                    </>
                  ) : (
                    <>
                      <FileText size={12} className="text-blue-400" />
                      <Tag color="blue" className="border-0">Local</Tag>
                    </>
                  )}
                </div>
              </div>
              
              <div className="space-y-1">
                <span className="text-gray-500 font-bold">Type:</span>
                <div>
                  <Tag color="orange" className="capitalize border-0">{selectedVarForInspect.type}</Tag>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-gray-500 font-bold">Display Name:</span>
                <div className="text-gray-300 font-medium">{selectedVarForInspect.name || selectedVarForInspect.key}</div>
              </div>

              {selectedVarForInspect.description && (
                <div className="col-span-3 pt-2 mt-2 border-t border-gray-800 text-gray-400 italic">
                  {selectedVarForInspect.description}
                </div>
              )}
            </div>

            {/* Realtime Values Comparison */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-950/40 p-3 rounded-lg border border-gray-850">
                <span className="text-[10px] text-gray-500 font-bold block mb-1">DEFAULT VALUE</span>
                <pre className="text-xs font-mono text-gray-400 bg-gray-900 p-2 rounded max-h-24 overflow-y-auto whitespace-pre-wrap">
                  {typeof selectedVarForInspect.defaultValue === "object"
                    ? JSON.stringify(selectedVarForInspect.defaultValue, null, 2)
                    : String(selectedVarForInspect.defaultValue ?? "undefined")}
                </pre>
              </div>
              <div className="bg-gray-950/40 p-3 rounded-lg border border-gray-850">
                <span className="text-[10px] text-gray-500 font-bold block mb-1">CURRENT RUNTIME VALUE</span>
                <div className="bg-gray-900 p-2 rounded max-h-24 overflow-y-auto flex items-center h-16">
                  <RealTimeValueCell path={selectedVarForInspect.key} />
                </div>
              </div>
            </div>

            {/* Usages Section */}
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Usages / References</span>
              {getVariableUsages(selectedVarForInspect).length === 0 ? (
                <div className="p-4 bg-gray-900/30 rounded border border-gray-850 text-center text-gray-500 text-xs">
                  This variable is not referenced anywhere in data bindings or event actions.
                </div>
              ) : (
                <div className="max-h-44 overflow-y-auto border border-gray-850 rounded-lg divide-y divide-gray-850">
                  {getVariableUsages(selectedVarForInspect).map((usage) => (
                    <div 
                      key={usage.id} 
                      onClick={() => handleGoToUsage(usage)}
                      className={`p-2.5 flex items-center justify-between text-xs transition-all ${
                        usage.nodeId ? "cursor-pointer hover:bg-gray-850" : "bg-gray-900/20"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Tag color={usage.type === "binding" ? "cyan" : usage.type === "action" ? "red" : "orange"} className="text-[9px] border-0 scale-90 capitalize font-mono font-medium">
                          {usage.type}
                        </Tag>
                        <div>
                          <span className="font-semibold text-gray-300">{usage.pageName}</span>
                          {usage.nodeType && (
                            <span className="text-gray-500"> ➔ {usage.nodeType}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px]">
                        <span className="text-gray-400 italic">{usage.description}</span>
                        {usage.nodeId && <ChevronRight size={12} className="text-gray-500" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Data Flow / Visual Graph */}
            <div>
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-2">Data Flow Graph</span>
              
              <div className="bg-[#0b0f19] p-4 rounded-xl border border-gray-850 flex items-center justify-between relative overflow-hidden select-none">
                {/* Left: Triggers */}
                <div className="w-1/3 flex flex-col space-y-2 z-10">
                  <div className="text-[9px] text-gray-500 font-bold text-center uppercase tracking-wider mb-1">
                    Triggers (Writers)
                  </div>
                  {getVariableUsages(selectedVarForInspect).filter(u => u.type === "action").length === 0 ? (
                    <div className="p-2 border border-dashed border-gray-800 rounded bg-gray-900/20 text-[10px] text-center text-gray-600">
                      No Trigger Events
                    </div>
                  ) : (
                    getVariableUsages(selectedVarForInspect)
                      .filter(u => u.type === "action")
                      .slice(0, 3)
                      .map((u, i) => (
                        <div key={i} className="p-2 bg-red-950/20 border border-red-500/20 rounded-lg text-[10px] flex items-center justify-between text-red-300 font-mono">
                          <span>{u.nodeType || "Unknown"}</span>
                          <span className="text-[8px] bg-red-500/10 text-red-400 px-1 py-0.5 rounded">Update</span>
                        </div>
                      ))
                  )}
                </div>

                {/* Arrow Left to Middle */}
                <div className="flex-1 flex justify-center text-gray-700">
                  <ArrowRight size={16} className="text-red-500/35 animate-pulse" />
                </div>

                {/* Middle: Variable */}
                <div className="px-4 py-3 bg-gray-900 border-2 border-blue-500/60 rounded-xl shadow-lg z-10 w-1/4 text-center space-y-1">
                  <div className="text-[8px] font-mono font-bold tracking-widest text-blue-400 uppercase">
                    {selectedVarForInspect.scope}
                  </div>
                  <div className="text-xs font-mono font-bold text-white truncate" title={selectedVarForInspect.key}>
                    {selectedVarForInspect.key}
                  </div>
                  <div className="flex justify-center pt-1 scale-90">
                    <RealTimeValueCell path={selectedVarForInspect.key} />
                  </div>
                </div>

                {/* Arrow Middle to Right */}
                <div className="flex-1 flex justify-center text-gray-700">
                  <ArrowRight size={16} className="text-cyan-500/35 animate-pulse" />
                </div>

                {/* Right: Consumers */}
                <div className="w-1/3 flex flex-col space-y-2 z-10">
                  <div className="text-[9px] text-gray-500 font-bold text-center uppercase tracking-wider mb-1">
                    Consumers (Readers)
                  </div>
                  {getVariableUsages(selectedVarForInspect).filter(u => u.type === "binding").length === 0 ? (
                    <div className="p-2 border border-dashed border-gray-800 rounded bg-gray-900/20 text-[10px] text-center text-gray-600">
                      No Data Bindings
                    </div>
                  ) : (
                    getVariableUsages(selectedVarForInspect)
                      .filter(u => u.type === "binding")
                      .slice(0, 3)
                      .map((u, i) => (
                        <div key={i} className="p-2 bg-cyan-950/20 border border-cyan-500/20 rounded-lg text-[10px] flex items-center justify-between text-cyan-300 font-mono">
                          <span>{u.nodeType || "Unknown"}</span>
                          <span className="text-[8px] bg-cyan-500/10 text-cyan-400 px-1 py-0.5 rounded">Bind</span>
                        </div>
                      ))
                  )}
                </div>

                {/* Grid Background Effect */}
                <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
