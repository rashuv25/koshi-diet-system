import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import Spinner from './Spinner';
import NepaliDate from 'nepali-date-converter';
import KoshiHospitalLogo from '../assets/koshi_hospital_logo.jpg';
import NepaliEmblem from '../assets/nepali_emblem.png';
import NepaliFlag from '../assets/nepal_flag.png';

// Helper to generate date options (last 7, today, next 7)
const getDateOptions = () => {
  const options = [];
  for (let i = -7; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const adStr = date.toISOString().split('T')[0];
    const bs = new NepaliDate(date);
    const bsStr = `${bs.getBS().year}/${String(bs.getBS().month + 1).padStart(2, '0')}/${String(bs.getBS().date).padStart(2, '0')}`;
    options.push({ ad: adStr, bs: bsStr });
  }
  return options;
};

const VendorDashboard = () => {
  const { API_BASE_URL, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState([]); // Dynamic wards
  const [wardPatients, setWardPatients] = useState({}); // { ward: [patients] }
  const [dateOptions] = useState(getDateOptions());
  const [selectedDate, setSelectedDate] = useState(dateOptions[7].ad); // today is at index 7

  useEffect(() => {
    const fetchWards = async () => {
      try {
        const config = {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        };
        const res = await axios.get(`${API_BASE_URL}/vendor/wards`, config);
        setWards(res.data.wards || []);
      } catch (error) {
        showToast('Error loading wards', 'error');
      }
    };
    fetchWards();
  }, [API_BASE_URL, showToast]);

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const config = {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        };
        const res = await axios.get(`${API_BASE_URL}/vendor/records/by-date?date=${selectedDate}`, config);
        setWardPatients(res.data.grouped || {});
      } catch (error) {
        showToast('Error loading patient records', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, [API_BASE_URL, selectedDate, showToast]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  if (loading) return <Spinner />;

  return (
    <div className="dashboard-container" style={{
      maxWidth: '100%',
      margin: '2rem auto',
      background: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      padding: '2rem',
      position: 'relative',
      minHeight: '80vh',
    }}>
      <img src={KoshiHospitalLogo} alt="Koshi Hospital Logo" style={{ position: 'absolute', top: '2rem', left: '2rem', height: 80, width: 'auto', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', background: '#fff' }} />
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', gap: 32, marginTop: 24 }}>
        <img src={NepaliEmblem} alt="Nepali Emblem" style={{ height: '120px', width: 'auto' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.2 }}>
          <div style={{ fontSize: 16, color: '#b71c1c', fontWeight: 400 }}>नेपाल सरकार</div>
          <div style={{ fontSize: 16, color: '#b71c1c', fontWeight: 400 }}>स्वास्थ्य तथा जनसंख्या मन्त्रालय</div>
          <div style={{ fontSize: 28, color: '#111', fontWeight: 700, margin: '6px 0 0 0' }}>कोशी अस्पताल</div>
          <div style={{ fontSize: 16, color: '#b71c1c', fontWeight: 400 }}>विराटनगर, नेपाल</div>
        </div>
        <img src={NepaliFlag} alt="Nepali Flag" style={{ height: '120px', width: 'auto' }} />
      </div>
      <h1 style={{ textAlign: 'center', margin: '1rem 0 0.5rem 0', color: '#2c3e50', fontWeight: 700, letterSpacing: '1px' }}>
        Vendor Dashboard
      </h1>
      {/* Date dropdown */}
      <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.1rem', marginBottom: '1.5rem', color: '#555' }}>
        <span style={{ marginRight: 16 }}>मिति (वि.सं.):</span>
        <select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} style={{ fontWeight: 700, color: '#2563eb', fontSize: 18, border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer' }}>
          {dateOptions.map((opt, idx) => (
            <option key={opt.ad} value={opt.ad}>{opt.bs}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Render for each ward */}
        {wards.map((ward) => (
          <div key={ward._id} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1.2rem 0.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h2 style={{ marginBottom: '0.7rem', color: '#2980b9', fontWeight: 600, paddingLeft: '1rem' }}>{ward.name} Ward</h2>
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
                  {wardPatients[ward.name] && wardPatients[ward.name].length > 0 ? (
                    wardPatients[ward.name].map((p, idx) => {
                      const isLastRow = idx === wardPatients[ward.name].length - 1;
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
