import { useState } from 'react';

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
  },
  'EcoCash Lesotho': {
    merchantCode: '234567',
    type: 'mobile',
  },
};

const BANK_OPTIONS = [
  { value: '', label: '— Select bank —' },
  ...Object.keys(BANK_ACCOUNTS).map((b) => ({ value: b, label: b })),
];

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

  return (
    <>
      {/* Payment reference */}
      <div style={{ background: '#f0f6ff', padding: 16, borderRadius: 6, marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: '#666', textTransform: 'uppercase', letterSpacing: 1 }}>
          Payment Reference
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', color: '#003366', fontFamily: 'monospace' }}>
            {reference}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            style={{
              background: 'white',
              color: '#003366',
              border: '1px solid #003366',
              padding: '4px 12px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#666', margin: '8px 0 0 0' }}>
          Use this reference when paying. Your application will not be processed without it.
        </p>
      </div>

      {/* Bank dropdown */}
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
            padding: 10,
            border: '1px solid #ccc',
            borderRadius: 6,
            fontSize: 14,
            boxSizing: 'border-box',
          }}
        >
          {BANK_OPTIONS.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
      </div>

      {/* Account details revealed when a bank is chosen */}
      {bank && (
        <div style={{
          background: '#fff8e0',
          border: '1px solid #ffe08a',
          borderRadius: 6,
          padding: 16,
          marginBottom: 16,
          fontSize: 13,
          color: '#7a5a00',
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: 10, fontSize: 14, color: '#7a5a00' }}>
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
              <div style={{ marginTop: 10, fontSize: 12 }}>
                Dial <strong>*120#</strong> on your phone, or open the {bankName} app.
                Enter the merchant code, then the reference, then the amount.
              </div>
            </>
          )}

          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: '1px solid #ffe08a',
            fontSize: 12,
          }}>
            <strong>⚠ Important:</strong> Pay the exact amount shown below. Keep the
            reference safe — you will need it if you have to confirm payment.
          </div>
        </div>
      )}

      {/* Fee breakdown */}
      <div style={{ marginTop: 16, background: 'white', border: '1px solid #ddd', borderRadius: 6, padding: 16 }}>
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
          marginTop: 10,
          paddingTop: 10,
          borderTop: '2px solid #003366',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 'bold', color: '#003366' }}>Total to pay</span>
          <span style={{ fontSize: 20, fontWeight: 'bold', color: '#003366' }}>
            M {total.toLocaleString()}
          </span>
        </div>
      </div>
    </>
  );
};

const DetailRow = ({ label, value, mono }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    gap: 12,
  }}>
    <span style={{ color: '#7a5a00' }}>{label}:</span>
    <span style={{
      fontWeight: 'bold',
      color: '#003366',
      fontFamily: mono ? 'monospace' : 'inherit',
      letterSpacing: mono ? 1 : 0,
    }}>
      {value}
    </span>
  </div>
);

export default PaymentBlock;