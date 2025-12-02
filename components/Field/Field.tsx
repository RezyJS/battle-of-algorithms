import { CellHeight, CellOffset, CellWidth } from '@/utils/consts';
import { CellType, PlayerCoords, TField } from '@/utils/types';

const CellColor = {
  [CellType.Ground]: 'bg-[#1b8f36]',
  [CellType.Wall]: 'bg-[#737373]',
  [CellType.ControlPointUnclaimed]: 'bg-[#333333]',
  [CellType.ControlPointFirstPlayer]: 'bg-[#3922bd]',
  [CellType.ControlPointSecondPlayer]: 'bg-[#ad2323]',
};

type TPlayer = { number: 'first' | 'second'; coords: PlayerCoords };

type TFieldProps = {
  field: TField;
  players: Array<TPlayer>;
};

const PlayerColor = {
  FIRST: '#08084f',
  SECOND: '#4f080e',
};

const CellGrid = ({ field }: { field: TField }) => {
  return (
    <>
      {field.map((row, index) => {
        return (
          <div
            className={`flex grid-cols-${row.length}`}
            key={`Field-Row-${index}`}
          >
            {row.map((cell, cellIndex) => (
              <div
                className={`${CellWidth} ${CellHeight} m-1 ${
                  CellColor[cell.type]
                }`}
                key={`Field-Row-${index}-Cell-${cellIndex}`}
              >
                {[
                  CellType.ControlPointUnclaimed,
                  CellType.ControlPointFirstPlayer,
                  CellType.ControlPointSecondPlayer,
                ].includes(cell.type) && (
                  <div className='w-full h-full flex justify-center items-center'>
                    🚩
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
};

const Player = ({
  player,
  fieldLengths,
}: {
  player: TPlayer;
  fieldLengths: { x: number; y: number };
}) => {
  const left = `calc(${CellOffset} * ${player.coords.x})`;
  const bottom = `calc(${CellOffset} * ${
    fieldLengths.y - player.coords.y - 1
  })`;
  return (
    <div
      className={`absolute flex justify-center items-center m-1 w-[60px] h-[60px] z-10`}
      style={{ left, bottom }}
    >
      {player.number === 'first' && (
        <div
          className='flex justify-center items-center w-10 h-10 rounded-lg'
          style={{ backgroundColor: PlayerColor.FIRST }}
        >
          🔵
        </div>
      )}
      {player.number === 'second' && (
        <div
          className='flex justify-center items-center w-10 h-10 rounded-lg'
          style={{ backgroundColor: PlayerColor.SECOND }}
        >
          🔴
        </div>
      )}
    </div>
  );
};

export const Field = ({ field, players }: TFieldProps) => {
  const fieldLengths = { x: field[0].length, y: field.length };
  return (
    <div className={`grid-rows-${field.length} border border-white  relative`}>
      <CellGrid field={field} />
      <Player
        player={players[0]}
        fieldLengths={fieldLengths}
      />
      <Player
        player={players[1]}
        fieldLengths={fieldLengths}
      />
    </div>
  );
};
