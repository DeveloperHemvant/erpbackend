// Jest test-environment mock for @react-pdf/renderer (see package.json's
// moduleNameMapper). Its real dependency tree ships several packages as
// pure ESM (@react-pdf/render -> color-string -> color-name, and more
// several levels deep) which ts-jest's CommonJS transform can't load no
// matter how deep transformIgnorePatterns chases it. Production code never
// hits this file — dist/ runs under Node directly (verified against real
// PDF output, see DocumentRenderingService). Specs that transitively import
// DocumentRenderingService only exercise business logic around it (which
// template was picked, what status a certificate ends up in, ...), never
// the actual rendered bytes, so a lightweight stand-in is enough here.
const passthroughTag = (name: string) => name;

export const Document = passthroughTag('Document');
export const Page = passthroughTag('Page');
export const View = passthroughTag('View');
export const Text = passthroughTag('Text');
export const Image = passthroughTag('Image');

export const StyleSheet = {
  create: (styles: Record<string, unknown>) => styles,
};

export async function renderToBuffer(): Promise<Buffer> {
  return Buffer.from('%PDF-mock');
}
