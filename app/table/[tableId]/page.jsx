'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import MenuSection from '../../../components/MenuSection';
import CustomizationDrawer from '../../../components/CustomizationDrawer';
import CartSummary from '../../../components/CartSummary';
import CartDrawer from '../../../components/CartDrawer';
import OrderConfirmationDrawer from '../../../components/OrderConfirmationDrawer';
import OrderSuccessModal from '../../../components/OrderSuccessModal';
import { createOrder, formatOrderForFirebase, validateOrderData } from '../../../lib/orderService';

const MENU_DATA = {
  drinks: [
    { id: 1, name: 'Cold Coffee', price: 150, customizable: false, category: 'drinks' },
    { id: 2, name: 'Iced Tea', price:100, customizable: true, category: 'drinks', options: [
        {id: 'lemon', label: 'Lemon', price: 100},
        {id: 'peach', label: 'Peach', price: 100}
    ]},
  ],
  mains: [
    { id: 3, name: 'Peppy Paneer Pizza', price: 250, customizable: true, category: 'mains', options: [
      { id: 'small', label: 'Small (8")', price: 250 },
      { id: 'medium', label: 'Medium (12")', price: 300 },
      { id: 'large', label: 'Large (16")', price: 350 }
    ], description: 'cheese, paneer, paprika'},
    { id: 4, name: 'Grilled Chicken', price: 250, customizable: false, isVeg: false, category: 'mains' },
    { id: 5, name: 'Pasta', price: 200, customizable: true, category: 'mains', options: [
      { id: 'alfredo', label: 'Alfredo', price: 200 },
      { id: 'full', label: 'Full Portion', price: 300 }
    ]}
  ],
  desserts: [
    { id: 6, name: 'Chocolate Cake', price: 150, customizable: true, category: 'desserts', options: [
      { id: 'slice', label: 'Single Slice', price: 150 },
      { id: 'double', label: 'Double Slice', price: 200 }
    ]},
    { id: 7, name: 'Ice Cream', price: 150, customizable: false, category: 'desserts' }
  ]
};

// Custom hook for persistent cart state
function usePersistedCart(tableId) {
  const [cart, setCart] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  // Generate unique storage key for each table
  const storageKey = `cafe-cart-table-${tableId}`;

  // Load cart from localStorage on component mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        // Validate the cart data structure
        if (typeof parsedCart === 'object' && parsedCart !== null) {
          setCart(parsedCart);
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem(storageKey);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      try {
        if (Object.keys(cart).length === 0) {
          // Remove from localStorage if cart is empty
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(cart));
        }
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    }
  }, [cart, storageKey, isLoaded]);

  const updateCart = (newCart) => {
    setCart(newCart);
  };

  const clearCart = () => {
    setCart({});
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error clearing cart from localStorage:', error);
    }
  };

  return [cart, updateCart, clearCart, isLoaded];
}

