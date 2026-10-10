(() => {
  const BUTTON_ID = "studylib-direct-pdf-download";
  if (document.getElementById(BUTTON_ID)) return;

  const findPdfUrl = () => {
    const urlPattern = /(?:https?:)?\/\/(?:[a-z\d-]+\.)*studylib\.net\/store\/data\/\d+\.pdf(?:\?[^\s"'<>]*)?|\/store\/data\/\d+\.pdf(?:\?[^\s"'<>]*)?/gi;
    const candidates = [];

    for (const element of document.querySelectorAll("*")) {
      for (const attribute of element.attributes) {
        if (!attribute.value.includes("/store/data/")) continue;
        for (const match of attribute.value.matchAll(urlPattern)) {
          candidates.push(match[0]);
        }
      }
    }

    for (const candidate of candidates) {
      try {
        const url = new URL(candidate, location.href);
        const isStudylibHost =
          url.hostname === "studylib.net" || url.hostname.endsWith(".studylib.net");
        if (
          url.protocol === "https:" &&
          isStudylibHost &&
          /^\/store\/data\/\d+\.pdf$/i.test(url.pathname)
        ) {
          return url.href;
        }
      } catch {
        // Ignore malformed links and keep looking for a valid PDF URL.
      }
    }

    return null;
  };

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

  button.addEventListener("click", () => {
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
    chrome.runtime.sendMessage(
      {
        type: "studylib-download-pdf",
        url: pdfUrl,
        filename: document.title || "studylib-document"
      },
      (response) => {
        if (chrome.runtime.lastError || !response?.ok) {
          button.disabled = false;
          button.textContent = "⬇ Tentar baixar novamente";
          console.error(
            "[StudyLib Downloader] Falha ao iniciar o download:",
            response?.error || chrome.runtime.lastError?.message
          );
          return;
        }

        button.textContent = "Download iniciado";
        window.setTimeout(() => {
          button.remove();
        }, 2500);
      }
    );
  });

  (document.body || document.documentElement).appendChild(button);
})();
