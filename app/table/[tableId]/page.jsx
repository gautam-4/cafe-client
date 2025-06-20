'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import MenuSection from '../../../components/MenuSection';
import CustomizationDrawer from '../../../components/CustomizationDrawer';
import CartSummary from '../../../components/CartSummary';
import CartDrawer from '../../../components/CartDrawer';
import OrderConfirmationDrawer from '../../../components/OrderConfirmationDrawer';

const MENU_DATA = {
  drinks: [
    { id: 1, name: 'Cold Coffee', price: 150, customizable: false },
    { id: 2, name: 'Iced Tea', price:100, customizable: true, options: [
        {id: 'lemon', label: 'Lemon', price: 100},
        {id: 'peach', label: 'Peach', price: 100}
    ]},
  ],
  mains: [
    { id: 3, name: 'Margherita Pizza', price: 250, customizable: true, options: [
      { id: 'small', label: 'Small (8")', price: 250 },
      { id: 'medium', label: 'Medium (12")', price: 300 },
      { id: 'large', label: 'Large (16")', price: 350 }
    ]},
    { id: 4, name: 'Grilled Chicken', price: 250, customizable: false },
    { id: 5, name: 'Pasta', price: 200, customizable: true, options: [
      { id: 'alfredo', label: 'Alfredo', price: 200 },
      { id: 'full', label: 'Full Portion', price: 300 }
    ]}
  ],
  desserts: [
    { id: 6, name: 'Chocolate Cake', price: 150, customizable: true, options: [
      { id: 'slice', label: 'Single Slice', price: 150 },
      { id: 'double', label: 'Double Slice', price: 200 }
    ]},
    { id: 7, name: 'Ice Cream', price: 150, customizable: false }
  ]
};

export default function TablePage() {
  const params = useParams();
  const tableId = params.tableId;
  const [cart, setCart] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [orderConfirmationOpen, setOrderConfirmationOpen] = useState(false);
  const [cartTotals, setCartTotals] = useState({ totalItems: 0, totalPrice: 0 });

  // Calculate cart totals whenever cart changes
  useEffect(() => {
    const allMenuItems = [
      ...MENU_DATA.drinks,
      ...MENU_DATA.mains,
      ...MENU_DATA.desserts
    ];

    const cartEntries = Object.entries(cart);
    const totalItems = cartEntries.reduce((sum, [itemId, cartData]) => sum + cartData.quantity, 0);
    const totalPrice = cartEntries.reduce((sum, [itemId, cartData]) => {
      const menuItem = allMenuItems.find(item => item.id === parseInt(itemId));
      const price = cartData.customization?.price || menuItem?.price || 0;
      return sum + (price * cartData.quantity);
    }, 0);

    setCartTotals({ totalItems, totalPrice });
  }, [cart]);

  const handleAddItem = (item) => {
    if (item.customizable) {
      setSelectedItem(item);
      setDrawerOpen(true);
    } else {
      addToCart(item.id, { price: item.price });
    }
  };

  const handleCustomizationConfirm = (itemId, customization) => {
    addToCart(itemId, customization);
    setDrawerOpen(false);
    setSelectedItem(null);
  };

  const addToCart = (itemId, customization) => {
    setCart(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        quantity: (prev[itemId]?.quantity || 0) + 1,
        customization
      }
    }));
  };

  const updateQuantity = (itemId, change) => {
    setCart(prev => {
      const currentQuantity = prev[itemId]?.quantity || 0;
      const newQuantity = currentQuantity + change;
      
      if (newQuantity <= 0) {
        const { [itemId]: removed, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [itemId]: {
          ...prev[itemId],
          quantity: newQuantity
        }
      };
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => {
      const { [itemId]: removed, ...rest } = prev;
      return rest;
    });
  };

  const handleGoToCart = () => {
    setCartDrawerOpen(true);
  };

  const handleConfirmOrder = () => {
    setCartDrawerOpen(false);
    setOrderConfirmationOpen(true);
  };

  const handleSubmitOrder = async (orderDetails) => {
    // Here you would typically send the order to your backend API
    const orderData = {
      tableId,
      customerInfo: orderDetails,
      items: cart,
      totals: cartTotals,
      timestamp: new Date().toISOString()
    };

    console.log('Submitting order:', orderData);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Clear cart after successful order
    setCart({});
    
    // You could show a success message here
    alert('Order submitted successfully! We\'ll prepare your order shortly.');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="px-4 py-6 text-center flex justify-between" style={{ backgroundColor: 'var(--cozy-lemon)' }}>
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
      />
    </div>
  );
}