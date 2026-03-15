import type { FieldGrid, StateSnapshot } from '@/src/shared/model';
import type { Operator } from '@/src/entities/operator';

export function mergeFields(
  staticField: FieldGrid,
  operators: Operator[],
  histories: StateSnapshot[][],
  currentStep: number
): FieldGrid {
  const base = staticField.map((row) => [...row]);

  // Mark keys that have already been picked up
  operators.forEach((_, idx) => {
    const history = histories[idx];
    if (!history) return;

    for (let step = 1; step <= Math.min(currentStep, history.length - 1); step++) {
      if (history[step].hasKey && !history[step - 1].hasKey) {
        // This operator picked up a key at this step
        const pos = history[step].position;
        const kx = pos.getX();
        const ky = pos.getY();
        if (staticField[ky][kx].startsWith('key')) {
          base[ky][kx] = 'key_taken';
        }
        break;
      }
    }
  });

  // Place operators on the field
  operators.forEach((op, idx) => {
    const history = histories[idx];
    if (!history || currentStep >= history.length) return;

    const snapshot = history[currentStep];
    const pos = snapshot.position;
    const x = pos.getX();
    const y = pos.getY();

    if (!snapshot.hasExited) {
      const cellContent = base[y][x];
      if (!cellContent.startsWith('key') && cellContent !== 'exit') {
        base[y][x] = op.getUID();
      } else {
        base[y][x] = cellContent + '_' + op.getUID();
      }
    }
  });

  return base;
}
