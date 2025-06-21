'use client';

import { useEffect } from 'react';

export default function OrderSuccessModal({ isOpen, onClose, orderDetails }) {
    // useEffect(() => {
    //     if (isOpen) {
    //         // Auto close after 8 seconds (give more time to read)
    //         const timer = setTimeout(() => {
    //             onClose();
    //         }, 8000);

    //         return () => clearTimeout(timer);
    //     }
    // }, [isOpen, onClose]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    if (!isOpen || !orderDetails) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-white rounded-lg w-full max-w-md animate-bounce-in">
                <div className="text-center p-8">
                    {/* Success Icon */}
                    <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    {/* Success Message */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        Order Placed Successfully!
                    </h3>
                    <p className="text-gray-600 mb-6">
                        Thank you for your order. We'll start preparing it right away.
                    </p>

                    {/* Order Details */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Order Number:</span>
                                <span className="font-mono font-medium text-blue-600">
                                    {orderDetails.orderNumber}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Customer:</span>
                                <span className="font-medium">{orderDetails.customerName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Table:</span>
                                <span className="font-medium">{orderDetails.tableNumber}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Items:</span>
                                <span className="font-medium">{orderDetails.totalItems}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-2">
                                <span className="text-gray-600">Total:</span>
                                <span className="font-bold text-lg">₹{orderDetails.totalPrice?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Estimated Time:</span>
                                <span className="font-medium text-green-600">{orderDetails.estimatedTime} mins</span>
                            </div>
                        </div>
                    </div>

                    {/* Additional Info
                    <div className="bg-blue-50 rounded-lg p-3 mb-6">
                        <p className="text-sm text-blue-800">
                            <strong>What's next?</strong> Your order has been sent to the kitchen. 
                            Please keep your order number handy for reference.
                        </p>
                    </div> */}

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="w-full py-3 px-4 rounded-lg font-medium text-gray-800 transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
                        style={{ backgroundColor: 'var(--cozy-lemon)' }}
                    >
                        Continue Browsing
                    </button>

                    {/* Auto close notice */}
                    {/* <p className="text-xs text-gray-500 mt-3">
                        This window will close automatically in 8 seconds
                    </p> */}
                </div>

                <style jsx>{`
          @keyframes bounce-in {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              opacity: 1;
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-bounce-in {
            animation: bounce-in 0.6s ease-out;
          }
        `}</style>
            </div>
        </div>
    );
}