import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";

import styles from "./CreateTicket.module.css";
import { useBackend } from "../../context/BackendContext";

function CreateTicket() {
  const [department, setDepartment] = useState("");
  const [sectors, setSectors] = useState([]); // ✅ Estado para armazenar os setores
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status] = useState("open");
  const [message, setMessage] = useState("");

  // Estados para arquivos
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedPdfs, setUploadedPdfs] = useState([]);
  const [serverImageUrls, setServerImageUrls] = useState([]);

  const { backendUrl } = useBackend();

  const API_URL = backendUrl + 'tickets';
  const SECTORS_API_URL = backendUrl + 'sectors'; // ✅ URL da API de setores

  // Refs para os inputs de arquivo
  const imageInputRef = useRef(null);
  const pdfInputRef = useRef(null);

  // ✅ Função para buscar os setores do backend
  const fetchSectors = async () => {
    try {
      const res = await fetch(SECTORS_API_URL);
      if (!res.ok) {
        throw new Error("Erro ao buscar setores do backend.");
      }
      const data = await res.json();
      setSectors(data);
    } catch (error) {
      console.error("Erro de rede ou ao buscar setores:", error);
      setMessage("❌ Não foi possível carregar os setores.");
    }
  };

  // ✅ Chama a função de busca de setores quando o componente é montado
  useEffect(() => {
    fetchSectors();
  }, []);

  const handleLocalImage = (editor, file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      editor.chain().focus().setImage({ src: url }).run();
      setUploadedImages((prevFiles) => [...prevFiles, { file, dataUrl: url }]);
    };
    reader.readAsDataURL(file);
  };

  const editor = useEditor({
    extensions: [StarterKit, Image, LinkExtension],
    content: "",
    onCreate: ({ editor }) => {
      const dom = editor.view.dom;
      dom.addEventListener("paste", (event) => {
        const items = event.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              event.preventDefault();
              handleLocalImage(editor, file);
            }
          }
        }
      });
      dom.addEventListener("drop", (event) => {
        event.preventDefault();
        const files = event.dataTransfer?.files;
        if (!files) return;
        Array.from(files).forEach((file) => {
          if (file.type.startsWith("image/")) {
            handleLocalImage(editor, file);
          }
        });
      });
    },
    onUpdate: ({ editor }) => {
      const currentHtml = editor.getHTML();
      setDescription(currentHtml);
      const parser = new DOMParser();
      const doc = parser.parseFromString(currentHtml, "text/html");
      const imgElements = Array.from(doc.querySelectorAll("img"));
      const currentImageSrcs = imgElements.map((img) => img.src);
      setUploadedImages((prevFiles) =>
        prevFiles.filter((fileObj) =>
          currentImageSrcs.includes(fileObj.dataUrl)
        )
      );
    },
  });

  // Funções para disparar o clique nos inputs
  const triggerImageSelect = () => imageInputRef.current?.click();
  const triggerPdfSelect = () => pdfInputRef.current?.click();

  // Handler para mudança de arquivo de imagem
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/") && editor) {
      handleLocalImage(editor, file);
    }
    event.target.value = "";
  };

  // Novo handler para mudança de arquivo PDF
  const handlePdfChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type === "application/pdf") {
      // Evita adicionar o mesmo arquivo duas vezes
      if (!uploadedPdfs.some(p => p.name === file.name)) {
        setUploadedPdfs((prevPdfs) => [...prevPdfs, file]);
      }
    }
    event.target.value = "";
  };

  // Função para remover um PDF da lista
  const removePdf = (fileName) => {
    setUploadedPdfs(uploadedPdfs.filter(pdf => pdf.name !== fileName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let currentImageUrlsInEditor = [];
    editor.state.doc.descendants((node) => {
      if (node.type.name === "image" && node.attrs.src) {
        currentImageUrlsInEditor.push(node.attrs.src);
      }
    });
    const removedImageUrls = serverImageUrls.filter(
      (url) => !currentImageUrlsInEditor.includes(url)
    );
    for (const url of removedImageUrls) {
      try {
        const filename = url.split("/").pop();
        await fetch(`${backendUrl}upload/image/${filename}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error(`Erro ao remover imagem ${url} do servidor:`, error);
      }
    }

    let finalDescription = description;
    const newServerImageUrls = [];

    // Upload de imagens
    for (const fileObj of uploadedImages) {
      const formData = new FormData();
      formData.append("file", fileObj.file);
      try {
        const res = await fetch(`${backendUrl}upload/image`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        newServerImageUrls.push(data.url);
        finalDescription = finalDescription.replace(fileObj.dataUrl, data.url);
      } catch (error) {
        setMessage(`❌ ERRO ao enviar imagem: ${error.message}`);
        return;
      }
    }

    // Upload de PDFs e adição dos links na descrição
    const pdfLinks = [];
    for (const pdfFile of uploadedPdfs) {
      const formData = new FormData();
      formData.append("file", pdfFile);
      try {
        const res = await fetch(`${backendUrl}upload/file`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        pdfLinks.push(`<a href="${data.url}" target="_blank" rel="noopener noreferrer">${pdfFile.name}</a>`);
      } catch (error) {
        setMessage(`❌ ERRO ao enviar PDF: ${error.message}`);
        return;
      }
    }

    // Adiciona a lista de links de PDF ao final da descrição
    if (pdfLinks.length > 0) {
      finalDescription += `
        <p><strong>Anexos:</strong></p>
        <ul>
          ${pdfLinks.map(link => `<li>${link}</li>`).join('')}
        </ul>
      `;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department,
          title,
          description: finalDescription,
          status,
        }),
      });

      if (!res.ok) throw new Error("Erro ao criar ticket");

      const data = await res.json();
      setMessage(`✅ Ticket criado com sucesso! ID: ${data.id}`);
      setDepartment("");
      setTitle("");
      setDescription("");
      setUploadedImages([]);
      setUploadedPdfs([]); // Limpa a lista de PDFs
      setServerImageUrls(newServerImageUrls);
      editor.commands.clearContent();
    } catch (err) {
      setMessage(`❌ ERRO: ${err.message}`);
    }
  };

  return (
    <div className={styles.createTicketContainer}>
      <div className={styles.header}>
        <h1>Criar Novo Ticket</h1>
        <span style={{ display: "flex", gap: 20 }}>
          <Link to="/">
            <button className={styles.btnCreate}>Home</button>
          </Link>
        </span>
      </div>

      <form className={styles.createTicketForm} onSubmit={handleSubmit}>
        <label>Categoria</label>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          required
        >
          <option value="" disabled>
            Selecione seu setor
          </option>
          {/* ✅ Renderiza dinamicamente as opções com base no estado 'sectors' */}
          {sectors.map((sector) => (
            <option key={sector.id} value={sector.name}>
              {sector.name}
            </option>
          ))}
        </select>

        <label>Título</label>
        <input
          type="text"
          placeholder="Título do ticket"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <label>Descrição detalhada</label>
        <div className={styles.editorToolbar}>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBold().run()}
          >
            <b>B</b>
          </button>
          <button
            type="button"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          >
            • Lista
          </button>
          <button type="button" onClick={triggerImageSelect}>
            🖼️ Upload de imagem
          </button>
          <button type="button" onClick={triggerPdfSelect}>
            📄 Upload de PDF
          </button>
          <input
            type="file"
            accept="image/*"
            ref={imageInputRef}
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
          <input
            type="file"
            accept="application/pdf"
            ref={pdfInputRef}
            onChange={handlePdfChange}
            style={{ display: "none" }}
          />
        </div>

        <div
          className={styles.editorWrapper}
          onClick={() => editor?.commands.focus()}
        >
          <EditorContent editor={editor} />
        </div>

        {/* Lista de PDFs anexados */}
        {uploadedPdfs.length > 0 && (
          <div className={styles.pdfList}>
            <strong>PDFs anexados:</strong>
            <ul>
              {uploadedPdfs.map((pdf, index) => (
                <li key={index}>
                  {pdf.name}
                  <button type="button" onClick={() => removePdf(pdf.name)} className={styles.removePdfBtn}>
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button type="submit" className={styles.btnSave}>
          Criar Ticket
        </button>
      </form>

      {message && <p className={styles.createTicketMessage}>{message}</p>}
    </div>
  );
}

export default CreateTicket;