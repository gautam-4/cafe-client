import { 
  collection, 
  addDoc, 
  updateDoc,
  doc,
  getDocs, 
  query, 
  orderBy, 
  where,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

// Order status constants
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  CANCELLED: 'cancelled'
};

// Create a new order
export const createOrder = async (orderData) => {
  try {
    const order = {
      ...orderData,
      status: ORDER_STATUS.PENDING,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      orderNumber: generateOrderNumber()
    };

    const docRef = await addDoc(collection(db, 'orders'), order);
    
    return {
      id: docRef.id,
      ...order
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw new Error('Failed to create order. Please try again.');
  }
};

// Update order status
export const updateOrderStatus = async (orderId, status, notes = '') => {
  try {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: Timestamp.now(),
      ...(notes && { statusNotes: notes })
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status.');
  }
};

// Get all orders (for admin)
export const getAllOrders = async (filters = {}) => {
  try {
    let q = collection(db, 'orders');
    
    // Apply filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    if (filters.tableId) {
      q = query(q, where('tableId', '==', filters.tableId));
    }
    
    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      q = query(q, 
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<=', Timestamp.fromDate(endOfDay))
      );
    }
    
    // Order by creation time (newest first)
    q = query(q, orderBy('createdAt', 'desc'));
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      });
    });
    
    return orders;
  } catch (error) {
    console.error('Error fetching orders:', error);
    throw new Error('Failed to fetch orders.');
  }
};

// Get orders for a specific table
export const getTableOrders = async (tableId) => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('tableId', '==', tableId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate()
      });
    });
    
    return orders;
  } catch (error) {
    console.error('Error fetching table orders:', error);
    throw new Error('Failed to fetch table orders.');
  }
};

// Real-time listener for orders (for admin dashboard)
export const subscribeToOrders = (callback, filters = {}) => {
  try {
    let q = collection(db, 'orders');
    
    // Apply filters
    if (filters.status) {
      q = query(q, where('status', '==', filters.status));
    }
    
    // Order by creation time (newest first)
    q = query(q, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const orders = [];
      querySnapshot.forEach((doc) => {
        orders.push({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
          updatedAt: doc.data().updatedAt.toDate()
        });
      });
      callback(orders);
    });
    
    return unsubscribe;
  } catch (error) {
    console.error('Error subscribing to orders:', error);
    throw new Error('Failed to subscribe to orders.');
  }
};

// Generate order number
const generateOrderNumber = () => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const timeStr = now.getTime().toString().slice(-4);
  return `ORD-${dateStr}-${timeStr}`;
};

// Helper function to format order items for storage
export const formatOrderItems = (cart, menuData) => {
  const allMenuItems = [
    ...menuData.appetizers,
    ...menuData.mains,
    ...menuData.desserts
  ];

  return Object.entries(cart).map(([itemId, cartData]) => {
    const menuItem = allMenuItems.find(item => item.id === parseInt(itemId));
    const price = cartData.customization?.price || menuItem?.price || 0;
    
    return {
      itemId: parseInt(itemId),
      name: menuItem?.name || 'Unknown Item',
      quantity: cartData.quantity,
      unitPrice: price,
      totalPrice: price * cartData.quantity,
      customization: cartData.customization || null,
      category: getItemCategory(parseInt(itemId), menuData)
    };
  });
};

// Helper function to get item category
const getItemCategory = (itemId, menuData) => {
  if (menuData.appetizers.find(item => item.id === itemId)) return 'appetizers';
  if (menuData.mains.find(item => item.id === itemId)) return 'mains';
  if (menuData.desserts.find(item => item.id === itemId)) return 'desserts';
  return 'unknown';
};