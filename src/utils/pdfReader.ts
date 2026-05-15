import * as fs from 'node:fs/promises';

// Extract text content from a PDF file. Uses `pdfjs-dist`'s legacy build (Node-compatible). Returns the concatenated text of all pages, one space between page boundaries.
export async function extractPdfText(filePath: string): Promise<string> {
  // Lazy-load the heavy pdfjs module so importing pdfReader has no
  // cost for tests that never touch PDFs.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = await fs.readFile(filePath);
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;

  const pages = await Promise.all(
    Array.from({ length: pdf.numPages }, (_, i) => extractPage(pdf, i + 1)),
  );
  return pages.join(' ');
}

async function extractPage(pdf: unknown, pageNo: number): Promise<string> {
  const page = await (pdf as { getPage: (n: number) => Promise<unknown> }).getPage(pageNo);
  const tokenized = await (page as { getTextContent: () => Promise<{ items: Array<{ str: string }> }> }).getTextContent();
  return tokenized.items.map((t) => t.str).join('');
}
