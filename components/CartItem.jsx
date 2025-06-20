// components/CartItem.jsx
'use client';

import QuantityControl from './QuantityControl';

export default function CartItem({ item, onUpdateQuantity, onRemove }) {
  const price = item.customization?.price || item.price;

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="font-medium text-gray-800">{item.name}</h3>
          {item.customization?.label && (
            <p className="text-sm text-gray-600 mt-1">{item.customization.label}</p>
          )}
          <p className="text-sm text-gray-600">₹{price.toFixed(2)} each</p>
        </div>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 text-sm ml-4"
        >
          Remove
        </button>
      </div>
      
      <div className="flex justify-between items-center">
        <QuantityControl
          quantity={item.quantity}
          onDecrease={() => onUpdateQuantity(-1)}
          onIncrease={() => onUpdateQuantity(1)}
        />
        <span className="font-semibold text-gray-800">
          ₹{(price * item.quantity).toFixed(2)}
        </span>
      </div>
    </div>
  );
}