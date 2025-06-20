'use client';

export default function QuantityControl({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={onDecrease}
        className="w-8 h-8 rounded-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 font-medium transition-colors"
      >
        −
      </button>
      <span className="font-medium text-gray-800 min-w-[24px] text-center">
        {quantity}
      </span>
      <button
        onClick={onIncrease}
        className="w-8 h-8 rounded-md flex items-center justify-center text-gray-800 font-medium transition-colors hover:opacity-90"
        style={{ backgroundColor: 'var(--cozy-lemon)' }}
      >
        +
      </button>
    </div>
  );
}