export function setupOffline() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const status = document.createElement("div");
  status.className = "offline-status";
  status.setAttribute("role", "status");
  status.textContent = "Saving for offline use…";
  document.querySelector(".home-footer").append(status);
  navigator.serviceWorker
    .register(import.meta.env.BASE_URL + "sw.js")
    .then((registration) => {
      navigator.serviceWorker.ready.then(() => {
        status.textContent = "Ready to use offline";
      });
      const offerUpdate = () => {
        if (!registration.waiting || !navigator.serviceWorker.controller)
          return;
        status.textContent = "An update is ready. ";
        const button = document.createElement("button");
        button.className = "text-button";
        button.textContent = "Update now";
        button.onclick = () => {
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => location.reload(),
            { once: true },
          );
          registration.waiting.postMessage("ACTIVATE");
        };
        status.append(button);
      };
      offerUpdate();
      registration.addEventListener("updatefound", () =>
        registration.installing?.addEventListener("statechange", offerUpdate),
      );
    })
    .catch(() => {
      status.textContent =
        "Offline copy could not be saved. Connect and reload to try again.";
    });
  let installEvent;
  addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installEvent = event;
    const button = document.createElement("button");
    button.className = "text-button";
    button.textContent = "Install for this classroom";
    button.onclick = async () => {
      await installEvent.prompt();
      button.remove();
    };
    document.querySelector(".home-footer").append(button);
  });
}
