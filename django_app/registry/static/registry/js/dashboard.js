const modal = document.getElementById("record-modal");
const openModalBtn = document.getElementById("open-modal");
const closeModalBtn = document.getElementById("close-modal");
const form = document.getElementById("record-form");
const recordsBody = document.getElementById("records-body");
const searchInput = document.getElementById("search");
const formErrors = document.getElementById("form-errors");

function toggleModal(open) {
  if (!modal) return;
  if (open) {
    modal.showModal();
  } else {
    modal.close();
    form.reset();
    formErrors.textContent = "";
  }
}

openModalBtn?.addEventListener("click", () => toggleModal(true));
closeModalBtn?.addEventListener("click", () => toggleModal(false));

function createRow(record) {
  const tr = document.createElement("tr");
  tr.dataset.row = "";
  tr.innerHTML = `
    <td>${record.client_name}</td>
    <td>${record.vci_serial ?? ""}</td>
    <td>${record.tablet_serial ?? ""}</td>
    <td>${record.prog_serial ?? ""}</td>
    <td>
      <div>${record.email ?? ""}</div>
      <div class="muted">${record.phone ?? ""}</div>
    </td>
    <td>${record.request_text ?? ""}</td>
    <td>
      <div class="photos-list">
        ${record.photos.length ? record.photos.map((url, index) => `<a href="${url}" target="_blank">Foto ${index + 1}</a>`).join("") : "<span class='muted'>Sem fotos</span>"}
      </div>
    </td>
    <td><span class="muted">${new Date(record.created_at).toLocaleString()}</span></td>
  `;
  return tr;
}

function prependRecord(record) {
  const tr = createRow(record);
  recordsBody?.prepend(tr);
}

function filterRows(term) {
  const rows = recordsBody?.querySelectorAll("tr[data-row]") ?? [];
  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term.toLowerCase()) ? "" : "none";
  });
}

searchInput?.addEventListener("input", (event) => {
  filterRows(event.target.value);
});

function getCsrfToken() {
  return window.CSRF_TOKEN || document.querySelector("[name=csrfmiddlewaretoken]")?.value;
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const data = new FormData(form);
  formErrors.textContent = "";

  const response = await fetch("/records/create/", {
    method: "POST",
    headers: {
      "X-CSRFToken": getCsrfToken(),
    },
    body: data,
  });

  if (!response.ok) {
    const result = await response.json();
    formErrors.textContent = result.errors ? Object.values(result.errors).flat().join(". ") : "Erro ao salvar";
    return;
  }

  const record = await response.json();
  prependRecord(record);
  toggleModal(false);
});

function startWebsocket() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  const socket = new WebSocket(`${protocol}://${window.location.host}/ws/records/`);

  socket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === "record.created") {
      prependRecord(payload.data);
    }
  });

  socket.addEventListener("close", () => {
    setTimeout(startWebsocket, 1000);
  });
}

startWebsocket();
