import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, DEPARTMENTS } from '../../firebase/db';
import StaffLayout from '../common/StaffLayout';
import Card from '../common/Card';
import Alert from '../common/Alert';
import Table from '../common/Table';

const StaffFinanceAnalytics = () => {
  const [apps, setApps] = useState([]);
  const [tins, setTins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const appsQ = query(collection(db, 'applications'), where('department_id', '==', DEPARTMENTS.FINANCE));
        const appsSnap = await getDocs(appsQ);
        setApps(appsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

        const tinSnap = await getDocs(collection(db, 'tin_registrations'));
        setTins(tinSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        setMessage(`Failed to load analytics: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // --- Apps metrics
  const appCounts = { pending: 0, processing: 0, approved: 0, rejected: 0, completed: 0 };
  apps.forEach((a) => { if (appCounts[a.status] !== undefined) appCounts[a.status] += 1; });
  const appDecided = appCounts.approved + appCounts.rejected;
  const appRate = appDecided > 0 ? Math.round((appCounts.approved / appDecided) * 100) : 0;

  const byService = {};
  apps.forEach((a) => {
    const k = a.service_type || 'Other';
    byService[k] = (byService[k] || 0) + 1;
  });

  // --- TIN metrics
  const tinCounts = { pending: 0, processing: 0, approved: 0, rejected: 0 };
  tins.forEach((t) => { if (tinCounts[t.status] !== undefined) tinCounts[t.status] += 1; });
  const tinDecided = tinCounts.approved + tinCounts.rejected;
  const tinRate = tinDecided > 0 ? Math.round((tinCounts.approved / tinDecided) * 100) : 0;

  const tinByType = { Individual: 0, Business: 0 };
  tins.forEach((t) => { if (tinByType[t.taxpayer_type] !== undefined) tinByType[t.taxpayer_type] += 1; });

  // --- Daily data
  const buildDaily = (list) => {
    const byDay = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = d.toISOString().split('T')[0];
      byDay[k] = 0;
    }
    list.forEach((x) => {
      const ms = x.submitted_at?.toMillis?.();
      if (ms) {
        const k = new Date(ms).toISOString().split('T')[0];
        if (byDay[k] !== undefined) byDay[k] += 1;
      }
    });
    return Object.entries(byDay).map(([date, count]) => ({
      date,
      label: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      count,
    }));
  };
  const appDaily = buildDaily(apps);
  const tinDaily = buildDaily(tins);

  const statusData = [
    { name: 'Pending', value: appCounts.pending, fill: '#ffcc00' },
    { name: 'Processing', value: appCounts.processing, fill: '#0066cc' },
    { name: 'Approved', value: appCounts.approved, fill: '#006600' },
    { name: 'Rejected', value: appCounts.rejected, fill: '#cc0000' },
    { name: 'Completed', value: appCounts.completed, fill: '#666' },
  ].filter((s) => s.value > 0);

  const kpi = (label, value, color) => (
    <div style={{ background: 'white', border: '1px solid #ddd', borderLeft: `4px solid ${color}`, borderRadius: 8, padding: 20 }}>
      <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold' }}>{label}</div>
      <div style={{ fontSize: 32, color, fontWeight: 'bold', marginTop: 8 }}>{value}</div>
    </div>
  );

  return (
    <StaffLayout title="Finance / RSL — Analytics">
      <Alert type="info">Tax clearance, PAYE refunds, and TIN registration metrics</Alert>
      {message && <Alert type="error" onClose={() => setMessage('')}>{message}</Alert>}

      {loading ? <Card><p>Loading...</p></Card> : (
        <>
          {/* ---- Applications section ---- */}
          <h2 style={{ color: '#003366', fontSize: 18, marginTop: 20, marginBottom: 10 }}>Applications (Tax Clearance & PAYE)</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, marginBottom: 20 }}>
            {kpi('Total Applications', apps.length, '#003366')}
            {kpi('Pending', appCounts.pending, '#ffcc00')}
            {kpi('Approved', appCounts.approved, '#006600')}
            {kpi('Rejected', appCounts.rejected, '#cc0000')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 15, marginBottom: 30 }}>
            {kpi('Approval Rate', `${appRate}%`, '#006600')}
            {kpi('Unique Services', Object.keys(byService).length, '#1a1a5e')}
          </div>

          <Card title="Applications per Day (Last 14 Days)" style={{ marginBottom: 25 }}>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={appDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" fontSize={11} stroke="#666" />
                  <YAxis fontSize={11} stroke="#666" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#003366" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 40 }}>
            <Card title="Application Status">
              {statusData.length === 0 ? <p style={{ color: '#666', textAlign: 'center', padding: 30 }}>No applications yet.</p> : (
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }) => `${name}: ${value}`}>
                        {statusData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'white', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
            <Card title="Top Services">
              {Object.keys(byService).length === 0 ? <p style={{ color: '#666', textAlign: 'center', padding: 30 }}>No services yet.</p> : (
                <Table
                  headers={['Service', 'Total']}
                  rows={Object.entries(byService).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, <strong style={{ color: '#003366' }}>{v}</strong>])}
                />
              )}
            </Card>
          </div>

          {/* ---- TIN section ---- */}
          <h2 style={{ color: '#003366', fontSize: 18, marginTop: 20, marginBottom: 10 }}>TIN Registrations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, marginBottom: 20 }}>
            {kpi('Total TIN Requests', tins.length, '#003366')}
            {kpi('Pending', tinCounts.pending, '#ffcc00')}
            {kpi('Approved', tinCounts.approved, '#006600')}
            {kpi('Rejected', tinCounts.rejected, '#cc0000')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 15, marginBottom: 30 }}>
            {kpi('TIN Approval Rate', `${tinRate}%`, '#006600')}
            {kpi('Individual', tinByType.Individual, '#0066cc')}
            {kpi('Business', tinByType.Business, '#1a1a5e')}
            {kpi('Processing', tinCounts.processing, '#0066cc')}
          </div>

          <Card title="TIN Registrations per Day (Last 14 Days)" style={{ marginBottom: 25 }}>
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer>
                <BarChart data={tinDaily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="label" fontSize={11} stroke="#666" />
                  <YAxis fontSize={11} stroke="#666" allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'white', border: '1px solid #ddd', borderRadius: 4, fontSize: 12 }} />
                  <Bar dataKey="count" fill="#1a1a5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div style={{ marginTop: 20 }}>
            <Link to="/staff/finance" style={{ color: '#0066cc', fontSize: 14 }}>← Back to Finance Staff</Link>
          </div>
        </>
      )}
    </StaffLayout>
  );
};

export default StaffFinanceAnalytics;