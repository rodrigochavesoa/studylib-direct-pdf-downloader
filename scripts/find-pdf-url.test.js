const assert = require("node:assert/strict");
const { extractUrlsFromText, normalizePdfUrl, findPdfUrlFromDocument } = require("../find-pdf-url.js");

const baseHref = "https://studylib.net/doc/027142818/example";
const pdfHref = "https://s2p.studylib.net/store/data/027142818.pdf?k=TOKEN";
const s3PdfHref = "https://s3p.studylib.net/store/data/029026933.pdf?k=TOKEN";
const protocolRelative = "//s2p.studylib.net/store/data/027142818.pdf?k=TOKEN";

const element = (tagName, attrs) => ({
  tagName,
  getAttributeNames: () => Object.keys(attrs),
  getAttribute: (name) => attrs[name] ?? null,
  attributes: Object.entries(attrs).map(([name, value]) => ({ name, value }))
});

const documentFrom = (nodesBySelector, html = "") => ({
  defaultView: { location: { href: baseHref } },
  querySelectorAll: (selector) => nodesBySelector[selector] || [],
  documentElement: { innerHTML: html }
});

{
  const urls = extractUrlsFromText(pdfHref);
  assert.deepEqual(urls, [pdfHref]);
  assert.equal(normalizePdfUrl(urls[0], baseHref), pdfHref);
}

{
  const urls = extractUrlsFromText(`<link rel="preconnect" href="${pdfHref}">`);
  assert.equal(normalizePdfUrl(urls[0], baseHref), pdfHref);
}

{
  const urls = extractUrlsFromText(`<link rel="preconnect" href="${s3PdfHref}">`);
  assert.equal(normalizePdfUrl(urls[0], baseHref), s3PdfHref);
}

{
  const encoded = encodeURIComponent(protocolRelative);
  const urls = extractUrlsFromText(`https://studylib.net/viewer_next/web/study?file=${encoded}`);
  assert.equal(normalizePdfUrl(urls[0], baseHref), pdfHref);
}

{
  const doc = documentFrom({
    'link[href*="/store/data/"][href*=".pdf"]': [
      element("LINK", { rel: "preconnect", href: pdfHref })
    ]
  });
  assert.equal(findPdfUrlFromDocument(doc), pdfHref);
}

{
  const doc = documentFrom(
    {
      'link[href*="/store/data/"][href*=".pdf"]': [],
      '[data-src*="/store/data/"][data-src*=".pdf"]': [
        element("DIV", { "data-src": protocolRelative })
      ]
    }
  );
  assert.equal(findPdfUrlFromDocument(doc), pdfHref);
}

{
  const doc = documentFrom({}, `<script>const x = "${pdfHref}";</script>`);
  assert.equal(findPdfUrlFromDocument(doc), pdfHref);
}

{
  const doc = documentFrom({}, "no pdf here");
  assert.equal(
    findPdfUrlFromDocument(doc, { performanceEntries: [pdfHref] }),
    pdfHref
  );
}

{
  const doc = documentFrom({}, "no pdf here");
  assert.equal(findPdfUrlFromDocument(doc), null);
}

console.log("find-pdf-url tests passed");
