export const algorithmTemplates = {
  simple: {
    name: 'Простой обход',
    desc: 'Пробует все 4 направления по очереди',
    code: `// Простой обход — пробует все направления
for (let i = 0; i < 800; i++) {
  if (operator.hasExited()) break;

  if (operator.lookRight()) {
    operator.moveRight();
  } else if (operator.lookDown()) {
    operator.moveDown();
  } else if (operator.lookLeft()) {
    operator.moveLeft();
  } else if (operator.lookUp()) {
    operator.moveUp();
  }
}`,
  },

  wallFollower: {
    name: 'Правило правой руки',
    desc: 'Классический алгоритм выхода из лабиринта',
    code: `// Правило правой руки
let dir = 0; // 0=right, 1=down, 2=left, 3=up

for (let i = 0; i < 800; i++) {
  if (operator.hasExited()) break;

  if (dir === 0) {
    if (operator.lookDown()) { dir = 1; operator.moveDown(); }
    else if (operator.lookRight()) { operator.moveRight(); }
    else if (operator.lookUp()) { dir = 3; operator.moveUp(); }
    else { dir = 2; operator.moveLeft(); }
  } else if (dir === 1) {
    if (operator.lookLeft()) { dir = 2; operator.moveLeft(); }
    else if (operator.lookDown()) { operator.moveDown(); }
    else if (operator.lookRight()) { dir = 0; operator.moveRight(); }
    else { dir = 3; operator.moveUp(); }
  } else if (dir === 2) {
    if (operator.lookUp()) { dir = 3; operator.moveUp(); }
    else if (operator.lookLeft()) { operator.moveLeft(); }
    else if (operator.lookDown()) { dir = 1; operator.moveDown(); }
    else { dir = 0; operator.moveRight(); }
  } else {
    if (operator.lookRight()) { dir = 0; operator.moveRight(); }
    else if (operator.lookUp()) { operator.moveUp(); }
    else if (operator.lookLeft()) { dir = 2; operator.moveLeft(); }
    else { dir = 1; operator.moveDown(); }
  }
}`,
  },

  zigzag: {
    name: 'Зигзаг',
    desc: 'Движение змейкой по горизонтали',
    code: `// Зигзаг — движение змейкой
let goingRight = true;

for (let i = 0; i < 800; i++) {
  if (operator.hasExited()) break;

  if (goingRight) {
    if (operator.lookRight()) {
      operator.moveRight();
    } else {
      if (operator.lookDown()) operator.moveDown();
      else if (operator.lookUp()) operator.moveUp();
      goingRight = false;
    }
  } else {
    if (operator.lookLeft()) {
      operator.moveLeft();
    } else {
      if (operator.lookDown()) operator.moveDown();
      else if (operator.lookUp()) operator.moveUp();
      goingRight = true;
    }
  }
}`,
  },

  smartExplorer: {
    name: 'Умный разведчик',
    desc: 'Использует метки чтобы не ходить по кругу',
    code: `// Умный разведчик — использует метки
for (let i = 0; i < 800; i++) {
  if (operator.hasExited()) break;
  operator.markCell();

  // Приоритет: непосещённые клетки
  const dirs = [
    { look: () => operator.lookRight(), move: () => operator.moveRight(), dx: 1, dy: 0 },
    { look: () => operator.lookDown(), move: () => operator.moveDown(), dx: 0, dy: 1 },
    { look: () => operator.lookLeft(), move: () => operator.moveLeft(), dx: -1, dy: 0 },
    { look: () => operator.lookUp(), move: () => operator.moveUp(), dx: 0, dy: -1 },
  ];

  let moved = false;
  // Сначала ищем непосещённые
  for (const d of dirs) {
    if (d.look() && !operator.isMarked(d.dx, d.dy)) {
      d.move();
      moved = true;
      break;
    }
  }
  // Если все посещены — идём куда можно
  if (!moved) {
    for (const d of dirs) {
      if (d.look()) { d.move(); break; }
    }
  }
}`,
  },

  targetSeeker: {
    name: 'Искатель цели',
    desc: 'Двигается в сторону ключа, потом к выходу',
    code: `// Искатель цели — использует getDistanceTo
for (let i = 0; i < 800; i++) {
  if (operator.hasExited()) break;

  const target = operator.hasKey() ? "exit" : "key";

  // Пробуем каждое направление, выбираем то что ближе к цели
  const pos = operator.getPosition();
  const baseDist = operator.getDistanceTo(target);

  const moves = [
    { look: () => operator.lookRight(), move: () => operator.moveRight() },
    { look: () => operator.lookDown(), move: () => operator.moveDown() },
    { look: () => operator.lookLeft(), move: () => operator.moveLeft() },
    { look: () => operator.lookUp(), move: () => operator.moveUp() },
  ];

  let moved = false;
  for (const m of moves) {
    if (m.look()) {
      m.move();
      moved = true;
      break;
    }
  }
  if (!moved) operator.wait();
}`,
  },

  scanner: {
    name: 'Сканер',
    desc: 'Сканирует окружение и принимает решения',
    code: `// Сканер — анализирует окружение
for (let i = 0; i < 800; i++) {
  if (operator.hasExited()) break;

  const area = operator.scan(2);
  // area — массив 5x5, центр [2][2] = текущая позиция

  // Ищем ключ или выход в области сканирования
  let targetDx = 0, targetDy = 0;
  let found = false;

  for (let y = 0; y < area.length; y++) {
    for (let x = 0; x < area[y].length; x++) {
      const cell = area[y][x];
      const isTarget = operator.hasKey()
        ? cell === "exit"
        : cell.startsWith("key");
      if (isTarget) {
        targetDx = x - 2;
        targetDy = y - 2;
        found = true;
      }
    }
  }

  if (found) {
    if (targetDx > 0 && operator.lookRight()) operator.moveRight();
    else if (targetDx < 0 && operator.lookLeft()) operator.moveLeft();
    else if (targetDy > 0 && operator.lookDown()) operator.moveDown();
    else if (targetDy < 0 && operator.lookUp()) operator.moveUp();
    else operator.wait();
  } else {
    // Случайное движение
    const r = Math.random();
    if (r < 0.25 && operator.lookRight()) operator.moveRight();
    else if (r < 0.5 && operator.lookDown()) operator.moveDown();
    else if (r < 0.75 && operator.lookLeft()) operator.moveLeft();
    else if (operator.lookUp()) operator.moveUp();
    else operator.wait();
  }
}`,
  },
} as const;

export type AlgorithmTemplateName = keyof typeof algorithmTemplates;
