import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconX,
  IconInfoSmall,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { createElement } from "react";

export const NotificationService = {
  success(
    message: string = "",
    position:
      | "top-center"
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "bottom-center" = "bottom-right",
    autoClose: number = 3000,
  ): void {
    notifications.show({
      color: "green",
      icon: createElement(IconCheck, { size: 18 }),
      title: "สำเร็จ",
      message,
      autoClose,
      position,
      //   withBorder: true,
    });
  },

  error(
    message: string = "",
    position:
      | "top-center"
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "bottom-center" = "bottom-right",
    autoClose: number = 5000,
  ): void {
    notifications.show({
      color: "red",
      icon: createElement(IconX, { size: 18 }),
      title: "เกิดข้อผิดพลาด",
      message,
      autoClose,
      position,
      //   withBorder: true,
    });
  },

  warning(
    message: string = "",
    position:
      | "top-center"
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "bottom-center" = "bottom-right",
    autoClose: number = 4000,
  ): void {
    notifications.show({
      color: "yellow",
      icon: createElement(IconAlertTriangle, { size: 18 }),
      title: "คำเตือน",
      message,
      autoClose,
      position,
      //   withBorder: true,
    });
  },

  info(message: string = "", autoClose: number = 3000): void {
    notifications.show({
      color: "cyan",
      icon: createElement(IconInfoSmall, { size: 30 }),
      title: "ข่าวสาร",
      message,
      autoClose,
      //   withBorder: true,
    });
  },

  loading(
    message: string = "",
    position:
      | "top-center"
      | "top-left"
      | "top-right"
      | "bottom-left"
      | "bottom-right"
      | "bottom-center" = "bottom-right",
  ): string {
    return notifications.show({
      title: "กำลังโหลด...",
      message,
      loading: true,
      loaderProps: {
        color: "yellow",
      },
      position,
      autoClose: false,
      withCloseButton: false,
      //   withBorder: true,
    });
  },

  updateToSuccess(
    id: string,
    {
      message = "",
      autoClose = 3000,
    }: { message?: string; autoClose?: number },
  ): void {
    notifications.update({
      icon: createElement(IconCheck, { size: 18 }),
      color: "green",
      title: "สำเร็จ",
      id,
      message,
      autoClose,
      loading: false,
      withCloseButton: true,
      //   withBorder: true,
    });
  },

  updateToError(
    id: string,
    {
      message = "",
      autoClose = 5000,
    }: { message?: string; autoClose?: number },
  ): void {
    notifications.update({
      icon: createElement(IconX, { size: 18 }),
      color: "red",
      title: "เกิดข้อผิดพลาด",
      id,
      message,
      autoClose,
      loading: false,
      withCloseButton: true,
      //   withBorder: true,
    });
  },

  clean() {
    notifications.clean();
  },

  cleanQueue() {
    notifications.cleanQueue();
  },
};
