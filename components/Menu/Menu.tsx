'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { ButtonGroup } from '../ui/button-group';
import { ScriptLoader } from './ScriptLoader';
import { Rules } from './Rules';

export enum states {
  RULES = 'rules',
  PLAYER_ONE = 'player_one',
  PLAYER_TWO = 'player_two',
}

export const Menu = () => {
  const [state, setState] = useState(states.RULES);

  const handleOnClick = (state: states) => {
    setState(state);
  };

  return (
    <div className='w-full h-full flex flex-col p-10 gap-5'>
      <div className='h-1/12 w-full flex gap-3 justify-center items-center text-violet-500'>
        <ButtonGroup>
          <Button
            variant={'outline'}
            onClick={() => {
              handleOnClick(states.RULES);
            }}
          >
            Правила
          </Button>
          <Button
            variant={'outline'}
            onClick={() => {
              handleOnClick(states.PLAYER_ONE);
            }}
          >
            Участник 1
          </Button>
          <Button
            variant={'outline'}
            onClick={() => {
              handleOnClick(states.PLAYER_TWO);
            }}
          >
            Участник 2
          </Button>
        </ButtonGroup>
      </div>
      <div className='h-11/12 w-full flex justify-center items-center'>
        {state === states.RULES && <Rules />}
        {state !== states.RULES && <ScriptLoader player={state} />}
      </div>
    </div>
  );
};
