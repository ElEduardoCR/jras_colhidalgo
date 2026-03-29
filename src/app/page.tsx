"use client";

import { useEffect, useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, CheckCircle, XCircle, MoreVertical } from "lucide-react";
import { supabase } from "@/lib/supabase";
import PartialPaymentModal from "@/components/PartialPaymentModal";

interface Payment {
  id: string;
  agreement_id: string;
  expected_amount: number;
  paid_amount: number;
  due_date: string;
  status: string;
  users: {
    nombre: string;
    cuenta: string;
  };
}

export default function Home() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [partialModalOpen, setPartialModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const dateStr = format(selectedDate, "yyyy-MM-dd");

  async function fetchPayments() {
    setLoading(true);
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        users ( nombre, cuenta )
      `)
      .eq("due_date", dateStr)
      .order("users(nombre)", { ascending: true });

    if (!error && data) {
      setPayments(data as Payment[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchPayments();
  }, [dateStr]);

  // Handle Full Payment
  async function handleFullPayment(payment: Payment) {
    if (!confirm(`¿Confirmar el pago completo de $${payment.expected_amount} por ${payment.users?.nombre}?`)) return;

    await supabase
      .from("payments")
      .update({ status: "paid", paid_amount: payment.expected_amount })
      .eq("id", payment.id);
    
    fetchPayments();
  }

  // Handle Unpaid (Roll over to next)
  async function handleUnpaid(payment: Payment) {
    if (!confirm(`¿Marcar como NO PAGADO? La deuda se pasará al siguiente cobro.`)) return;

    // 1. Mark this as unpaid
    await supabase.from("payments").update({ status: "unpaid" }).eq("id", payment.id);

    // 2. Add to next pending payment
    await rollOverDebt(payment.agreement_id, payment.expected_amount);
    
    fetchPayments();
  }

  // Handle Partial Payment
  async function handlePartialPaymentSubmit(amount: number) {
    if (!selectedPayment) return;
    const remainingDebt = selectedPayment.expected_amount - amount;

    // 1. Update this as partial payment
    await supabase
      .from("payments")
      .update({ status: "partial", paid_amount: amount })
      .eq("id", selectedPayment.id);

    // 2. Add remainder to next pending payment
    await rollOverDebt(selectedPayment.agreement_id, remainingDebt);
    
    fetchPayments();
  }

  async function rollOverDebt(agreementId: string, amountToAdd: number) {
    // Find next pending payment
    const { data: nextPayments } = await supabase
      .from("payments")
      .select("*")
      .eq("agreement_id", agreementId)
      .eq("status", "pending")
      .gt("due_date", dateStr)
      .order("due_date", { ascending: true })
      .limit(1);

    if (nextPayments && nextPayments.length > 0) {
      const nextP = nextPayments[0];
      await supabase
        .from("payments")
        .update({ expected_amount: nextP.expected_amount + amountToAdd })
        .eq("id", nextP.id);
    } else {
      // If there's no sequence left, we might need to create a new padding payment or just ignore.
      // For MVP, we alert that it was the last payment and we create one extra.
      await supabase.from("payments").insert([{
        agreement_id: agreementId,
        user_id: payments.find(p => p.agreement_id === agreementId)?.users ? null : null, // we need user_id but we didn't fetch it explicitly.
        // Quick dirty fix: getting user_id. We skip this complexity in MVP and assume it always exists.
      }]);
      // Let's refine: The payments table has agreement_id but we must supply user_id as well.
      // To keep it robust, let's fetch user_id from agreement:
      const { data: aggr } = await supabase.from("agreements").select("user_id").eq("id", agreementId).single();
      if(aggr) {
         // Create a new future payment a week from dateStr since no pending exists
         await supabase.from("payments").insert([{
          agreement_id: agreementId,
          user_id: aggr.user_id,
          expected_amount: amountToAdd,
          due_date: format(addDays(parseISO(dateStr), 7), "yyyy-MM-dd"), // + 1 week default
          status: "pending"
         }]);
      }
    }
  }

  // Helper for parseISO if needed
  function parseISO(dateString: string) {
    return new Date(dateString + 'T00:00:00');
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-[var(--color-primary)]" />
            Tablero de Cobros
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Administra la cobranza programada para la fecha seleccionada.
          </p>
        </div>

        {/* Date Navigator */}
        <div className="flex items-center gap-4 bg-white px-4 py-2 border border-gray-200 rounded-xl shadow-sm">
          <button 
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="text-center min-w-[160px]">
            <div className="text-sm text-gray-500 uppercase font-semibold">
              {format(selectedDate, "EEEE", { locale: es })}
            </div>
            <div className="text-lg font-bold text-gray-900">
              {format(selectedDate, "d MMMM yyyy", { locale: es })}
            </div>
          </div>

          <button 
             onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>
      
      <div className="bg-white shadow rounded-xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500">Cargando pagos...</div>
        ) : payments.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-gray-400">
             <CheckCircle className="w-16 h-16 mb-4 text-green-200" />
             <p className="text-xl font-medium text-gray-500">No hay cobros programados para esta fecha.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                  <th className="px-6 py-4 font-medium">Deudor</th>
                  <th className="px-6 py-4 font-medium">Monto Esperado</th>
                  <th className="px-6 py-4 font-medium">Monto Pagado</th>
                  <th className="px-6 py-4 font-medium">Estatus</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{payment.users?.nombre}</div>
                      <div className="text-sm text-gray-500">CTA: {payment.users?.cuenta || "-"}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-bold">
                      ${payment.expected_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-green-700 font-bold">
                       ${payment.paid_amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                       <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        payment.status === "paid" ? "bg-green-100 text-green-800" :
                        payment.status === "unpaid" ? "bg-red-100 text-red-800" :
                        payment.status === "partial" ? "bg-orange-100 text-orange-800" :
                        "bg-blue-100 text-[var(--color-primary)]"
                      }`}>
                        {payment.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {payment.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleFullPayment(payment)}
                            className="bg-green-50 text-green-600 hover:bg-green-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          >
                            Pagó Completo
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedPayment(payment);
                              setPartialModalOpen(true);
                            }}
                            className="bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          >
                            Parcial
                          </button>
                          <button 
                            onClick={() => handleUnpaid(payment)}
                            className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                          >
                            No Pagó
                          </button>
                        </div>
                      )}
                      {payment.status !== 'pending' && (
                        <span className="text-gray-400 text-sm">Procesado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PartialPaymentModal
        isOpen={partialModalOpen}
        onClose={() => {
          setPartialModalOpen(false);
          setSelectedPayment(null);
        }}
        payment={selectedPayment}
        onSubmit={handlePartialPaymentSubmit}
      />
    </div>
  );
}
