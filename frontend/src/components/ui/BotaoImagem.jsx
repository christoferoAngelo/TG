import { useId } from "react";
import "./BotaoImagem.css";

function IconeCamera() {
    return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
                d="M4.5 8.5A2.5 2.5 0 0 1 7 6h1.4l1.2-1.6A1.5 1.5 0 0 1 10.8 4h2.4a1.5 1.5 0 0 1 1.2.4L15.6 6H17a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 17 19H7a2.5 2.5 0 0 1-2.5-2.5v-8Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
            />
            <circle cx="12" cy="12.5" r="3.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
        </svg>
    );
}

export default function BotaoImagem({
    id,
    accept = "image/*",
    multiple = false,
    disabled = false,
    preview,
    nomeArquivo,
    rotulo = "Adicionar imagem",
    rotuloTroca = "Trocar imagem",
    dica = "PNG, JPG ou WEBP",
    compacto = false,
    onChange,
    className = ""
}) {
    const gerado = useId();
    const inputId = id || gerado;
    const temArquivo = Boolean(preview || nomeArquivo);
    const texto = temArquivo ? rotuloTroca : rotulo;

    return (
        <label
            htmlFor={inputId}
            className={[
                "btn-imagem",
                compacto ? "btn-imagem--compacto" : "",
                temArquivo ? "btn-imagem--preenchido" : "",
                disabled ? "btn-imagem--desativado" : "",
                className
            ].filter(Boolean).join(" ")}
        >
            <input
                id={inputId}
                type="file"
                className="btn-imagem__input"
                accept={accept}
                multiple={multiple}
                disabled={disabled}
                onChange={(evento) => {
                    onChange?.(evento);
                }}
            />
            {preview ? (
                <img src={preview} alt="" className="btn-imagem__preview" />
            ) : (
                <span className="btn-imagem__icone">
                    <IconeCamera />
                </span>
            )}
            <span className="btn-imagem__textos">
                <strong>{texto}</strong>
                <small>{nomeArquivo || dica}</small>
            </span>
        </label>
    );
}
