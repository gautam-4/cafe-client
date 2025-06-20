'use client';

export default function QuantityControl({ quantity, onDecrease, onIncrease }) {
  return (
    <div className="inline-flex items-center rounded-md border border-gray-300 overflow-hidden">
      <button
        onClick={onDecrease}
        className="px-2.5 py-1 text-sm font-bold text-gray-700 hover:bg-gray-100"
      >
        −
      </button>

      <span className="px-2.5 py-1 text-sm font-medium text-gray-800">
        {quantity}
      </span>

      <button
        onClick={onIncrease}
        className="px-2.5 py-1 text-sm font-bold text-gray-800 hover:bg-yellow-100"
        style={{ backgroundColor: 'var(--cozy-lemon)', color: '#333' }}
      >
        +
      </button>
    </div>
  );
}
