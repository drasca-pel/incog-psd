export async function requestNotificationPermission() {
  if (!("Notification" in window)) {
    console.warn(
      "This browser does not support notifications."
    );

    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission =
      await Notification.requestPermission();

    return permission === "granted";
  }

  return false;
}

export function sendBrowserNotification(
  title,
  options = {}
) {
  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") {
    return;
  }

  if (
    document.visibilityState === "visible" &&
    document.hasFocus()
  ) {
    return;
  }

  const notification = new Notification(title, {
    icon: options.icon || "/logo192.png",
    badge: "/logo192.png",
    body: options.body || "",
    tag: options.tag,
    data: options.data || {},
  });

  notification.onclick = () => {
    window.focus();

    if (options.onClick) {
      options.onClick();
    }

    notification.close();
  };

  return notification;
}