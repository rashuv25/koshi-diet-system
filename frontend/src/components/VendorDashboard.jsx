import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import Spinner from './Spinner';
import NepaliDate from 'nepali-date-converter';

const wardNames = [
  { label: 'Ortho', value: 'ortho' },
  { label: 'Gyno', value: 'gyno' },
  { label: 'Emergency', value: 'emergency' },
  { label: 'Medical', value: 'medical' }
];

const VendorDashboard = () => {
  const { API_BASE_URL, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]); // All users with department
  const [patientRecords, setPatientRecords] = useState([]); // All patient records for today
  const [wardPatients, setWardPatients] = useState({}); // { ward: [patients] }

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Get today's date in YYYY-MM-DD
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayStr = `${yyyy}-${mm}-${dd}`;
  // Nepali date for display
  const bsToday = new NepaliDate(today);
  const nepaliDateStr = `${bsToday.getBS().year}/${String(bsToday.getBS().month + 1).padStart(2, '0')}/${String(bsToday.getBS().date).padStart(2, '0')}`;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const config = {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        };
        // Fetch all users (for vendor)
        const usersRes = await axios.get(`${API_BASE_URL}/admin/users/all`, config);
        setUsers(usersRes.data.users || []);
        // Fetch all patient records for today
        const recordsRes = await axios.get(`${API_BASE_URL}/patients?date=${todayStr}&all=true`, config);
        setPatientRecords(recordsRes.data.records || []);
        // Group patients by ward
        const wardMap = {};
        for (const { userId, patients } of recordsRes.data.records || []) {
          const user = usersRes.data.users.find(u => u._id === userId);
          if (user && user.department) {
            if (!wardMap[user.department]) wardMap[user.department] = [];
            wardMap[user.department].push(...patients);
          }
        }
        setWardPatients(wardMap);
      } catch (error) {
        showToast('Error loading data for vendor', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    // eslint-disable-next-line
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="dashboard-container" style={{
      maxWidth: '1100px',
      margin: '2rem auto',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      padding: '2rem',
      position: 'relative',
      minHeight: '80vh',
    }}>
      {/* Logout button */}
      <button
        onClick={handleLogout}
        style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          background: '#e74c3c',
          color: '#fff',
          border: 'none',
          borderRadius: '6px',
          padding: '0.5rem 1.2rem',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '1rem',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
        }}
      >
        Logout
      </button>
      <h1 style={{ textAlign: 'center', margin: '1rem 0 0.5rem 0', color: '#2c3e50', fontWeight: 700, letterSpacing: '1px' }}>
        Vendor Dashboard
      </h1>
      {/* Date at the top center */}
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1.5rem', color: '#555' }}>
        {`मिति (वि.सं.): ${nepaliDateStr}`}
      </div>
      {/* Wards and tables will be rendered here */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Render for each ward */}
        {wardNames.map(({ label, value }) => (
          <div key={value} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1.2rem 0.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h2 style={{ marginBottom: '0.7rem', color: '#2980b9', fontWeight: 600, paddingLeft: '1rem' }}>{label} Ward</h2>
            <div className="table-container">
              <table className="patient-table" style={{width: '100%', tableLayout: 'fixed', background: '#f6edff'}}>
                <thead>
                  <tr>
                    <th rowSpan="2" style={{background:'#f6edff'}}>Bed No.</th>
                    <th rowSpan="2" style={{background:'#f6edff'}}>IPD No.</th>
                    <th rowSpan="2" style={{background:'#f6edff'}}>Patient name</th>
                    <th rowSpan="2" style={{background:'#f6edff'}}>Age</th>
                    <th colSpan="4" style={{background:'#f6edff'}}>Morning Meal (any one)</th>
                    <th colSpan="2" style={{background:'#f6edff'}}>Any one</th>
                    <th colSpan="2" style={{background:'#f6edff'}}>Launch (any one)</th>
                    <th colSpan="5" style={{background:'#f6edff'}}>Night Meal (any one)</th>
                    <th colSpan="2" style={{background:'#f6edff'}}>Any one</th>
                  </tr>
                  <tr>
                    <th style={{background:'#f6edff'}}>Simple diet</th>
                    <th style={{background:'#f6edff'}}>Under 12 years diet</th>
                    <th style={{background:'#f6edff'}}>Soft diet</th>
                    <th style={{background:'#f6edff'}}>Liquid diet</th>
                    <th style={{background:'#f6edff'}}>Egg</th>
                    <th style={{background:'#f6edff'}}>Milk</th>
                    <th style={{background:'#f6edff'}}>Biscuit</th>
                    <th style={{background:'#f6edff'}}>Satu</th>
                    <th style={{background:'#f6edff'}}>Simple diet</th>
                    <th style={{background:'#f6edff'}}>Under 12 years diet</th>
                    <th style={{background:'#f6edff'}}>Soft diet</th>
                    <th style={{background:'#f6edff'}}>Liquid diet</th>
                    <th style={{background:'#f6edff'}}>Chapati diet</th>
                    <th style={{background:'#f6edff'}}>Egg</th>
                    <th style={{background:'#f6edff'}}>Milk</th>
                  </tr>
                </thead>
                <tbody>
                  {wardPatients[value] && wardPatients[value].length > 0 ? (
                    wardPatients[value].map((p, idx) => (
                      <tr key={idx} className="table-row">
                        <td className="table-cell">{p.bedNo}</td>
                        <td className="table-cell">{p.ipdNumber}</td>
                        <td className="table-cell">{p.name}</td>
                        <td className="table-cell">{p.age}</td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.morningMeal === 'Simple diet' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.morningMeal === 'Under 12 years diet' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.morningMeal === 'Soft diet' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.morningMeal === 'Liquid diet' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.morningExtra === 'Egg' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.morningExtra === 'Milk' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.launch === 'Biscuit' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.launch === 'Satu' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.nightMeal === 'Simple diet' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.nightMeal === 'Under 12 years diet' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.nightMeal === 'Soft diet' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.nightMeal === 'Liquid diet' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.nightMeal === 'Chapati diet' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.nightExtra === 'Egg' ? 'selected' : ''}`}></span>
                        </td>
                        <td className="table-cell diet-cell">
                          <span className={`diet-box ${p.nightExtra === 'Milk' ? 'selected' : ''}`}></span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="20" className="no-data">No patient records found for this ward</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VendorDashboard;
