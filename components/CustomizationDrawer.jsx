'use client';

import { useState, useEffect } from 'react';

export default function CustomizationDrawer({ isOpen, item, onClose, onConfirm }) {
  const [selectedOption, setSelectedOption] = useState(null);

  useEffect(() => {
    if (isOpen && item?.options?.length > 0) {
      setSelectedOption(item.options[0].id);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const handleConfirm = () => {
    const selectedCustomization = item.options.find(opt => opt.id === selectedOption);
    onConfirm(item.id, {
      option: selectedOption,
      label: selectedCustomization.label,
      price: selectedCustomization.price
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 p-6 transform transition-transform duration-300">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.name}</h3>
        <p className="text-sm text-gray-600 mb-6">Choose your option:</p>
        
        <div className="space-y-3 mb-6">
          {item.options?.map(option => (
            <label
              key={option.id}
              className="flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors"
              style={{
                borderColor: selectedOption === option.id ? 'var(--cozy-lemon)' : '#E5E7EB',
                backgroundColor: selectedOption === option.id ? 'var(--cozy-lemon-bg)' : 'transparent'
              }}
            >
              <input
                type="radio"
                name="customization"
                value={option.id}
                checked={selectedOption === option.id}
                onChange={(e) => setSelectedOption(e.target.value)}
                className="w-4 h-4"
                style={{ accentColor: 'var(--cozy-lime)' }}
              />
              <div className="flex-1">
                <span className="font-medium text-gray-800">{option.label}</span>
                <span className="block text-sm text-gray-600">₹{option.price.toFixed(2)}</span>
              </div>
            </label>
          ))}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-3 text-gray-800 rounded-lg font-medium transition-colors hover:opacity-90"
            style={{ backgroundColor: 'var(--cozy-lemon)' }}
          >
            Add to Order
          </button>
        </div>
      </div>
    </>
  );
}