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
  Activity,
  Layers
} from "lucide-react";
import { Tooltip, Empty } from "antd";

// Dnd Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface EventsPanelProps {
  node: ASTNode;
}

// Sub-component for individual sortable action items
interface SortableActionItemProps {
  action: EventActionConfig;
  idx: number;
  eventName: string;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
  isFirst: boolean;
  isLast: boolean;
}

const SortableActionItem: React.FC<SortableActionItemProps> = ({
  action,
  idx,
  eventName,
  onEdit,
  onDelete,
  onMove,
  isFirst,
  isLast,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 9999 : "auto",
  };

  const handler = getActionHandler(action.type);

  // Render a human-friendly display description of the action with condition if enabled
  const renderActionSummary = () => {
    let summary = handler?.label || action.type;
    const cond = action.condition;
    
    if (cond && cond.enabled) {
      summary = `[If ${cond.statePath.split(".").pop()} ${cond.operator}] ${summary}`;
    }
    return summary;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between bg-gray-950/80 px-2.5 py-1.5 rounded border ${
        isDragging ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-gray-850"
      } text-xs text-gray-300 group hover:border-gray-700/60 transition-all select-none`}
    >
      <div className="flex items-center space-x-2 overflow-hidden mr-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-600 hover:text-gray-400 p-0.5 shrink-0"
        >
          ⋮⋮
        </div>
        <span className="text-[10px] font-mono text-gray-500 bg-gray-900 px-1 py-0.5 rounded border border-gray-850">
          {idx + 1}
        </span>
        <span className="text-xs font-medium text-gray-200 truncate" title={renderActionSummary()}>
          {renderActionSummary()}
        </span>
      </div>

      <div className="flex items-center space-x-1 shrink-0">
        <button
          disabled={isFirst}
          onClick={(e) => { e.stopPropagation(); onMove("up"); }}
          className={`p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all ${
            isFirst ? "opacity-30 cursor-not-allowed" : ""
          }`}
        >
          <ChevronUp size={12} />
        </button>
        <button
          disabled={isLast}
          onClick={(e) => { e.stopPropagation(); onMove("down"); }}
          className={`p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-all ${
            isLast ? "opacity-30 cursor-not-allowed" : ""
          }`}
        >
          <ChevronDown size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1 rounded text-gray-500 hover:text-blue-400 hover:bg-gray-800 transition-all"
          title="Edit parameters"
        >
          <Settings size={12} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 rounded text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-all"
          title="Delete step"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
};

export const EventsPanel: React.FC<EventsPanelProps> = ({ node }) => {
  const { pages, activePageId, executeCommand } = useEditorStore();

  const componentDef = getComponent(node.type);
  const supportedEvents = componentDef?.supportedEvents || [];

  const [activeConfigEvent, setActiveConfigEvent] = useState<string | null>(null);
  const [editingAction, setEditingAction] = useState<EventActionConfig | undefined>(undefined);
  const [configuratorVisible, setConfiguratorVisible] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (supportedEvents.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <Layers className="mx-auto mb-2 text-gray-600" size={24} />
        <span className="text-xs">This component does not support any events.</span>
      </div>
    );
  }

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
      eventConfig.actions = eventConfig.actions.map((act) =>
        act.id === actionConfig.id ? actionConfig : act
      );
    } else {
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

  const handleDragEnd = (eventName: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    if (!node.events) return;

    const eventConfig = node.events.find((e) => e.event === eventName);
    if (!eventConfig) return;

    const oldIndex = eventConfig.actions.findIndex((act) => act.id === active.id);
    const newIndex = eventConfig.actions.findIndex((act) => act.id === over.id);

    if (oldIndex !== -1 && newIndex !== -1) {
      const nextActions = arrayMove(eventConfig.actions, oldIndex, newIndex);
      const currentEvents = node.events.map((evt) => {
        if (evt.event === eventName) {
          return { ...evt, actions: nextActions };
        }
        return evt;
      });
      updateNodeEvents(currentEvents);
    }
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

          // Check if any action in this event references the selectedVariableKey
          const selectedVarKey = useEditorStore.getState().selectedVariableKey;
          const isHighlighted = selectedVarKey && actions.some(act => {
            const statePath = act.params?.statePath as string;
            if (statePath) {
              const cleanPath = statePath.startsWith("state.") ? statePath.substring(6) : statePath;
              if (cleanPath === selectedVarKey || cleanPath.startsWith(selectedVarKey + ".")) return true;
            }
            const paramsStr = JSON.stringify(act.params);
            return paramsStr.includes(`state.${selectedVarKey}`) || paramsStr.includes(`{{${selectedVarKey}}}`);
          });

          return (
            <div
              key={eventName}
              className={`bg-gray-900/40 rounded-lg border overflow-hidden transition-all ${
                isHighlighted
                  ? "border-blue-500/60 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/5"
                  : "border-gray-800"
              }`}
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

              {/* Event Actions List with Drag and Drop */}
              <div className="p-2 space-y-1.5">
                {actions.length === 0 ? (
                  <div className="p-4 text-center text-gray-600 text-[10px]">
                    No actions configured. Click "+ Action" to add step.
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(eventName, event)}
                  >
                    <SortableContext
                      items={actions.map((a) => a.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-1.5">
                        {actions.map((action, idx) => (
                          <SortableActionItem
                            key={action.id}
                            action={action}
                            idx={idx}
                            eventName={eventName}
                            onEdit={() => handleEditActionClick(eventName, action)}
                            onDelete={() => handleDeleteAction(eventName, action.id)}
                            onMove={(dir) => handleMoveAction(eventName, idx, dir)}
                            isFirst={idx === 0}
                            isLast={idx === actions.length - 1}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
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
