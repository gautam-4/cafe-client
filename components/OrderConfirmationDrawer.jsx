'use client';

import { useState } from 'react';

export default function OrderConfirmationDrawer({
  isOpen,
  onClose,
  onSubmitOrder,
  tableId,
  totalPrice,
  totalItems,
  isSubmitting = false
}) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    countryCode: '+91',
    tableNumber: tableId || '',
    specialInstructions: ''
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.tableNumber.trim()) {
      newErrors.tableNumber = 'Table number is required';
    }

    if (formData.phone) {
      const phoneNumbers = formData.phone.replace(/\D/g, '');
      if (phoneNumbers.length > 0 && phoneNumbers.length < 10) {
        newErrors.phone = 'Please enter a valid phone number (at least 10 digits)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const fullPhoneNumber = formData.phone
      ? `${formData.countryCode}${formData.phone.replace(/\D/g, '')}`
      : '';

    const customerDetails = {
      ...formData,
      fullPhoneNumber
    };

    await onSubmitOrder(customerDetails);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">Order Details</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter your name"
              disabled={isSubmitting}
              maxLength={50}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Phone with Country Code Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="flex space-x-2">
              <select
                value={formData.countryCode}
                onChange={(e) => handleInputChange('countryCode', e.target.value)}
                className="px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 bg-white text-sm"
                disabled={isSubmitting}
              >
                <option value="+91">🇮🇳 +91</option>
                <option value="+1">🇺🇸 +1</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+61">🇦🇺 +61</option>
                <option value="+81">🇯🇵 +81</option>
                <option value="+971">🇦🇪 +971</option>
              </select>

              <input
                type="tel"
                inputMode="numeric"
                pattern="\d*"
                value={formData.phone}
                onChange={(e) =>
                  handleInputChange('phone', e.target.value.replace(/\D/g, ''))
                }
                className={`flex-1 min-w-0 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Phone number"
                disabled={isSubmitting}
                maxLength={15}
              />
            </div>
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
          </div>

          {/* Table Number Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Table Number *
            </label>
            <input
              type="text"
              value={formData.tableNumber}
              onChange={(e) => handleInputChange('tableNumber', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 ${
                errors.tableNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Table number"
              disabled={isSubmitting}
              maxLength={10}
            />
            {errors.tableNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.tableNumber}</p>
            )}
          </div>

          {/* Special Instructions Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              value={formData.specialInstructions}
              onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
              rows="3"
              placeholder="Any special requests or dietary requirements..."
              disabled={isSubmitting}
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.specialInstructions.length}/200 characters
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <h3 className="font-medium text-gray-800 mb-2">Order Summary</h3>
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Items:</span>
                <span className="text-gray-800">{totalItems}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="font-medium text-gray-800">Total Amount:</span>
                <span className="text-lg font-bold text-gray-800">
                  ₹{totalPrice?.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 rounded-lg font-medium text-gray-800 transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-6 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            style={{ backgroundColor: 'var(--cozy-lemon)' }}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting Order...
              </div>
            ) : (
              'Submit Order'
            )}
          </button>
        </form>

        <style jsx>{`
          @keyframes fade-in {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fade-in {
            animation: fade-in 0.2s ease-out;
          }
        `}</style>
      </div>
    </div>
  );
}
