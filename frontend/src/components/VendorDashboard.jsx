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

// Nepali months
const nepaliMonths = [
  { number: '01', name: 'Baisakh' },
  { number: '02', name: 'Jestha' },
  { number: '03', name: 'Ashar' },
  { number: '04', name: 'Shrawan' },
  { number: '05', name: 'Bhadra' },
  { number: '06', name: 'Ashwin' },
  { number: '07', name: 'Kartik' },
  { number: '08', name: 'Mangsir' },
  { number: '09', name: 'Poush' },
  { number: '10', name: 'Magh' },
  { number: '11', name: 'Falgun' },
  { number: '12', name: 'Chaitra' }
];

const today = new Date();
const bsToday = new NepaliDate(today);
const defaultYear = String(bsToday.getBS().year);
const defaultMonth = String(bsToday.getBS().month + 1).padStart(2, '0');
const defaultDay = String(bsToday.getBS().date).padStart(2, '0');

const VendorDashboard = () => {
  const { API_BASE_URL, showToast } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState([]); // Dynamic wards
  const [wardPatients, setWardPatients] = useState({}); // { ward: [patients] }
  // Date dropdown states
  const [year, setYear] = useState(defaultYear);
  const [month, setMonth] = useState(defaultMonth);
  const [day, setDay] = useState(defaultDay);
  // Compute AD date from BS
  const getADDate = (y, m, d) => {
    const bsDate = `${y}/${m}/${d}`;
    const nepaliDate = new NepaliDate(bsDate);
    const adDate = nepaliDate.getAD();
    return `${adDate.year}-${String(adDate.month + 1).padStart(2, '0')}-${String(adDate.date).padStart(2, '0')}`;
  };
  const [selectedDate, setSelectedDate] = useState(getADDate(defaultYear, defaultMonth, defaultDay));

  useEffect(() => {
    setSelectedDate(getADDate(year, month, day));
  }, [year, month, day]);

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
    <div className="dashboard-container">
      <div className="dashboard-header-row">
        <img src={KoshiHospitalLogo} alt="Koshi Hospital Logo" className="logo" />
        <div className="dashboard-header-spacer"></div>
        <div className="dashboard-header-actions">
          <button
            onClick={handleLogout}
            className="button button-danger dashboard-logout-btn"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="dashboard-emblem-row">
        <img src={NepaliEmblem} alt="Nepali Emblem" className="dashboard-emblem" />
        <div className="dashboard-emblem-center">
          <div className="dashboard-emblem-govt">नेपाल सरकार</div>
          <div className="dashboard-emblem-govt">स्वास्थ्य तथा जनसंख्या मन्त्रालय</div>
          <div className="admin-main-title">कोशी अस्पताल</div>
          <div className="dashboard-emblem-govt">विराटनगर, नेपाल</div>
        </div>
        <img src={NepaliFlag} alt="Nepali Flag" className="dashboard-flag" />
      </div>
      <h1 className="admin-main-title dashboard-title-center">
        Vendor Dashboard
      </h1>
      <div className="dashboard-date-row">
        <span style={{ marginRight: 16 }}>मिति (वि.सं.):</span>
        <select value={year} onChange={e => setYear(e.target.value)} style={{ marginRight: 8 }}>
          {/* Show a range of years around today */}
          {[...Array(5).keys()].map(i => {
            const y = String(Number(defaultYear) - 2 + i);
            return <option key={y} value={y}>{y}</option>;
          })}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)} style={{ marginRight: 8 }}>
          {nepaliMonths.map(m => (
            <option key={m.number} value={m.number}>{m.name}</option>
          ))}
        </select>
        <select value={day} onChange={e => setDay(e.target.value)}>
          {[...Array(32).keys()].slice(1).map(d => (
            <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
          ))}
        </select>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Render for each ward */}
        {wards.map((ward) => (
          <div key={ward._id} style={{ background: '#f8f9fa', borderRadius: '8px', padding: '1.2rem 0.5rem', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <h2 style={{ marginBottom: '0.7rem', color: '#2980b9', fontWeight: 600, paddingLeft: '1rem' }}>{ward.name} Ward</h2>
            <div className="table-responsive">
              <table className="patient-table">
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
