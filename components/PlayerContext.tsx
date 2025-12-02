'use client';

import { createContext, PropsWithChildren, useContext, useState } from 'react';

export type TPlayerContext = {
  player_one: {
    script?: string;
    setScript: (script: string) => void;
  };
  player_two: {
    script?: string;
    setScript: (script: string) => void;
  };
};

const PlayerContext = createContext<TPlayerContext | undefined>(undefined);

export const PlayerContextProvider = (props: PropsWithChildren) => {
  const [firstPlayerScript, setFirstPlayerScript] = useState<
    string | undefined
  >(undefined);
  const [secondPlayerScript, setSecondPlayerScript] = useState<
    string | undefined
  >(undefined);

  const value = {
    player_one: {
      script: firstPlayerScript,
      setScript: setFirstPlayerScript,
    },
    player_two: {
      script: secondPlayerScript,
      setScript: setSecondPlayerScript,
    },
  };

  return (
    <PlayerContext.Provider value={value}>
      {props.children}
    </PlayerContext.Provider>
  );
};

export const usePlayerContext = () => {
  const context = useContext(PlayerContext);

  if (context === undefined) {
    throw new Error('You should use this inside PlayerContextProvider');
  }

  return context;
};
