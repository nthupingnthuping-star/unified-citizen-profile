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
import '../../styles/module.css';

const StaffPensionAnalytics = () => {
  const [claims, setClaims] = useState([]);
  const [applications, setApplications] = useState([]);
  const [fundRecords, setFundRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [claimsSnap, appsSnap, fundSnap] = await Promise.all([
          getDocs(collection(db, 'pension_claims')),
          getDocs(
            query(
              collection(db, 'applications'),
              where('department_id', '==', DEPARTMENTS.PENSIONS)
            )
          ),
          getDocs(collection(db, 'pension_fund_records')),
        ]);
        setClaims(claimsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setApplications(appsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setFundRecords(fundSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error(err);
        setMessage(`Failed to load analytics: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allWork = [...claims, ...applications];

  const statusCounts = {
    pending: 0,
    processing: 0,
    audit: 0,
    approved: 0,
    rejected: 0,
    completed: 0,
  };
  allWork.forEach((c) => {
    if (statusCounts[c.status] !== undefined) statusCounts[c.status] += 1;
  });

  const decided = statusCounts.approved + statusCounts.rejected;
  const approvalRate = decided > 0 ? Math.round((statusCounts.approved / decided) * 100) : 0;

  // By service type (union of claim_type and service_type)
  const byType = {};
  allWork.forEach((c) => {
    const t = c.claim_type || c.service_type || 'unknown';
    byType[t] = (byType[t] || 0) + 1;
  });

  // Daily trend for the last 14 days
  const dailyData = [];
  const byDay = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    byDay[key] = 0;
  }
  allWork.forEach((c) => {
    const ms = c.submitted_at?.toMillis?.();
    if (ms) {
      const key = new Date(ms).toISOString().split('T')[0];
      if (byDay[key] !== undefined) byDay[key] += 1;
    }
  });
  Object.entries(byDay).forEach(([date, count]) => {
    dailyData.push({
      date,
      label: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      count,
    });
  });

  // Average processing time
  const times = [];
  allWork.forEach((c) => {
    const s = c.submitted_at?.toMillis?.();
    const e = c.approved_at?.toMillis?.() || c.completed_at?.toMillis?.();
    if (s && e) times.push((e - s) / (1000 * 60 * 60));
  });
  const avgHours = times.length > 0 ? (times.reduce((a, b) => a + b, 0) / times.length).toFixed(1) : null;

  // Fund verification counts
  const fundCounts = { pending: 0, needs_info: 0, verified: 0, rejected: 0 };
  fundRecords.forEach((r) => {
    const s = r.verification_status || 'pending';
    if (fundCounts[s] !== undefined) fundCounts[s] += 1;
  });

  const statusData = [
    { name: 'Pending', value: statusCounts.pending, fill: '#ffcc00' },
    { name: 'Processing', value: statusCounts.processing, fill: '#0066cc' },
    { name: 'Audit', value: statusCounts.audit, fill: '#856404' },
    { name: 'Approved', value: statusCounts.approved, fill: '#006600' },
    { name: 'Rejected', value: statusCounts.rejected, fill: '#cc0000' },
    { name: 'Completed', value: statusCounts.completed, fill: '#666666' },
  ].filter((s) => s.value > 0);

  const kpi = (label, value, color) => (
    <div style={{
      background: 'white',
      border: '1px solid #e0e6ef',
      borderLeft: `4px solid ${color}`,
      borderRadius: 12,
      padding: 20,
      boxShadow: '0 2px 8px rgba(0, 51, 102, 0.06)',
    }}>
      <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 'bold' }}>
        {label}
      </div>
      <div style={{ fontSize: 32, color, fontWeight: 'bold', marginTop: 8 }}>
        {value}
      </div>
    </div>
  );

  return (
    <StaffLayout title="Pensions Department — Analytics">
      <div className="module-root">
        <div className="module-header">
          <h1>Pensions Analytics</h1>
          <p>Claims, applications, and fund verification metrics</p>
        </div>

        {message && <Alert type="error" onClose={() => setMessage('')}>{message}</Alert>}

        {loading ? (
          <Card><p>Loading...</p></Card>
        ) : (
          <>
            {/* KPI ROW 1 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: 15,
              marginBottom: 20,
            }}>
              {kpi('Total Work Items', allWork.length, '#003366')}
              {kpi('Pending', statusCounts.pending, '#ffcc00')}
              {kpi('In Audit', statusCounts.audit, '#856404')}
              {kpi('Approved', statusCounts.approved, '#006600')}
              {kpi('Rejected', statusCounts.rejected, '#cc0000')}
            </div>

            {/* KPI ROW 2 */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 15,
              marginBottom: 30,
            }}>
              {kpi('Approval Rate', `${approvalRate}%`, '#006600')}
              {kpi('Avg Processing', avgHours ? `${avgHours} h` : '—', '#003366')}
              {kpi('Fund Verif. Pending', fundCounts.pending, '#ffcc00')}
              {kpi('Fund Records Verified', fundCounts.verified, '#006600')}
            </div>

            {/* BAR CHART */}
            <Card title="Work Items per Day (Last 14 Days)" style={{ marginBottom: 25 }}>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="label" fontSize={11} stroke="#666" />
                    <YAxis fontSize={11} stroke="#666" allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #ddd',
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" fill="#003366" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* PIE + TYPE TABLE */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
              marginBottom: 25,
            }}>
              <Card title="Status Breakdown">
                {statusData.length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', padding: 30 }}>
                    No work items yet.
                  </p>
                ) : (
                  <div style={{ width: '100%', height: 280 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {statusData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: 'white',
                            border: '1px solid #ddd',
                            borderRadius: 4,
                            fontSize: 12,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <Card title="By Service Type">
                {Object.keys(byType).length === 0 ? (
                  <p style={{ color: '#666', textAlign: 'center', padding: 30 }}>
                    No work items yet.
                  </p>
                ) : (
                  <Table
                    headers={['Service', 'Total']}
                    rows={Object.entries(byType).map(([type, count]) => [
                      type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                      <strong style={{ color: '#003366' }}>{count}</strong>,
                    ])}
                  />
                )}
              </Card>
            </div>

            {/* FUND VERIFICATION TABLE */}
            <Card title="Fund Verification Status" style={{ marginBottom: 25 }}>
              <Table
                headers={['Status', 'Total']}
                rows={[
                  ['Pending', <strong style={{ color: '#ffcc00' }}>{fundCounts.pending}</strong>],
                  ['Needs Info', <strong style={{ color: '#ff9933' }}>{fundCounts.needs_info}</strong>],
                  ['Verified', <strong style={{ color: '#006600' }}>{fundCounts.verified}</strong>],
                  ['Rejected', <strong style={{ color: '#cc0000' }}>{fundCounts.rejected}</strong>],
                  ['Total Records', <strong style={{ color: '#003366' }}>{fundRecords.length}</strong>],
                ]}
              />
            </Card>

            <div style={{ marginTop: 20 }}>
              <Link to="/staff/pensions" style={{ color: '#0066cc', fontSize: 14 }}>
                ← Back to Pensions Staff
              </Link>
            </div>
          </>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffPensionAnalytics;