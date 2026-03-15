import { DirectionX, DirectionY } from '@/src/shared/model';

export class Point {
  #x: number;
  #y: number;

  constructor(x = 0, y = 0) {
    this.#x = x;
    this.#y = y;
  }

  getX() {
    return this.#x;
  }

  getY() {
    return this.#y;
  }

  changeX(direction = DirectionX.STAY) {
    this.#x += direction;
  }

  changeY(direction = DirectionY.STAY) {
    this.#y += direction;
  }

  clone() {
    return new Point(this.#x, this.#y);
  }
}
