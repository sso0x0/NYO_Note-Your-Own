// 회원가입/로그인 폼에서 공용으로 쓰는 입력 필드.
// error가 있으면 빨간 테두리 + 에러 메시지를, error가 없고 hint가 있으면 회색 안내문구를 보여준다.
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
                // 유효성 검사 실패 메시지 (우선순위 높음)
                <span style={{ fontSize: '12px', color: '#e05252' }}>
                    {error}
                </span>
            ) : hint ? (
                // 에러가 없을 때만 보여주는 보조 안내문구 (예: 비밀번호 조건 등)
                <span style={{ fontSize: '12px', color: '#999' }}>
                    {hint}
                </span>
            ) : null}
        </div>
    );
}

export default FormField;