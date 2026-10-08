import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getPendingVerifications,
  verifyCitizen,
  getDepartmentApplications,
  updateApplicationStatus,
  DEPARTMENTS,
} from '../../firebase/db';
import StaffLayout from '../common/StaffLayout';
import Alert from '../common/Alert';
import Badge from '../common/Badge';
import Table from '../common/Table';
import '../../styles/module.css';

const StaffHomeAffairs = () => {
  const { profile } = useAuth();
  const [view, setView] = useState('verification');

  // -------- Verification state --------
  const [pending, setPending] = useState([]);
  const [searchId, setSearchId] = useState('');
  const [loadingPending, setLoadingPending] = useState(true);
  const [verificationMsg, setVerificationMsg] = useState('');

  // -------- Document requests state --------
  const [applications, setApplications] = useState([]);
  const [docStatus, setDocStatus] = useState('pending');
  const [loadingApps, setLoadingApps] = useState(true);
  const [appMsg, setAppMsg] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);

  // -------- Loaders --------
  const loadPending = async () => {
    setLoadingPending(true);
    try {
      const data = await getPendingVerifications();
      setPending(data);
    } catch (err) {
      console.error(err);
      setVerificationMsg('Failed to load pending verifications.');
    } finally {
      setLoadingPending(false);
    }
  };

  const loadApplications = async () => {
    setLoadingApps(true);
    try {
      const data = await getDepartmentApplications(DEPARTMENTS.HOME_AFFAIRS, docStatus);
      setApplications(data);
    } catch (err) {
      console.error(err);
      setAppMsg('Failed to load document requests.');
    } finally {
      setLoadingApps(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadPending(); }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (view === 'documents') loadApplications();
  }, [view, docStatus]);

  // -------- Actions --------
  const handleVerify = async (citizenId) => {
    try {
      await verifyCitizen(citizenId, profile.uid);
      setVerificationMsg('Citizen verified successfully.');
      loadPending();
    } catch (err) {
      console.error(err);
      setVerificationMsg(`Error: ${err.message}`);
    }
  };

  const handleDocAction = async (appId, action, reason) => {
    try {
      await updateApplicationStatus(appId, action, profile.uid, reason || '');
      setAppMsg(
        action === 'request-info'
          ? 'Application sent back for more information.'
          : `Application ${action === 'approve' ? 'approved' : 'rejected'}.`
      );
      setSelectedApp(null);
      loadApplications();
    } catch (err) {
      console.error(err);
      setAppMsg(`Error: ${err.message}`);
    }
  };

  const filteredPending = pending.filter((c) => {
    if (!searchId.trim()) return true;
    const q = searchId.trim().toLowerCase();
    return (
      (c.national_id || '').toLowerCase().includes(q) ||
      (c.full_name || '').toLowerCase().includes(q)
    );
  });

  const docStatusTabs = [
    { key: 'pending', label: 'Pending' },
    { key: 'processing', label: 'Processing' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' },
    { key: 'all', label: 'All' },
  ];

  const statusColor = (s) => {
    if (s === 'approved' || s === 'completed') return 'green';
    if (s === 'rejected') return 'red';
    if (s === 'processing') return 'yellow';
    return 'gray';
  };

  return (
    <StaffLayout title="Ministry of Home Affairs — Staff Portal">
      <div className="module-root">
        <div className="module-header">
          <h1>Ministry of Home Affairs</h1>
          <p>Verify citizen identities and process document requests</p>
        </div>

        <Alert type="info">
          Only Home Affairs can verify citizen identity. Once verified, all other ministries
          can serve the citizen.
        </Alert>

        <div className="module-tabs" style={{ marginBottom: 20 }}>
          <button
            onClick={() => setView('verification')}
            className={`module-tab ${view === 'verification' ? 'active' : ''}`}
          >
            Verification Queue
            {pending.length > 0 && (
              <span style={{
                background: 'white',
                color: '#003366',
                borderRadius: 12,
                padding: '2px 10px',
                fontSize: 12,
                fontWeight: 'bold',
                marginLeft: 8,
              }}>
                {pending.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setView('documents')}
            className={`module-tab ${view === 'documents' ? 'active' : ''}`}
          >
            Document Requests
          </button>
        </div>

        {/* ============ VERIFICATION QUEUE ============ */}
        {view === 'verification' && (
          <>
            {verificationMsg && (
              <Alert
                type={verificationMsg.toLowerCase().includes('error') || verificationMsg.toLowerCase().includes('failed') ? 'error' : 'success'}
                onClose={() => setVerificationMsg('')}
              >
                {verificationMsg}
              </Alert>
            )}

            <div className="module-card" style={{ marginBottom: 20 }}>
              <div className="module-section-title">Search Pending Citizen</div>
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Search by National ID or name..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  fontSize: 14,
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div className="module-card">
              <div className="module-section-title">Pending Verification Requests</div>

              {loadingPending ? (
                <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
              ) : filteredPending.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>
                  {searchId.trim() ? 'No matching citizen found.' : 'No pending verification requests.'}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {filteredPending.map((c) => (
                    <div key={c.id} style={{
                      border: '1px solid #e0e6ef',
                      borderRadius: 10,
                      padding: 16,
                      background: 'white',
                      boxShadow: '0 2px 8px rgba(0, 51, 102, 0.06)',
                    }}>
                      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        {/* Photo */}
                        <div>
                          <div style={{
                            fontSize: 10, color: '#888', textTransform: 'uppercase',
                            letterSpacing: 1, marginBottom: 6,
                          }}>
                            Photo
                          </div>
                          <div style={{
                            width: 100,
                            height: 100,
                            borderRadius: 8,
                            background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 36,
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            boxShadow: '0 2px 8px rgba(0, 51, 102, 0.15)',
                          }}>
                            {c.photo_url ? (
                              <img
                                src={c.photo_url}
                                alt={c.full_name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              />
                            ) : (
                              '👤'
                            )}
                          </div>
                        </div>

                        {/* Supporting document */}
                        <div>
                          <div style={{
                            fontSize: 10, color: '#888', textTransform: 'uppercase',
                            letterSpacing: 1, marginBottom: 6,
                          }}>
                            {c.id_document_type || 'Supporting Document'}
                          </div>
                          {c.id_document_url ? (
                            <a
                              href={c.id_document_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'flex',
                                width: 140,
                                height: 100,
                                borderRadius: 8,
                                border: '1px solid #cce0ff',
                                background: '#f0f6ff',
                                color: '#003366',
                                fontSize: 12,
                                fontWeight: 'bold',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textDecoration: 'none',
                                textAlign: 'center',
                                padding: 8,
                                boxSizing: 'border-box',
                              }}
                            >
                              📄 View Document
                            </a>
                          ) : (
                            <div style={{
                              width: 140,
                              height: 100,
                              borderRadius: 8,
                              border: '1px dashed #ccc',
                              background: '#f9f9f9',
                              color: '#999',
                              fontSize: 11,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textAlign: 'center',
                              padding: 8,
                              boxSizing: 'border-box',
                            }}>
                              No document uploaded — requires in-person verification
                            </div>
                          )}
                        </div>

                        {/* Details */}
                        <div style={{ flex: 1, minWidth: 240 }}>
                          <div style={{ fontSize: 16, fontWeight: 'bold', color: '#003366' }}>
                            {c.full_name}
                          </div>
                          <div style={{ fontSize: 13, color: '#666', marginTop: 4 }}>
                            National ID: <strong>{c.national_id}</strong>
                          </div>
                          <div style={{ fontSize: 13, color: '#666' }}>
                            Date of Birth: {c.date_of_birth || '—'}
                          </div>
                          <div style={{ fontSize: 13, color: '#666' }}>
                            Gender: {c.gender || '—'}
                          </div>
                          <div style={{ fontSize: 13, color: '#666' }}>
                            Submitted: {c.created_at?.toDate?.().toLocaleDateString() || '—'}
                          </div>
                        </div>

                        {/* Action */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <button
                            onClick={() => handleVerify(c.id)}
                            style={{
                              background: 'linear-gradient(135deg, #006600 0%, #008800 100%)',
                              color: 'white',
                              border: 'none',
                              padding: '10px 22px',
                              borderRadius: 999,
                              fontSize: 13,
                              fontWeight: 'bold',
                              cursor: 'pointer',
                              boxShadow: '0 4px 14px rgba(0, 102, 0, 0.25)',
                            }}
                          >
                            ✓ Verify
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* ============ DOCUMENT REQUESTS ============ */}
        {view === 'documents' && (
          <>
            {appMsg && (
              <Alert
                type={appMsg.toLowerCase().includes('error') || appMsg.toLowerCase().includes('failed') ? 'error' : 'success'}
                onClose={() => setAppMsg('')}
              >
                {appMsg}
              </Alert>
            )}

            <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {docStatusTabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setDocStatus(t.key)}
                  style={{
                    padding: '8px 18px',
                    background: docStatus === t.key
                      ? 'linear-gradient(135deg, #003366 0%, #0055aa 100%)'
                      : 'white',
                    color: docStatus === t.key ? 'white' : '#333',
                    border: docStatus === t.key ? '1px solid transparent' : '1px solid #ddd',
                    borderRadius: 999,
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: docStatus === t.key ? 'bold' : 'normal',
                    boxShadow: docStatus === t.key ? '0 4px 12px rgba(0, 51, 102, 0.2)' : 'none',
                    transition: 'all 0.25s ease',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="module-card">
              <div className="module-section-title">Document Requests — {docStatus}</div>

              {loadingApps ? (
                <div style={{ padding: 30, textAlign: 'center' }}>Loading...</div>
              ) : applications.length === 0 ? (
                <div style={{ padding: 30, textAlign: 'center', color: '#666' }}>
                  No requests in this category.
                </div>
              ) : (
                <Table
                  headers={['Reference', 'Citizen', 'Document', 'Submitted', 'Status', 'Action']}
                  rows={applications.map((a) => [
                    a.application_reference,
                    a.citizen_name,
                    a.service_type,
                    a.submitted_at?.toDate?.().toLocaleDateString() || '—',
                    <Badge color={statusColor(a.status)}>{a.status}</Badge>,
                    <button
                      onClick={() => setSelectedApp(a)}
                      style={{
                        background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '6px 14px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0, 51, 102, 0.2)',
                      }}
                    >
                      Review
                    </button>,
                  ])}
                />
              )}
            </div>
          </>
        )}

        {selectedApp && (
          <DocumentReviewModal
            application={selectedApp}
            onClose={() => setSelectedApp(null)}
            onAction={handleDocAction}
          />
        )}
      </div>
    </StaffLayout>
  );
};

// ============================================================
// DOCUMENT REVIEW MODAL
// ============================================================
const DocumentReviewModal = ({ application, onClose, onAction }) => {
  const [reason, setReason] = useState('');
  const [showReason, setShowReason] = useState(false);
  const [pendingAction, setPendingAction] = useState('');

  const data = application.application_data || {};
  const uploads = data.documents_uploaded || {};
  const legacyDeclared = data.documents_declared || {};

  const askReason = (action) => {
    setPendingAction(action);
    setShowReason(true);
  };

  const confirm = () => {
    if (!reason.trim()) return alert('Please enter a reason.');
    onAction(application.id, pendingAction, reason.trim());
  };

  const btnGreen = { background: 'linear-gradient(135deg, #006600 0%, #008800 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 102, 0, 0.25)' };
  const btnBlue = { background: 'linear-gradient(135deg, #003366 0%, #0055aa 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0, 51, 102, 0.25)' };
  const btnRed = { background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)', color: 'white', border: 'none', padding: '10px 22px', borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 14px rgba(204, 0, 0, 0.25)' };

  const hasUploads = uploads.national_id || uploads.police_report || uploads.supporting;
  const hasLegacyDeclared = legacyDeclared.national_id || legacyDeclared.police_report || legacyDeclared.supporting;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
      zIndex: 1000, display: 'flex', alignItems: 'center',
      justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        background: 'white', borderRadius: 12, maxWidth: 680,
        width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ margin: 0, color: '#003366', fontSize: 20 }}>
            {application.service_type}
          </h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <Section title="Citizen">
          <Field label="Full Name" value={application.citizen_name} />
          <Field label="National ID" value={application.citizen_national_id} />
        </Section>

        <Section title="Request">
          <Field label="Document" value={application.service_type} />
          <Field label="Reference" value={application.application_reference} />
          <Field label="Reason" value={data.reason} />
          <Field label="Collection Branch" value={data.collection_branch} />
          <Field label="Processing Time" value={data.processing_time} />
          <Field label="Fee" value={data.fees?.total ? `M ${data.fees.total}` : 'Free'} />
        </Section>

        {hasUploads && (
          <Section title="Documents Uploaded by Citizen">
            {uploads.national_id && (
              <DocumentLink label="National ID / Police Report" url={uploads.national_id} />
            )}
            {uploads.police_report && (
              <DocumentLink label="Police Report" url={uploads.police_report} />
            )}
            {uploads.supporting && (
              <DocumentLink label="Supporting Document" url={uploads.supporting} />
            )}
          </Section>
        )}

        {hasLegacyDeclared && (
          <Section title="Documents Declared (legacy)">
            <Field label="Current National ID" value={legacyDeclared.national_id ? 'Yes' : 'No'} />
            <Field label="Police Report" value={legacyDeclared.police_report ? 'Yes' : 'No'} />
            <Field label="Supporting Documents" value={legacyDeclared.supporting ? 'Yes' : 'No'} />
          </Section>
        )}

        {showReason ? (
          <div style={{ marginTop: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>
              Reason for "{pendingAction}" *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              style={{ width: '100%', padding: 10, border: '1px solid #ccc', borderRadius: 6, boxSizing: 'border-box' }}
            />
            <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
              <button onClick={confirm} style={{
                background: pendingAction === 'reject'
                  ? 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)'
                  : 'linear-gradient(135deg, #003366 0%, #0055aa 100%)',
                color: 'white', border: 'none', padding: '10px 20px',
                borderRadius: 999, fontSize: 14, fontWeight: 'bold', cursor: 'pointer',
              }}>
                Confirm {pendingAction}
              </button>
              <button onClick={() => { setShowReason(false); setReason(''); }} style={{
                background: 'white', color: '#333', border: '1px solid #ccc',
                padding: '10px 20px', borderRadius: 999, fontSize: 14, cursor: 'pointer',
              }}>
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 24, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => onAction(application.id, 'approve', 'Approved')} style={btnGreen}>
              ✓ Approve
            </button>
            <button onClick={() => askReason('request-info')} style={btnBlue}>
              ✉ Request Info
            </button>
            <button onClick={() => askReason('reject')} style={btnRed}>
              ✗ Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================
// REUSABLE PIECES
// ============================================================
const Section = ({ title, children }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{
      fontSize: 11, color: '#888', textTransform: 'uppercase',
      letterSpacing: 1, fontWeight: 'bold', marginBottom: 8,
    }}>
      {title}
    </div>
    <div style={{ background: '#f9f9f9', borderRadius: 6, padding: 12 }}>{children}</div>
  </div>
);

const Field = ({ label, value }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
    <span style={{ color: '#666' }}>{label}:</span>
    <span style={{ fontWeight: 'bold', color: '#003366', textAlign: 'right', maxWidth: '65%' }}>
      {value || '—'}
    </span>
  </div>
);

const DocumentLink = ({ label, url }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
    <span style={{ color: '#666' }}>{label}:</span>
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      style={{
        color: '#0055aa',
        fontWeight: 'bold',
        textDecoration: 'underline',
      }}
    >
      📄 View Document
    </a>
  </div>
);

export default StaffHomeAffairs;