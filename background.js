const PORT_NAME = "studylib-downloader";

chrome.runtime.onInstalled.addListener(() => {});
chrome.runtime.onStartup.addListener(() => {});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== PORT_NAME) return;

  port.onMessage.addListener((message) => {
    if (message?.type !== "studylib-download-pdf") return;
    startDownload(message, (result) => {
      try {
        port.postMessage({ type: "studylib-download-result", requestId: message.requestId, ...result });
      } catch {
        // The tab closed or the content script was invalidated.
      }
    });
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "studylib-ping") {
    sendResponse({ ok: true });
    return;
  }

  if (message?.type !== "studylib-download-pdf") return;
  startDownload(message, sendResponse);
  return true;
});

function startDownload(message, sendResponse) {
  const parsedUrl = parseStudylibPdfUrl(message?.url);
  if (!parsedUrl) {
    sendResponse({ ok: false, error: "O link encontrado não é um PDF válido do StudyLib." });
    return;
  }

  const filename = `${sanitizeFilename(message.filename || "studylib-document")}.pdf`;
  chrome.downloads.download(
    { url: parsedUrl.href, filename, saveAs: true },
    (downloadId) => {
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ ok: true, downloadId });
    }
  );
}

function parseStudylibPdfUrl(url) {
  if (typeof url !== "string") return null;
  try {
    const parsedUrl = new URL(url);
    const isStudylibHost =
      parsedUrl.hostname === "studylib.net" || parsedUrl.hostname.endsWith(".studylib.net");
    if (
      parsedUrl.protocol === "https:" &&
      isStudylibHost &&
      /^\/store\/data\/\d+\.pdf$/i.test(parsedUrl.pathname)
    ) {
      return parsedUrl;
    }
  } catch {
    return null;
  }
  return null;
}

function sanitizeFilename(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "studylib-document";
}
