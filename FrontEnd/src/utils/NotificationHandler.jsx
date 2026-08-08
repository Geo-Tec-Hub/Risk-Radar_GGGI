import { notification } from "antd";

export const openErrorNotification = (message, description) => {
  notification.error({
    message: message,
    description: description,
  });
};

export const openSuccessNotification = (message, description) => {
  notification.success({
    message: message,
    description: description,
  });
};

export const openInfoNotification = (message, description) => {
  notification.info({
    message: message,
    description: description,
  });
};
