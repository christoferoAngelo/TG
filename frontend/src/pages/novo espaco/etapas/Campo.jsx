export default function Campo({ id, label, opcional, dica, erro, span = 6, children }) {
    return (
        <div
            className={`ne-campo ne-span-${span}${erro ? " ne-campo--erro" : ""}`}
            data-erro={erro ? "true" : undefined}
        >
            <label htmlFor={id}>
                {label}
                {opcional && <span className="ne-opcional"> (opcional)</span>}
            </label>
            {children}
            {dica && !erro && <small className="ne-dica">{dica}</small>}
            {erro && <small className="ne-erro">{erro}</small>}
        </div>
    );
}
