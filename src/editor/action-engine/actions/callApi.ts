import { ActionHandler } from "../types";

export const callApiAction: ActionHandler = {
  type: "callApi",
  label: "Call API",
  icon: "Globe",
  category: "Data",
  paramSchema: [
    { key: "url", label: "URL", type: "text", placeholder: "https://api.example.com/data", required: true },
    {
      key: "method",
      label: "Method",
      type: "select",
      defaultValue: "GET",
      options: [
        { label: "GET", value: "GET" },
        { label: "POST", value: "POST" },
        { label: "PUT", value: "PUT" },
        { label: "DELETE", value: "DELETE" },
        { label: "PATCH", value: "PATCH" },
      ],
    },
    { key: "body", label: "Request Body (JSON)", type: "json", placeholder: '{"key": "value"}' },
    { key: "headers", label: "Headers (JSON)", type: "json", placeholder: '{"Authorization": "Bearer ..."}' },
    { key: "responsePath", label: "Store Response In", type: "state-path", placeholder: "e.g. api.response" },
    { key: "errorPath", label: "Store Error In", type: "state-path", placeholder: "e.g. api.error" },
  ],
  execute: async (params, ctx) => {
    const url = params.url as string;
    const method = (params.method as string) || "GET";
    const responsePath = params.responsePath as string | undefined;
    const errorPath = params.errorPath as string | undefined;

    let headers: Record<string, string> = {};
    if (params.headers) {
      try {
        headers = typeof params.headers === "string" ? JSON.parse(params.headers) : params.headers as Record<string, string>;
      } catch { /* ignore */ }
    }

    let body: string | undefined;
    if (params.body && method !== "GET") {
      body = typeof params.body === "string" ? params.body : JSON.stringify(params.body);
      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
      }
    }

    try {
      const response = await fetch(url, { method, headers, body });
      const data = await response.json().catch(() => response.text());

      if (responsePath) {
        ctx.setState(responsePath, data);
      }
      if (errorPath) {
        ctx.setState(errorPath, null);
      }
    } catch (error) {
      if (errorPath) {
        ctx.setState(errorPath, (error as Error).message);
      }
    }
  },
};
