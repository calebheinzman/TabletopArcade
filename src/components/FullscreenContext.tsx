'use client';

import React, { createContext, useContext, useState } from 'react';

interface FullScreenContextProps {
  isFullScreen: boolean;
  fullScreenRef: React.RefObject<HTMLElement> | null;
  toggleFullScreen: (ref: React.RefObject<HTMLElement>) => void;
}

const FullScreenContext = createContext<FullScreenContextProps | undefined>(
  undefined
);

export const FullScreenProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [fullScreenRef, setFullScreenRef] =
    useState<React.RefObject<HTMLElement> | null>(null);

  const toggleFullScreen = (ref: React.RefObject<HTMLElement>) => {
    if (!ref?.current) {
      console.error('No valid container for fullscreen mode.');
      return;
    }

    if (isFullScreen) {
      document
        .exitFullscreen?.()
        .then(() => setFullScreenRef(null))
        .catch((err) => {
          console.error('Error exiting full-screen mode:', err);
        });
    } else {
      ref.current
        .requestFullscreen?.()
        .then(() => setFullScreenRef(ref))
        .catch((err) => {
          console.error('Error entering full-screen mode:', err);
        });
    }
    setIsFullScreen(!isFullScreen);
  };

  return (
    <FullScreenContext.Provider
      value={{
        isFullScreen,
        fullScreenRef,
        toggleFullScreen,
      }}
    >
      {children}
    </FullScreenContext.Provider>
  );
};

export const useFullScreen = () => {
  const context = useContext(FullScreenContext);
  if (!context) {
    throw new Error('useFullScreen must be used within a FullScreenProvider');
  }
  return context;
};
