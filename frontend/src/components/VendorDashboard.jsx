import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import Spinner from './Spinner';
import NepaliDate from 'nepali-date-converter';
import KoshiHospitalLogo from '../assets/koshi_hospital_logo.jpg';
import './VendorDashboard.css';

const VendorDashboard = () => {
  const { API_BASE_URL, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]); // All users with department
  const [patientRecords, setPatientRecords] = useState([]); // All patient records for today
  const [wardPatients, setWardPatients] = useState({}); // { ward: [patients] }
  const [wards, setWards] = useState([]);
  const [wardsLoading, setWardsLoading] = useState(true);

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

  // Fetch wards from backend
  useEffect(() => {
    const fetchWards = async () => {
      setWardsLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const res = await axios.get(`${API_BASE_URL}/vendor/wards`, config);
        setWards(res.data.wards.map(w => w.name));
      } catch (err) {
        showToast('Error fetching wards', 'error');
      } finally {
        setWardsLoading(false);
      }
    };
    fetchWards();
  }, [API_BASE_URL, showToast]);

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

  if (loading || wardsLoading) return <Spinner />;

  return (
    <div className="dashboard-container">
      {/* Header: logo left, logout right */}
      <div className="header" style={{ alignItems: 'center', marginBottom: '1.5rem' }}>
        <img src={KoshiHospitalLogo} alt="Koshi Hospital Logo" className="logo" style={{ marginRight: '1.5rem', marginBottom: 0 }} />
        <div style={{ flex: 1 }}></div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <button
            onClick={handleLogout}
            className="button button-danger dashboard-logout-btn"
            style={{ minWidth: 120, marginBottom: 4 }}
          >
            Logout
          </button>
        </div>
      </div>

      <div className="dashboard-main-content">
        <div className="dashboard-center-titles">
          <h1 className="dashboard-hospital-title">कोशी अस्पताल, विराटनगर</h1>
          <h2 className="dashboard-form-title">बिरामीहरुको डाईट फारम</h2>
        </div>
        <div className="dashboard-ward-date-row">
          <div className="dashboard-ward">Ward: <span className="dashboard-ward-value">All</span></div>
          <div className="dashboard-date">Date: <span className="dashboard-date-value">{nepaliDateStr}</span></div>
        </div>

        {/* Wards and tables will be rendered here */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Render for each ward */}
          {wards.map((ward) => (
            <div key={ward} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h2 style={{ marginBottom: '0.7rem', color: '#2980b9', fontWeight: 600 }}>{ward.charAt(0).toUpperCase() + ward.slice(1)} Ward</h2>
              <div className="dashboard-table-section">
                <table className="patient-table">
                  <thead>
                    <tr>
                      <th rowSpan="2" className="diet-stack">Bed<br/>No.</th>
                      <th rowSpan="2" className="diet-stack">IPD<br/>No.</th>
                      <th rowSpan="2" className="diet-stack">Patient<br/>name</th>
                      <th rowSpan="2" className="dark-border">Age</th>
                                                      <th colSpan="4">Tomorrow's Morning meal</th>
                      <th colSpan="3">Any one</th>
                      <th colSpan="2">Snacks</th>
                      <th colSpan="5">Night Meal (any one)</th>
                      <th colSpan="3">Any one</th>
                    </tr>
                    <tr>
                      <th className="light-border diet-stack">Simple<br/>diet</th>
                      <th className="light-border diet-stack">Under 12<br/>years<br/>diet</th>
                      <th className="light-border diet-stack">Soft<br/>diet</th>
                      <th className="dark-border diet-stack">Liquid<br/>diet</th>
                      <th className="light-border">Egg</th>
                      <th className="dark-border">Milk</th>
                      <th className="light-border">High protein</th>
                      <th className="light-border">Biscuit</th>
                      <th className="dark-border">Satu</th>
                      <th className="light-border diet-stack">Simple<br/>diet</th>
                      <th className="light-border diet-stack">Under 12<br/>years<br/>diet</th>
                      <th className="light-border diet-stack">Soft<br/>diet</th>
                      <th className="light-border diet-stack">Liquid<br/>diet</th>
                      <th className="dark-border diet-stack">Chapati<br/>diet</th>
                                                <th className="light-border">Egg</th>
                          <th>Milk</th>
                          <th className="light-border">High protein</th>
                    </tr>
                  </thead>
                  <tbody>
                    {wardPatients[ward] && wardPatients[ward].length > 0 ? (
                      wardPatients[ward].map((p, idx) => (
                        <tr key={idx} className="table-row">
                          <td className="table-cell">{p.bedNo}</td>
                          <td className="table-cell">{p.ipdNumber}</td>
                          <td className="table-cell">{p.name}</td>
                          <td className="table-cell dark-border">{p.age}</td>
                          {/* Tomorrow's Morning meal */}
                          {['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet'].map((opt, i) => (
                            <td className={`table-cell diet-cell${i < 3 ? ' light-border' : ' dark-border'}`} key={`morningMeal-${i}`}>
                              <span className={`diet-box ${p.morningMeal === opt ? 'selected' : ''}`}></span>
                            </td>
                          ))}
                          {/* Morning Extra */}
                          {['Egg', 'Milk', 'High protein'].map((opt, i) => (
                            <td className={`table-cell diet-cell${i === 0 ? ' light-border' : i === 1 ? ' dark-border' : ' light-border'}`} key={`morningExtra-${i}`}>
                              <span className={`diet-box ${p.morningExtra === opt ? 'selected' : ''}`}></span>
                            </td>
                          ))}
                          {/* Snacks */}
                          {['Biscuit', 'Satu'].map((opt, i) => (
                            <td className={`table-cell diet-cell${i === 0 ? ' light-border' : ' dark-border'}`} key={`launch-${i}`}>
                              <span className={`diet-box ${p.launch === opt ? 'selected' : ''}`}></span>
                            </td>
                          ))}
                          {/* Night Meal */}
                          {['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet', 'Chapati diet'].map((opt, i) => (
                            <td className={`table-cell diet-cell${i < 4 ? ' light-border' : ' dark-border'}`} key={`nightMeal-${i}`}>
                              <span className={`diet-box ${p.nightMeal === opt ? 'selected' : ''}`}></span>
                            </td>
                          ))}
                          {/* Night Extra */}
                          {['Egg', 'Milk', 'High protein'].map((opt, i) => (
                            <td className={`table-cell diet-cell${i === 0 ? ' light-border' : i === 1 ? '' : ' light-border'}`} key={`nightExtra-${i}`}>
                              <span className={`diet-box ${p.nightExtra === opt ? 'selected' : ''}`}></span>
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="20" style={{ textAlign: 'center', color: '#888' }}>[No patient data]</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
