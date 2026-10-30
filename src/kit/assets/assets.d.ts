// Static asset module declarations for the Lightwell kit.
// Webpack (via FEC base config) handles the actual transforms at build time.

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.svg' {
  const src: string;
  export default src;
}
