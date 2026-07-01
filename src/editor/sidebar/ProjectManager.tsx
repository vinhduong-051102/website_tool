import React, { useState } from "react";
import { Modal, Button, Input, Card, Row, Col, Space, Tooltip, Tag, List, Typography, Divider, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined, CopyOutlined, EditOutlined, FolderOpenOutlined, DownloadOutlined, UploadOutlined, FileTextOutlined, LayoutOutlined, AppstoreOutlined, ShoppingCartOutlined, BarChartOutlined, BookOutlined } from "@ant-design/icons";
import { useEditorStore } from "../store/useEditorStore";

const { Text, Title } = Typography;

interface ProjectManagerProps {
  open: boolean;
  onClose: () => void;
}

const TEMPLATE_METADATA = [
  { key: "blank", name: "Blank Template", desc: "Start a clean slate with a single empty home page container.", icon: <FileTextOutlined style={{ fontSize: 24, color: "#9ca3af" }} /> },
  { key: "admin", name: "Admin Dashboard", desc: "Stats widgets, auto-loading refresh mock, state logic, and settings page.", icon: <LayoutOutlined style={{ fontSize: 24, color: "#3b82f6" }} /> },
  { key: "landing", name: "Landing Page", desc: "Hero introduction section, features highlight, and interactive contact form.", icon: <AppstoreOutlined style={{ fontSize: 24, color: "#10b981" }} /> },
  { key: "crm", name: "CRM Panel", desc: "Client contacts repository list with interactive detail display selection.", icon: <BarChartOutlined style={{ fontSize: 24, color: "#8b5cf6" }} /> },
  { key: "ecommerce", name: "E-Commerce", desc: "Featured products catalogue grid and reactive shopping cart indicators.", icon: <ShoppingCartOutlined style={{ fontSize: 24, color: "#f59e0b" }} /> },
  { key: "blog", name: "Tech Blog", desc: "Article post cards, categories tab filters, and theme config variables.", icon: <BookOutlined style={{ fontSize: 24, color: "#ec4899" }} /> },
];

