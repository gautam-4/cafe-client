'use client';

export default function CartSummary({ totalItems, totalPrice, onGoToCart }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-gray-200 z-30" style={{ backgroundColor: 'var(--cozy-lemon-bg)' }}>
      <button
        onClick={onGoToCart}
        className="w-full flex items-center justify-between px-6 py-4 rounded-lg font-medium transition-colors hover:opacity-90"
        style={{ backgroundColor: 'var(--cozy-lemon)' }}
      >
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded-full bg-gray-800 text-white text-sm flex items-center justify-center">
            {totalItems}
          </div>
          <span className="text-gray-800">View Order</span>
        </div>
        <span className="text-gray-800 font-semibold">₹{totalPrice.toFixed(2)}</span>
      </button>
    </div>
  );
}