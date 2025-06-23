'use client';

import { useState, useEffect } from 'react';
import CartItem from './CartItem';

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  cart, 
  menuData, 
  onUpdateQuantity, 
  onRemoveItem, 
  onConfirmOrder 
}) {
  const [cartItems, setCartItems] = useState([]);
  const [totals, setTotals] = useState({ totalItems: 0, totalPrice: 0 });

  // Convert cart object to array of items with full details
  useEffect(() => {
    if (!menuData || !menuData.drinks || !menuData.mains || !menuData.desserts) {
      setCartItems([]);
      setTotals({ totalItems: 0, totalPrice: 0 });
      return;
    }

    const allMenuItems = [
      ...menuData.drinks,
      ...menuData.mains,
      ...menuData.desserts
    ];

    const items = [];
    
    Object.entries(cart).forEach(([itemId, variations]) => {
      const menuItem = allMenuItems.find(item => item.id === parseInt(itemId));
      
      if (menuItem) {
        variations.forEach((variation, variationIndex) => {
          items.push({
            ...menuItem,
            quantity: variation.quantity,
            customization: variation.customization,
            variationIndex: variationIndex,
            itemId: parseInt(itemId)
          });
        });
      }
    });

    setCartItems(items);

    // Calculate totals
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => {
      const price = item.customization?.price || item.price;
      return sum + (price * item.quantity);
    }, 0);

    setTotals({ totalItems, totalPrice });
  }, [cart, menuData]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirmOrder = () => {
    if (cartItems.length === 0) {
      return;
    }

    // Simply call the onConfirmOrder callback - no need to pass data
    // The parent component already has access to the cart state
    onConfirmOrder();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-full max-w-md h-full flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Your Order</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6.5-5L21 21" />
              </svg>
              <p className="text-lg">Your cart is empty</p>
              <p className="text-sm mt-2">Add some delicious items to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <CartItem
                  key={`${item.itemId}-${item.variationIndex}`}
                  item={item}
                  onUpdateQuantity={(change) => onUpdateQuantity(item.itemId, change, item.variationIndex)}
                  onRemove={() => onRemoveItem(item.itemId, item.variationIndex)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer with totals and confirm button */}
        {cartItems.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4 bg-white">
            {/* <div className="space-y-2">
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Items ({totals.totalItems})</span>
                <span>₹{totals.totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center font-semibold text-lg text-gray-800 pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>₹{totals.totalPrice.toFixed(2)}</span>
              </div>
            </div> */}
            <button
              onClick={handleConfirmOrder}
              className="w-full py-3 px-4 rounded-lg font-medium text-gray-800 transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              style={{ backgroundColor: 'var(--cozy-lemon)' }}
            >
              Proceed 
              {/* ({totals.totalItems} {totals.totalItems === 1 ? 'item' : 'items'}) */}
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}