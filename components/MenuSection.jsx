'use client';

import MenuCell from './MenuCell';

export default function MenuSection({ title, items, cart, onAddItem, onUpdateQuantity }) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-800 pb-2" style={{ borderBottom: '2px solid var(--cozy-lemon)' }}>
        {title}
      </h2>
      <div className="space-y-3">
        {items.map(item => (
          <MenuCell
            key={item.id}
            item={item}
            cartItem={cart[item.id]}
            onAddItem={onAddItem}
            onUpdateQuantity={onUpdateQuantity}
          />
        ))}
      </div>
    </div>
  );
}