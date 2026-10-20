(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.StudyLibPdf = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const URL_PATTERN =
    /(?:https?:)?\/\/(?:[a-z\d-]+\.)*studylib\.net\/store\/data\/\d+\.pdf(?:\?[^\s"'<>]*)?|\/store\/data\/\d+\.pdf(?:\?[^\s"'<>]*)?/gi;

  const ELEMENT_SELECTORS = [
    'link[href*="/store/data/"][href*=".pdf"]',
    '[data-src*="/store/data/"][data-src*=".pdf"]',
    'a[href*="/store/data/"][href*=".pdf"]',
    'embed[src*="/store/data/"][src*=".pdf"]',
    'iframe[src*="/store/data/"][src*=".pdf"]',
    'meta[content*="/store/data/"][content*=".pdf"]'
  ];

  const decodeVariants = (value) => {
    const text = String(value || "");
    const variants = [text];
    try {
      const decoded = decodeURIComponent(text);
      if (decoded !== text) variants.push(decoded);
    } catch {
      // Keep the original string when it is not a valid URI component.
    }
    return variants;
  };

  const extractUrlsFromText = (text) => {
    const urls = [];
    for (const variant of decodeVariants(text)) {
      URL_PATTERN.lastIndex = 0;
      for (const match of variant.matchAll(URL_PATTERN)) {
        urls.push(match[0]);
      }
    }
    return urls;
  };

  const normalizePdfUrl = (candidate, baseHref) => {
    try {
      const url = new URL(candidate, baseHref);
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
    return null;
  };

  const attributeValues = (element) => {
    if (element.getAttributeNames) {
      return element.getAttributeNames().map((name) => element.getAttribute(name));
    }
    if (!element.attributes) return [];
    return [...element.attributes].map((attribute) => attribute.value);
  };

  const firstNormalizedUrl = (text, baseHref) => {
    for (const candidate of extractUrlsFromText(text)) {
      const normalized = normalizePdfUrl(candidate, baseHref);
      if (normalized) return normalized;
    }
    return null;
  };

  const findPdfUrlFromDocument = (doc, options = {}) => {
    const baseHref =
      options.baseHref ||
      doc.defaultView?.location?.href ||
      "https://studylib.net/";

    for (const selector of ELEMENT_SELECTORS) {
      let elements = [];
      try {
        elements = doc.querySelectorAll(selector);
      } catch {
        continue;
      }
      for (const element of elements) {
        for (const value of attributeValues(element)) {
          const found = firstNormalizedUrl(value, baseHref);
          if (found) return found;
        }
      }
    }

    for (const entry of options.performanceEntries || []) {
      const found = firstNormalizedUrl(entry, baseHref);
      if (found) return found;
    }

    try {
      const html = doc.documentElement?.innerHTML;
      if (html) {
        const found = firstNormalizedUrl(html, baseHref);
        if (found) return found;
      }
    } catch {
      // Some documents restrict innerHTML access; keep going without it.
    }

    return null;
  };

  return {
    extractUrlsFromText,
    normalizePdfUrl,
    findPdfUrlFromDocument
  };
});
