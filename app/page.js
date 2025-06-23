'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TableSelector() {
  const [tableId, setTableId] = useState('');
  const router = useRouter();

  const handleSubmit = () => {
    if (tableId !== '') {
      router.push(`/table/${tableId}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <label className="text-xl font-medium">Select Table Number</label>
      <select
        value={tableId}
        onChange={(e) => setTableId(e.target.value)}
        className="p-2 rounded border border-gray-300"
      >
        <option value="">-- Choose a table --</option>
        {[...Array(11).keys()].map((num) => (
          <option key={num} value={num}>
            Table {num}
          </option>
        ))}
      </select>

      <button
        onClick={handleSubmit}
        disabled={tableId === ''}
        className="px-4 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
      >
        Go to Table
      </button>
    </div>
  );
}
