const RequestedInfoBanner = ({ application, onEdit }) => {
  if (!application) return null;
  if (application.status !== 'processing') return null;
  if (!application.notes && !application.rejection_reason) return null;

  const note = application.notes || application.rejection_reason;

  return (
    <div style={{
      background: '#fff8e0',
      border: '2px solid #ffcc00',
      borderRadius: 10,
      padding: 16,
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 24 }}>✉</div>
        <div style={{ flex: 1, minWidth: 240 }}>
          <div style={{
            fontSize: 15,
            fontWeight: 'bold',
            color: '#7a5a00',
            marginBottom: 6,
          }}>
            Home Affairs needs more information
          </div>
          <p style={{
            margin: '0 0 12px 0',
            fontSize: 13,
            color: '#7a5a00',
            lineHeight: 1.6,
          }}>
            <strong>Reference:</strong> {application.application_reference}
            <br />
            <strong>What they need:</strong> {note}
          </p>
          <button
            type="button"
            onClick={onEdit}
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
              color: 'white',
              padding: '10px 22px',
              borderRadius: 999,
              border: 'none',
              fontSize: 13,
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 51, 102, 0.25)',
            }}
          >
            ✎ Edit & Resubmit
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestedInfoBanner;