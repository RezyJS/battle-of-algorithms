'use client';

import { Field } from '@/components/Field/Field';
import { useFieldContext } from '@/components/Field/FieldContext';

export default function Home() {
  const { field } = useFieldContext();

  return (
    <div className='w-full h-full flex items-center justify-center bg-[#0d0d0d]'>
      <Field
        field={field}
        players={[
          { number: 'first', coords: { x: 1, y: 2 } },
          { number: 'second', coords: { x: 3, y: 2 } },
        ]}
      />
    </div>
  );
}
