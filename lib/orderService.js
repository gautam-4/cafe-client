// lib/orderService.js
import { collection, addDoc, doc, updateDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  CANCELLED: 'cancelled'
};

export const createOrder = async (orderData) => {
  try {
    // Validate required fields
    if (!orderData.customer?.name || !orderData.tableNumber || !orderData.items?.length) {
      throw new Error('Missing required order information');
    }

    // Add the order to Firestore
    const orderRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: ORDER_STATUS.PENDING
    });
    
    console.log('Order created successfully with ID:', orderRef.id);
    return orderRef.id;
  } catch (error) {
    console.error('Error creating order:', error);
    
    // Provide more specific error messages
    if (error.code === 'permission-denied') {
      throw new Error('Permission denied. Please check your Firebase security rules.');
    } else if (error.code === 'unavailable') {
      throw new Error('Service temporarily unavailable. Please try again.');
    } else {
      throw new Error(error.message || 'Failed to create order. Please try again.');
    }
  }
};

export const updateOrderStatus = async (orderId, status) => {
  try {
    if (!orderId || !status) {
      throw new Error('Order ID and status are required');
    }

    if (!Object.values(ORDER_STATUS).includes(status)) {
      throw new Error('Invalid order status');
    }

    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status,
      updatedAt: serverTimestamp()
    });

    console.log('Order status updated successfully');
  } catch (error) {
    console.error('Error updating order status:', error);
    throw new Error('Failed to update order status');
  }
};

export const getOrdersByTable = async (tableNumber) => {
  try {
    const q = query(
      collection(db, 'orders'),
      where('tableNumber', '==', tableNumber),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return orders;
  } catch (error) {
    console.error('Error fetching orders by table:', error);
    throw new Error('Failed to fetch orders');
  }
};

export const formatOrderForFirebase = (cart, customerDetails, menuData) => {
  try {
    // Validate inputs
    if (!cart || typeof cart !== 'object') {
      throw new Error('Invalid cart data');
    }

    if (!customerDetails?.name || !customerDetails?.tableNumber) {
      throw new Error('Missing customer details');
    }

    if (!menuData?.drinks || !menuData?.mains || !menuData?.desserts) {
      throw new Error('Invalid menu data');
    }

    // Get all menu items for reference
    const allMenuItems = [
      ...menuData.drinks,
      ...menuData.mains,
      ...menuData.desserts
    ];

    // Convert cart to items array with full details
    const items = [];
    let totalPrice = 0;
    let totalItems = 0;

    Object.entries(cart).forEach(([itemId, variations]) => {
      const menuItem = allMenuItems.find(item => item.id === parseInt(itemId));
      
      if (menuItem && Array.isArray(variations)) {
        variations.forEach((variation, variationIndex) => {
          if (variation.quantity > 0) {
            const price = variation.customization?.price || menuItem.price;
            const itemTotal = price * variation.quantity;
            
            // Create a description for customized items
            let itemDescription = menuItem.name;
            if (variation.customization && variation.customization.label) {
              itemDescription += ` (${variation.customization.label})`;
            }
            
            items.push({
              itemId: parseInt(itemId),
              name: menuItem.name,
              displayName: itemDescription,
              category: menuItem.category || 'unknown',
              basePrice: menuItem.price,
              customization: variation.customization || null,
              finalPrice: price,
              quantity: variation.quantity,
              itemTotal: itemTotal,
              variationIndex: variationIndex,
              description: menuItem.description || null,
              isVeg: menuItem.isVeg !== false, // Default to veg unless explicitly set to false
              image: menuItem.image || null
            });

            totalPrice += itemTotal;
            totalItems += variation.quantity;
          }
        });
      }
    });

    if (items.length === 0) {
      throw new Error('No valid items found in cart');
    }

    // Generate order number
    const orderNumber = generateOrderNumber();

    return {
      // Customer Information
      customer: {
        name: customerDetails.name.trim(),
        phone: customerDetails.fullPhoneNumber || null,
        countryCode: customerDetails.countryCode || '+91',
        phoneNumber: customerDetails.phone || null
      },
      
      // Order Details
      tableNumber: customerDetails.tableNumber.trim(),
      specialInstructions: customerDetails.specialInstructions?.trim() || null,
      
      // Items and Pricing
      items: items,
      totalItems: totalItems,
      totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimal places
      
      // Order metadata
      orderNumber: orderNumber,
      paymentStatus: 'pending',
      estimatedTime: calculateEstimatedTime(items.length),
      
      // Additional tracking info
      orderSource: 'web',
      timestamp: new Date().toISOString(),
      
      // Summary for easy querying
      summary: {
        itemCount: totalItems,
        totalAmount: Math.round(totalPrice * 100) / 100,
        hasSpecialInstructions: !!customerDetails.specialInstructions?.trim(),
        categories: [...new Set(items.map(item => item.category))]
      }
    };
  } catch (error) {
    console.error('Error formatting order for Firebase:', error);
    throw new Error(error.message || 'Failed to format order data');
  }
};

const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD${timestamp}${random}`;
};

const calculateEstimatedTime = (itemCount) => {
  // Base time of 15 minutes + 2 minutes per item, with a max of 45 minutes
  const baseTime = 15;
  const timePerItem = 2;
  const maxTime = 45;
  const minTime = 10;
  
  const calculatedTime = baseTime + (itemCount * timePerItem);
  return Math.max(minTime, Math.min(calculatedTime, maxTime));
};

// Helper function to validate order data before submission
export const validateOrderData = (orderData) => {
  const errors = [];

  // Customer validation
  if (!orderData.customer?.name || orderData.customer.name.trim().length < 2) {
    errors.push('Customer name must be at least 2 characters long');
  }

  // Table validation
  if (!orderData.tableNumber || orderData.tableNumber.trim().length === 0) {
    errors.push('Table number is required');
  }

  // Items validation
  if (!orderData.items || orderData.items.length === 0) {
    errors.push('Order must contain at least one item');
  }

  // Price validation
  if (!orderData.totalPrice || orderData.totalPrice <= 0) {
    errors.push('Order total must be greater than zero');
  }

  // Items detail validation
  if (orderData.items && orderData.items.length > 0) {
    orderData.items.forEach((item, index) => {
      if (!item.itemId || !item.name || !item.quantity || item.quantity <= 0) {
        errors.push(`Item ${index + 1} is missing required information`);
      }
      if (!item.finalPrice || item.finalPrice <= 0) {
        errors.push(`Item ${index + 1} has invalid price`);
      }
    });
  }

  // Phone validation (if provided)
  if (orderData.customer?.phone) {
    const phoneRegex = /^\+\d{1,3}\d{10,14}$/;
    if (!phoneRegex.test(orderData.customer.phone)) {
      errors.push('Phone number format is invalid');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to format order for display
export const formatOrderForDisplay = (orderData) => {
  if (!orderData) return null;

  return {
    orderId: orderData.id || 'N/A',
    orderNumber: orderData.orderNumber || 'N/A',
    customerName: orderData.customer?.name || 'N/A',
    tableNumber: orderData.tableNumber || 'N/A',
    totalItems: orderData.totalItems || 0,
    totalPrice: orderData.totalPrice || 0,
    status: orderData.status || ORDER_STATUS.PENDING,
    estimatedTime: orderData.estimatedTime || 30,
    createdAt: orderData.createdAt || new Date(),
    items: orderData.items || []
  };
};