'use client';

import QuantityControl from './QuantityControl';

export default function MenuCell({ item, cartItem, onAddItem, onUpdateQuantity }) {
  // Calculate total quantity across all variations
  const totalQuantity = cartItem ? cartItem.reduce((sum, variation) => sum + variation.quantity, 0) : 0;
  const isVeg = item.isVeg !== false;

  return (
    <div className="border-b border-gray-200 py-5">
      <div className="flex justify-between items-center">
        {/* Left Section */}
        <div className="flex-1 pr-4">
          {/* Veg / Non-Veg symbol */}
          <div className="w-4 h-4 border rounded-sm mb-1 flex items-center justify-center"
               style={{
                 borderColor: isVeg ? '#2e7d32' : '#b71c1c',
                 opacity: 0.5
               }}>
            <div className="w-2 h-2 rounded-full"
                 style={{ backgroundColor: isVeg ? '#2e7d32' : '#b71c1c' }}></div>
          </div>

          {/* Item Name */}
          <h3 className="text-base font-semibold text-gray-900">{item.name}</h3>

          {/* Price */}
          <p className="text-sm text-gray-800 font-medium mt-0.5">₹{item.price}</p>

          {/* Description */}
          {item.description && (
            <p className="text-sm text-gray-500 mt-0.5 leading-snug">
              {item.description}
            </p>
          )}
        </div>

        {/* Right Section */}
        <div className="flex flex-col items-end justify-center min-w-[90px]">
          {totalQuantity === 0 ? (
            <button
              onClick={() => onAddItem(item)}
              className="text-sm font-medium px-4 py-1.5 rounded-md border border-gray-300 text-gray-800 hover:bg-gray-50 transition"
            >
              ADD
            </button>
          ) : (
            <QuantityControl
              quantity={totalQuantity}
              onDecrease={() => onUpdateQuantity(item.id, -1)}
              onIncrease={() => onUpdateQuantity(item.id, 1)}
            />
          )}

          {item.customizable && (
            <p className="text-xs text-gray-500 mt-1">customizable</p>
          )}
        </div>
      </div>
    </div>
  );
}