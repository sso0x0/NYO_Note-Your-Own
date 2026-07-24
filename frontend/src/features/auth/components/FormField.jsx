function FormField({ label, name, type = 'text', value, onChange, onBlur, error, placeholder, hint }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label htmlFor={name} style={{ fontSize: '13px', color: 'var(--text)' }}>
                {label}
            </label>
            <input
                id={name}
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                placeholder={placeholder}
                style={{
                    borderColor: error ? '#e05252' : 'var(--border)',
                }}
            />
            {error ? (
                <span style={{ fontSize: '12px', color: '#e05252' }}>
                    {error}
                </span>
            ) : hint ? (
                <span style={{ fontSize: '12px', color: '#999' }}>
                    {hint}
                </span>
            ) : null}
        </div>
    );
}

export default FormField;