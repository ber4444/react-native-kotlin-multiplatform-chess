// Type declarations for CSS side-effect and CSS-module imports (RN Web template
// relies on these; TypeScript itself has no built-in CSS module typing).

declare module '*.css';
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
