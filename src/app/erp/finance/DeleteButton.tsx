'use client';

import React from 'react';
import { deleteIncome, deleteExpense } from './actions';

interface DeleteButtonProps {
  id: string;
  type: 'income' | 'expense';
}

export default function DeleteButton({ id, type }: DeleteButtonProps) {
  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this ${type}? This action cannot be undone.`)) {
      try {
        if (type === 'income') {
          await deleteIncome(id);
        } else {
          await deleteExpense(id);
        }
      } catch (e: any) {
        alert(e.message || 'Failed to delete record.');
      }
    }
  };

  return (
    <button 
      onClick={handleDelete}
      style={{
        padding: '4px 8px',
        fontSize: '0.75rem',
        fontWeight: 600,
        color: '#ef4444',
        border: '1px solid #ef4444',
        borderRadius: '4px',
        backgroundColor: 'transparent',
        cursor: 'pointer',
        marginLeft: '8px'
      }}
    >
      Delete
    </button>
  );
}
