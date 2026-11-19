// Framer's editor APIs are not needed to render the copied components in Vite.
export const ControlType = new Proxy({}, {get: (_target, key) => String(key)});
export const addPropertyControls = () => undefined;
export const useIsStaticRenderer = () => false;
export const RenderTarget = {
  canvas: "canvas",
  thumbnail: "thumbnail",
  current: () => "preview",
};
