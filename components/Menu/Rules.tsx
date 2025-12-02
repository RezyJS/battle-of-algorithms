import { usePlayerContext } from '../PlayerContext';

export const Rules = () => {
  const {
    player_one: { script },
  } = usePlayerContext();

  return <p className='text-white'>{script}</p>;
};
