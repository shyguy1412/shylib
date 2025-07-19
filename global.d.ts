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
}

export default global;
