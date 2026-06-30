import { ActionHandler } from "../types";
import { message } from "antd";

export const showToastAction: ActionHandler = {
  type: "showToast",
  label: "Show Toast",
  icon: "MessageSquare",
  category: "UI",
  paramSchema: [
    { key: "message", label: "Message", type: "text", placeholder: "Notification message", required: true },
    {
      key: "type",
      label: "Type",
      type: "select",
      defaultValue: "success",
      options: [
        { label: "Success", value: "success" },
        { label: "Error", value: "error" },
        { label: "Warning", value: "warning" },
        { label: "Info", value: "info" },
      ],
    },
  ],
  execute: async (params) => {
    const msg = (params.message as string) || "Notification";
    const type = (params.type as string) || "success";

    switch (type) {
      case "error":
        message.error(msg);
        break;
      case "warning":
        message.warning(msg);
        break;
      case "info":
        message.info(msg);
        break;
      case "success":
      default:
        message.success(msg);
        break;
    }
  },
};
