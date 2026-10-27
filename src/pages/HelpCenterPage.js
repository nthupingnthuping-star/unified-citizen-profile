// src/pages/HelpCenterPage.js
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/firebase'; // Adjust path
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/common/Layout';
import Card from '../components/common/Card';
import Alert from '../components/common/Alert';
import { DEPARTMENTS } from '../firebase/db';

const HelpCenterPage = () => {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({ 
    department: '', 
    message: '' 
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department) return setError('Please select a department.');
    
    setSubmitting(true);
    setError('');
    
    try {
      await addDoc(collection(db, 'support_tickets'), {
        citizen_id: user.uid,
        citizen_name: profile.full_name,
        citizen_email: profile.email,
        citizen_phone: profile.phone_number || '',
        department_id: Number(formData.department),
        message: formData.message,
        status: 'open',
        reply: null,
        createdAt: serverTimestamp()
      });
      
      setSubmitted(true);
      setFormData({ department: '', message: '' });
    } catch (err) {
      console.error("Error sending message: ", err);
      setError("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout title="Help Center">
      <div style={{ maxWidth: 800, margin: '0 auto', paddingTop: 20 }}>
        
        <Card>
          <h2 style={{ color: '#003366', marginTop: 0 }}>How can we help you?</h2>
          <p style={{ color: '#666', marginBottom: 20 }}>
            Find answers to common questions or send a direct message to a department.
          </p>

          <div style={{ background: '#f0f9ff', padding: 24, borderRadius: 8, border: '1px solid #e0f2fe', marginBottom: 24 }}>
            <h3 style={{ marginTop: 0, color: '#0f172a', fontSize: 18 }}>Contact Support</h3>
            <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.8 }}>
              <div><strong>Phone:</strong> +266 2222 0000 (Mon-Fri, 8am - 4pm)</div>
              <div><strong>Email:</strong> support@ucps.gov.ls</div>
            </div>
          </div>

          {/* CUSTOM QUESTION FORM */}
          <h3 style={{ color: '#003366', fontSize: 18, marginBottom: 12 }}>Ask a Department</h3>
          {submitted ? (
            <Alert type="success" onClose={() => setSubmitted(false)}>
              Your question has been sent to the department. You will receive a reply in your notifications soon.
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0' }}>
              {error && <div style={{ color: '#cc0000', marginBottom: 12, fontSize: 13 }}>{error}</div>}
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>Which department is this for? *</label>
                <select 
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 6, fontSize: 14 }}
                >
                  <option value="">-- Select a Department --</option>
                  <option value={DEPARTMENTS.HOME_AFFAIRS}>Home Affairs (ID, Passports)</option>
                  <option value={DEPARTMENTS.FINANCE}>Finance (Tax, RSL)</option>
                  <option value={DEPARTMENTS.TRAFFIC}>Traffic (License, Vehicles)</option>
                  <option value={DEPARTMENTS.POLICE}>Police (Clearance)</option>
                  <option value={DEPARTMENTS.PENSIONS}>Pensions (Old Age, Grants)</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 'bold', marginBottom: 6 }}>Your Question *</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  placeholder="Type your question here..."
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: 6, resize: 'vertical' }}
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                style={{ background: '#003366', color: 'white', border: 'none', padding: '12px 24px', borderRadius: 6, fontSize: 14, fontWeight: 'bold', cursor: submitting ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Sending...' : 'Send Question'}
              </button>
            </form>
          )}
        </Card>

        {/* FAQs */}
        <div style={{ marginTop: 30 }}>
          <h2 style={{ color: '#003366', fontSize: 20, marginBottom: 16 }}>Frequently Asked Questions</h2>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12, padding: 16 }}>
            <strong>How do I verify my identity?</strong>
            <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: 14 }}>Go to your dashboard and click "Verify My Identity".</p>
          </div>
          <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 12, padding: 16 }}>
            <strong>I forgot my password. What do I do?</strong>
            <p style={{ color: '#666', margin: '8px 0 0 0', fontSize: 14 }}>Click "Forgot Password" on the login screen to receive a reset link.</p>
          </div>
        </div>

      </div>
    </Layout>
  );
};

export default HelpCenterPage;