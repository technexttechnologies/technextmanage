"use client";

import { useState } from "react";
import { Edit } from "lucide-react";
import EditCustomerModal from "@/components/EditCustomerModal";

export default function EditCustomerButton({ customer }: { customer: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button className="btn-secondary" onClick={() => setIsModalOpen(true)}>
        <Edit size={16} /> Edit Profile
      </button>
      {isModalOpen && (
        <EditCustomerModal customer={customer} onClose={() => setIsModalOpen(false)} />
      )}
    </>
  );
}
