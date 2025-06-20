'use client';

import QuantityControl from './QuantityControl';

export default function MenuCell({ item, cartItem, onAddItem, onUpdateQuantity }) {
  const quantity = cartItem?.quantity || 0;

  return (
    <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
      <div className="flex-1">
        <h3 className="font-medium text-gray-800">{item.name}</h3>
        <p className="text-sm text-gray-600 mt-1">₹{item.price.toFixed(2)}</p>
        {item.customizable && (
          <span className="inline-block text-xs px-2 py-1 rounded-full mt-2" style={{ 
            backgroundColor: 'var(--cozy-lemon-accent)', 
            color: 'var(--cozy-lemon-dark)' 
          }}>
            Customizable
          </span>
        )}
      </div>
      
      <div className="ml-4">
        {quantity === 0 ? (
          <button
            onClick={() => onAddItem(item)}
            className="text-gray-800 font-medium px-4 py-2 rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--cozy-lemon)' }}
          >
            Add
          </button>
        ) : (
          <QuantityControl
            quantity={quantity}
            onDecrease={() => onUpdateQuantity(item.id, -1)}
            onIncrease={() => onUpdateQuantity(item.id, 1)}
          />
        )}
      </div>
    </div>
  );
}