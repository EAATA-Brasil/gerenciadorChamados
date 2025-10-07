import React, { useState, useEffect } from "react";
import styles from "./Relatorio.module.css";
import {
  Pie,
  PieChart,
  Cell,
  Tooltip,
  Legend,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Link } from "react-router-dom";
import { useBackend } from "../../context/BackendContext";

function Relatorio() {
  const [reportType, setReportType] = useState("weekly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sectors, setSectors] = useState([]);
  const [selectedSector, setSelectedSector] = useState("");
  const { backendUrl } = useBackend();
  
  const API_URL = backendUrl+"tickets";
  const SECTORS_API_URL = `${backendUrl}sectors`;

  const fetchSectors = async () => {
    try {
      const res = await fetch(SECTORS_API_URL);
      if (res.ok) {
        const data = await res.json();
        setSectors(data);
      } else {
        console.error("Erro ao buscar setores");
      }
    } catch (error) {
      console.error("Erro de rede ao buscar setores:", error);
    }
  };

  const COLORS = ["#36b37e", "#ffad00", "#de350b"];

  useEffect(() => {
    fetchSectors();
  }, [SECTORS_API_URL]);

  useEffect(() => {
    const today = new Date();
    let start, end;

    switch (reportType) {
      case "weekly":
        start = new Date(today);
        start.setDate(today.getDate() - 7);
        end = new Date(today);
        end.setDate(end.getDate() + 1);
        break;
      case "monthly":
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth()+1, 0);
        break;
      case "yearly":
        start = new Date(today.getFullYear() - 0, 0, 1);
        end = new Date(today.getFullYear() - 0, 11, 31);
        break;
      default:
        start = new Date(today);
        end = new Date(today);
        end.setDate(end.getDate() + 1);
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, [reportType]);

 const handleGenerateReport = async () => {
  if (!startDate || !endDate) {
    setError("Por favor, selecione as datas de início e fim.");
    return;
  }

  setError(null);
  setLoading(true);
  setReportData(null);

  try {
    // ✅ ROTA CORRETA - está funcionando!
    const ticketsResponse = await fetch(
      `${backendUrl}tickets/report/period?startDate=${startDate}&endDate=${endDate}${selectedSector ? `&sector=${selectedSector}` : ''}`
    );

    // console.log('Request URL:', `${backendUrl}tickets/report/period?startDate=${startDate}&endDate=${endDate}`);
    // console.log('Response status:', ticketsResponse.status);
    
    // ✅ CORREÇÃO: Use apenas .text() OU .json(), não ambos
    const responseText = await ticketsResponse.text();
    // console.log('Raw response length:', responseText.length);
    
    if (!ticketsResponse.ok) {
      throw new Error(`Erro HTTP: ${ticketsResponse.status} - ${responseText}`);
    }
    
    let fetchedTickets;
    try {
      fetchedTickets = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Erro ao fazer parse JSON:', parseError);
      throw new Error('Resposta da API não é JSON válido');
    }
    
    // console.log('Parsed data type:', typeof fetchedTickets);
    // console.log('Is Array:', Array.isArray(fetchedTickets));
    // console.log('Quantidade de tickets:', fetchedTickets.length);

    // ✅ A API já retorna um array - ótimo!
    // Mas vamos garantir que seja sempre um array
    if (!Array.isArray(fetchedTickets)) {
      fetchedTickets = [];
    }
    
    // console.log('Final tickets array:', fetchedTickets);

    // ✅ FILTRO POR SETOR (se necessário)
    if (selectedSector && fetchedTickets.length > 0) {
      fetchedTickets = fetchedTickets.filter(ticket => 
        ticket && ticket.department === selectedSector
      );
      console.log('Após filtro por setor:', fetchedTickets.length);
    }

    // ✅ AGORA pode usar filter com segurança
    const resolved = fetchedTickets.filter((t) => t.status === "closed").length;
    const inProgress = fetchedTickets.filter((t) => t.status === "in_progress").length;
    const open = fetchedTickets.filter((t) => t.status === "open").length;

    const now = new Date();
    const completedOnTime = fetchedTickets.filter((t) => {
      if (t.dueDate) {
        return (
          t.status === "closed" &&
          t.closedAt &&
          new Date(t.closedAt) <= new Date(t.dueDate)
        );
      } else {
        return t.status === "closed" && t.closedAt;
      }
    }).length;

    const overdue = fetchedTickets.filter(
      (t) =>
        t.status !== "closed" &&
        t.dueDate &&
        new Date(t.dueDate) < now
    ).length;

    const statusData = [
      { name: "Abertos", value: open },
      { name: "Em andamento", value: inProgress },
      { name: "Fechados", value: resolved },
    ];

    const departmentData = sectors.map(sector => ({
      name: sector.name,
      value: fetchedTickets.filter(t => t.department === sector.name).length
    }));

    const data = {
      title: `Relatório ${
        reportType === "weekly"
          ? "Semanal"
          : reportType === "monthly"
          ? "Mensal"
          : "Anual"
      }`,
      period: `${startDate} a ${endDate}`,
      summary: `Este relatório apresenta uma análise detalhada dos tickets no período selecionado. Foram analisados ${fetchedTickets.length} tickets no total.`,
      tickets: fetchedTickets,
      statusData,
      departmentData,
      metrics: {
        total: fetchedTickets.length,
        resolved,
        pending: open + inProgress,
        completedOnTime,
        overdue,
        completionRate:
          fetchedTickets.length > 0
            ? Math.round((resolved / fetchedTickets.length) * 100)
            : 0,
        avgResolutionTime: "2.5 dias",
      },
    };

    setReportData(data);
    console.log('Relatório gerado com sucesso!');
    
  } catch (err) {
    setError(`Erro ao gerar relatório: ${err.message}`);
    console.error('Erro detalhado:', err);
  } finally {
    setLoading(false);
  }
  };

  const handleDownloadPdf = async () => {
    if (!reportData) return;

    try {
      setLoading(true);
      const response = await fetch(`${backendUrl}report/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reportData,
          reportType,
          startDate,
          endDate,
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorio-${reportType}-${startDate}-${endDate}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        setError("Erro ao gerar PDF.");
      }
    } catch (err) {
      setError("Erro ao baixar o relatório.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Mapeamento para status CSS classes (camelCase)
  const statusClasses = {
    open: styles.statusOpen,
    in_progress: styles.statusInProgress,
    closed: styles.statusClosed,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Dashboard de Tickets</h1>
        <span style={{ display: "flex", gap: 20 }}>
          <Link to="/">
            <button className={styles.btnCreate}>Home</button>
          </Link>
        </span>
      </div>

      <div className={styles.reportControls}>
        <div className={styles.controlGroup}>
          <label>
            Tipo de Relatório:
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
              <option value="yearly">Anual</option>
            </select>
          </label>
        </div>

        <div className={styles.controlGroup}>
          <label>
            Data de Início:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </label>
        </div>

        <div className={styles.controlGroup}>
          <label>
            Data de Fim:
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </label>
        </div>

        <div className={styles.controlGroup}>
          <label>
            Setor:
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
            >
              <option value="">Todos</option>
              {sectors.map((sector) => (
                <option key={sector.id} value={sector.name}>
                  {sector.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          className={styles.btnCreate}
          onClick={handleGenerateReport}
          disabled={loading || !startDate || !endDate}
        >
          {loading ? "Gerando..." : "Gerar Relatório"}
        </button>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}

      {reportData && (
        <div className={styles.reportPreview}>
          <div className={styles.reportHeader}>
            <h2>{reportData.title}</h2>
            <p className={styles.reportPeriod}>Período: {reportData.period}</p>
            <p className={styles.reportSummary}>{reportData.summary}</p>
          </div>

          <div className={styles.reportMetrics}>
            <div className={styles.metricCard}>
              <h3>Total de Tickets</h3>
              <span className={styles.metricValue}>
                {reportData.metrics.total}
              </span>
            </div>
            <div className={styles.metricCard}>
              <h3>Resolvidos</h3>
              <span
                className={`${styles.metricValue} ${styles.resolved}`}
              >
                {reportData.metrics.resolved}
              </span>
            </div>
            <div className={styles.metricCard}>
              <h3>Pendentes</h3>
              <span
                className={`${styles.metricValue} ${styles.pending}`}
              >
                {reportData.metrics.pending}
              </span>
            </div>
            <div className={styles.metricCard}>
              <h3>Concluídos no prazo</h3>
              <span className={styles.metricValue}>
                {reportData.metrics.completedOnTime}
              </span>
            </div>
            <div className={styles.metricCard}>
              <h3>Em atraso</h3>
              <span
                className={`${styles.metricValue} ${styles.overdue}`}
              >
                {reportData.metrics.overdue}
              </span>
            </div>
          </div>

          <div className={styles.reportCharts}>
            <div className={styles.chartContainer}>
              <h3>Status dos Tickets</h3>
              <PieChart width={400} height={300}>
                <Pie
                  data={reportData.statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>

            <div className={styles.chartContainer}>
              <h3>Tickets por Departamento</h3>
              <BarChart width={400} height={300} data={reportData.departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#36b37e" />
              </BarChart>
            </div>
          </div>

          <div className={styles.reportActions}>
            <button
              className={styles.btnSave}
              onClick={handleDownloadPdf}
              disabled={loading}
            >
              {loading ? "Gerando PDF..." : "Baixar Relatório em PDF"}
            </button>
          </div>

          <div className={styles.reportTickets}>
            <h3>Detalhes dos Tickets</h3>
            <ul className={styles.ticketList}>
              {reportData.tickets.map((ticket) => (
                <li key={ticket.id} className={styles.ticketItem}>
                  <div className={styles.ticketTitle}>
                    #{ticket.id} - {ticket.title}
                  </div>
                  <div className={styles.ticketMeta}>
                    <span
                      className={`${styles.ticketStatus} ${
                        statusClasses[ticket.status] || ""
                      }`}
                    >
                      {ticket.status === "open"
                        ? "Aberto"
                        : ticket.status === "in_progress"
                        ? "Em andamento"
                        : "Fechado"}
                    </span>
                    <span className={styles.ticketDepartment}>
                      {ticket.department}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default Relatorio;