/** Nahrazuje se při sestavení (vite.config `define`). */
export const APP_VERSION =
  typeof __APP_VERSION__ === "string" && __APP_VERSION__.length > 0 ? __APP_VERSION__ : "0.1.0";
