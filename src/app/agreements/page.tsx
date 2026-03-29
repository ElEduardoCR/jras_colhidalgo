"use client";

import { useEffect, useState } from "react";
import { FileText, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import CreateAgreementModal from "@/components/CreateAgreementModal";

interface Agreement {
  id: string;
  total_debt: number;
  amount_per_payment: number;
  number_of_payments: number;
  frequency: string;
  start_date: string;
  status: string;
  users: {
    nombre: string;
  };
}

export default function AgreementsPage() {
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  async function fetchAgreements() {
    setLoading(true);
    const { data, error } = await supabase
      .from("agreements")
      .select(`
        *,
        users ( nombre )
      `)
      .order("start_date", { ascending: false });

    if (!error && data) {
      setAgreements(data as Agreement[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchAgreements();
  }, []);

  const filteredAgreements = agreements.filter((a) =>
    a.users?.nombre?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-[var(--color-primary)]" />
            Convenios
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Crea y administra los convenios de pago rezagado.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-primary)] hover:bg-blue-900 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
        >
          + Nuevo Convenio
        </button>
      </header>
      
      <div className="bg-white shadow rounded-xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por usuario..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 text-sm">
                <th className="px-6 py-4 font-medium">Usuario</th>
                <th className="px-6 py-4 font-medium">Deuda Total</th>
                <th className="px-6 py-4 font-medium">Pagos</th>
                <th className="px-6 py-4 font-medium">Frecuencia</th>
                <th className="px-6 py-4 font-medium">Fecha de Inicio</th>
                <th className="px-6 py-4 font-medium">Estatus</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Cargando convenios...
                  </td>
                </tr>
              ) : filteredAgreements.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron convenios.
                  </td>
                </tr>
              ) : (
                filteredAgreements.map((agreement) => (
                  <tr key={agreement.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-medium">
                      {agreement.users?.nombre || "Usuario Desconocido"}
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-bold">
                      ${agreement.total_debt.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {agreement.number_of_payments} pagos de ${agreement.amount_per_payment.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-gray-600 capitalize">
                      {agreement.frequency}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">
                      {new Date(agreement.start_date + 'T00:00:00').toLocaleDateString("es-MX")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        agreement.status === "active" ? "bg-green-100 text-green-800" :
                        agreement.status === "cancelled" ? "bg-red-100 text-red-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {agreement.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateAgreementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAgreementAdded={fetchAgreements}
      />
    </div>
  );
}
