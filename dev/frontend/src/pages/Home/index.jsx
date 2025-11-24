// dev/frontend/src/pages/Home/index.jsx (CORRIGIDO)
import { useEffect, useRef, useState } from "react";
import styles from "./Home.module.css";
import {
  Legend,
  Pie,
  PieChart,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { Link } from "react-router-dom";
import { FaCog, FaTrash, FaComment, FaDownload } from "react-icons/fa";
import { useBackend } from "../../context/BackendContext";

function Home() {
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { backendUrl } = useBackend();
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState({ autor: "", conteudo: "" });
  const [commentImage, setCommentImage] = useState(null);
  const [commentImagePreview, setCommentImagePreview] = useState(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const commentImageInputRef = useRef(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("desc");
  
  const API_URL = backendUrl + 'tickets';

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
    fetchTickets();
    fetchDepartments();
  }, []);

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

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/departments`);
      
      // Verificar se a resposta é bem-sucedida
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // CORREÇÃO: Garantir que departments seja sempre um array
      if (Array.isArray(data)) {
        setDepartments(data);
      } else {
        console.warn('Departments data is not an array:', data);
        setDepartments([]); // Definir como array vazio se não for array
      }
    } catch (err) {
      console.error(`ERROR fetching departments: ${err.message}`);
      setDepartments([]); // Em caso de erro, definir como array vazio
    }
  };

  const fetchComments = async (ticketId) => {
    try {
      const res = await fetch(`${API_URL}/${ticketId}/comments`);
      const data = await res.json();
      setComments(data);
    } catch (err) {
      console.error(`ERROR fetching comments: ${err.message}`);
    }
  };

  const addComment = async () => {
    if (!newComment.autor.trim()) {
      alert("Por favor, informe o autor do comentário");
      return;
    }

    if (!newComment.conteudo.trim() && !commentImage) {
      alert("Digite um comentário ou anexe uma imagem");
      return;
    }

    try {
      setIsSubmittingComment(true);

      let imageUrl;
      if (commentImage) {
        const formData = new FormData();
        formData.append("file", commentImage);

        const uploadRes = await fetch(`${backendUrl}upload/image`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          throw new Error("Falha ao enviar imagem do comentário");
        }

        const uploadData = await uploadRes.json();
        imageUrl = uploadData.url;
      }

      const res = await fetch(`${API_URL}/${selectedTicket.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newComment, imageUrl }),
      });

      if (res.ok) {
        setNewComment({ autor: "", conteudo: "" });
        setCommentImage(null);
        setCommentImagePreview(null);
        if (commentImageInputRef.current) {
          commentImageInputRef.current.value = "";
        }
        fetchComments(selectedTicket.id);
      }
    } catch (err) {
      console.error(`ERROR adding comment: ${err.message}`);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentImageChange = (event) => {
    const file = event.target.files?.[0];

    if (file && file.type.startsWith("image/")) {
      setCommentImage(file);
      setCommentImagePreview(URL.createObjectURL(file));
    } else {
      setCommentImage(null);
      setCommentImagePreview(null);
    }
  };

  const removeCommentImage = () => {
    setCommentImage(null);
    setCommentImagePreview(null);

    if (commentImageInputRef.current) {
      commentImageInputRef.current.value = "";
    }
  };

  const downloadPDF = async (ticketId) => {
    try {
      const res = await fetch(`${API_URL}/${ticketId}/pdf`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${ticketId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error(`ERROR downloading PDF: ${err.message}`);
    }
  };

  const visibleTickets = [...tickets].reverse().slice(0, 3);

  const handleOpenModal = (ticket) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status);
    fetchComments(ticket.id);
    setNewComment({ autor: "", conteudo: "" });
    removeCommentImage();
  };

  const handleCloseModal = () => {
    setSelectedTicket(null);
    setComments([]);
    setNewComment({ autor: "", conteudo: "" });
    setCommentImage(null);
    setCommentImagePreview(null);
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
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchDepartment = departmentFilter === "all" || t.department === departmentFilter;
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
  const paginatedTickets = sortedTickets.slice(startIndex, startIndex + ticketsPerPage);

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
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
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
            <option value="all">Todos os Departamentos</option>
            {/* CORREÇÃO: Verificar se departments é array antes de usar map */}
            {Array.isArray(departments) && departments.map((dept) => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
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
                    {ticket.openedBy && (
                      <div className={styles.ticketUser}>Por: {ticket.openedBy}</div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPDF(ticket.id);
                      }}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#1890ff",
                        cursor: "pointer",
                      }}
                      title="Baixar PDF"
                    >
                      <FaDownload style={{ width: '1.2em', height: '1.2em' }} />
                    </button>
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
                      <FaTrash style={{ width: '1.2em', height: '1.2em' }} />
                    </button>
                  </div>
                </div>
                <div
                  className={styles.ticketDesc}
                  dangerouslySetInnerHTML={{ __html: ticket.description }}
                ></div>
                {ticket.imagePath && (
                  <div className={styles.ticketImage}>
                    <img 
                      src={`${backendUrl.replace('/api/', '')}${ticket.imagePath}`} 
                      alt="Anexo" 
                      style={{ maxWidth: "100px", maxHeight: "100px", objectFit: "cover" }}
                    />
                  </div>
                )}
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
          <div className={styles.modalContent} style={{ maxWidth: "800px", width: "90%" }}>
            <h2>Ticket #{selectedTicket.id} - {selectedTicket.title}</h2>
            <p><strong>Setor:</strong> {selectedTicket.department}</p>
            {selectedTicket.openedBy && (
              <p><strong>Aberto por:</strong> {selectedTicket.openedBy}</p>
            )}
            <div dangerouslySetInnerHTML={{ __html: selectedTicket.description }}></div>

            {selectedTicket.imagePath && (
              <div style={{ margin: "15px 0" }}>
                <strong>Imagem:</strong><br />
                <img 
                  src={`${backendUrl.replace('/api/', '')}${selectedTicket.imagePath}`} 
                  alt="Anexo" 
                  style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain" }}
                />
              </div>
            )}

            <label>Status:</label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
            >
              <option value="open">Aberto</option>
              <option value="in_progress">Em andamento</option>
              <option value="closed">Fechado</option>
            </select>

            {/* Seção de Comentários */}
            <div className={styles.commentsSection}>
              <h3 className={styles.commentsHeader}>
                <FaComment /> Comentários ({comments.length})
              </h3>
              
              <div className={styles.commentsList}>
                {comments.length === 0 ? (
                  <p className={styles.noComments}>Nenhum comentário ainda</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className={styles.commentItem}>
                      <div className={styles.commentHeader}>
                        {comment.autor} - {new Date(comment.createdAt).toLocaleString('pt-BR')}
                      </div>
                      {comment.conteudo && (
                        <div className={styles.commentContent}>{comment.conteudo}</div>
                      )}
                      {comment.imageUrl && (
                        <img
                          src={comment.imageUrl}
                          alt="Imagem do comentário"
                          className={styles.commentImage}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className={styles.commentForm}>
                <input
                  type="text"
                  placeholder="Seu nome"
                  value={newComment.autor}
                  onChange={(e) => setNewComment(prev => ({ ...prev, autor: e.target.value }))}
                  className={styles.commentInput}
                />
                <textarea
                  placeholder="Digite seu comentário..."
                  value={newComment.conteudo}
                  onChange={(e) => setNewComment(prev => ({ ...prev, conteudo: e.target.value }))}
                  rows="3"
                  className={styles.commentTextarea}
                />
                <label className={styles.commentFileLabel}>
                  <input
                    type="file"
                    accept="image/*"
                    ref={commentImageInputRef}
                    onChange={handleCommentImageChange}
                    className={styles.commentFileInput}
                  />
                  {commentImage ? "Imagem selecionada" : "Anexar imagem"}
                </label>
                {commentImagePreview && (
                  <div className={styles.commentImagePreview}>
                    <img src={commentImagePreview} alt="Pré-visualização do comentário" />
                    <button type="button" onClick={removeCommentImage} className={styles.removeCommentImageBtn}>
                      Remover imagem
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={addComment}
                  className={styles.btnAddComment}
                  disabled={isSubmittingComment}
                >
                  {isSubmittingComment ? "Enviando..." : "Adicionar Comentário"}
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
              <button className={styles.btnSave} onClick={handleSaveStatus}>
                Salvar Status
              </button>
              <button 
                onClick={() => downloadPDF(selectedTicket.id)}
                style={{ 
                  padding: "8px 16px", 
                  backgroundColor: "#52c41a", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                <FaDownload /> Baixar PDF
              </button>
              <button className={styles.btnCancel} onClick={handleCloseModal}>
                Fechar
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