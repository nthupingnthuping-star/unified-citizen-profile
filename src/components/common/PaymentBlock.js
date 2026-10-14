import { useState } from 'react';

// ============================================================
// BANK + MOBILE MONEY ACCOUNTS
// ============================================================
const BANK_ACCOUNTS = {
  'Lesotho PostBank': {
    accountName: 'Government of Lesotho Revenue Account',
    accountNumber: '0100 1234 5678',
    branchCode: '700100',
    type: 'bank',
  },
  'Standard Lesotho Bank': {
    accountName: 'Revenue Services Lesotho Collection',
    accountNumber: '0601 6712 3456',
    branchCode: '060167',
    type: 'bank',
  },
  'Nedbank Lesotho': {
    accountName: 'Revenue Services Lesotho Collection',
    accountNumber: '3301 6245 6789',
    branchCode: '330162',
    type: 'bank',
  },
  'First National Bank Lesotho': {
    accountName: 'Government of Lesotho Collections',
    accountNumber: '2803 6189 0123',
    branchCode: '280361',
    type: 'bank',
  },
  'Vodacom M-Pesa': {
    merchantCode: '567890',
    type: 'mobile',
    dialCode: '*200#',
  },
  'EcoCash Lesotho': {
    merchantCode: '234567',
    type: 'mobile',
    dialCode: '*199#',
  },
};

// Fallback for any provider not listed above
const DEFAULT_MOBILE_DIAL = '*120#';

const BANK_OPTIONS = [
  { value: '', label: '— Select bank —' },
  ...Object.keys(BANK_ACCOUNTS).map((b) => ({ value: b, label: b })),
];

// ============================================================
// PAYMENT BLOCK
// ============================================================
const PaymentBlock = ({ reference, bankName, onBankChange, rows, total }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(reference);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const bank = bankName ? BANK_ACCOUNTS[bankName] : null;
  const dialCode = bank?.dialCode || DEFAULT_MOBILE_DIAL;

  return (
    <>
      {/* ---------- Payment reference ---------- */}
      <div style={{
        background: 'linear-gradient(135deg, #f0f6ff 0%, #e8f1ff 100%)',
        padding: 18,
        borderRadius: 10,
        marginBottom: 18,
        border: '1px solid #cce0ff',
      }}>
        <div style={{
          fontSize: 12,
          color: '#556',
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 'bold',
        }}>
          Payment Reference
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginTop: 8,
          flexWrap: 'wrap',
        }}>
          <div style={{
            fontSize: 20,
            fontWeight: 'bold',
            color: '#003366',
            fontFamily: 'monospace',
            letterSpacing: 1,
          }}>
            {reference}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: 'white',
              color: '#003366',
              border: '1px solid #003366',
              padding: '5px 14px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.15s ease, background 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.background = '#f0f6ff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'white';
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#666', margin: '10px 0 0 0' }}>
          Use this reference when paying. Your application will not be processed without it.
        </p>
      </div>

      {/* ---------- Bank dropdown ---------- */}
      <div style={{ marginBottom: 16 }}>
        <label style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 'bold',
          color: '#333',
          marginBottom: 6,
        }}>
          Where will you pay? *
        </label>
        <select
          value={bankName}
          onChange={(e) => onBankChange(e.target.value)}
          required
          style={{
            width: '100%',
            padding: 12,
            border: '1px solid #ccc',
            borderRadius: 8,
            fontSize: 14,
            boxSizing: 'border-box',
            background: 'white',
          }}
        >
          {BANK_OPTIONS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>

      {/* ---------- Account details (revealed on select) ---------- */}
      {bank && (
        <div style={{
          background: bank.type === 'mobile' ? '#fff8e0' : '#eef7ee',
          border: `1px solid ${bank.type === 'mobile' ? '#ffe08a' : '#a8d5b8'}`,
          borderRadius: 10,
          padding: 18,
          marginBottom: 16,
          fontSize: 13,
          color: bank.type === 'mobile' ? '#7a5a00' : '#006600',
        }}>
          <div style={{
            fontWeight: 'bold',
            marginBottom: 12,
            fontSize: 14,
            color: bank.type === 'mobile' ? '#7a5a00' : '#006600',
          }}>
            {bank.type === 'bank' ? '💳 Bank payment details' : '📱 Mobile money details'}
          </div>

          {bank.type === 'bank' ? (
            <>
              <DetailRow label="Account Name" value={bank.accountName} />
              <DetailRow label="Account Number" value={bank.accountNumber} mono />
              <DetailRow label="Branch Code" value={bank.branchCode} mono />
              <DetailRow label="Reference" value={reference} mono />
            </>
          ) : (
            <>
              <DetailRow label="Merchant Code" value={bank.merchantCode} mono />
              <DetailRow label="Reference" value={reference} mono />
              <div style={{
                marginTop: 12,
                padding: 12,
                background: 'rgba(255,255,255,0.6)',
                borderRadius: 8,
                fontSize: 12,
                lineHeight: 1.7,
                color: '#7a5a00',
              }}>
                <div style={{ marginBottom: 6 }}>
                  Dial <strong style={{ fontSize: 14 }}>{dialCode}</strong> on your phone
                  from the number registered to {bankName}.
                </div>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Enter merchant code: <strong>{bank.merchantCode}</strong></li>
                  <li>Enter reference: <strong>{reference}</strong></li>
                  <li>Enter amount shown below</li>
                  <li>Confirm with your PIN</li>
                </ol>
              </div>
            </>
          )}

          <div style={{
            marginTop: 14,
            paddingTop: 14,
            borderTop: `1px solid ${bank.type === 'mobile' ? '#ffe08a' : '#a8d5b8'}`,
            fontSize: 12,
            lineHeight: 1.6,
          }}>
            <strong>⚠ Important:</strong> Pay the exact amount shown below. Keep the
            reference safe — you will need it if you have to confirm payment.
          </div>
        </div>
      )}

      {/* ---------- Fee breakdown ---------- */}
      <div style={{
        marginTop: 16,
        background: 'white',
        border: '1px solid #ddd',
        borderRadius: 10,
        padding: 18,
        boxShadow: '0 2px 8px rgba(0, 51, 102, 0.04)',
      }}>
        <div style={{
          fontSize: 11,
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: 'bold',
          marginBottom: 12,
        }}>
          Fee Breakdown
        </div>

        {rows.map((r, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 13,
            padding: '6px 0',
            color: '#333',
          }}>
            <span>{r.label}</span>
            <span style={{ fontWeight: 'bold' }}>M {r.amount.toLocaleString()}</span>
          </div>
        ))}

        <div style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '2px solid #003366',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontWeight: 'bold', color: '#003366', fontSize: 14 }}>
            Total to pay
          </span>
          <span style={{ fontSize: 22, fontWeight: 'bold', color: '#003366' }}>
            M {total.toLocaleString()}
          </span>
        </div>
      </div>
    </>
  );
};

// ============================================================
// HELPER
// ============================================================
const DetailRow = ({ label, value, mono }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    gap: 12,
  }}>
    <span style={{ color: 'inherit', opacity: 0.85 }}>{label}:</span>
    <span style={{
      fontWeight: 'bold',
      color: '#003366',
      fontFamily: mono ? 'monospace' : 'inherit',
      letterSpacing: mono ? 1 : 0,
      wordBreak: 'break-all',
      textAlign: 'right',
    }}>
      {value}
    </span>
  </div>
);

export default PaymentBlock;