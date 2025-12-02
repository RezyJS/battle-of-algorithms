'use client';

import { Field } from '@/components/Field/Field';
import { useFieldContext } from '@/components/Field/FieldContext';
import { Menu } from '@/components/Menu/Menu';

export default function Home() {
  const { field } = useFieldContext();

  return (
    <div className='w-full h-full flex bg-background'>
      <div className='w-1/3 h-full flex flex-col justify-center items-center'>
        <Menu />
      </div>
      <div className='absolute w-0.5 h-[90%] bottom-1/2 left-1/3 translate-y-1/2 bg-foreground rounded-3xl' />
      <div className='w-2/3 h-full flex flex-col justify-center items-center'>
        <Field
          field={field}
          players={[
            { number: 'first', coords: { x: 1, y: 1 } },
            { number: 'second', coords: { x: 12, y: 1 } },
          ]}
        />
      </div>
    </div>
  );
}
