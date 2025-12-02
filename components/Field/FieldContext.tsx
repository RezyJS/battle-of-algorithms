'use client';

import { createContext, PropsWithChildren, useContext, useState } from 'react';
import { TField } from '@/utils/types';
import { testField } from '@/utils/consts';

interface IFieldContext {
  field: TField;
  setField: (field: TField) => void;
}

const FieldContext = createContext<IFieldContext | undefined>(undefined);

export const FieldContextProvider = (props: PropsWithChildren) => {
  const [field, setField] = useState<TField>(testField);
  const { children } = props;

  const value = { field, setField };

  return (
    <FieldContext.Provider value={value}>{children}</FieldContext.Provider>
  );
};

export const useFieldContext = () => {
  const fieldContext = useContext(FieldContext);

  if (fieldContext === undefined) {
    throw new Error(
      "You should use this function inside FieldContextProvider component and it's children!"
    );
  }

  return fieldContext;
};
