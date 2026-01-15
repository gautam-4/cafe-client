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
import { fetchMenu, getAllMenuItems } from '../../../lib/menuService';

// Custom hook for persistent cart state
function usePersistedCart(tableId) {
  const [cart, setCart] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  const storageKey = `cafe-cart-table-${tableId}`;

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        if (typeof parsedCart === 'object' && parsedCart !== null) {
          setCart(parsedCart);
        }
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      localStorage.removeItem(storageKey);
    } finally {
      setIsLoaded(true);
    }
  }, [storageKey]);

  useEffect(() => {
    if (isLoaded) {
      try {
        if (Object.keys(cart).length === 0) {
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
  
  // Menu state
  const [menuData, setMenuData] = useState(null);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [menuError, setMenuError] = useState(null);
  
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

  // Fetch menu from Firestore
  useEffect(() => {
    async function loadMenu() {
      try {
        setIsMenuLoading(true);
        const menu = await fetchMenu();
        setMenuData(menu);
        setMenuError(null);
      } catch (error) {
        console.error('Failed to load menu:', error);
        setMenuError('Failed to load menu. Please refresh the page.');
      } finally {
        setIsMenuLoading(false);
      }
    }

    loadMenu();
  }, []);

  // Calculate cart totals
  useEffect(() => {
    if (!isCartLoaded || !menuData) return;
    
    const allMenuItems = getAllMenuItems(menuData);

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
  }, [cart, isCartLoaded, menuData]);

  const handleAddItem = (item) => {
    if (item.customizable) {
      setSelectedItem(item);
      setIsIncreasing(false);
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
      
      const existingVariationIndex = existingVariations.findIndex(variation => 
        JSON.stringify(variation.customization) === JSON.stringify(customization)
      );

      if (existingVariationIndex >= 0) {
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
    if (!menuData) return;
    
    const allMenuItems = getAllMenuItems(menuData);
    const menuItem = allMenuItems.find(item => item.id === parseInt(itemId));
    
    if (menuItem?.customizable && change > 0) {
      setSelectedItem(menuItem);
      setIsIncreasing(true);
      setDrawerOpen(true);
      return;
    }

    setCart(prev => {
      const variations = prev[itemId] || [];
      
      if (variationIndex !== null) {
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

  const handleConfirmOrder = () => {
    setCartDrawerOpen(false);
    setOrderConfirmationOpen(true);
  };

  const handleSubmitOrder = async (customerDetails) => {
    if (isSubmittingOrder) return;
    
    setIsSubmittingOrder(true);
    
    try {
      const orderData = formatOrderForFirebase(cart, customerDetails, menuData);
      
      const validation = validateOrderData(orderData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const orderId = await createOrder(orderData);
      
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
      
      setOrderConfirmationOpen(false);
      setOrderSuccessOpen(true);
      
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

  // Loading state
  if (isMenuLoading || !isCartLoaded) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (menuError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-4">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-800 font-medium mb-2">{menuError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  // Empty menu state
  if (!menuData || Object.keys(menuData).length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center p-4">
          <p className="text-gray-600">No menu items available at the moment.</p>
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
        {Object.entries(menuData).map(([categoryId, category]) => (
          <MenuSection
            key={categoryId}
            title={category.name}
            items={category.items}
            cart={cart}
            onAddItem={handleAddItem}
            onUpdateQuantity={updateQuantity}
          />
        ))}
      </div>

      {/* Cart Summary */}
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
        menuData={menuData}
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