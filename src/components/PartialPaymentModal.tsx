"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface Payment {
  id: string;
  expected_amount: number;
}

export default function PartialPaymentModal({
  isOpen,
  onClose,
  payment,
  onSubmit,
}: {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  onSubmit: (amount: number) => Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen || !payment) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const paid = parseFloat(amount);
    
    if (isNaN(paid) || paid <= 0 || paid >= payment!.expected_amount) {
      alert("El monto debe ser mayor a 0 y menor al total esperado.");
      return;
    }

    setLoading(true);
    await onSubmit(paid);
    setLoading(false);
    setAmount("");
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Pago Parcial</h2>
        
        <p className="text-sm text-gray-600 mb-4">
          Monto esperado: <strong>${payment.expected_amount.toFixed(2)}</strong>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto que abonó ($)
            </label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              max={payment.expected_amount - 0.01}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              placeholder="Ej. 100"
            />
          </div>

          <div className="bg-orange-50 text-orange-800 p-3 rounded-lg text-xs">
            El resto de la deuda se sumará automáticamente al próximo pago programado.
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !amount}
              className="bg-[var(--color-secondary)] hover:bg-teal-600 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Procesando..." : "Confirmar Pago"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
