// components/Board/CounterControl.tsx

'use client';

import { Button } from '@/components/ui/button';
import { FC } from 'react';

interface CounterControlProps {
  label: string;
  value: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disableDecrease: boolean;
  disableIncrease: boolean;
}

const CounterControl: FC<CounterControlProps> = ({
  label,
  value,
  onIncrease,
  onDecrease,
  disableDecrease,
  disableIncrease,
}) => {
  return (
    <div className="flex items-center justify-between">
      <span className="font-semibold">{label}:</span>
      <div className="flex items-center gap-2">
        <Button
          onClick={onDecrease}
          disabled={disableDecrease}
          size="sm"
          variant="destructive"
        >
          -
        </Button>
        <span className="text-sm">{value}</span>
        <Button
          onClick={onIncrease}
          disabled={disableIncrease}
          size="sm"
          variant="default"
        >
          +
        </Button>
      </div>
    </div>
  );
};

export default CounterControl;
