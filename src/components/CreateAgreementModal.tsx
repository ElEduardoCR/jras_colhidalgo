"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { X } from "lucide-react";
import { addWeeks, addMonths, parseISO } from "date-fns";

interface User {
  id: string;
  name: string;
}

export default function CreateAgreementModal({
  isOpen,
  onClose,
  onAgreementAdded,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAgreementAdded: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [userId, setUserId] = useState("");
  const [totalDebt, setTotalDebt] = useState("");
  const [numberOfPayments, setNumberOfPayments] = useState("");
  const [frequency, setFrequency] = useState("semanal");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // YYYY-MM-DD
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch users for the dropdown
      supabase
        .from("users")
        .select("id, name")
        .order("name", { ascending: true })
        .then(({ data }) => {
          if (data) setUsers(data);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) {
      setError("Por favor selecciona un usuario.");
      return;
    }

    setLoading(true);
    setError(null);

    const amountPerPayment = parseFloat(totalDebt) / parseInt(numberOfPayments);

    // 1. Create Agreement
    const { data: agreement, error: agreementError } = await supabase
      .from("agreements")
      .insert([
        {
          user_id: userId,
          total_debt: parseFloat(totalDebt),
          amount_per_payment: amountPerPayment,
          number_of_payments: parseInt(numberOfPayments),
          frequency,
          start_date: startDate,
        },
      ])
      .select()
      .single();

    if (agreementError) {
      setError(agreementError.message);
      setLoading(false);
      return;
    }

    // 2. Generate Payments
    const payments = [];
    let currentDate = parseISO(startDate);

    for (let i = 0; i < parseInt(numberOfPayments); i++) {
      payments.push({
        agreement_id: agreement.id,
        user_id: userId,
        expected_amount: amountPerPayment,
        paid_amount: 0,
        due_date: currentDate.toISOString().split("T")[0],
        status: "pending",
      });

      // Increment date based on frequency
      if (frequency === "semanal") {
        currentDate = addWeeks(currentDate, 1);
      } else if (frequency === "quincenal") {
        currentDate = addWeeks(currentDate, 2);
      } else if (frequency === "mensual") {
        currentDate = addMonths(currentDate, 1);
      }
    }

    const { error: paymentsError } = await supabase
      .from("payments")
      .insert(payments);

    if (paymentsError) {
      setError(paymentsError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    
    // Reset form
    setUserId("");
    setTotalDebt("");
    setNumberOfPayments("");
    setFrequency("semanal");
    
    onAgreementAdded();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Nuevo Convenio</h2>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuario deudor *
            </label>
            <select
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
            >
              <option value="">Selecciona un usuario</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deuda Total ($) *
            </label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              value={totalDebt}
              onChange={(e) => setTotalDebt(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              placeholder="Ej. 1200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Pagos *
            </label>
            <input
              type="number"
              required
              min="1"
              value={numberOfPayments}
              onChange={(e) => setNumberOfPayments(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
              placeholder="Ej. 6"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frecuencia de Pago *
            </label>
             <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
            >
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Primer Pago *
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[var(--color-primary)] outline-none"
            />
          </div>

          {totalDebt && numberOfPayments && (
            <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
              Cada pago será de: <strong>${(parseFloat(totalDebt) / parseInt(numberOfPayments)).toFixed(2)}</strong>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-[var(--color-primary)] hover:bg-blue-900 text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear Convenio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
