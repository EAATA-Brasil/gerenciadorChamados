import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";

import styles from "./CreateTicket.module.css";
import { useBackend } from "../../context/BackendContext";

function CreateTicket() {
  const [department, setDepartment] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status] = useState("open");
  const [message, setMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [serverImageUrls, setServerImageUrls] = useState([]);
  const { backendUrl } = useBackend();

  const API_URL = backendUrl+'tickets';
  console.log(backendUrl);
  
  const fileInputRef = useRef(null);

  const handleLocalImage = (editor, file) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      editor.chain().focus().setImage({ src: url }).run();
      setUploadedFiles((prevFiles) => [...prevFiles, { file, dataUrl: url }]);
    };
    reader.readAsDataURL(file);
  };

  const editor = useEditor({
    extensions: [StarterKit, Image, LinkExtension],
    content: "",
    onCreate: ({ editor }) => {
      // ✅ DOM do editor agora está pronto
      const dom = editor.view.dom;

      // Evento de colar imagem
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

      // Evento de arrastar/soltar imagem
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

      // Extrai as imagens que ainda estão no conteúdo
      const parser = new DOMParser();
      const doc = parser.parseFromString(currentHtml, "text/html");
      const imgElements = Array.from(doc.querySelectorAll("img"));
      const currentImageSrcs = imgElements.map((img) => img.src);

      // Mantém apenas os arquivos ainda presentes no conteúdo
      setUploadedFiles((prevFiles) =>
        prevFiles.filter((fileObj) =>
          currentImageSrcs.includes(fileObj.dataUrl)
        )
      );
    },
  });

  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/") && editor) {
      handleLocalImage(editor, file);
    }
    event.target.value = "";
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
        await fetch(`http://localhost:3000/upload/image/${filename}`, {
          method: "DELETE",
        });
        console.log(`Imagem ${filename} removida do servidor.`);
      } catch (error) {
        console.error(`Erro ao remover imagem ${url} do servidor:`, error);
      }
    }

    let finalDescription = description;
    const newServerImageUrls = [];

    for (const fileObj of uploadedFiles) {
      const formData = new FormData();
      formData.append("file", fileObj.file);
      try {
        const res = await fetch("http://localhost:3000/upload/image", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        newServerImageUrls.push(data.url);
        finalDescription = finalDescription.replace(fileObj.dataUrl, data.url);
      } catch (error) {
        console.error("Erro ao enviar imagem durante o submit:", error);
        setMessage(`❌ ERRO ao enviar imagem: ${error.message}`);
        return;
      }
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
      setUploadedFiles([]);
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
          <option value="Financeiro">Financeiro</option>
          <option value="Marketing">Marketing</option>
          <option value="Comercial">Comercial</option>
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
          <button type="button" onClick={triggerFileSelect}>
            📁 Upload de imagem
          </button>
          <input
            type="file"
            accept="image/*"
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

        <button type="submit" className={styles.btnSave}>
          Criar Ticket
        </button>
      </form>

      {message && <p className={styles.createTicketMessage}>{message}</p>}
    </div>
  );
}

export default CreateTicket;
