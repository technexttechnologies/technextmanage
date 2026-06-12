"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { updateCustomerProfile } from "@/app/customers/[id]/actions";

type Customer = {
  id: string;
  name: string;
  company?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  billingNotes?: string | null;
  paymentStatus?: string | null;
  notes?: string | null;
};

export default function EditCustomerModal({
  customer,
  onClose,
}: {
  customer: Customer;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateCustomerProfile(customer.id, formData);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to update customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100,
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#fff', borderRadius: '12px', width: '100%', maxWidth: '600px',
        maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        position: 'relative'
      }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <X size={24} color="#6B7280" />
        </button>

        <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#111827' }}>Edit Customer Profile</h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>Name *</label>
              <input type="text" name="name" defaultValue={customer.name} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>Company</label>
              <input type="text" name="company" defaultValue={customer.company || ""} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>Phone *</label>
              <input type="text" name="phone" defaultValue={customer.phone} required style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>Email</label>
              <input type="email" name="email" defaultValue={customer.email || ""} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>Address</label>
            <input type="text" name="address" defaultValue={customer.address || ""} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>Payment Status</label>
              <input type="text" name="paymentStatus" defaultValue={customer.paymentStatus || ""} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>Billing Notes</label>
              <input type="text" name="billingNotes" defaultValue={customer.billingNotes || ""} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>General Notes</label>
            <textarea name="notes" defaultValue={customer.notes || ""} rows={3} style={{ width: '100%', padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: '6px', resize: 'vertical' }}></textarea>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px', backgroundColor: '#F3F4F6', color: '#374151', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} style={{ padding: '8px 16px', backgroundColor: '#2563EB', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '500', cursor: 'pointer' }}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
