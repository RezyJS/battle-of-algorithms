import { BadgeInfo } from 'lucide-react';
import Link from 'next/link';

export default function NoBattle() {
  return (
    <div className='w-full h-full flex justify-center items-center'>
      <div className='w-2/3 h-2/3 bg-background px-16 py-8 flex flex-col items-center justify-center rounded-lg gap-4'>
        <BadgeInfo className='w-24 h-24 bg-indigo-600 text-white p-4 rounded-lg' />
        <div className='flex flex-col leading-tight font-semibold text-xl items-center'>
          <p>В данный момент соревнование не проходит.</p>
          <p>Возвращайтесь позже.</p>
        </div>
        <div className='flex flex-col leading-tight font-semibold text-xl items-center'>
          <div className='flex gap-1.5'>
            <p>А пока вы можете написать свой алгоритм в</p>
            <Link
              className='underline text-indigo-600 hover:text-black decoration-indigo-600'
              href='/editor'
            >
              Редакторе
            </Link>
          </div>
          <div className='flex gap-1.5'>
            <p>Или сразиться в</p>
            <Link
              className='underline text-indigo-600 hover:text-black decoration-indigo-600'
              href='/private-battles'
            >
              Приватных боях
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