export default function TablePage() {
  const params = useParams();
  const tableId = params.tableId;
  
  // Use the custom hook for persistent cart
  const [cart, setCart, clearCart, isCartLoaded] = usePersistedCart(tableId);
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [orderConfirmationOpen, setOrderConfirmationOpen] = useState(false);
  const [orderSuccessOpen, setOrderSuccessOpen] = useState(false);
  const [cartTotals, setCartTotals] = useState({ totalItems: 0, totalPrice: 0 });
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Calculate cart totals whenever cart changes
  useEffect(() => {
    if (!isCartLoaded) return; // Don't calculate until cart is loaded
    
    const allMenuItems = [
      ...MENU_DATA.drinks,
      ...MENU_DATA.mains,
      ...MENU_DATA.desserts
    ];

    // Cart is now an array of items with different customizations
    const cartEntries = Object.entries(cart);
    const totalItems = cartEntries.reduce((sum, [itemId, variations]) => {
      return sum + variations.reduce((varSum, variation) => varSum + variation.quantity, 0);
    }, 0);
    
    const totalPrice = cartEntries.reduce((sum, [itemId, variations]) => {
      const menuItem = allMenuItems.find(item => item.id === parseInt(itemId));
      return sum + variations.reduce((varSum, variation) => {
        const price = variation.customization?.price || menuItem?.price || 0;
        return varSum + (price * variation.quantity);
      }, 0);
    }, 0);

    setCartTotals({ totalItems, totalPrice });
  }, [cart, isCartLoaded]);

  const handleAddItem = (item) => {
    if (item.customizable) {
      setSelectedItem(item);
      setIsIncreasing(false); // This is a new addition
      setDrawerOpen(true);
    } else {
      addToCart(item.id, { price: item.price });
    }
  };

  const handleCustomizationConfirm = (itemId, customization) => {
    addToCart(itemId, customization);
    setDrawerOpen(false);
    setSelectedItem(null);
    setIsIncreasing(false);
  };

  const addToCart = (itemId, customization) => {
    setCart(prev => {
      const existingVariations = prev[itemId] || [];
      
      // Find if this customization already exists
      const existingVariationIndex = existingVariations.findIndex(variation => 
        JSON.stringify(variation.customization) === JSON.stringify(customization)
      );

      if (existingVariationIndex >= 0) {
        // Update existing variation
        const updatedVariations = [...existingVariations];
        updatedVariations[existingVariationIndex] = {
          ...updatedVariations[existingVariationIndex],
          quantity: updatedVariations[existingVariationIndex].quantity + 1
        };
        
        return {
          ...prev,
          [itemId]: updatedVariations
        };
      } else {
        // Add new variation
        return {
          ...prev,
          [itemId]: [
            ...existingVariations,
            {
              quantity: 1,
              customization
            }
          ]
        };
      }
    });
  };

  const updateQuantity = (itemId, change, variationIndex = null) => {
    const allMenuItems = [
      ...MENU_DATA.drinks,
      ...MENU_DATA.mains,
      ...MENU_DATA.desserts
    ];
    
    const menuItem = allMenuItems.find(item => item.id === parseInt(itemId));
    
    // If it's customizable and we're increasing, show customization drawer
    if (menuItem?.customizable && change > 0) {
      setSelectedItem(menuItem);
      setIsIncreasing(true);
      setDrawerOpen(true);
      return;
    }

    setCart(prev => {
      const variations = prev[itemId] || [];
      
      if (variationIndex !== null) {
        // Update specific variation
        const updatedVariations = [...variations];
        const newQuantity = updatedVariations[variationIndex].quantity + change;
        
        if (newQuantity <= 0) {
          updatedVariations.splice(variationIndex, 1);
        } else {
          updatedVariations[variationIndex] = {
            ...updatedVariations[variationIndex],
            quantity: newQuantity
          };
        }
        
        if (updatedVariations.length === 0) {
          const { [itemId]: removed, ...rest } = prev;
          return rest;
        }
        
        return {
          ...prev,
          [itemId]: updatedVariations
        };
      } else {
        // For non-customizable items or decreasing
        if (variations.length > 0) {
          const updatedVariations = [...variations];
          const newQuantity = updatedVariations[0].quantity + change;
          
          if (newQuantity <= 0) {
            const { [itemId]: removed, ...rest } = prev;
            return rest;
          }
          
          updatedVariations[0] = {
            ...updatedVariations[0],
            quantity: newQuantity
          };
          
          return {
            ...prev,
            [itemId]: updatedVariations
          };
        }
        
        return prev;
      }
    });
  };

  const removeFromCart = (itemId, variationIndex = null) => {
    setCart(prev => {
      if (variationIndex !== null) {
        const variations = prev[itemId] || [];
        const updatedVariations = [...variations];
        updatedVariations.splice(variationIndex, 1);
        
        if (updatedVariations.length === 0) {
          const { [itemId]: removed, ...rest } = prev;
          return rest;
        }
        
        return {
          ...prev,
          [itemId]: updatedVariations
        };
      } else {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      }
    });
  };

  const handleGoToCart = () => {
    setCartDrawerOpen(true);
  };

  // Updated to properly handle the cart data and open order confirmation
  const handleConfirmOrder = () => {
    setCartDrawerOpen(false);
    setOrderConfirmationOpen(true);
  };

  // Updated to handle the actual order submission
  const handleSubmitOrder = async (customerDetails) => {
    if (isSubmittingOrder) return; // Prevent double submission
    
    setIsSubmittingOrder(true);
    
    try {
      // Format order data for Firebase
      const orderData = formatOrderForFirebase(cart, customerDetails, MENU_DATA);
      
      // Validate order data
      const validation = validateOrderData(orderData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Submit order to Firebase
      const orderId = await createOrder(orderData);
      
      // Prepare success modal data
      const successData = {
        orderId,
        orderNumber: orderData.orderNumber,
        customerName: orderData.customer.name,
        tableNumber: orderData.tableNumber,
        totalItems: orderData.totalItems,
        totalPrice: orderData.totalPrice,
        estimatedTime: orderData.estimatedTime
      };
      
      setOrderDetails(successData);
      
      // Close confirmation drawer and show success modal
      setOrderConfirmationOpen(false);
      setOrderSuccessOpen(true);
      
      // Clear cart after successful order
      clearCart();
      
    } catch (error) {
      console.error('Error submitting order:', error);
      alert(`There was an error submitting your order: ${error.message}. Please try again.`);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleSuccessModalClose = () => {
    setOrderSuccessOpen(false);
    setOrderDetails(null);
  };

  // Show loading state until cart is loaded
  if (!isCartLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-4 py-5 text-center flex justify-between" style={{ backgroundColor: 'var(--cozy-lemon)' }}>
        <h1 className="text-2xl font-bold text-gray-800">Menu</h1>
        <p className="text-gray-700 mt-1">Table {tableId}</p>
      </div>

      {/* Menu Sections */}
      <div className="px-4 py-6 space-y-8" style={{ paddingBottom: cartTotals.totalItems > 0 ? '100px' : '24px' }}>
        <MenuSection
          title="Drinks"
          items={MENU_DATA.drinks}
          cart={cart}
          onAddItem={handleAddItem}
          onUpdateQuantity={updateQuantity}
        />
        
        <MenuSection
          title="Main Courses"
          items={MENU_DATA.mains}
          cart={cart}
          onAddItem={handleAddItem}
          onUpdateQuantity={updateQuantity}
        />
        
        <MenuSection
          title="Desserts"
          items={MENU_DATA.desserts}
          cart={cart}
          onAddItem={handleAddItem}
          onUpdateQuantity={updateQuantity}
        />
      </div>

      {/* Cart Summary - Only show when there are items in cart */}
      {cartTotals.totalItems > 0 && (
        <CartSummary
          totalItems={cartTotals.totalItems}
          totalPrice={cartTotals.totalPrice}
          onGoToCart={handleGoToCart}
        />
      )}

      {/* Customization Drawer */}
      <CustomizationDrawer
        isOpen={drawerOpen}
        item={selectedItem}
        onClose={() => {
          setDrawerOpen(false);
          setSelectedItem(null);
          setIsIncreasing(false);
        }}
        onConfirm={handleCustomizationConfirm}
      />

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cart={cart}
        menuData={MENU_DATA}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onConfirmOrder={handleConfirmOrder}
      />

      {/* Order Confirmation Drawer */}
      <OrderConfirmationDrawer
        isOpen={orderConfirmationOpen}
        onClose={() => setOrderConfirmationOpen(false)}
        onSubmitOrder={handleSubmitOrder}
        tableId={tableId}
        totalPrice={cartTotals.totalPrice}
        totalItems={cartTotals.totalItems}
        isSubmitting={isSubmittingOrder}
      />

      {/* Order Success Modal */}
      <OrderSuccessModal
        isOpen={orderSuccessOpen}
        onClose={handleSuccessModalClose}
        orderDetails={orderDetails}
      />
    </div>
  );
}