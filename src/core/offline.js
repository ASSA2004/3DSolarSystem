import release from "../data/release.json";
import "../../css/offline.css";

export function setupOffline() {
  if (!import.meta.env.PROD || document.querySelector(".release-status"))
    return;
  const footer = document.querySelector(".home-footer");
  if (!footer) return;
  const version = document.createElement("span");
  version.className = "release-status";
  version.textContent = `Version ${release.version}`;
  footer.append(version);
  if (!("serviceWorker" in navigator)) return;
  const status = document.createElement("div");
  status.className = "offline-status";
  status.setAttribute("role", "status");
  status.textContent = "Saving for offline use…";
  const check = document.createElement("button");
  check.className = "release-check";
  check.textContent = "Check for updates";
  check.disabled = true;
  footer.append(status, check);
  let registration,
    newerVersion = false,
    dismissed = false;
  const notice = document.createElement("section");
  notice.className = "update-notice";
  notice.hidden = true;
  notice.setAttribute("aria-label", "App update");
  notice.innerHTML =
    '<p role="status"><strong>New version ready</strong><br>Reload to use it. This experiment will restart; saved notebooks stay.</p><div><button data-reload>Reload latest version</button><button data-later>Later</button></div>';
  document.body.append(notice);
  notice.querySelector("[data-later]").onclick = () => {
    dismissed = true;
    notice.hidden = true;
    check.focus();
  };
  notice.querySelector("[data-reload]").onclick = () => location.reload();
  const showUpdate = () => {
    newerVersion = true;
    status.textContent = "New version ready to use.";
    check.textContent = "Show update";
    notice.hidden = dismissed;
  };
  const identifyWorker = () => {
    const worker = navigator.serviceWorker.controller;
    if (!worker) return;
    const channel = new MessageChannel();
    const timer = setTimeout(() => channel.port1.close(), 2000);
    channel.port1.onmessage = ({ data }) => {
      clearTimeout(timer);
      channel.port1.close();
      if (data?.version && data.version !== release.version) showUpdate();
    };
    worker.postMessage({ type: "VERSION" }, [channel.port2]);
  };
  navigator.serviceWorker.addEventListener("controllerchange", identifyWorker);
  navigator.serviceWorker.addEventListener("message", ({ data }) => {
    if (data?.type === "RELEASE" && data.version !== release.version)
      showUpdate();
  });
  const update = async (manual = false) => {
    if (!registration || check.disabled) return;
    if (newerVersion) {
      if (manual) {
        dismissed = false;
        notice.hidden = false;
      }
      return;
    }
    check.disabled = true;
    try {
      await registration.update();
      identifyWorker();
      if (manual && !newerVersion)
        status.textContent = registration.installing
          ? "Downloading the new offline copy…"
          : "You have the latest version. Ready to use offline.";
    } catch {
      if (manual)
        status.textContent =
          "Connect to the internet to check for updates. Your offline copy is still available.";
    } finally {
      check.disabled = false;
    }
  };
  check.onclick = () => update(true);
  navigator.serviceWorker
    .register(import.meta.env.BASE_URL + "sw.js", { updateViaCache: "none" })
    .then(async (reg) => {
      registration = reg;
      await navigator.serviceWorker.ready;
      check.disabled = false;
      if (!newerVersion) status.textContent = "Ready to use offline";
      identifyWorker();
      await update();
    })
    .catch(() => {
      status.textContent =
        "Offline copy could not be saved. Connect and reload to try again.";
    });
  addEventListener("online", () => update());
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) update();
  });
  addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    const button = document.createElement("button");
    button.className = "release-check";
    button.textContent = "Install for this classroom";
    button.onclick = async () => {
      await event.prompt();
      button.remove();
    };
    footer.append(button);
  });
}
