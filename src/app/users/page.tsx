"use client";

import { useEffect, useState } from "react";
import { Users, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import CreateUserModal from "@/components/CreateUserModal";

interface User {
  id: string | number;
  cuenta: string | null;
  nombre: string | null;
  direccion: string | null;
  tarifa: string | null;
  deuda: number | null;
  created_at: string | null;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  async function fetchUsers() {
    setLoading(true);
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("cuenta", { ascending: true });

    if (error) {
      console.error("Error fetching users:", error.message);
    }
    if (data) {
      setUsers(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const nombre = (u.nombre ?? "").toLowerCase();
    const cuenta = (u.cuenta ?? "").toLowerCase();
    const q = search.toLowerCase();
    return nombre.includes(q) || cuenta.includes(q);
  });

  return (
    <div className="max-w-6xl mx-auto">
      <header className="mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-[var(--color-primary)]" />
            Usuarios
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Administra los usuarios registrados y consulta sus datos.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[var(--color-secondary)] hover:bg-teal-500 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
        >
          + Nuevo Usuario
        </button>
      </header>
      
      <div className="bg-white shadow rounded-xl border border-gray-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre..."
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
                <th className="px-6 py-4 font-medium">Cuenta</th>
                <th className="px-6 py-4 font-medium">Nombre</th>
                <th className="px-6 py-4 font-medium">Dirección</th>
                <th className="px-6 py-4 font-medium">Tarifa</th>
                <th className="px-6 py-4 font-medium">Adeudo</th>
                <th className="px-6 py-4 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No se encontraron usuarios.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-600 font-medium">{user.cuenta ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{user.nombre ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{user.direccion ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600">{user.tarifa ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-600 font-bold">${Number(user.deuda ?? 0).toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-500 text-sm">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString("es-MX") : "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUserAdded={fetchUsers}
      />
    </div>
  );
}
