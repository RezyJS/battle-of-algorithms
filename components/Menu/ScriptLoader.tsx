import { useCallback } from 'react';
import { usePlayerContext } from '../PlayerContext';
import { states } from './Menu';
import ReactCodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { aura } from '@uiw/codemirror-theme-aura';

export const ScriptLoader = ({
  player,
}: {
  player: states.PLAYER_ONE | states.PLAYER_TWO;
}) => {
  const {
    player_one: { script: playerOneScript, setScript: setPlayerOneScript },
    player_two: { script: playerTwoScript, setScript: setPlayerTwoScript },
  } = usePlayerContext();

  const onChange = useCallback(
    (value: string) => {
      if (player === states.PLAYER_ONE) {
        setPlayerOneScript(value);
      } else {
        setPlayerTwoScript(value);
      }
    },
    [player, setPlayerOneScript, setPlayerTwoScript]
  );

  return (
    <div className='w-full h-full'>
      <ReactCodeMirror
        value={player === states.PLAYER_ONE ? playerOneScript : playerTwoScript}
        onChange={onChange}
        width='100%'
        height='100%'
        theme={aura}
        extensions={[javascript({ jsx: false, typescript: true })]}
      />
    </div>
  );
};
