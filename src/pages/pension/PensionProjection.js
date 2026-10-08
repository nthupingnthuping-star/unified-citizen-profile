import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyFundRecord, calculateProjection, RETIREMENT_AGES } from '../../firebase/db';
import { useAuth } from '../../contexts/AuthContext';
import Layout from '../../components/common/Layout';
import Card from '../../components/common/Card';

const PensionProjection = () => {
  const { user } = useAuth();
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentAge, setCurrentAge] = useState('');
  const [retirementAge, setRetirementAge] = useState(60);
  const [monthlyContribution, setMonthlyContribution] = useState('');
  const [annualReturnRate, setAnnualReturnRate] = useState(5);
  const [annualSalaryGrowth, setAnnualSalaryGrowth] = useState(3);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!user?.uid) return;
      try {
        const data = await getMyFundRecord(user.uid);
        setRecord(data);
        if (data?.employment_branch) {
          setRetirementAge(RETIREMENT_AGES[data.employment_branch] || 60);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const handleCalculate = () => {
    if (!record || !currentAge || !monthlyContribution) {
      alert('Please enter your current age and monthly contribution.');
      return;
    }
    const projection = calculateProjection({
      currentFundCredit: record.total_fund_credit || 0,
      currentAge: Number(currentAge),
      retirementAge: Number(retirementAge),
      monthlyContribution: Number(monthlyContribution),
      annualReturnRate: Number(annualReturnRate),
      annualSalaryGrowth: Number(annualSalaryGrowth),
    });
    if (!projection) {
      alert('Retirement age must be greater than current age.');
      return;
    }
    setResult(projection);
  };

  const fmt = (n) =>
    n == null ? '—' : `M ${Number(n).toLocaleString('en-LS', { maximumFractionDigits: 0 })}`;

  return (
    <Layout title="Retirement Projection Calculator">
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>Loading...</div>
      ) : !record ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 30 }}>
            <h2 style={{ color: '#003366' }}>No Fund Record Found</h2>
            <p style={{ color: '#666' }}>You need an active pension fund record to use the projection tool.</p>
            <Link to="/pensions" style={{ color: '#0066cc' }}>← Back to Pensions</Link>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={labelMini}>Current Fund Credit</div>
                <div style={{ fontSize: 22, fontWeight: 'bold', color: '#003366' }}>
                  {fmt(record.total_fund_credit)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={labelMini}>Employment Branch</div>
                <div style={{ fontSize: 15, fontWeight: 'bold', color: '#003366' }}>
                  {record.employment_branch || 'Public Service'}
                </div>
              </div>
            </div>
          </Card>

          <div style={{ marginTop: 20 }}>
            <Card title="Your Inputs">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
                <Field label="Current Age" value={currentAge} onChange={setCurrentAge} type="number" />
                <Field label="Retirement Age" value={retirementAge} onChange={setRetirementAge} type="number" />
                <Field label="Monthly Contribution (M)" value={monthlyContribution} onChange={setMonthlyContribution} type="number" />
                <Field label="Annual Return Rate (%)" value={annualReturnRate} onChange={setAnnualReturnRate} type="number" />
                <Field label="Annual Salary Growth (%)" value={annualSalaryGrowth} onChange={setAnnualSalaryGrowth} type="number" />
              </div>
              <button
                onClick={handleCalculate}
                style={{
                  marginTop: 20, background: '#003366', color: 'white', border: 'none',
                  padding: '12px 24px', borderRadius: 6, fontSize: 15, fontWeight: 'bold', cursor: 'pointer',
                }}
              >
                Calculate Projection
              </button>
            </Card>
          </div>

          {result && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                color: 'white', borderRadius: 8, padding: 28,
              }}>
                <div style={{ fontSize: 12, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Projected Fund Credit at Age {retirementAge}
                </div>
                <div style={{ fontSize: 36, fontWeight: 'bold', marginTop: 6 }}>
                  {fmt(result.projectedFundCredit)}
                </div>
                <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                  In {result.yearsToRetirement} year{result.yearsToRetirement === 1 ? '' : 's'}
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <Card title="Retirement Breakdown">
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <tbody>
                      <Row label="Maximum Lump Sum (50%)" value={fmt(result.maxLumpSum)} />
                      <Row label="Annuity Balance (50%)" value={fmt(result.annuityBalance)} />
                      <Row label="Estimated Monthly Annuity" value={`${fmt(result.estimatedMonthlyAnnuity)} / month`} bold />
                    </tbody>
                  </table>
                </Card>
              </div>

              <p style={{ fontSize: 12, color: '#888', marginTop: 16 }}>
                This is an estimate only. Actual values depend on fund performance, salary changes,
                and government pension regulations in force at the time of retirement.
              </p>
            </div>
          )}

          <div style={{ marginTop: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/pension/statement" style={btnSecondary}>View Statement</Link>
            <Link to="/pensions" style={btnSecondary}>← Back to Pensions</Link>
          </div>
        </>
      )}
    </Layout>
  );
};

const Field = ({ label, value, onChange, type = 'text' }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12, color: '#666', marginBottom: 4 }}>{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: '100%', padding: '10px 12px', border: '1px solid #ccc',
        borderRadius: 6, fontSize: 14, boxSizing: 'border-box',
      }}
    />
  </div>
);

const Row = ({ label, value, bold }) => (
  <tr style={{ borderBottom: '1px solid #eee' }}>
    <td style={{ padding: '10px 0', color: '#666' }}>{label}</td>
    <td style={{ padding: '10px 0', textAlign: 'right', color: '#003366', fontWeight: bold ? 'bold' : 'normal' }}>
      {value}
    </td>
  </tr>
);

const labelMini = { fontSize: 11, color: '#888', textTransform: 'uppercase' };
const btnSecondary = {
  background: 'white', color: '#003366', border: '1px solid #003366',
  padding: '10px 18px', borderRadius: 6, textDecoration: 'none', fontSize: 14,
};

export default PensionProjection;