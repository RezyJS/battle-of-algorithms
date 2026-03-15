import type { Operator } from '@/src/entities/operator';
import type { GameMode } from '@/src/app/model/game-store';

export function executeScript(
  operator: Operator,
  scriptString: string,
  maxSteps: number = 1000,
  gameMode: GameMode = 'race',
): string | null {
  try {
    let stepCount = 0;

    const wrappedOperator = {
      moveRight: () => {
        if (stepCount++ >= maxSteps) throw new Error('Max steps reached');
        operator.moveRight();
      },
      moveLeft: () => {
        if (stepCount++ >= maxSteps) throw new Error('Max steps reached');
        operator.moveLeft();
      },
      moveUp: () => {
        if (stepCount++ >= maxSteps) throw new Error('Max steps reached');
        operator.moveUp();
      },
      moveDown: () => {
        if (stepCount++ >= maxSteps) throw new Error('Max steps reached');
        operator.moveDown();
      },
      wait: () => {
        if (stepCount++ >= maxSteps) throw new Error('Max steps reached');
        operator.wait();
      },
      lookRight: () => operator.lookRight(),
      lookLeft: () => operator.lookLeft(),
      lookUp: () => operator.lookUp(),
      lookDown: () => operator.lookDown(),
      hasKey: () => operator.hasKey(),
      hasExited: () => operator.hasExited(),
      getPosition: () => operator.getPosition(),
      getStepCount: () => operator.getStepCount(),
      scan: (radius?: number) => operator.scan(radius),
      markCell: () => operator.markCell(),
      isMarked: (dx?: number, dy?: number) => operator.isMarked(dx, dy),
      getDistanceTo: (target: 'key' | 'exit') => operator.getDistanceTo(target),
      getOpponentPosition: () => {
        if (gameMode !== 'duel') return null;
        return operator.getOpponentPosition();
      },
    };

    const func = new Function('operator', scriptString);
    func(wrappedOperator);
    return null;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return `Error in script: ${message}`;
  }
}