export const ProjectManager: React.FC<ProjectManagerProps> = ({ open, onClose }) => {
  const {
    projects,
    activeProjectId,
    createProject,
    openProject,
    renameProject,
    duplicateProject,
    deleteProject,
    importProject,
    exportProject,
  } = useEditorStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("blank");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = () => {
    if (!newProjectName.trim()) return;
    createProject(newProjectName.trim(), selectedTemplate);
    setIsCreateOpen(false);
    setNewProjectName("");
    setSelectedTemplate("blank");
  };

  const handleStartRename = (id: string, name: string) => {
    setEditingProjectId(id);
    setEditName(name);
  };

  const handleSaveRename = (id: string) => {
    if (editName.trim()) {
      renameProject(id, editName.trim());
    }
    setEditingProjectId(null);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const result = evt.target?.result as string;
      if (result) {
        importProject(result);
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // reset input
  };

  return (
    <>
      <Modal
        title={
          <div className="flex items-center space-x-2 pb-2 text-white">
            <FolderOpenOutlined className="text-blue-500 text-lg" />
            <span className="font-semibold text-base">Project Manager</span>
          </div>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={750}
        className="dark-theme-modal"
      >
        <div className="px-6 flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">
              Manage, duplicate, delete and export isolated application packages.
            </span>
            <Space>
              <label className="ant-btn ant-btn-default flex items-center space-x-1.5 cursor-pointer bg-gray-800 border-gray-700 hover:bg-gray-750 text-xs text-gray-300 px-3 py-1.5 rounded-md transition-all">
                <UploadOutlined />
                <span>Import JSON</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateOpen(true)}
                className="bg-blue-600 border-none hover:bg-blue-500 text-xs"
              >
                Create Project
              </Button>
            </Space>
          </div>

          <Divider style={{ margin: "8px 0", borderColor: "#374151" }} />

          <List
            dataSource={projects}
            renderItem={(proj) => {
              const isActive = proj.id === activeProjectId;
              const isEditing = proj.id === editingProjectId;
              const templateMeta = TEMPLATE_METADATA.find((t) => t.key === proj.template);

              return (
                <List.Item
                  className={`p-3 rounded-lg border mb-2 transition-all ${
                    isActive
                      ? "bg-blue-950/20 border-blue-800/80 shadow-md shadow-blue-900/10"
                      : "bg-gray-900/50 border-gray-800 hover:border-gray-700"
                  }`}
                  actions={[
                    isEditing ? (
                      <Button
                        key="save"
                        type="link"
                        onClick={() => handleSaveRename(proj.id)}
                        className="text-emerald-400 font-medium text-xs"
                      >
                        Save
                      </Button>
                    ) : (
                      <Button
                        key="edit"
                        type="link"
                        icon={<EditOutlined />}
                        onClick={() => handleStartRename(proj.id, proj.name)}
                        className="text-gray-400 hover:text-white"
                      />
                    ),
                    <Tooltip key="duplicate" title="Duplicate Project">
                      <Button
                        type="link"
                        icon={<CopyOutlined />}
                        onClick={() => duplicateProject(proj.id)}
                        className="text-gray-400 hover:text-white"
                      />
                    </Tooltip>,
                    <Tooltip key="export" title="Export Definition JSON">
                      <Button
                        type="link"
                        icon={<DownloadOutlined />}
                        onClick={() => exportProject(proj.id)}
                        className="text-gray-400 hover:text-white"
                      />
                    </Tooltip>,
                    <Popconfirm
                      key="delete"
                      title="Are you sure to delete this project?"
                      onConfirm={() => deleteProject(proj.id)}
                      okText="Yes"
                      cancelText="No"
                      disabled={projects.length <= 1}
                      overlayClassName="dark-popconfirm"
                    >
                      <Tooltip title={projects.length <= 1 ? "Cannot delete the only project" : "Delete Project"}>
                        <Button
                          type="link"
                          danger
                          icon={<DeleteOutlined />}
                          disabled={projects.length <= 1}
                          className="text-red-500 hover:text-red-400 disabled:opacity-30"
                        />
                      </Tooltip>
                    </Popconfirm>,
                  ]}
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0" onClick={() => !isEditing && openProject(proj.id)}>
                    <div className="cursor-pointer flex items-center justify-center p-2 rounded-md bg-gray-800 border border-gray-700 text-gray-400">
                      {templateMeta?.icon || <FileTextOutlined />}
                    </div>
                    <div className="flex flex-col min-w-0 cursor-pointer">
                      <div className="flex items-center space-x-2">
                        {isEditing ? (
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onPressEnter={() => handleSaveRename(proj.id)}
                            className="bg-gray-800 border-gray-700 text-white text-xs h-7 py-0"
                            autoFocus
                          />
                        ) : (
                          <span className="font-semibold text-xs text-white truncate max-w-[250px]">
                            {proj.name}
                          </span>
                        )}
                        {isActive && <Tag color="blue" style={{ fontSize: "9px", padding: "0 4px" }}>Active</Tag>}
                        <Tag color="default" style={{ fontSize: "9px", padding: "0 4px", border: "1px solid #374151", color: "#9ca3af", background: "#1f2937" }}>
                          {proj.pages?.length || 0} Pages
                        </Tag>
                      </div>
                      <span className="text-[10px] text-gray-500 mt-0.5">
                        Template: <span className="text-gray-400 font-medium">{templateMeta?.name || "Blank"}</span>
                      </span>
                    </div>
                  </div>
                </List.Item>
              );
            }}
          />
        </div>
      </Modal>

      {/* Create Project Template Selection Modal */}
      <Modal
        title={<span className="text-white font-semibold">Create New Project</span>}
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onOk={handleCreate}
        okText="Create"
        cancelText="Cancel"
        okButtonProps={{ className: "bg-blue-600 hover:bg-blue-500 border-none" }}
        width={650}
        className="dark-theme-modal"
      >
        <div className="px-6 flex flex-col space-y-4">
          <div className="flex flex-col space-y-1.5">
            <span className="text-xs font-semibold text-gray-300">Project Name</span>
            <Input
              placeholder="e.g. My Admin Portal"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white hover:border-gray-600 focus:border-blue-500 text-xs"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <span className="text-xs font-semibold text-gray-300">Select Template Starter</span>
            <Row gutter={[12, 12]}>
              {TEMPLATE_METADATA.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.key;
                return (
                  <Col span={12} key={tmpl.key}>
                    <div
                      onClick={() => setSelectedTemplate(tmpl.key)}
                      className={`cursor-pointer p-3 rounded-lg border transition-all flex items-start space-x-3 h-[85px] ${
                        isSelected
                          ? "bg-blue-950/30 border-blue-500 shadow-md shadow-blue-500/10"
                          : "bg-gray-900/40 border-gray-800 hover:border-gray-750"
                      }`}
                    >
                      <div className={`p-2 rounded-md ${isSelected ? "bg-blue-900/40 text-blue-400" : "bg-gray-850 text-gray-400"}`}>
                        {tmpl.icon}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-white truncate">{tmpl.name}</span>
                        <span className="text-[10px] text-gray-500 mt-1 leading-normal overflow-hidden text-ellipsis display-2-lines">
                          {tmpl.desc}
                        </span>
                      </div>
                    </div>
                  </Col>
                );
              })}
            </Row>
          </div>
        </div>
      </Modal>
    </>
  );
};
