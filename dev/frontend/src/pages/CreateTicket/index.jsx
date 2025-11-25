import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";

import styles from "./CreateTicket.module.css";
import { useBackend } from "../../context/BackendContext";

function CreateTicket() {
  const navigate = useNavigate();
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [openedBy, setOpenedBy] = useState("");
  const [description, setDescription] = useState("");
  const [status] = useState("open");
  const [message, setMessage] = useState("");

  // Estados para arquivos
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [serverImageUrls, setServerImageUrls] = useState([]);
  const [departments, setDepartments] = useState([]);

  const { backendUrl } = useBackend();

  const API_URL = backendUrl + 'tickets';
  const DEPARTMENTS_API_URL = backendUrl + 'sectors';

  // Refs para os inputs de arquivo
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  // ✅ Função para buscar os departamentos do backend
  const fetchDepartments = async () => {
    try {
      const res = await fetch(DEPARTMENTS_API_URL);
      if (!res.ok) {
        throw new Error("Erro ao buscar departamentos do backend.");
      }
      const data = await res.json();
      setDepartments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro de rede ou ao buscar departamentos:", error);
      setMessage("❌ Não foi possível carregar os departamentos.");
    }
  };

  // ✅ Chama a função de busca de departamentos quando o componente é montado
  useEffect(() => {
    fetchDepartments();
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
  const triggerFileSelect = () => fileInputRef.current?.click();

  // Handler para mudança de arquivo de imagem
  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/") && editor) {
      handleLocalImage(editor, file);
    }
    event.target.value = "";
  };

  // Novo handler para mudança de arquivos genéricos
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!uploadedFiles.some(p => p.name === file.name && p.size === file.size)) {
        setUploadedFiles((prevFiles) => [...prevFiles, file]);
      }
    }
    event.target.value = "";
  };

  // Função para remover um arquivo da lista
  const removeFile = (fileName) => {
    setUploadedFiles(uploadedFiles.filter(file => file.name !== fileName));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (!title.trim()) {
      alert("Por favor, preencha o título do ticket");
      return;
    }

    if (!department) {
      alert("Por favor, selecione um departamento");
      return;
    }

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

    // Upload de arquivos e adição dos links na descrição
    const fileLinks = [];
    for (const file of uploadedFiles) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch(`${backendUrl}upload/file`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        fileLinks.push(`<a href="${data.url}" target="_blank" rel="noopener noreferrer">${file.name}</a>`);
      } catch (error) {
        setMessage(`❌ ERRO ao enviar arquivo: ${error.message}`);
        return;
      }
    }

    // Adiciona a lista de links de arquivos ao final da descrição
    if (fileLinks.length > 0) {
      finalDescription += `
        <p><strong>Anexos:</strong></p>
        <ul>
          ${fileLinks.map(link => `<li>${link}</li>`).join('')}
        </ul>
      `;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          department,
          description: finalDescription,
          status,
          openedBy: openedBy.trim() || null
        }),
      });

      if (!res.ok) throw new Error("Erro ao criar ticket");

      const data = await res.json();
      setMessage(`✅ Ticket criado com sucesso! ID: ${data.id}`);
      
      // Limpa o formulário
      setDepartment("");
      setTitle("");
      setOpenedBy("");
      setDescription("");
      setUploadedImages([]);
      setUploadedFiles([]);
      setServerImageUrls(newServerImageUrls);
      editor.commands.clearContent();
      
      // Redireciona para home após 2 segundos
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      setMessage(`❌ ERRO: ${err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Criar Novo Ticket</h1>
        <button 
          onClick={() => navigate("/")}
          className={styles.backButton}
        >
          ← Voltar para Home
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {/* TÍTULO */}
        <div className={styles.formGroup}>
          <label htmlFor="title">Título do Ticket *</label>
          <input
            type="text"
            id="title"
            placeholder="Título do ticket"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* DEPARTAMENTO E ABERTO POR */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="department">Departamento *</label>
            <select
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
            >
              <option value="">Selecione um departamento</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="openedBy">Aberto por</label>
            <input
              type="text"
              id="openedBy"
              placeholder="Nome de quem está abrindo o ticket"
              value={openedBy}
              onChange={(e) => setOpenedBy(e.target.value)}
            />
          </div>
        </div>

        {/* DESCRIÇÃO COM EDITOR */}
        <div className={styles.formGroup}>
          <label>Descrição Detalhada</label>
          <div className={styles.editorToolbar}>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBold().run()}
              className={editor?.isActive('bold') ? styles.active : ''}
            >
              <b>B</b>
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              className={editor?.isActive('italic') ? styles.active : ''}
            >
              <i>I</i>
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              className={editor?.isActive('bulletList') ? styles.active : ''}
            >
              • Lista
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              className={editor?.isActive('orderedList') ? styles.active : ''}
            >
              1. Lista Num
            </button>
            <button type="button" onClick={triggerImageSelect}>
              🖼️ Imagem
            </button>
            <button type="button" onClick={triggerFileSelect}>
              📎 Arquivo
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
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </div>

          <div
            className={styles.editorWrapper}
            onClick={() => editor?.commands.focus()}
          >
            <EditorContent editor={editor} />
          </div>
        </div>

        {/* Lista de arquivos anexados */}
        {uploadedFiles.length > 0 && (
          <div className={styles.pdfList}>
            <strong>Arquivos anexados:</strong>
            <ul>
              {uploadedFiles.map((file, index) => (
                <li key={index}>
                  {file.name}
                  <button type="button" onClick={() => removeFile(file.name)} className={styles.removePdfBtn}>
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={() => navigate("/")}
            className={styles.cancelButton}
          >
            Cancelar
          </button>
          <button type="submit" className={styles.submitButton}>
            Criar Ticket
          </button>
        </div>
      </form>

      {message && <p className={styles.createTicketMessage}>{message}</p>}
    </div>
  );
}

export default CreateTicket;