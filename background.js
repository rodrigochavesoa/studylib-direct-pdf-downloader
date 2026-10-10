chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "studylib-download-pdf") return;

  const url = message.url;
  if (typeof url !== "string") {
    sendResponse({ ok: false, error: "URL inválida." });
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch {
    sendResponse({ ok: false, error: "URL inválida." });
    return;
  }

  if (
    parsedUrl.protocol !== "https:" ||
    !(parsedUrl.hostname === "studylib.net" || parsedUrl.hostname.endsWith(".studylib.net")) ||
    !/^\/store\/data\/\d+\.pdf$/i.test(parsedUrl.pathname)
  ) {
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

  return true;
});

function sanitizeFilename(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 120) || "studylib-document";
}
