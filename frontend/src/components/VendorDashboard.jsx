import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import Spinner from './Spinner';
import NepaliDate from 'nepali-date-converter';
import KoshiHospitalLogo from '../assets/koshi_hospital_logo.jpg';
import NepaliEmblem from '../assets/nepali_emblem.png';
import NepaliFlag from '../assets/nepal_flag.png';

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
  const [patientRecords, setPatientRecords] = useState([]); // All patient records for selected date
  const [wardPatients, setWardPatients] = useState({}); // { ward: [patients] }

  // Date logic
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const bsToday = new NepaliDate(today);
  const bsTomorrow = new NepaliDate(tomorrow);
  const bsTodayStr = `${bsToday.getBS().year}/${String(bsToday.getBS().month + 1).padStart(2, '0')}/${String(bsToday.getBS().date).padStart(2, '0')}`;
  const bsTomorrowStr = `${bsTomorrow.getBS().year}/${String(bsTomorrow.getBS().month + 1).padStart(2, '0')}/${String(bsTomorrow.getBS().date).padStart(2, '0')}`;
  const adTodayStr = today.toISOString().split('T')[0];
  const adTomorrowStr = tomorrow.toISOString().split('T')[0];

  const [dateOption, setDateOption] = useState('today');
  const [selectedDate, setSelectedDate] = useState(adTodayStr);
  const [nepaliDate, setNepaliDate] = useState(bsTodayStr);

  useEffect(() => {
    if (dateOption === 'today') {
      setNepaliDate(bsTodayStr);
      setSelectedDate(adTodayStr);
    } else {
      setNepaliDate(bsTomorrowStr);
      setSelectedDate(adTomorrowStr);
    }
  }, [dateOption, bsTodayStr, bsTomorrowStr, adTodayStr, adTomorrowStr]);

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
        // Fetch all patient records for selected date
        const recordsRes = await axios.get(`${API_BASE_URL}/patients?date=${selectedDate}&all=true`, config);
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
  }, [selectedDate, API_BASE_URL]);

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) return <Spinner />;

  return (
    <div className="dashboard-container" style={{
      maxWidth: '100%', // was '1100px'
      margin: '2rem auto',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      padding: '2rem',
      position: 'relative',
      minHeight: '80vh',
    }}>
      {/* Koshi Hospital logo at far left */}
      <img src={KoshiHospitalLogo} alt="Koshi Hospital Logo" style={{ position: 'absolute', top: '2rem', left: '2rem', height: 80, width: 'auto', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: '#fff' }} />
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
      {/* Hospital/emblem/flag header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', gap: 12, marginTop: 24 }}>
        <img src={NepaliEmblem} alt="Nepali Emblem" style={{ height: 48, width: 'auto' }} />
        <div style={{ fontSize: 28, fontWeight: 700, color: '#b71c1c', textAlign: 'center', letterSpacing: 1, margin: '0 16px' }}>
          कोशी अस्पताल, विराटनगर
        </div>
        <img src={NepaliFlag} alt="Nepali Flag" style={{ height: 36, width: 'auto' }} />
      </div>
      <h1 style={{ textAlign: 'center', margin: '1rem 0 0.5rem 0', color: '#2c3e50', fontWeight: 700, letterSpacing: '1px' }}>
        Vendor Dashboard
      </h1>
      {/* Date at the top center with switcher */}
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1.5rem', color: '#555' }}>
        <span style={{ marginRight: 16 }}>मिति (वि.सं.):</span>
        <select value={dateOption} onChange={e => setDateOption(e.target.value)} style={{ fontWeight: 700, color: '#2563eb', fontSize: 18, border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer' }}>
          <option value="today">{bsTodayStr}</option>
          <option value="tomorrow">{bsTomorrowStr}</option>
        </select>
      </div>
      {/* Wards and tables will be rendered here */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Render for each ward */}
        {wardNames.map(({ label, value }) => (
          <div key={value} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1.2rem 0.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h2 style={{ marginBottom: '0.7rem', color: '#2980b9', fontWeight: 600, paddingLeft: '1rem' }}>{label} Ward</h2>
            <div className="table-container">
              <table className="patient-table" style={{width: '100%', minWidth: '1300px', tableLayout: 'fixed', background: '#f6edff'}}>
                <thead>
                  <tr>
                    <th rowSpan="2" className="diet-stack" style={{ borderLeft: '3px solid #374151', borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Bed No.</th>
                    <th rowSpan="2" className="diet-stack" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>IPD No.</th>
                    <th rowSpan="2" className="diet-stack" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151', minWidth: '100px', maxWidth: '120px', whiteSpace: 'normal' }}>Patient<br/>name</th>
                    <th rowSpan="2" className="diet-stack" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Age</th>
                    <th colSpan="4" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Morning meal</th>
                    <th colSpan="3" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Any one</th>
                    <th colSpan="2" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Snacks</th>
                    <th colSpan="5" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Night Meal (any one)</th>
                    <th colSpan="3" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Any one</th>
                  </tr>
                  <tr>
                    <th className="light-border diet-stack" style={{ minWidth: '80px', maxWidth: '100px', whiteSpace: 'normal' }}>Normal<br/>diet</th>
                    <th className="light-border diet-stack under12-col">Under<br/>12<br/>years<br/>diet</th>
                    <th className="light-border diet-stack">Soft<br/>diet</th>
                    <th className="dark-border diet-stack" style={{ borderRight: '3px solid #374151' }}>Liquid<br/>diet</th>
                    <th className="light-border">Egg</th>
                    <th className="dark-border">Milk</th>
                    <th className="light-border" style={{ borderRight: '3px solid #374151', minWidth: '80px', maxWidth: '100px', whiteSpace: 'normal' }}>High<br/>protein</th>
                    <th className="light-border">Biscuit</th>
                    <th className="dark-border" style={{ borderRight: '3px solid #374151' }}>Satu</th>
                    <th className="light-border diet-stack">Normal<br/>diet</th>
                    <th className="light-border diet-stack under12-col">Under<br/>12<br/>years<br/>diet</th>
                    <th className="light-border diet-stack">Soft<br/>diet</th>
                    <th className="light-border diet-stack">Liquid<br/>diet</th>
                    <th className="dark-border diet-stack chapati-col" style={{ borderRight: '3px solid #374151', minWidth: '80px', maxWidth: '100px', whiteSpace: 'normal' }}>Chapati<br/>diet</th>
                    <th className="light-border">Egg</th>
                    <th className="light-border">Milk</th>
                    <th className="light-border" style={{ borderRight: '3px solid #374151', minWidth: '80px', maxWidth: '100px', whiteSpace: 'normal' }}>High<br/>protein</th>
                  </tr>
                </thead>
                <tbody>
                  {wardPatients[value] && wardPatients[value].length > 0 ? (
                    wardPatients[value].map((p, idx) => {
                      const isLastRow = idx === wardPatients[value].length - 1;
                      return (
                        <tr key={idx} className="table-row">
                          <td className="table-cell" style={{ borderLeft: '3px solid #374151', borderRight: '3px solid #374151', borderTop: '3px solid #374151', ...(isLastRow ? { borderBottom: '3px solid #374151' } : {}) }}>{p.bedNo}</td>
                          <td className="table-cell" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151', ...(isLastRow ? { borderBottom: '3px solid #374151' } : {}) }}>{p.ipdNumber}</td>
                          <td className="table-cell" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151', minWidth: '100px', maxWidth: '120px', whiteSpace: 'normal', ...(isLastRow ? { borderBottom: '3px solid #374151' } : {}) }}>{p.name}</td>
                          <td className="table-cell" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151', ...(isLastRow ? { borderBottom: '3px solid #374151' } : {}) }}>{p.age}</td>
                          {/* Morning meal options */}
                          {['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet'].map((opt, i) => (
                            <td className={`table-cell diet-cell${i < 3 ? ' light-border' : ' dark-border'}${opt === 'Under 12 years diet' ? ' under12-col' : ''}`} key={`morningMeal-${i}`} style={{ borderTop: '3px solid #374151', ...(isLastRow ? { borderBottom: '3px solid #374151' } : {}), ...(i === 3 ? { borderRight: '3px solid #374151' } : {}) }}>
                              <span className={`diet-box ${p.morningMeal === opt ? 'selected' : ''}`}></span>
                            </td>
                          ))}
                          {/* Morning Extra options (Any one) */}
                          {['Egg', 'Milk', 'High protein'].map((opt, i) => (
                            <td className={`table-cell diet-cell${i === 0 ? ' light-border' : i === 1 ? ' dark-border' : ' light-border'}`} key={`morningExtra-${i}`} style={{ borderTop: '3px solid #374151', ...(isLastRow ? { borderBottom: '3px solid #374151' } : {}), ...(i === 2 ? { borderRight: '3px solid #374151' } : {}) }}>
                              <span className={`diet-box ${p.morningExtra === opt ? 'selected' : ''}`}></span>
                            </td>
                          ))}
                          {/* Snacks options */}
                          {['Biscuit', 'Satu'].map((opt, i) => (
                            <td className={`table-cell diet-cell${i === 0 ? ' light-border biscuit-col' : ' dark-border'}`} key={`launch-${i}`} style={{ borderTop: '3px solid #374151', ...(isLastRow ? { borderBottom: '3px solid #374151' } : {}), ...(i === 1 ? { borderRight: '3px solid #374151' } : {}) }}>
                              <span className={`diet-box ${p.launch === opt ? 'selected' : ''}`}></span>
                            </td>
                          ))}
                          {/* Night Meal options */}
                          {['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet', 'Chapati diet'].map((opt, i) => (
                            <td className={`table-cell diet-cell${i < 4 ? ' light-border' : ' dark-border'}${opt === 'Under 12 years diet' ? ' under12-col' : ''}${opt === 'Chapati diet' ? ' chapati-col' : ''}`} key={`nightMeal-${i}`} style={{ borderTop: '3px solid #374151', ...(isLastRow ? { borderBottom: '3px solid #374151' } : {}), ...(i === 4 ? { borderRight: '3px solid #374151' } : {}) }}>
                              <span className={`diet-box ${p.nightMeal === opt ? 'selected' : ''}`}></span>
                            </td>
                          ))}
                          {/* Night Extra options (Any one) */}
                          {['Egg', 'Milk', 'High protein'].map((opt, i) => (
                            <td className={`table-cell diet-cell${i === 0 ? ' light-border' : i === 1 ? '' : ' light-border'}`} key={`nightExtra-${i}`} style={{ borderTop: '3px solid #374151', ...(isLastRow ? { borderBottom: '3px solid #374151' } : {}), ...(i === 2 ? { borderRight: '3px solid #374151' } : {}) }}>
                              <span className={`diet-box ${p.nightExtra === opt ? 'selected' : ''}`}></span>
                            </td>
                          ))}
                        </tr>
                      );
                    })
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
