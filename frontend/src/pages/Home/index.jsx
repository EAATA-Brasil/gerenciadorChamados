import { useEffect, useState } from "react";
import "./styles.css"
import { Legend, Pie, PieChart, Tooltip, Cell } from "recharts";
import { Link } from "react-router-dom";
import { FaCog } from "react-icons/fa"

function Home() {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all"); // all | open | in_progress | closed
  const [departmentFilter, setDepartmentFilter] = useState("all"); // all | open | in_progress | closed
  const [sortOrder, setSortOrder] = useState("desc"); // desc = mais recentes primeiro

  const total = tickets.length
  const openCount = tickets.filter((t) => t.status ===  "open").length
  const inProgressCount = tickets.filter((t) => t.status ===  "in_progress").length
  const closedCount = tickets.filter((t) => t.status ===  "closed").length

  const chartData = [
    { name: "Abertos", value: openCount },
    { name: "Em andamento", value: inProgressCount },
    { name: "Fechados", value: closedCount },
  ];

  const COLORS = ["#36b37e", "#ffad00", "#de350b"];

  const API_URL = "http://localhost:3000/tickets";

  useEffect(()=>{
    const fetchTickets = async()=>{
      try{
        const res = await fetch(API_URL)
        const data = await res.json()
        setTickets(data)
      }catch(err){
        console.error(`ERROR[${err.message}]`)
      }finally{
        setLoading(false)
      }
    }

    fetchTickets()
  },[])

  const visibleTickets = tickets.toReversed().slice(0, 3);
  //modal
  const handleOpenModal = (ticket) =>{
    setSelectedTicket(ticket)
    setNewStatus(ticket.status);
  }

  const handleCloseModal = () => {
    setSelectedTicket(null);
  };

  const handleOverlayClick = (e) => {
    // Fecha o modal apenas se o clique foi no overlay, não no conteúdo
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const handleSaveStatus = async ()=>{
    if(!selectedTicket) return;
    try{
      await fetch(`${API_URL}/${selectedTicket.id}`,{
        method: "PATCH",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({status: newStatus})
      })
      setTickets( (prev) => prev.map((t) => t.id === selectedTicket.id ? {...t, status:newStatus} : t ))
      handleCloseModal()
    }catch(err){
      console.error(`ERROR[${err.message}]`)
    }
  }

  let STATUS = {
    'in_progress' : 'Em progresso',
    'closed' : 'Fechado',
    'open' : 'Aberto'
  }
  
  let filteredTickets = tickets.filter((t) => {
  const matchStatus =
    statusFilter === "all" || t.status === statusFilter;
  const matchDepartment =
    departmentFilter === "all" || t.department === departmentFilter;

  return matchStatus && matchDepartment;
});


  // Ordena por id (simulando data de criação) ou se tiver createdAt
  const sortedTickets = [...filteredTickets].sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt) : a.id;
    const bDate = b.createdAt ? new Date(b.createdAt) : b.id;

    if (sortOrder === "desc") return bDate - aDate;
    else return aDate - bDate;
  });

  // Paginação
  const ticketsPerPage = 5;
  const totalPages = Math.ceil(sortedTickets.length / ticketsPerPage);
  const startIndex = (currentPage - 1) * ticketsPerPage;
  const paginatedTickets = sortedTickets.slice(startIndex, startIndex + ticketsPerPage);

  // Lógica para mostrar apenas 5 números de página por vez
  const getVisiblePages = () => {
    const maxVisiblePages = 2;
    
    if (totalPages <= maxVisiblePages) {
      // Se há 5 ou menos páginas, mostra todas
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Ajusta o início se estivermos muito próximos do final
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const visiblePages = getVisiblePages();



return (
    <div className="home-container">
      <div className="home-header">
        <h1>Dashboard de Tickets</h1>
        {/* ✅ Botão para criar ticket */}
        <span style={{display:'flex', gap:20}}>
          <Link to="/create">
            <button className="btn btn-create">+ Novo Ticket</button>
          </Link>
          <Link to="/relatorio">
            <button className="btn btn-create">Relatório</button>
          </Link>
          <div className="settings-icon">
            <Link to="/settings">
              <FaCog size={24} color="#fff" />
            </Link>
          </div>
        </span>
      </div>
      <div className="all-tickets">
        <h2>Todos os Tickets</h2>

        {/* Filtros */}
        <div className="filters">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="open">Abertos</option>
            <option value="in_progress">Em andamento</option>
            <option value="closed">Fechados</option>
          </select>

          <select value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="Financeiro">Financeiro</option>
            <option value="Marketing">Marketing</option>
            <option value="Comercial">Comercial</option>
          </select>

          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
            <option value="desc">Mais recentes</option>
            <option value="asc">Mais antigos</option>
          </select>
        </div>

        {/* Lista paginada */}
        {!loading && paginatedTickets.length === 0 && <p>Nenhum ticket encontrado.</p>}
        {!loading && paginatedTickets.length > 0 && (
          <ul className="ticket-list">
            {paginatedTickets.map((ticket) => (
              <li
                className="ticket-item"
                key={ticket.id}
                onClick={() => handleOpenModal(ticket)}
              >
                <div className="ticket-title">{ticket.title}</div>
                <div className={`ticket-status status-${ticket.status}`}>
                  {STATUS[ticket.status]}
                </div>
                <div className="ticket-desc" dangerouslySetInnerHTML={{ __html: ticket.description }}></div>
              </li>
            ))}
          </ul>
        )}

        {/* Paginação limitada a 5 números */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ◀
            </button>

            {/* Botão para primeira página se não estiver visível */}
            {visiblePages[0] > 1 && (
              <>
                <button onClick={() => setCurrentPage(1)}>1</button>
                {visiblePages[0] > 2 && <span className="pagination-dots">...</span>}
              </>
            )}

            {/* Páginas visíveis */}
            {visiblePages.map((pageNum) => (
              <button
                key={pageNum}
                className={currentPage === pageNum ? "active" : ""}
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            {/* Botão para última página se não estiver visível */}
            {visiblePages[visiblePages.length - 1] < totalPages && (
              <>
                {visiblePages[visiblePages.length - 1] < totalPages - 1 && <span className="pagination-dots">...</span>}
                <button onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
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
      {/* Meio dividido */}
      <div className="middle-section">
        {/* Tickets recentes */}
        <div className="recent-tickets">
          <h2>Mais Recentes</h2>
          {!loading && visibleTickets.length === 0 && <p>Nenhum ticket encontrado.</p>}
          {!loading && visibleTickets.length > 0 && (
            <ul className="ticket-list">
              {visibleTickets.map((ticket) => (
                <li
                  className="ticket-item"
                  key={ticket.id}
                  onClick={() => handleOpenModal(ticket)}
                >
                  <div className="ticket-title">{ticket.title}</div>
                  {/* <div className={`ticket-status status-${ticket.status}`}>
                    {STATUS[ticket.status]}
                  </div> */}
                  <div className="ticket-desc" dangerouslySetInnerHTML={{ __html: ticket.description }}></div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Gráfico */}
        <div className="tickets-chart">
          <h2>Status Geral: {total === 1 ? `${total} ticket` : ` ${total} tickets`}</h2>
          <PieChart width={700} height={250}>
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
            <Tooltip
              contentStyle={{
                border: "1px solid #333",
              }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
            />
          </PieChart>
        </div>
      </div>

      {/* Modal com funcionalidade de fechar ao clicar fora */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="modal-content">
            <h2>Editar Ticket #{selectedTicket.id}</h2>
            <p><strong>{selectedTicket.title}</strong></p>
            <p><strong>Setor:</strong>{selectedTicket.department}</p>
            <div dangerouslySetInnerHTML={{ __html: selectedTicket.description }}></div>

            <label>Status:</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              <option value="open">Aberto</option>
              <option value="in_progress">Em andamento</option>
              <option value="closed">Fechado</option>
            </select>

            <button className="btn btn-save" onClick={handleSaveStatus}>Salvar</button>
            <button className="btn btn-cancel" onClick={handleCloseModal}>Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );


}
export default Home;


