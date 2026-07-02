import React, { useEffect } from "react";
import { useEditorStore } from "../store/useEditorStore";
import { useGlobalState } from "../state/useGlobalState";

interface RuntimeProviderProps {
  children: React.ReactNode;
}

export const RuntimeProvider: React.FC<RuntimeProviderProps> = ({ children }) => {
  const pages = useEditorStore((state) => state.pages);
  const activePageId = useEditorStore((state) => state.activePageId);
  const globalVariables = useEditorStore((state) => state.globalVariables || []);

  const activePage = pages.find((p) => p.id === activePageId);
  const stateSchema = activePage?.stateSchema || [];

  const prevPageIdRef = React.useRef<string | null>(null);
  const prevSchemaStrRef = React.useRef<string>("");

  // Initialize/reset global state whenever we switch pages or the page schema/global variables change
  useEffect(() => {
    const schemaStr = JSON.stringify({ stateSchema, globalVariables });
    const schemaChanged = prevSchemaStrRef.current !== schemaStr;
    const pageChanged = prevPageIdRef.current !== activePageId;

    if (pageChanged) {
      prevPageIdRef.current = activePageId;
      prevSchemaStrRef.current = schemaStr;
      useGlobalState.getState().initializeFromSchema(stateSchema, globalVariables);
    } else if (schemaChanged) {
      prevSchemaStrRef.current = schemaStr;
      useGlobalState.getState().updateSchemaPreserveData(stateSchema, globalVariables);
    }
  }, [activePageId, stateSchema, globalVariables]);

  return <>{children}</>;
};

export default RuntimeProvider;
