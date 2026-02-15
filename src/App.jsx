import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/tauri";
import { save, open as tauriOpen } from "@tauri-apps/api/dialog";

// Fuzzy search helper
const fuzzyMatch = (text, query) => {
  if (!query) return true;
  const t = (text || "").toLowerCase();
  const q = query.toLowerCase();
  return t.includes(q);
};

// --- Shared Components ---
const StatusBadge = ({ status }) => {
  const map = {
    available: { label: "Dispoñible", bg: "#E8F5E9", color: "#2E7D32", border: "#A5D6A7" },
    loaned: { label: "Prestado", bg: "#FFF3E0", color: "#E65100", border: "#FFCC80" },
    maintenance: { label: "Mantemento", bg: "#FCE4EC", color: "#C62828", border: "#EF9A9A" },
    active: { label: "Activo", bg: "#E3F2FD", color: "#1565C0", border: "#90CAF9" },
    returned: { label: "Devolto", bg: "#F3E5F5", color: "#6A1B9A", border: "#CE93D8" },
    overdue: { label: "Atrasado", bg: "#FCE4EC", color: "#C62828", border: "#EF9A9A" },
  };
  const s = map[status] || map.available;
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{s.label}</span>;
};

const Btn = ({ children, onClick, primary, danger, small, disabled, style: sx }) => (
  <button disabled={disabled} onClick={onClick} style={{
    padding: small ? "6px 14px" : "10px 20px", borderRadius: 10, border: "none", fontWeight: 700,
    fontSize: small ? 13 : 14, cursor: disabled ? "default" : "pointer", fontFamily: "inherit",
    background: disabled ? "#ccc" : primary ? "linear-gradient(135deg, #1a6b5a, #22896e)" : danger ? "#c62828" : "#f0f2f5",
    color: primary || danger ? "#fff" : "#3a4a5a", opacity: disabled ? 0.5 : 1,
    boxShadow: primary && !disabled ? "0 2px 8px rgba(26,107,90,0.3)" : "none",
    transition: "all 0.15s", ...sx,
  }}>{children}</button>
);

const Modal = ({ open, onClose, title, children, wide }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }} />
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", background: "#fff", borderRadius: 16, width: wide ? 720 : 520, maxWidth: "94vw", maxHeight: "88vh",
        boxShadow: "0 25px 60px rgba(0,0,0,0.25)", display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid #e8e8e8" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1a3a4a" }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999", padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: "20px 24px", overflow: "auto", flex: 1 }}>{children}</div>
      </div>
    </div>
  );
};

