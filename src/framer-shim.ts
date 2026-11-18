import { useState } from "react";

// Framer's property controls are editor-only. This small adapter keeps the
// copied components usable in a regular React preview.
export const ControlType = new Proxy({}, { get: (_target, key) => String(key) });
export const addPropertyControls = () => undefined;
export const useIsStaticRenderer = () => false;
export const RenderTarget = {
  canvas: "canvas",
  thumbnail: "thumbnail",
  current: () => "preview",
};

export const useIsMounted = () => {
  const [mounted] = useState(true);
  return mounted;
};
