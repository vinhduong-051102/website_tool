import React, { useState } from "react";
import { useEditorStore, createASTCommand } from "../store/useEditorStore";
import { getComponent } from "../components/registry";
import { findNodeById } from "../utils/ast";
import { ASTNode, EventConfig, EventActionConfig } from "../types";
import { ActionConfigurator } from "./ActionConfigurator";
import { getActionHandler } from "../action-engine/registry";
import { 
  Zap, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Settings, 
  Play, 
  Activity,
  Layers
} from "lucide-react";
import { Button, Tooltip, Empty } from "antd";

interface EventsPanelProps {
  node: ASTNode;
}

export const EventsPanel: React.FC<EventsPanelProps> = ({ node }) => {
  const { pages, activePageId, executeCommand } = useEditorStore();

  const componentDef = getComponent(node.type);
  const supportedEvents = componentDef?.supportedEvents || [];

  const [activeConfigEvent, setActiveConfigEvent] = useState<string | null>(null);
  const [editingAction, setEditingAction] = useState<EventActionConfig | undefined>(undefined);
  const [configuratorVisible, setConfiguratorVisible] = useState(false);

  if (supportedEvents.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Layers className="mx-auto mb-2 text-gray-600" size={24} />
        <span className="text-xs">This component does not support any events.</span>
      </div>
    );
  }

  // Deep clone pages utility
  const clonePages = () => JSON.parse(JSON.stringify(pages));

  const updateNodeEvents = (newEvents: EventConfig[]) => {
    const nextPages = clonePages();
    const activePage = nextPages.find((p: any) => p.id === activePageId);
    if (!activePage) return;

    const targetNode = findNodeById(activePage.ast, node.id);
    if (targetNode) {
      targetNode.events = newEvents;
      executeCommand(
        createASTCommand("Update Event Handlers", nextPages)
      );
    }
  };

  const handleAddActionClick = (eventName: string) => {
    setActiveConfigEvent(eventName);
    setEditingAction(undefined);
    setConfiguratorVisible(true);
  };

  const handleEditActionClick = (eventName: string, action: EventActionConfig) => {
    setActiveConfigEvent(eventName);
    setEditingAction(action);
    setConfiguratorVisible(true);
  };

  const handleSaveAction = (actionConfig: EventActionConfig) => {
    if (!activeConfigEvent) return;

    const currentEvents = node.events ? [...node.events] : [];
    let eventConfig = currentEvents.find((e) => e.event === activeConfigEvent);

    if (!eventConfig) {
      eventConfig = { event: activeConfigEvent, actions: [] };
      currentEvents.push(eventConfig);
    }

    if (editingAction) {
      // Edit existing action
      eventConfig.actions = eventConfig.actions.map((act) =>
        act.id === actionConfig.id ? actionConfig : act
      );
    } else {
      // Add new action
      eventConfig.actions.push(actionConfig);
    }

    updateNodeEvents(currentEvents);
  };

  const handleDeleteAction = (eventName: string, actionId: string) => {
    if (!node.events) return;

    const currentEvents = node.events.map((evt) => {
      if (evt.event === eventName) {
        return {
          ...evt,
          actions: evt.actions.filter((act) => act.id !== actionId),
        };
      }
      return evt;
    });

    updateNodeEvents(currentEvents);
  };

  const handleMoveAction = (eventName: string, actionIndex: number, direction: "up" | "down") => {
    if (!node.events) return;

    const currentEvents = node.events.map((evt) => {
      if (evt.event === eventName) {
        const nextActions = [...evt.actions];
        const swapIndex = direction === "up" ? actionIndex - 1 : actionIndex + 1;

        if (swapIndex >= 0 && swapIndex < nextActions.length) {
          const temp = nextActions[actionIndex];
          nextActions[actionIndex] = nextActions[swapIndex];
          nextActions[swapIndex] = temp;
        }

        return { ...evt, actions: nextActions };
      }
      return evt;
    });

    updateNodeEvents(currentEvents);
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-gray-300 font-semibold text-xs uppercase tracking-wider">
          <Zap size={14} className="text-yellow-500" />
          <span>Interactions & Events</span>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {supportedEvents.map((eventName) => {
          const eventConfig = node.events?.find((e) => e.event === eventName);
          const actions = eventConfig?.actions || [];

          return (
            <div
              key={eventName}
              className="bg-gray-900/40 rounded-lg border border-gray-800 overflow-hidden"
            >
              {/* Event Header */}
              <div className="px-3.5 py-2.5 bg-gray-950/60 border-b border-gray-850 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity size={12} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-300">
                    {eventName}
                  </span>
                </div>
                <button
                  onClick={() => handleAddActionClick(eventName)}
                  className="px-2 py-1 rounded bg-blue-600/90 text-white text-[10px] font-semibold flex items-center space-x-1 hover:bg-blue-500 transition-all shadow shadow-blue-500/10"
                >
                  <Plus size={10} />
                  <span>Action</span>
                </button>
              </div>

              {/* Event Actions List */}
              <div className="p-2 space-y-1.5">
                {actions.length === 0 ? (
                  <div className="p-4 text-center text-gray-600 text-[10px]">
                    No actions configured. Click "+ Action" to add step.
                  </div>
                ) : (
                  actions.map((action, idx) => {
                    const handler = getActionHandler(action.type);
                    return (
                      <div
                        key={action.id}
                        className="flex items-center justify-between bg-gray-950/80 px-2.5 py-1.5 rounded border border-gray-850 text-xs text-gray-300"
                      >
                        <div className="flex items-center space-x-2 overflow-hidden mr-2">
                          <span className="text-[10px] font-mono text-gray-600 bg-gray-900 px-1 py-0.5 rounded border border-gray-850">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-medium text-gray-300 truncate">
                            {handler?.label || action.type}
                          </span>
                        </div>

                        {/* Action Operations */}
                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            disabled={idx === 0}
                            onClick={() => handleMoveAction(eventName, idx, "up")}
                            className={`p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all ${
                              idx === 0 ? "opacity-30 cursor-not-allowed" : ""
                            }`}
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            disabled={idx === actions.length - 1}
                            onClick={() => handleMoveAction(eventName, idx, "down")}
                            className={`p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all ${
                              idx === actions.length - 1 ? "opacity-30 cursor-not-allowed" : ""
                            }`}
                          >
                            <ChevronDown size={12} />
                          </button>
                          <button
                            onClick={() => handleEditActionClick(eventName, action)}
                            className="p-1 rounded text-gray-500 hover:text-blue-400 hover:bg-gray-800 transition-all"
                            title="Edit parameters"
                          >
                            <Settings size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteAction(eventName, action.id)}
                            className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-all"
                            title="Delete step"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ActionConfigurator
        visible={configuratorVisible}
        onClose={() => setConfiguratorVisible(false)}
        onSave={handleSaveAction}
        initialAction={editingAction}
      />
    </div>
  );
};

export default EventsPanel;
