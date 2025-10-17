declare global {
  const fullscreen: {
    onEnterFullscreen: (callback: () => void) => void;
    onLeaveFullscreen: (callback: () => void) => void;
    isFullscreen: () => Promise<boolean>;
  };

  const titlebar: {
    close: () => void;
    maximize: () => void;
    minimize: () => void;
    isMaximised: () => Promise<boolean>;
  };

  const __module_bridge_init: Promise<void>;
}

export default global;
