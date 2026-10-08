import { useState, useEffect } from 'react';
import {
  getPoliceEmergencyReports,
  getPoliceDocumentApplications,
} from '../../firebase/db';
import StaffLayout from '../common/StaffLayout';
import Alert from '../common/Alert';
import StaffPoliceEmergency from './StaffPoliceEmergency';
import StaffPoliceDocuments from './StaffPoliceDocuments';
import '../../styles/module.css';

const StaffPolice = () => {
  const [view, setView] = useState('emergency');
  const [emergencyCount, setEmergencyCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [emergencies, documents] = await Promise.all([
          getPoliceEmergencyReports(),
          getPoliceDocumentApplications('pending'),
        ]);
        setEmergencyCount(emergencies.length);
        setDocumentCount(documents.length);
      } catch (err) {
        console.error(err);
      }
    };
    loadCounts();
    const timer = setInterval(loadCounts, 20000);
    return () => clearInterval(timer);
  }, []);

  return (
    <StaffLayout title="Lesotho Mounted Police Service — Staff Portal">
      <div className="module-root">
        <div className="module-header">
          <h1>Lesotho Mounted Police Service</h1>
          <p>Respond to emergency reports and process clearance applications</p>
        </div>

        <Alert type="info">
          Respond to emergency reports immediately. Process police clearance applications from the Documents tab.
        </Alert>

        <div className="module-tabs" style={{ marginBottom: 20 }}>
          <button
            onClick={() => setView('emergency')}
            className={`module-tab ${view === 'emergency' ? 'active' : ''}`}
            style={view === 'emergency' ? {
              background: 'linear-gradient(135deg, #8b0000 0%, #cc0000 100%)',
              color: 'white',
              borderColor: 'transparent',
              boxShadow: '0 6px 18px rgba(204, 0, 0, 0.28)',
            } : {}}
          >
            🚨 Emergencies
            {emergencyCount > 0 && (
              <span style={{
                background: 'white',
                color: '#cc0000',
                borderRadius: 12,
                padding: '2px 10px',
                fontSize: 12,
                fontWeight: 'bold',
                marginLeft: 8,
              }}>
                {emergencyCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setView('documents')}
            className={`module-tab ${view === 'documents' ? 'active' : ''}`}
          >
            📄 Documents
            {documentCount > 0 && (
              <span style={{
                background: 'white',
                color: '#003366',
                borderRadius: 12,
                padding: '2px 10px',
                fontSize: 12,
                fontWeight: 'bold',
                marginLeft: 8,
              }}>
                {documentCount}
              </span>
            )}
          </button>
        </div>

        {view === 'emergency' ? <StaffPoliceEmergency /> : <StaffPoliceDocuments />}
      </div>
    </StaffLayout>
  );
};

export default StaffPolice;