// ============================================================
// MAIN APP
// ============================================================
export default function SAFApp() {
  const [view, setView] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [loans, setLoans] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [showNewLoan, setShowNewLoan] = useState(false);
  const [showNewUser, setShowNewUser] = useState(false);
  const [showNewStock, setShowNewStock] = useState(false);
  const [showReturn, setShowReturn] = useState(null);
  const [showEvents, setShowEvents] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2800); };

  // Load data from backend
  const loadAll = async () => {
    try {
      const [u, i, l, e] = await Promise.all([
        invoke("get_users"),
        invoke("get_items"),
        invoke("get_loans"),
        invoke("get_events", { limit: 50 }),
      ]);
      setUsers(u);
      setItems(i);
      setLoans(l);
      setEvents(e);
    } catch (err) {
      console.error("Error loading data:", err);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const getUserName = (id) => users.find(u => u.id === id)?.name || "—";

  // Compute stats from items (units by type)
  const totalStock = items.reduce((s, i) => s + i.total_stock, 0);
  const totalAvailable = items.reduce((s, i) => s + i.available_stock, 0);
  const stats = {
    users: users.length,
    activeLoans: loans.filter(l => l.status === "active" || l.status === "overdue").length,
    items: totalStock,
    available: totalAvailable,
  };

  const addUser = async (form) => {
    try {
      await invoke("create_user", {
        req: {
          name: form.name, dni: form.dni, address: form.address || "",
          phone: form.phone || null, email: null, notes: form.notes || null,
        }
      });
      showToast(`Usuaria/o ${form.name} engadido`);
      loadAll();
    } catch (err) { showToast("Erro: " + err); }
  };

  const createLoan = async (userId, selectedItems, notes) => {
    try {
      await invoke("create_loan", {
        req: {
          user_id: userId,
          item_ids: selectedItems.map(i => i.id),
          start_date: new Date().toISOString().split("T")[0],
          expected_end_date: (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d.toISOString().split("T")[0]; })(),
          notes: notes || null,
        }
      });
      showToast("Préstamo creado correctamente");
      loadAll();
    } catch (err) { showToast("Erro: " + err); }
  };

  const returnLoan = async (loanId) => {
    try {
      await invoke("return_loan", { id: loanId, condition: null, notes: null });
      showToast("Préstamo devolto correctamente");
      loadAll();
    } catch (err) { showToast("Erro: " + err); }
  };

  const addStockItem = async (itemId, quantity) => {
    try {
      const item = items.find(i => i.id === itemId);
      if (item) {
        await invoke("update_item_stock", { itemId, newTotalStock: item.total_stock + quantity });
        showToast("Stock actualizado");
        loadAll();
      }
    } catch (err) { showToast("Erro: " + err); }
  };

  const handleBackup = async () => {
    try {
      await invoke("create_backup");
      showToast("Copia de seguridade creada con éxito!");
    } catch (err) { showToast("Erro: " + err); }
  };

  const navItems = [
    { id: "dashboard", label: "Panel", icon: "📊" },
    { id: "users", label: "Usuarias/os", icon: "👥" },
    { id: "loans", label: "Préstamos", icon: "📋" },
    { id: "stock", label: "Inventario", icon: "📦" },
    { id: "reports", label: "Informes", icon: "📤" },
    { id: "events", label: "Rexistro", icon: "🕐" },
    { id: "manual", label: "Axuda", icon: "📖" },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Nunito', 'Segoe UI', system-ui, sans-serif", background: "#f5f7fa", color: "#1a3a4a", overflow: "hidden" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:5px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#c8cdd3;border-radius:4px}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes toastPop{from{opacity:0;transform:translateY(16px) scale(0.96)}to{opacity:1;transform:translateY(0) scale(1)}}
      `}</style>

      {/* SIDEBAR */}
      <aside style={{
        width: collapsed ? 64 : 232, minWidth: collapsed ? 64 : 232,
        background: "linear-gradient(195deg, #0e3d2e 0%, #1a5c48 50%, #17654f 100%)",
        color: "#fff", display: "flex", flexDirection: "column", transition: "all 0.25s ease",
      }}>
        <div style={{ padding: collapsed ? "20px 12px" : "22px 18px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ width: 38, height: 38, borderRadius: 8, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 20 }}>🏛️</div>
          {!collapsed && <div>
            <div style={{ fontSize: 10, opacity: 0.6, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase" }}>Concello de</div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Barreiros</div>
          </div>}
        </div>
        {!collapsed && <div style={{ padding: "14px 18px 6px", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.5, opacity: 0.4 }}>SAF · Xestión de material</div>}
        <nav style={{ flex: 1, padding: "6px 8px" }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => { setView(n.id); setSelectedUser(null); }} style={{
              display: "flex", alignItems: "center", gap: 10, width: "100%", padding: collapsed ? "11px 0" : "10px 12px",
              borderRadius: 10, border: "none", cursor: "pointer", marginBottom: 2, fontFamily: "inherit",
              background: view === n.id ? "rgba(255,255,255,0.18)" : "transparent",
              color: view === n.id ? "#fff" : "rgba(255,255,255,0.65)", fontSize: 14, fontWeight: view === n.id ? 700 : 500,
              justifyContent: collapsed ? "center" : "flex-start", transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 17 }}>{n.icon}</span>
              {!collapsed && n.label}
            </button>
          ))}
        </nav>
        <button onClick={() => setCollapsed(!collapsed)} style={{
          margin: "0 8px 14px", padding: 9, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", cursor: "pointer", fontSize: 13,
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit",
        }}>{collapsed ? "→" : "← Recoller"}</button>
      </aside>

      {/* MAIN */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <header style={{
          height: 60, minHeight: 60, background: "#fff", borderBottom: "1px solid #e8ecf0",
          display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
            {navItems.find(n => n.id === view)?.icon} {navItems.find(n => n.id === view)?.label}
            {selectedUser && <span style={{ fontWeight: 600, color: "#6a7a8a" }}> · {selectedUser.name}</span>}
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn small onClick={() => setShowEvents(true)}>🕐 Eventos ({events.length})</Btn>
            <Btn small primary onClick={() => setShowNewLoan(true)}>+ Novo préstamo</Btn>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: 24 }}>
          <div style={{ animation: "fadeIn 0.25s ease" }}>
            {view === "dashboard" && <Dashboard stats={stats} loans={loans} items={items} getUserName={getUserName} />}
            {view === "users" && <UsersView users={users} selectedUser={selectedUser} setSelectedUser={setSelectedUser} loans={loans} items={items} onNewUser={() => setShowNewUser(true)} onNewLoan={() => setShowNewLoan(true)} onReturn={(id) => setShowReturn(id)} loadAll={loadAll} showToast={showToast} />}
            {view === "loans" && <LoansView loans={loans} getUserName={getUserName} items={items} onReturn={(id) => setShowReturn(id)} onNewLoan={() => setShowNewLoan(true)} />}
            {view === "stock" && <StockView items={items} onAdd={() => setShowNewStock(true)} loadAll={loadAll} showToast={showToast} />}
            {view === "reports" && <ReportsView showToast={showToast} />}
            {view === "events" && <EventsView events={events} />}
            {view === "manual" && <ManualView />}
          </div>
        </div>
      </main>

      {/* Modals */}
      <NewLoanModal open={showNewLoan} onClose={() => setShowNewLoan(false)} users={users} items={items} onCreate={createLoan} preUser={selectedUser} />
      <NewUserModal open={showNewUser} onClose={() => setShowNewUser(false)} onSave={addUser} />
      <NewStockModal open={showNewStock} onClose={() => setShowNewStock(false)} items={items} loadAll={loadAll} showToast={showToast} />
      <EventLogModal open={showEvents} onClose={() => setShowEvents(false)} events={events} />

      <Modal open={!!showReturn} onClose={() => setShowReturn(null)} title="Confirmar devolución">
        <p style={{ color: "#5a6a7a", lineHeight: 1.6 }}>Confirma que todos os artigos deste préstamo foron devoltos en bo estado?</p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn onClick={() => setShowReturn(null)}>Cancelar</Btn>
          <Btn primary onClick={() => { returnLoan(showReturn); setShowReturn(null); }}>✓ Confirmar devolución</Btn>
        </div>
      </Modal>

      {toast && <div style={{
        position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 2000,
        background: "#1a6b5a", color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14,
        boxShadow: "0 8px 24px rgba(26,107,90,0.35)", animation: "toastPop 0.25s ease",
      }}>✓ {toast}</div>}
    </div>
  );
}

// ============================================================
// DASHBOARD
// ============================================================
function Dashboard({ stats, loans, items, getUserName }) {
  const cards = [
    { label: "Usuarias/os", value: stats.users, icon: "👥", color: "#1565C0" },
    { label: "Préstamos activos", value: stats.activeLoans, icon: "📋", color: "#E65100" },
    { label: "Total artigos", value: stats.items, icon: "📦", color: "#6A1B9A" },
    { label: "Dispoñibles", value: stats.available, icon: "✅", color: "#2E7D32" },
  ];
  const itemsWithStock = items.filter(i => i.total_stock > 0);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {cards.map((c, i) => (
          <div key={i} style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", borderLeft: `4px solid ${c.color}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#8a96a3", textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
              <span style={{ fontSize: 30, fontWeight: 900, color: c.color }}>{c.value}</span>
              <span style={{ fontSize: 22 }}>{c.icon}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 800 }}>📋 Préstamos recentes</h3>
          {loans.filter(l => l.status === "active" || l.status === "overdue").length === 0 ? (
            <div style={{ color: "#b0bac5", textAlign: "center", padding: 20 }}>Non hai préstamos activos</div>
          ) : loans.filter(l => l.status === "active" || l.status === "overdue").slice(0, 5).map(loan => (
            <div key={loan.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f0f2f5" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{loan.user_name}</div>
                <div style={{ fontSize: 11, color: "#8a96a3" }}>{loan.items.map(i => i.item_name).join(", ")} · {loan.start_date}</div>
              </div>
              <StatusBadge status={loan.status} />
            </div>
          ))}
        </div>
        <div style={{ background: "#fff", borderRadius: 14, padding: "18px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <h3 style={{ margin: "0 0 14px", fontSize: 15, fontWeight: 800 }}>📦 Estado do inventario</h3>
          {itemsWithStock.length === 0 ? (
            <div style={{ color: "#b0bac5", textAlign: "center", padding: 20 }}>Sen artigos no inventario</div>
          ) : itemsWithStock.map(item => {
            const pct = item.total_stock > 0 ? (item.available_stock / item.total_stock * 100) : 0;
            return (
              <div key={item.id} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600, marginBottom: 3 }}>
                  <span>{item.icon} {item.name}</span>
                  <span style={{ color: "#8a96a3" }}>{item.available_stock}/{item.total_stock}</span>
                </div>
                <div style={{ height: 5, background: "#eef1f5", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: pct > 50 ? "#4caf50" : pct > 0 ? "#ff9800" : "#ef5350", borderRadius: 4, transition: "width 0.4s" }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// USERS VIEW
// ============================================================
function UsersView({ users, selectedUser, setSelectedUser, loans, items, onNewUser, onNewLoan, onReturn, loadAll, showToast }) {
  const [search, setSearch] = useState("");
  const [editUser, setEditUser] = useState(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const filtered = users.filter(u => fuzzyMatch(u.name, search) || fuzzyMatch(u.dni, search));
  const getItemIcon = (itemId) => items.find(i => i.id === itemId)?.icon || "📦";

  const handleDeactivate = async (userId) => {
    const hasActive = loans.some(l => l.user_id === userId && (l.status === "active" || l.status === "overdue"));
    if (hasActive) { showToast("Non se pode desactivar: ten préstamos activos"); return; }
    try {
      await invoke("delete_user", { id: userId });
      showToast("Usuario/a desactivado/a");
      setConfirmDeactivate(false);
      setSelectedUser(null);
      loadAll();
    } catch (err) { showToast("Erro: " + err); }
  };

  const handleSaveEdit = async (form) => {
    try {
      await invoke("update_user", {
        id: editUser.id,
        req: {
          name: form.name || null, dni: form.dni || null, address: form.address || null,
          phone: form.phone || null, email: null, notes: form.notes || null,
        }
      });
      showToast("Usuario/a actualizado/a");
      setEditUser(null);
      loadAll();
    } catch (err) { showToast("Erro: " + err); }
  };

  return (
    <div style={{ display: "flex", gap: 20, height: "calc(100vh - 130px)" }}>
      <div style={{ width: 320, minWidth: 320, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Buscar..." style={{
            flex: 1, padding: "9px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 14, fontFamily: "inherit", outline: "none",
          }} />
          <Btn primary small onClick={onNewUser}>+ Novo</Btn>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {filtered.map(user => {
            const al = loans.filter(l => l.user_id === user.id && (l.status === "active" || l.status === "overdue")).length;
            const sel = selectedUser?.id === user.id;
            return (
              <button key={user.id} onClick={() => setSelectedUser(user)} style={{
                width: "100%", textAlign: "left", padding: "12px 14px", marginBottom: 5, borderRadius: 11,
                border: sel ? "2px solid #1a6b5a" : "1.5px solid #e8ecf0", cursor: "pointer",
                background: sel ? "#eef8f5" : "#fff", fontFamily: "inherit", transition: "all 0.15s",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                  {al > 0 && <span style={{ background: "#E65100", color: "#fff", borderRadius: 20, padding: "2px 8px", fontSize: 10, fontWeight: 700 }}>{al}</span>}
                </div>
                <div style={{ fontSize: 12, color: "#8a96a3", marginTop: 2 }}>DNI: {user.dni} · ☎ {user.phone || "—"}</div>
              </button>
            );
          })}
        </div>
      </div>
      <div style={{ flex: 1, overflow: "auto" }}>
        {selectedUser ? (
          <div>
            <div style={{ background: "#fff", borderRadius: 14, padding: 22, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2 style={{ margin: "0 0 3px", fontSize: 20, fontWeight: 900 }}>{selectedUser.name}</h2>
                  <span style={{ color: "#8a96a3", fontSize: 13 }}>DNI: {selectedUser.dni}</span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn small onClick={() => setEditUser(selectedUser)}>✏️ Editar</Btn>
                  <Btn small danger onClick={() => setConfirmDeactivate(true)}>Desactivar</Btn>
                  <Btn primary onClick={onNewLoan}>+ Novo préstamo</Btn>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
                {[
                  ["Teléfono", selectedUser.phone || "—"],
                  ["Enderezo", selectedUser.address],
                  selectedUser.notes ? ["Notas", selectedUser.notes] : null,
                ].filter(Boolean).map(([l, v]) => (
                  <div key={l}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#8a96a3", textTransform: "uppercase", letterSpacing: 0.5 }}>{l}</div>
                    <div style={{ fontWeight: 600, marginTop: 2, fontSize: 14 }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
      <EditUserModal open={!!editUser} onClose={() => setEditUser(null)} user={editUser} onSave={handleSaveEdit} />
      <Modal open={confirmDeactivate} onClose={() => setConfirmDeactivate(false)} title="Desactivar usuario/a">
        <div style={{ background: "#FCE4EC", border: "1px solid #EF9A9A", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#C62828", marginBottom: 6 }}>⚠️ Atención</div>
          <p style={{ fontSize: 13, color: "#5a6a7a", lineHeight: 1.6, margin: 0 }}>
            Vas desactivar o/a usuario/a <strong>{selectedUser?.name}</strong> (DNI: {selectedUser?.dni}).
          </p>
        </div>
        <p style={{ fontSize: 13, color: "#5a6a7a", lineHeight: 1.6 }}>
          O/A usuario/a non se eliminará, senón que quedará inactivo/a no sistema. Os seus datos e historial de préstamos conservaranse.
          Se no futuro se rexistra un/ha usuario/a co mesmo DNI, reactivarase automaticamente.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn onClick={() => setConfirmDeactivate(false)}>Cancelar</Btn>
          <Btn danger onClick={() => handleDeactivate(selectedUser.id)}>Confirmar desactivación</Btn>
        </div>
      </Modal>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 10 }}>📋 Préstamos activos</h3>
            {loans.filter(l => l.user_id === selectedUser.id && (l.status === "active" || l.status === "overdue")).length === 0 && (
              <div style={{ color: "#b0bac5", fontSize: 14, padding: 16 }}>Non hai préstamos activos</div>
            )}
            {loans.filter(l => l.user_id === selectedUser.id && (l.status === "active" || l.status === "overdue")).map(loan => (
              <div key={loan.id} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Préstamo do {loan.start_date}</span>
                    {loan.notes && <span style={{ color: "#8a96a3", fontSize: 12, marginLeft: 8 }}>— {loan.notes}</span>}
                  </div>
                  <Btn small danger onClick={() => onReturn(loan.id)}>↩ Devolver</Btn>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {loan.items.map((li, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 10, background: "#f5f7fa", border: "1px solid #e8ecf0" }}>
                      <span style={{ fontSize: 18 }}>{getItemIcon(li.item_id)}</span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{li.item_name}</div>
                        <div style={{ fontSize: 10, color: "#8a96a3" }}>×{li.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {loans.filter(l => l.user_id === selectedUser.id && l.status === "returned").length > 0 && (
              <>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 10, marginTop: 18 }}>🕐 Historial</h3>
                {loans.filter(l => l.user_id === selectedUser.id && l.status === "returned").map(loan => (
                  <div key={loan.id} style={{ background: "#fafbfc", borderRadius: 11, padding: "12px 16px", marginBottom: 6, border: "1px solid #eef0f3", opacity: 0.75 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: 600, fontSize: 12 }}>{loan.start_date} → {loan.actual_end_date || "?"}</span>
                      <StatusBadge status="returned" />
                    </div>
                    <div style={{ fontSize: 11, color: "#8a96a3", marginTop: 3 }}>{loan.items.map(i => i.item_name).join(", ")}</div>
                  </div>
                ))}
              </>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#b0bac5" }}>
            <span style={{ fontSize: 48, marginBottom: 12 }}>👈</span>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Selecciona un/ha usuario/a</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LOANS VIEW
// ============================================================
function LoansView({ loans, getUserName, items, onReturn, onNewLoan }) {
  const [filter, setFilter] = useState("active");
  const getItemIcon = (itemId) => items.find(i => i.id === itemId)?.icon || "📦";
  const filtered = loans.filter(l => {
    if (filter === "active") return l.status === "active" || l.status === "overdue";
    if (filter === "returned") return l.status === "returned";
    return true;
  }).sort((a, b) => (b.start_date || "").localeCompare(a.start_date || ""));
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {[["active", "Activos"], ["returned", "Devoltos"], ["all", "Todos"]].map(([id, label]) => (
            <button key={id} onClick={() => setFilter(id)} style={{
              padding: "7px 14px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer",
              background: filter === id ? "#1a6b5a" : "#e8ecf0", color: filter === id ? "#fff" : "#5a6a7a", fontFamily: "inherit",
            }}>{label}</button>
          ))}
        </div>
        <Btn primary small onClick={onNewLoan}>+ Novo préstamo</Btn>
      </div>
      <div style={{ background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8f9fb" }}>
              {["Usuaria/o", "Artigos", "Data inicio", "Estado", "Notas", "Accións"].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 11, fontWeight: 700, color: "#8a96a3", textTransform: "uppercase", letterSpacing: 0.5, borderBottom: "1px solid #eef0f3" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(loan => (
              <tr key={loan.id} style={{ borderBottom: "1px solid #f0f2f5" }}>
                <td style={{ padding: "11px 14px", fontWeight: 700 }}>{loan.user_name}</td>
                <td style={{ padding: "11px 14px" }}>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {loan.items.map((li, i) => (
                      <span key={i} style={{ background: "#f0f2f5", padding: "2px 7px", borderRadius: 5, fontSize: 11, fontWeight: 600 }}>{getItemIcon(li.item_id)} {li.item_name}</span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: "11px 14px", color: "#5a6a7a" }}>{loan.start_date}</td>
                <td style={{ padding: "11px 14px" }}><StatusBadge status={loan.status} /></td>
                <td style={{ padding: "11px 14px", color: "#8a96a3", fontSize: 12, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loan.notes || "—"}</td>
                <td style={{ padding: "11px 14px" }}>{(loan.status === "active" || loan.status === "overdue") && <Btn small danger onClick={() => onReturn(loan.id)}>↩ Devolver</Btn>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// STOCK VIEW — units by type, open article types
// ============================================================
function StockView({ items, onAdd, loadAll, showToast }) {
  const cats = ["Todos", ...new Set(items.filter(i => i.total_stock > 0).map(i => i.category))];
  const [cat, setCat] = useState("Todos");
  const [editItem, setEditItem] = useState(null);
  const [editVal, setEditVal] = useState(0);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(null);
  const itemsWithStock = items.filter(i => i.total_stock > 0);
  const filtered = cat === "Todos" ? itemsWithStock : itemsWithStock.filter(i => i.category === cat);

  const openEdit = (item) => { setEditItem(item); setEditVal(item.total_stock); };

  const handleSaveStock = async () => {
    if (!editItem) return;
    const n = parseInt(editVal);
    if (isNaN(n) || n < 0) { showToast("Valor non válido"); return; }
    try {
      await invoke("update_item_stock", { itemId: editItem.id, newTotalStock: n });
      showToast("Stock actualizado");
      setEditItem(null);
      loadAll();
    } catch (err) { showToast("Erro: " + err); }
  };

  const handleDelete = async () => {
    if (!confirmDeleteItem) return;
    try {
      await invoke("delete_item", { id: confirmDeleteItem.id });
      showToast(`Artigo "${confirmDeleteItem.name}" eliminado`);
      setConfirmDeleteItem(null);
      loadAll();
    } catch (err) { showToast("Erro: " + err); setConfirmDeleteItem(null); }
  };

  const loaned = editItem ? editItem.total_stock - editItem.available_stock : 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{
              padding: "7px 14px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer",
              background: cat === c ? "#1a6b5a" : "#e8ecf0", color: cat === c ? "#fff" : "#5a6a7a", fontFamily: "inherit",
            }}>{c}</button>
          ))}
        </div>
        <Btn primary small onClick={onAdd}>+ Engadir artigo</Btn>
      </div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 50, color: "#b0bac5" }}>
          <span style={{ fontSize: 44 }}>📦</span>
          <p style={{ fontSize: 15, fontWeight: 600, marginTop: 10 }}>Sen artigos no inventario</p>
          <p style={{ fontSize: 13 }}>Engade artigos para comezar</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: 14 }}>
          {filtered.map(item => {
            const avail = item.available_stock;
            const loanedCount = item.total_stock - item.available_stock;
            const total = item.total_stock;
            const canDelete = total === 0 && avail === 0;
            return (
              <div key={item.id} style={{ background: "#fff", borderRadius: 14, padding: 18, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 32 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "#8a96a3" }}>{item.category}</div>
                  </div>
                  {canDelete && (
                    <button onClick={() => setConfirmDeleteItem(item)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontSize: 16, padding: 4 }}
                      title="Eliminar artigo">🗑️</button>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  {[
                    [avail, "DISP.", "#e8f5e9", "#2e7d32"],
                    [loanedCount, "PREST.", "#fff3e0", "#e65100"],
                    [total, "TOTAL", "#f5f7fa", "#5a6a7a"],
                  ].map(([v, l, bg, c]) => (
                    <div key={l} style={{ textAlign: "center", flex: 1, padding: 6, borderRadius: 8, background: bg }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: c }}>{v}</div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: c, opacity: 0.8 }}>{l}</div>
                    </div>
                  ))}
                </div>
                <Btn small onClick={() => openEdit(item)} style={{ width: "100%" }}>Actualizar stock</Btn>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm Delete Item Modal */}
      <Modal open={!!confirmDeleteItem} onClose={() => setConfirmDeleteItem(null)} title="Eliminar artigo">
        <div style={{ background: "#FCE4EC", border: "1px solid #EF9A9A", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#C62828", marginBottom: 6 }}>⚠️ Atención</div>
          <p style={{ fontSize: 13, color: "#5a6a7a", lineHeight: 1.6, margin: 0 }}>
            Vas eliminar o artigo <strong>{confirmDeleteItem?.name}</strong> do inventario. Esta acción non se pode desfacer.
          </p>
        </div>
        <p style={{ fontSize: 13, color: "#5a6a7a", lineHeight: 1.6 }}>
          O tipo de artigo eliminarase completamente do sistema. Se no futuro se necesita de novo, haberá que crealo outra vez.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn onClick={() => setConfirmDeleteItem(null)}>Cancelar</Btn>
          <Btn danger onClick={handleDelete}>Confirmar eliminación</Btn>
        </div>
      </Modal>

      {/* Update Stock Modal */}
      <Modal open={!!editItem} onClose={() => setEditItem(null)} title={`Actualizar stock: ${editItem?.name || ""}`}>
        {editItem && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {[
                [editItem.available_stock, "Dispoñibles", "#e8f5e9", "#2e7d32"],
                [loaned, "En préstamo", "#fff3e0", "#e65100"],
                [editItem.total_stock, "Total actual", "#f5f7fa", "#5a6a7a"],
              ].map(([v, l, bg, c]) => (
                <div key={l} style={{ textAlign: "center", flex: 1, padding: 10, borderRadius: 8, background: bg }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: c }}>{v}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: c }}>{l}</div>
                </div>
              ))}
            </div>
            {loaned > 0 && (
              <div style={{ background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: 8, padding: "10px 14px", marginBottom: 14, fontSize: 12, color: "#e65100", fontWeight: 600 }}>
                ⚠️ Hai {loaned} unidades en préstamo. O stock mínimo permitido é {loaned}.
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5a6a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Novo stock total</label>
              <input type="number" value={editVal} min={loaned} onChange={e => setEditVal(e.target.value)} style={{
                width: "100%", padding: "12px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 18, fontFamily: "inherit", boxSizing: "border-box", outline: "none", textAlign: "center",
              }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn onClick={() => setEditItem(null)}>Cancelar</Btn>
              <Btn primary disabled={parseInt(editVal) < loaned || isNaN(parseInt(editVal))} onClick={handleSaveStock}>✓ Gardar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ============================================================
// EVENTS VIEW
// ============================================================
function EventsView({ events }) {
  const types = {
    USER_CREATED: { label: "Usuario/a creado/a", icon: "👤", color: "#1565C0" },
    ITEM_CREATED: { label: "Artigo creado", icon: "📦", color: "#2E7D32" },
    LOAN_CREATED: { label: "Préstamo creado", icon: "📋", color: "#E65100" },
    LOAN_RETURNED: { label: "Préstamo devolto", icon: "↩️", color: "#6A1B9A" },
    STOCK_UPDATED: { label: "Stock actualizado", icon: "📊", color: "#2E7D32" },
    STOCK_RESERVED: { label: "Stock reservado", icon: "🔒", color: "#E65100" },
    STOCK_RELEASED: { label: "Stock liberado", icon: "🔓", color: "#2E7D32" },
    USER_UPDATED: { label: "Usuario/a editado/a", icon: "✏️", color: "#1565C0" },
    RETURN_CANCELLED: { label: "Devolución cancelada", icon: "↩️", color: "#C62828" },
  };
  if (!events.length) return (
    <div style={{ textAlign: "center", padding: 50, color: "#b0bac5" }}>
      <span style={{ fontSize: 44 }}>🕐</span>
      <p style={{ fontSize: 15, fontWeight: 600, marginTop: 10 }}>Aínda non hai eventos</p>
      <p style={{ fontSize: 13 }}>Cada acción xerará un evento no rexistro</p>
    </div>
  );
  return (
    <div style={{ background: "#fff", borderRadius: 14, padding: "18px 22px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontWeight: 800 }}>Rexistro de eventos</h3>
        <span style={{ fontSize: 12, color: "#8a96a3", fontWeight: 600 }}>{events.length} eventos</span>
      </div>
      {events.map(evt => {
        const t = types[evt.event_type] || { label: evt.event_type, icon: "•", color: "#666" };
        return (
          <div key={evt.id} style={{ display: "flex", gap: 12, padding: "10px 0", borderBottom: "1px solid #f0f2f5", alignItems: "flex-start" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${t.color}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{t.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: t.color }}>{t.label}</div>
              <div style={{ fontSize: 11, color: "#8a96a3" }}>{new Date(evt.created_at).toLocaleString("gl-ES")}</div>
              <div style={{ fontSize: 11, color: "#5a6a7a", marginTop: 3, background: "#f8f9fb", padding: "5px 8px", borderRadius: 5, fontFamily: "monospace", wordBreak: "break-all" }}>
                {JSON.stringify(evt.data)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// NEW LOAN MODAL — selects items by type+quantity, not serial
// ============================================================
function NewLoanModal({ open, onClose, users, items, onCreate, preUser }) {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState("");
  const [uSearch, setUSearch] = useState("");
  const [iSearch, setISearch] = useState("");
  const [selectedItems, setSelectedItems] = useState([]); // [{id, name, icon}]
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setStep(preUser ? 2 : 1);
      setUserId(preUser?.id || "");
      setUSearch(""); setISearch(""); setSelectedItems([]); setNotes("");
    }
  }, [open, preUser]);

  const filteredUsers = users.filter(u => fuzzyMatch(u.name, uSearch) || fuzzyMatch(u.dni, uSearch));
  const available = items.filter(i => i.available_stock > 0);
  const filteredItems = available.filter(i => fuzzyMatch(i.name, iSearch) || fuzzyMatch(i.category, iSearch));

  const toggle = (item) => {
    if (selectedItems.find(i => i.id === item.id)) {
      setSelectedItems(p => p.filter(i => i.id !== item.id));
    } else {
      setSelectedItems(p => [...p, { id: item.id, name: item.name, icon: item.icon }]);
    }
  };

  const user = users.find(u => u.id === userId);

  return (
    <Modal open={open} onClose={onClose} title="Novo préstamo" wide>
      {/* Progress */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ flex: 1, height: 4, borderRadius: 4, background: s <= step ? "#1a6b5a" : "#e8ecf0", transition: "all 0.3s" }} />
        ))}
      </div>

      {step === 1 && (
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>1️⃣ Selecciona o/a usuario/a</p>
          <input value={uSearch} onChange={e => setUSearch(e.target.value)} placeholder="🔍 Buscar por nome ou DNI..." autoFocus style={{
            width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 14, fontFamily: "inherit", marginBottom: 10, boxSizing: "border-box", outline: "none",
          }} />
          <div style={{ maxHeight: 280, overflow: "auto" }}>
            {filteredUsers.map(u => (
              <button key={u.id} onClick={() => { setUserId(u.id); setStep(2); }} style={{
                display: "block", width: "100%", textAlign: "left", padding: "11px 14px", borderRadius: 10,
                border: userId === u.id ? "2px solid #1a6b5a" : "1px solid #e8ecf0",
                background: userId === u.id ? "#eef8f5" : "#fff", cursor: "pointer", marginBottom: 5, fontFamily: "inherit",
              }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: "#8a96a3" }}>DNI: {u.dni} · {u.address}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 14, margin: 0 }}>2️⃣ Artigos para {user?.name?.split(" ")[0]}</p>
            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#1a6b5a", fontWeight: 700, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>← Cambiar usuario</button>
          </div>
          <input value={iSearch} onChange={e => setISearch(e.target.value)} placeholder="🔍 Buscar artigo (nome, categoría)..." autoFocus style={{
            width: "100%", padding: "11px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 14, fontFamily: "inherit", marginBottom: 8, boxSizing: "border-box", outline: "none",
          }} />
          {selectedItems.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10, padding: "8px 10px", background: "#eef8f5", borderRadius: 10, border: "1px solid #c8e6c9" }}>
              {selectedItems.map(item => (
                <span key={item.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", padding: "4px 9px", borderRadius: 7, fontSize: 12, fontWeight: 600, border: "1px solid #a5d6a7" }}>
                  {item.icon} {item.name}
                  <button onClick={() => toggle(item)} style={{ background: "none", border: "none", cursor: "pointer", color: "#c62828", fontWeight: 900, fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ maxHeight: 240, overflow: "auto" }}>
            {filteredItems.map(item => {
              const sel = selectedItems.find(i => i.id === item.id);
              return (
                <button key={item.id} onClick={() => toggle(item)} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: sel ? "2px solid #1a6b5a" : "1px solid #e8ecf0", background: sel ? "#eef8f5" : "#fff",
                  cursor: "pointer", marginBottom: 4, fontFamily: "inherit", textAlign: "left",
                }}>
                  <span style={{ fontSize: 22 }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</div>
                    <div style={{ fontSize: 11, color: "#8a96a3" }}>{item.category} · {item.available_stock} disp.</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: 6, border: sel ? "none" : "2px solid #d8dde3", background: sel ? "#1a6b5a" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 900 }}>
                    {sel && "✓"}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 14 }}>
            <Btn onClick={onClose}>Cancelar</Btn>
            <Btn primary disabled={selectedItems.length === 0} onClick={() => setStep(3)}>Seguinte → ({selectedItems.length} artigos)</Btn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>3️⃣ Confirmar préstamo</p>
          <div style={{ background: "#f8f9fb", borderRadius: 10, padding: 16, marginBottom: 14 }}>
            <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 4 }}>{user?.name}</div>
            <div style={{ fontSize: 12, color: "#8a96a3" }}>DNI: {user?.dni} · {user?.address}</div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5a6a7a", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Artigos seleccionados</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {selectedItems.map(item => (
                <span key={item.id} style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#eef8f5", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600, border: "1px solid #c8e6c9" }}>
                  {item.icon} {item.name}
                </span>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#5a6a7a", marginBottom: 5, textTransform: "uppercase", letterSpacing: 0.5 }}>Notas (opcional)</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Motivo do préstamo, observacións..." style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none",
            }} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn onClick={() => setStep(2)}>← Volver</Btn>
            <Btn primary onClick={() => { onCreate(userId, selectedItems, notes); onClose(); }}>✓ Crear préstamo</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ============================================================
// NEW USER MODAL
// ============================================================
function NewUserModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", dni: "", phone: "", address: "", notes: "" });
  useEffect(() => { if (open) setForm({ name: "", dni: "", phone: "", address: "", notes: "" }); }, [open]);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const fields = [
    ["Nome completo", "name", "María García López"],
    ["DNI", "dni", "12345678A"],
    ["Teléfono", "phone", "981 234 567"],
    ["Enderezo", "address", "Rúa do Porto, 12"],
  ];
  return (
    <Modal open={open} onClose={onClose} title="Novo/a usuario/a">
      {fields.map(([label, key, ph]) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5a6a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
          <input type="text" value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
          }} />
        </div>
      ))}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5a6a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Notas</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Observacións..." style={{
          width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none",
        }} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn primary disabled={!form.name || !form.dni} onClick={() => { onSave(form); onClose(); }}>✓ Gardar usuario/a</Btn>
      </div>
    </Modal>
  );
}

// ============================================================
// NEW STOCK MODAL — add stock by type (open article types)
// ============================================================
function NewStockModal({ open, onClose, items, loadAll, showToast }) {
  const [mode, setMode] = useState("existing"); // "existing" or "custom"
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState(1);
  // custom item fields
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("Mobilidade");
  const [customIcon, setCustomIcon] = useState("📦");
  const [customStock, setCustomStock] = useState(1);

  useEffect(() => {
    if (open) { setMode("existing"); setSelectedId(""); setQty(1); setCustomName(""); setCustomCategory("Mobilidade"); setCustomIcon("📦"); setCustomStock(1); }
  }, [open]);

  const handleAddExisting = async () => {
    if (!selectedId) return;
    const item = items.find(i => i.id === selectedId);
    if (!item) return;
    try {
      await invoke("update_item_stock", { itemId: selectedId, newTotalStock: item.total_stock + qty });
      showToast(`+${qty} unidades de ${item.name}`);
      loadAll();
      onClose();
    } catch (err) { showToast("Erro: " + err); }
  };

  const handleCreateCustom = async () => {
    if (!customName) return;
    try {
      await invoke("create_item", {
        req: { name: customName, description: null, category: customCategory, icon: customIcon, total_stock: customStock, notes: null }
      });
      showToast(`Artigo "${customName}" creado con ${customStock} unidades`);
      loadAll();
      onClose();
    } catch (err) { showToast("Erro: " + err); }
  };

  // Get all items (including those with 0 stock) for adding stock
  const allItems = items;

  const categories = [
    ["Mobilidade", "Mobilidade"], ["Baño", "Baño"], ["Transferencia", "Transferencia"],
    ["Coidados", "Coidados"], ["Cama/Descanso", "Cama/Descanso"], ["Respiración", "Respiración"],
    ["Alimentación", "Alimentación"], ["Vestir", "Vestir"], ["Comunicación", "Comunicación"], ["Outros", "Outros"],
  ];

  return (
    <Modal open={open} onClose={onClose} title="Engadir artigo ao inventario">
      <div style={{ display: "flex", gap: 5, marginBottom: 16 }}>
        <button onClick={() => setMode("existing")} style={{
          padding: "7px 14px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          background: mode === "existing" ? "#1a6b5a" : "#e8ecf0", color: mode === "existing" ? "#fff" : "#5a6a7a",
        }}>Artigo existente</button>
        <button onClick={() => setMode("custom")} style={{
          padding: "7px 14px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
          background: mode === "custom" ? "#1a6b5a" : "#e8ecf0", color: mode === "custom" ? "#fff" : "#5a6a7a",
        }}>Crear novo tipo</button>
      </div>

      {mode === "existing" ? (
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5a6a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Tipo de artigo</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, maxHeight: 240, overflow: "auto" }}>
              {allItems.map(item => (
                <button key={item.id} onClick={() => setSelectedId(item.id)} style={{
                  padding: "10px 12px", borderRadius: 10, border: selectedId === item.id ? "2px solid #1a6b5a" : "1px solid #e8ecf0",
                  background: selectedId === item.id ? "#eef8f5" : "#fff", cursor: "pointer", fontFamily: "inherit", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{item.name}</span>
                    <div style={{ fontSize: 10, color: "#8a96a3" }}>Stock: {item.total_stock}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5a6a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Cantidade a engadir</label>
            <input type="number" value={qty} onChange={e => setQty(parseInt(e.target.value) || 0)} min="1" style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
            }} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <Btn onClick={onClose}>Cancelar</Btn>
            <Btn primary disabled={!selectedId || qty < 1} onClick={handleAddExisting}>✓ Engadir</Btn>
          </div>
        </div>
      ) : (
        <div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5a6a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Nome do artigo</label>
            <input value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Ex: Cama hospitalaria" style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
            }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5a6a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Categoría</label>
            <select value={customCategory} onChange={e => setCustomCategory(e.target.value)} style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
            }}>
              {categories.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5a6a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Icona (emoji)</label>
            <input value={customIcon} onChange={e => setCustomIcon(e.target.value)} placeholder="📦" maxLength={2} style={{
              width: 80, padding: "10px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 18, fontFamily: "inherit", boxSizing: "border-box", outline: "none", textAlign: "center",
            }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5a6a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Stock inicial</label>
            <input type="number" value={customStock} onChange={e => setCustomStock(parseInt(e.target.value) || 0)} min="0" style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
            }} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
            <Btn onClick={onClose}>Cancelar</Btn>
            <Btn primary disabled={!customName} onClick={handleCreateCustom}>✓ Crear artigo</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ============================================================
// EVENT LOG MODAL
// ============================================================
function EventLogModal({ open, onClose, events }) {
  const types = {
    USER_CREATED: { label: "Usuario/a", icon: "👤", color: "#1565C0" },
    LOAN_CREATED: { label: "Préstamo", icon: "📋", color: "#E65100" },
    LOAN_RETURNED: { label: "Devolución", icon: "↩️", color: "#6A1B9A" },
    STOCK_UPDATED: { label: "Stock", icon: "📦", color: "#2E7D32" },
    ITEM_CREATED: { label: "Artigo", icon: "📦", color: "#2E7D32" },
    STOCK_RESERVED: { label: "Reserva", icon: "🔒", color: "#E65100" },
    STOCK_RELEASED: { label: "Liberación", icon: "🔓", color: "#2E7D32" },
  };
  return (
    <Modal open={open} onClose={onClose} title={`Rexistro de eventos (${events.length})`} wide>
      {!events.length ? (
        <p style={{ color: "#8a96a3", textAlign: "center", padding: 20 }}>Aínda non hai eventos rexistrados.</p>
      ) : (
        <div style={{ maxHeight: 400, overflow: "auto" }}>
          {events.map(evt => {
            const t = types[evt.event_type] || { label: evt.event_type, icon: "•", color: "#666" };
            return (
              <div key={evt.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #f0f2f5" }}>
                <span style={{ fontSize: 16 }}>{t.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontWeight: 700, fontSize: 12, color: t.color }}>{t.label}</span>
                  <span style={{ fontSize: 11, color: "#8a96a3", marginLeft: 8 }}>{new Date(evt.created_at).toLocaleString("gl-ES")}</span>
                  <div style={{ fontSize: 11, color: "#5a6a7a", fontFamily: "monospace", marginTop: 2, wordBreak: "break-all" }}>{JSON.stringify(evt.data)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}

// ============================================================
// EDIT USER MODAL
// ============================================================
function EditUserModal({ open, onClose, user, onSave }) {
  const [form, setForm] = useState({ name: "", dni: "", phone: "", address: "", notes: "" });
  useEffect(() => {
    if (open && user) setForm({ name: user.name || "", dni: user.dni || "", phone: user.phone || "", address: user.address || "", notes: user.notes || "" });
  }, [open, user]);
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const fields = [
    ["Nome completo", "name", "María García López"],
    ["DNI", "dni", "12345678A"],
    ["Teléfono", "phone", "981 234 567"],
    ["Enderezo", "address", "Rúa do Porto, 12"],
  ];
  return (
    <Modal open={open} onClose={onClose} title="Editar usuario/a">
      {fields.map(([label, key, ph]) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5a6a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</label>
          <input type="text" value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} style={{
            width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 14, fontFamily: "inherit", boxSizing: "border-box", outline: "none",
          }} />
        </div>
      ))}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#5a6a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>Notas</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2} placeholder="Observacións..." style={{
          width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 14, fontFamily: "inherit", resize: "vertical", boxSizing: "border-box", outline: "none",
        }} />
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn primary disabled={!form.name || !form.dni} onClick={() => { onSave(form); }}>✓ Gardar cambios</Btn>
      </div>
    </Modal>
  );
}

// ============================================================
// REPORTS VIEW
// ============================================================
function ReportsView({ showToast }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [format, setFormat] = useState("xlsx");
  const [confirmRestore, setConfirmRestore] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleExportExcel = async () => {
    try {
      const filePath = await save({
        filters: [{ name: "Excel", extensions: ["xlsx"] }],
        defaultPath: `SAF_Export_${new Date().toISOString().split("T")[0]}.xlsx`
      });
      if (filePath) {
        await invoke("export_to_excel", { path: filePath });
        showToast("Exportado con éxito!");
      }
    } catch (err) { showToast("Erro: " + err); }
  };

  const handleAnnualReport = async () => {
    try {
      if (format === "xlsx") {
        const filePath = await save({
          filters: [{ name: "Excel", extensions: ["xlsx"] }],
          defaultPath: `SAF_Informe_Anual_${year}.xlsx`
        });
        if (filePath) {
          await invoke("export_annual_report", { path: filePath, year });
          showToast(`Informe anual ${year} exportado en Excel!`);
        }
      } else {
        const filePath = await save({
          filters: [{ name: "PDF", extensions: ["pdf"] }],
          defaultPath: `SAF_Informe_Anual_${year}.pdf`
        });
        if (filePath) {
          await invoke("export_annual_report_pdf", { path: filePath, year });
          showToast(`Informe anual ${year} exportado en PDF!`);
        }
      }
    } catch (err) { showToast("Erro: " + err); }
  };

  const handleBackup = async () => {
    try {
      await invoke("create_backup");
      showToast("Copia de seguridade creada con éxito!");
    } catch (err) { showToast("Erro: " + err); }
  };

  const handleRestoreBackup = async () => {
    try {
      const filePath = await tauriOpen({
        filters: [{ name: "Copia de seguridade (ZIP)", extensions: ["zip"] }],
        multiple: false,
      });
      if (filePath) {
        await invoke("restore_backup", { backupPath: filePath });
        showToast("Datos restaurados! Reinicia a aplicación para ver os cambios.");
        setConfirmRestore(false);
      }
    } catch (err) { showToast("Erro: " + err); setConfirmRestore(false); }
  };

  const lbl = { display: "block", fontSize: 11, fontWeight: 700, color: "#5a6a7a", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Export Excel */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 28 }}>📊</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Exportar a Excel</div>
              <div style={{ fontSize: 12, color: "#8a96a3" }}>Inventario, préstamos e usuarios en .xlsx</div>
            </div>
          </div>
          <Btn primary onClick={handleExportExcel} style={{ width: "100%" }}>Exportar todo a Excel</Btn>
        </div>

        {/* Annual Report */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 28 }}>📋</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Informe anual de actividade</div>
              <div style={{ fontSize: 12, color: "#8a96a3" }}>Usuarios/as con préstamos no ano seleccionado</div>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Ano</label>
            <select value={year} onChange={e => setYear(parseInt(e.target.value))} style={{
              width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #d8dde3", fontSize: 14, fontFamily: "inherit", outline: "none",
            }}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={lbl}>Formato</label>
            <div style={{ display: "flex", gap: 5 }}>
              {[["xlsx", "Excel (.xlsx)"], ["pdf", "PDF (.pdf)"]].map(([id, label]) => (
                <button key={id} onClick={() => setFormat(id)} style={{
                  flex: 1, padding: "8px 12px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 12, cursor: "pointer",
                  background: format === id ? "#1a6b5a" : "#e8ecf0", color: format === id ? "#fff" : "#5a6a7a", fontFamily: "inherit",
                }}>{label}</button>
              ))}
            </div>
          </div>
          <Btn primary onClick={handleAnnualReport} style={{ width: "100%" }}>Xerar informe {year}</Btn>
        </div>

        {/* Backup */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 28 }}>💾</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Copia de seguridade</div>
              <div style={{ fontSize: 12, color: "#8a96a3" }}>Gardar unha copia da base de datos</div>
            </div>
          </div>
          <Btn primary onClick={handleBackup} style={{ width: "100%" }}>Crear copia agora</Btn>
        </div>

        {/* Restore */}
        <div style={{ background: "#fff", borderRadius: 14, padding: "22px 24px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 28 }}>🔄</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Restaurar copia de seguridade</div>
              <div style={{ fontSize: 12, color: "#8a96a3" }}>Recuperar datos desde un ficheiro .zip</div>
            </div>
          </div>
          <Btn danger onClick={() => setConfirmRestore(true)} style={{ width: "100%" }}>Restaurar desde arquivo</Btn>
        </div>
      </div>

      {/* Confirm restore modal */}
      <Modal open={confirmRestore} onClose={() => setConfirmRestore(false)} title="Restaurar copia de seguridade">
        <div style={{ background: "#FCE4EC", border: "1px solid #EF9A9A", borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 13, color: "#C62828", marginBottom: 6 }}>⚠️ Atención: esta acción é destrutiva</div>
          <p style={{ fontSize: 13, color: "#5a6a7a", lineHeight: 1.6, margin: 0 }}>
            Ao restaurar unha copia de seguridade, <strong>todos os datos actuais serán substituídos</strong> polos datos do arquivo seleccionado.
            Esta acción non se pode desfacer.
          </p>
        </div>
        <p style={{ fontSize: 13, color: "#5a6a7a", lineHeight: 1.6 }}>
          Recoméndase crear unha copia de seguridade antes de restaurar.
          Despois de restaurar, deberá pechar e volver a abrir a aplicación para que os cambios teñan efecto.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>
          <Btn onClick={() => setConfirmRestore(false)}>Cancelar</Btn>
          <Btn danger onClick={handleRestoreBackup}>Seleccionar arquivo e restaurar</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// AXUDA
// ============================================================
function ManualView() {
  const S = ({ children }) => <h3 style={{ fontSize: 16, fontWeight: 800, margin: "24px 0 10px", color: "#1a6b5a" }}>{children}</h3>;
  const P = ({ children }) => <p style={{ fontSize: 14, lineHeight: 1.7, color: "#3a4a5a", marginBottom: 10 }}>{children}</p>;
  return (
    <div style={{ maxWidth: 760 }}>
      <div style={{ background: "#fff", borderRadius: 14, padding: "28px 32px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 900 }}>📖 Axuda</h2>
        <P>Benvida ao SAF (Servizo de Axuda ao Fogar) do Concello de Barreiros. Esta aplicación permite xestionar o préstamo de material de apoio a persoas que o necesiten.</P>

        <S>1. Panel</S>
        <P>O panel mostra un resumo da situación actual: o total de usuarios/as, os préstamos activos, o inventario total e as unidades dispoñibles. Tamén mostra os préstamos recentes e o estado de cada tipo de artigo.</P>

        <S>2. Usuarias/os</S>
        <P>Nesta sección pódense consultar, crear e editar os datos dos/as usuarios/as. Ao seleccionar un/ha usuario/a na lista da esquerda, vense os seus datos persoais e os préstamos activos.</P>
        <P><strong>Crear usuario/a:</strong> Pulsar "+ Novo" e cubrir o formulario. Se o DNI xa existía no sistema (usuario/a previamente desactivado/a), reactivarase automaticamente cos novos datos.</P>
        <P><strong>Editar:</strong> Seleccionar o/a usuario/a e pulsar "Editar" para modificar os seus datos.</P>
        <P><strong>Desactivar:</strong> Para dar de baixa a un/ha usuario/a, pulsar "Desactivar". A aplicación pedirá confirmación e explicará o efecto da acción. O/A usuario/a non se elimina, senón que queda inactivo/a. Se se rexistra de novo co mesmo DNI, reactívase. Non se pode desactivar un/ha usuario/a con préstamos activos.</P>

        <S>3. Préstamos</S>
        <P>Aquí xestiónanse os préstamos de material. Pódese crear un novo préstamo, ver os activos e os devoltos, e rexistrar a devolución.</P>
        <P><strong>Crear préstamo:</strong> Pulsar "+ Novo préstamo". O asistente guía en 3 pasos: seleccionar usuario/a, seleccionar artigos e confirmar.</P>
        <P><strong>Devolver:</strong> No préstamo activo, pulsar "Devolver" para rexistrar a devolución. O stock dos artigos actualizarase automaticamente.</P>

        <S>4. Inventario</S>
        <P>O inventario mostra todos os tipos de artigo con unidades rexistradas. Para cada artigo vese o número de unidades dispoñibles, en préstamo e total.</P>
        <P><strong>Engadir artigo:</strong> Pulsar "+ Engadir artigo". Hai dúas opcións: engadir unidades a un artigo existente, ou crear un novo tipo de artigo personalizado.</P>
        <P><strong>Actualizar stock:</strong> Pulsar "Actualizar stock" nun artigo para cambiar o stock total. Non se pode reducir por debaixo do número de unidades en préstamo.</P>
        <P><strong>Eliminar artigo:</strong> Só se pode eliminar un artigo cando o stock total é 0 (ningunha unidade no sistema). Nese caso aparecerá a icona de papeleira.</P>

        <S>5. Informes e copias de seguridade</S>
        <P><strong>Exportar a Excel:</strong> Descarga un ficheiro .xlsx con toda a información de usuarios, préstamos e inventario.</P>
        <P><strong>Informe anual:</strong> Xera un ficheiro coa actividade dun ano concreto, listando só os/as usuarios/as que recibiron algún préstamo nese ano e os artigos prestados. Pódese xerar en formato Excel (.xlsx) ou PDF.</P>
        <P><strong>Copia de seguridade:</strong> Crea unha copia da base de datos. A copia gárdase como ficheiro .zip no directorio de datos da aplicación.</P>
        <P><strong>Restaurar copia de seguridade:</strong> Permite seleccionar un ficheiro .zip para restaurar a base de datos. <strong>Atención:</strong> esta acción é destrutiva e substitúe todos os datos actuais polos do arquivo. Recoméndase crear unha copia de seguridade antes de restaurar. Despois de restaurar, é necesario pechar e volver a abrir a aplicación.</P>

        <S>6. Rexistro de eventos</S>
        <P>Cada acción (crear usuario, crear préstamo, devolver, modificar stock...) queda rexistrada no historial de eventos. Pódese consultar na sección "Rexistro" ou pulsando o botón "Eventos" na barra superior.</P>
      </div>
    </div>
  );
}
