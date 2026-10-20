(() => {
  const BUTTON_ID = "studylib-direct-pdf-download";
  const PORT_NAME = "studylib-downloader";
  if (document.getElementById(BUTTON_ID)) return;

  let port = null;
  let requestId = 0;

  const findPdfUrl = () => {
    const performanceEntries = [];
    try {
      for (const entry of performance.getEntriesByType("resource")) {
        performanceEntries.push(entry.name);
      }
    } catch {
      // Resource timing is optional; element and HTML scans still run.
    }
    return StudyLibPdf.findPdfUrlFromDocument(document, { performanceEntries });
  };

  const disconnectedError = (message) =>
    /Receiving end does not exist|Extension context invalidated/i.test(message || "");

  const connectPort = () => {
    try {
      port = chrome.runtime.connect({ name: PORT_NAME });
      port.onDisconnect.addListener(() => {
        port = null;
        void chrome.runtime.lastError;
      });
      return port;
    } catch {
      port = null;
      return null;
    }
  };

  connectPort();

  const openPdfFallback = (url) => {
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };

  const downloadViaPort = (payload) =>
    new Promise((resolve) => {
      const active = port || connectPort();
      if (!active) {
        resolve({ ok: false, disconnected: true, error: "Could not establish connection. Receiving end does not exist." });
        return;
      }

      const onMessage = (response) => {
        if (response?.type !== "studylib-download-result" || response.requestId !== payload.requestId) {
          return;
        }
        active.onMessage.removeListener(onMessage);
        resolve(response);
      };

      active.onMessage.addListener(onMessage);
      try {
        active.postMessage(payload);
      } catch (error) {
        active.onMessage.removeListener(onMessage);
        resolve({ ok: false, disconnected: true, error: error.message });
      }
    });

  const downloadViaMessage = (payload) =>
    new Promise((resolve) => {
      const attempt = (remaining) => {
        chrome.runtime.sendMessage(payload, (response) => {
          const runtimeError = chrome.runtime.lastError?.message;
          if (disconnectedError(runtimeError) && remaining > 0) {
            connectPort();
            window.setTimeout(() => attempt(remaining - 1), 200);
            return;
          }
          if (runtimeError) {
            resolve({ ok: false, disconnected: disconnectedError(runtimeError), error: runtimeError });
            return;
          }
          resolve(response || { ok: false, error: "Falha desconhecida." });
        });
      };
      attempt(3);
    });

  const button = document.createElement("button");
  button.id = BUTTON_ID;
  button.type = "button";
  button.textContent = "⬇ Baixar PDF direto";
  button.setAttribute("aria-label", "Baixar PDF direto do StudyLib");
  Object.assign(button.style, {
    position: "fixed",
    right: "20px",
    bottom: "20px",
    zIndex: "2147483647",
    padding: "12px 18px",
    background: "#218838",
    color: "#fff",
    border: "0",
    borderRadius: "8px",
    boxShadow: "0 4px 12px rgba(0, 0, 0, .25)",
    cursor: "pointer",
    font: "600 14px/1.2 system-ui, sans-serif"
  });

  button.addEventListener("click", async () => {
    const pdfUrl = findPdfUrl();
    if (!pdfUrl) {
      button.textContent = "PDF não encontrado nesta página";
      button.title = "O StudyLib não disponibilizou um link direto para o PDF no conteúdo da página.";
      window.setTimeout(() => {
        button.textContent = "⬇ Baixar PDF direto";
        button.title = "";
      }, 3500);
      return;
    }

    button.disabled = true;
    button.textContent = "Preparando download…";

    const payload = {
      type: "studylib-download-pdf",
      requestId: ++requestId,
      url: pdfUrl,
      filename: document.title || "studylib-document"
    };

    let result = await downloadViaPort(payload);
    if (!result?.ok) {
      result = await downloadViaMessage(payload);
    }

    if (result?.ok) {
      button.textContent = "Download iniciado";
      window.setTimeout(() => button.remove(), 2500);
      return;
    }

    if (result?.disconnected) {
      openPdfFallback(pdfUrl);
      button.disabled = false;
      button.textContent = "⬇ Recarregue a página";
      button.title = "O arquivo pode ter aberto em outra aba. Recarregue esta página e clique de novo. Se atualizou a extensão agora, recarregue a extensão e depois esta página.";
      console.error(
        "[StudyLib Downloader] Falha ao iniciar o download:",
        "Recarregue a página do documento. Se atualizou a extensão, recarregue a extensão e depois a página."
      );
      return;
    }

    button.disabled = false;
    button.textContent = "⬇ Tentar baixar novamente";
    button.title = result?.error || "Falha desconhecida.";
    console.error("[StudyLib Downloader] Falha ao iniciar o download:", result?.error || "Falha desconhecida.");
  });

  (document.body || document.documentElement).appendChild(button);
})();
