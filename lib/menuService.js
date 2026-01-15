import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Fetch all menu categories and items from Firestore
 * @returns {Object} Menu data organized by category
 */
export async function fetchMenu() {
  try {
    const menuCollection = collection(db, 'menu');
    const menuSnapshot = await getDocs(menuCollection);
    
    const menuData = {};
    
    menuSnapshot.forEach((doc) => {
      const data = doc.data();
      menuData[doc.id] = {
        name: data.name,
        order: data.order || 0,
        items: data.items || []
      };
    });
    
    // Sort categories by order field
    const sortedMenu = Object.keys(menuData)
      .sort((a, b) => menuData[a].order - menuData[b].order)
      .reduce((acc, key) => {
        acc[key] = menuData[key];
        return acc;
      }, {});
    
    return sortedMenu;
  } catch (error) {
    console.error('Error fetching menu:', error);
    throw error;
  }
}

/**
 * Get all menu items flattened (useful for cart operations)
 * @param {Object} menuData - Menu data organized by category
 * @returns {Array} All menu items in a single array
 */
export function getAllMenuItems(menuData) {
  const allItems = [];
  
  Object.values(menuData).forEach(category => {
    if (category.items) {
      allItems.push(...category.items);
    }
  });
  
  return allItems;
}