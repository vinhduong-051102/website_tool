import { ActionHandler } from "../types";
import { useEditorStore } from "../../store/useEditorStore";

export const navigateAction: ActionHandler = {
  type: "navigate",
  label: "Navigate",
  icon: "Navigation",
  category: "Navigation",
  paramSchema: [
    { key: "targetPageId", label: "Target Page", type: "text", required: true },
    { key: "routeParams", label: "Route Params (JSON)", type: "json", placeholder: '{"id": "{{state.selectedId}}"}' },
    { key: "queryParams", label: "Query Params (JSON)", type: "json", placeholder: '{"from": "home"}' },
    { key: "replace", label: "Replace History", type: "boolean", defaultValue: false },
    { key: "newTab", label: "Open in new tab", type: "boolean", defaultValue: false },
  ],
  execute: async (params) => {
    const targetPageId = params.targetPageId as string;
    const routeParamsRaw = params.routeParams;
    const queryParamsRaw = params.queryParams;
    const replace = params.replace as boolean;
    const newTab = params.newTab as boolean;

    if (!targetPageId) {
      console.warn("Navigate action failed: targetPageId is missing.");
      return;
    }

    const store = useEditorStore.getState();
    const activeProj = store.projects.find((p) => p.id === store.activeProjectId);
    const pages = activeProj ? activeProj.pages : store.pages;

    const targetPage = pages.find((p) => p.id === targetPageId);
    if (!targetPage) {
      console.warn(`Target page with ID ${targetPageId} not found.`);
      return;
    }

    let routePath = targetPage.path;

    // Parse route params and query params
    let routeParams: Record<string, any> = {};
    if (typeof routeParamsRaw === "string") {
      try { routeParams = JSON.parse(routeParamsRaw); } catch {}
    } else if (typeof routeParamsRaw === "object" && routeParamsRaw !== null) {
      routeParams = routeParamsRaw as any;
    }

    let queryParams: Record<string, any> = {};
    if (typeof queryParamsRaw === "string") {
      try { queryParams = JSON.parse(queryParamsRaw); } catch {}
    } else if (typeof queryParamsRaw === "object" && queryParamsRaw !== null) {
      queryParams = queryParamsRaw as any;
    }

    // Replace route parameters [paramName] in route path
    for (const [key, value] of Object.entries(routeParams)) {
      routePath = routePath.replace(`[${key}]`, String(value));
    }

    // Append query params
    const queryParts = Object.entries(queryParams)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    if (queryParts.length > 0) {
      routePath += (routePath.includes("?") ? "&" : "?") + queryParts.join("&");
    }

    if (newTab) {
      window.open(routePath, "_blank");
    } else {
      if (store.isPreviewMode) {
        store.setActivePageId(targetPageId);
      } else {
        if (replace) {
          window.history.replaceState(null, "", routePath);
        } else {
          window.location.href = routePath;
        }
      }
    }
  },
};
