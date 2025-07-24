import { useContext, useEffect, useState } from "react";
import styles from "./Home.module.css"; // ✅ usando CSS module
import {
  Legend,
  Pie,
  PieChart,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { FaCog, FaTrash } from "react-icons/fa";
import { useBackend } from "../../context/BackendContext";

function Home() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { backendUrl } = useBackend();
  
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  
  const API_URL = backendUrl+'tickets';
  console.log(API_URL, tickets);

  const total = tickets.length;
  const openCount = tickets.filter((t) => t.status === "open").length;
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
  const closedCount = tickets.filter((t) => t.status === "closed").length;

  const chartData = [
    { name: "Abertos", value: openCount || 0 },
    { name: "Em andamento", value: inProgressCount || 0 },
    { name: "Fechados", value: closedCount || 0 },
  ];

  const COLORS = ["#36b37e", "#ffad00", "#de350b"];

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setTickets(data);
      } catch (err) {
        console.error(`ERROR[${err.message}]`);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, []);

  const visibleTickets = [...tickets].reverse().slice(0, 3);

  const handleOpenModal = (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
  };

  const handleCloseModal = () => {
    setSelectedTicket(null);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) handleCloseModal();
  };

  const handleSaveStatus = async () => {
    if (!selectedTicket) return;
    try {
      await fetch(`${API_URL}/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        
      });
      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id ? { ...t, status: newStatus } : t
        )
      );
      handleCloseModal();
    } catch (err) {
      console.error(`ERROR[${err.message}]`);
    }
  };

  const deleteTicket = async (id, closeModalAfter = false) => {
    if (!window.confirm("Tem certeza que deseja excluir este ticket?")) return;

    try {
      const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao deletar ticket");

      setTickets((prev) => prev.filter((t) => t.id !== id));

      if (closeModalAfter) handleCloseModal();
    } catch (err) {
      console.error(`Erro ao deletar ticket: ${err.message}`);
      alert("❌ Erro ao deletar ticket");
    }
  };

  const STATUS = {
    in_progress: "Em progresso",
    closed: "Fechado",
    open: "Aberto",
  };

  let filteredTickets = tickets.filter((t) => {
    const matchStatus =
      statusFilter === "all" || t.status === statusFilter;
    const matchDepartment =
      departmentFilter === "all" || t.department === departmentFilter;
    return matchStatus && matchDepartment;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt) : a.id;
    const bDate = b.createdAt ? new Date(b.createdAt) : b.id;
    return sortOrder === "desc" ? bDate - aDate : aDate - bDate;
  });

  const ticketsPerPage = 5;
  const totalPages = Math.ceil(sortedTickets.length / ticketsPerPage);
  const startIndex = (currentPage - 1) * ticketsPerPage;
  const paginatedTickets = sortedTickets.slice(
    startIndex,
    startIndex + ticketsPerPage
  );

  const getVisiblePages = () => {
    const maxVisiblePages = 2;
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    return Array.from(
      { length: endPage - startPage + 1 },
      (_, i) => startPage + i
    );
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeHeader}>
        <h1>Dashboard de Tickets</h1>
        <span style={{ display: "flex", gap: 20 }}>
          <Link to="/create">
            <button className={styles.btnCreate}>+ Novo Ticket</button>
          </Link>
          <Link to="/relatorio">
            <button className={styles.btnCreate}>Relatório</button>
          </Link>
          <div className={styles.settingsIcon}>
            <Link to="/settings">
              <FaCog size={24} color="#fff" />
            </Link>
          </div>
        </span>
      </div>

      <div className={styles.allTickets}>
        <h2>Todos os Tickets</h2>

        <div className={styles.filters}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="open">Abertos</option>
            <option value="in_progress">Em andamento</option>
            <option value="closed">Fechados</option>
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Marketing">Marketing</option>
            <option value="Comercial">Comercial</option>
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Mais recentes</option>
            <option value="asc">Mais antigos</option>
          </select>
        </div>

        {!loading && paginatedTickets.length === 0 && (
          <p>Nenhum ticket encontrado.</p>
        )}
        {!loading && paginatedTickets.length > 0 && (
          <ul className={styles.ticketList}>
            {paginatedTickets.map((ticket) => (
              <li
                className={styles.ticketItem}
                key={ticket.id}
                onClick={() => handleOpenModal(ticket)}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div className={styles.ticketTitle}>{ticket.title}</div>
                    <div className={`${styles.ticketStatus} ${styles[`status-${ticket.status}`]}`}>
                      {STATUS[ticket.status]}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTicket(ticket.id);
                    }}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ff4d4f",
                      cursor: "pointer",
                    }}
                    title="Excluir ticket"
                  >
                    <FaTrash style={{width: '1.5em', height:'1.5em'}}/>
                  </button>
                </div>
                <div
                  className={styles.ticketDesc}
                  dangerouslySetInnerHTML={{ __html: ticket.description }}
                ></div>
              </li>
            ))}
          </ul>
        )}

        {totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ◀
            </button>

            {visiblePages[0] > 1 && (
              <>
                <button onClick={() => setCurrentPage(1)}>1</button>
                {visiblePages[0] > 2 && (
                  <span className={styles.paginationDots}>...</span>
                )}
              </>
            )}

            {visiblePages.map((pageNum) => (
              <button
                key={pageNum}
                className={currentPage === pageNum ? styles.active : ""}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                  <span className={styles.paginationDots}>...</span>
                )}
                <button onClick={() => setCurrentPage(totalPages)}>
                  {totalPages}
                </button>
              </>
            )}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
            >
              ▶
            </button>
          </div>
        )}
      </div>

      <div className={styles.middleSection}>
        <div className={styles.recentTickets}>
          <h2>Mais Recentes</h2>
          {!loading && visibleTickets.length === 0 && (
            <p>Nenhum ticket encontrado.</p>
          )}
          {!loading && visibleTickets.length > 0 && (
            <ul className={styles.ticketList}>
              {visibleTickets.map((ticket) => (
                <li
                  className={styles.ticketItem}
                  key={ticket.id}
                  onClick={() => handleOpenModal(ticket)}
                >
                  <div className={styles.ticketTitle}>{ticket.title}</div>
                  <div
                    className={styles.ticketDesc}
                    dangerouslySetInnerHTML={{ __html: ticket.description }}
                  ></div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ✅ Corrigido gráfico responsivo + fallback se não houver tickets */}
        <div className={styles.ticketsChart}>
          <h2>
            Status Geral:{" "}
            {total === 0
              ? "Nenhum ticket"
              : total === 1
              ? "1 ticket"
              : `${total} tickets`}
          </h2>

          {total === 0 ? (
            <p>Nenhum dado para exibir</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ border: "1px solid #333" }} />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {selectedTicket && (
        <div className={styles.modalOverlay} onClick={handleOverlayClick}>
          <div className={styles.modalContent}>
            <h2>Editar Ticket #{selectedTicket.id}</h2>
            <p>
              <strong>{selectedTicket.title}</strong>
            </p>
            <p>
              <strong>Setor:</strong> {selectedTicket.department}
            </p>
            <div
              dangerouslySetInnerHTML={{ __html: selectedTicket.description }}
            ></div>

            <label>Status:</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="open">Aberto</option>
              <option value="in_progress">Em andamento</option>
              <option value="closed">Fechado</option>
            </select>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button className={styles.btnSave} onClick={handleSaveStatus}>
                Salvar
              </button>
              <button className={styles.btnCancel} onClick={handleCloseModal}>
                Cancelar
              </button>
              <button
                className={styles.btnCancel}
                style={{ background: "#ff4d4f" }}
                onClick={() => deleteTicket(selectedTicket.id, true)}
              >
                Excluir Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
