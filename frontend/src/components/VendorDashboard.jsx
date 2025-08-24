import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import Spinner from './Spinner';
import NepaliDate from 'nepali-date-converter';
import KoshiHospitalLogo from '../assets/koshi_hospital_logo.jpg';
import NepaliEmblem from '../assets/nepali_emblem.png';
import NepaliFlag from '../assets/nepal_flag.png';
import 'jspdf-autotable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  
  // Monthly report states
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  const [monthlyReportData, setMonthlyReportData] = useState([]);
  const [monthlyReportLoading, setMonthlyReportLoading] = useState(false);
  const [selectedReportYear, setSelectedReportYear] = useState(defaultYear);
  const [selectedReportMonth, setSelectedReportMonth] = useState('');
  
  // Helper to convert BS year/month to AD date range (start and end of BS month)
  const convertBSMonthToADRange = (bsYear, bsMonth) => {
    // 2082 BS to 2025/2026 AD month and start day mappings
    const monthMappings = {
      '01': { year: 2025, month: 4, startDay: 14, endMonth: 5, endDay: 14 },  // Baisakh: Apr 14 - May 14
      '02': { year: 2025, month: 5, startDay: 15, endMonth: 6, endDay: 14 },  // Jestha: May 15 - Jun 14
      '03': { year: 2025, month: 6, startDay: 15, endMonth: 7, endDay: 16 },  // Ashar: Jun 15 - Jul 16
      '04': { year: 2025, month: 7, startDay: 17, endMonth: 8, endDay: 16 },  // Shrawan: Jul 17 - Aug 16
      '05': { year: 2025, month: 8, startDay: 17, endMonth: 9, endDay: 16 },  // Bhadra: Aug 17 - Sep 16
      '06': { year: 2025, month: 9, startDay: 17, endMonth: 10, endDay: 17 }, // Ashwin: Sep 17 - Oct 17
      '07': { year: 2025, month: 10, startDay: 18, endMonth: 11, endDay: 16 },// Kartik: Oct 18 - Nov 16
      '08': { year: 2025, month: 11, startDay: 17, endMonth: 12, endDay: 16 },// Mangsir: Nov 17 - Dec 16
      '09': { year: 2025, month: 12, startDay: 17, endMonth: 1, endDay: 15, endYear: 2026 }, // Poush: Dec 17 - Jan 15
      '10': { year: 2026, month: 1, startDay: 16, endMonth: 2, endDay: 15 },  // Magh: Jan 16 - Feb 15
      '11': { year: 2026, month: 2, startDay: 16, endMonth: 3, endDay: 14 },  // Falgun: Feb 16 - Mar 14
      '12': { year: 2026, month: 3, startDay: 15, endMonth: 4, endDay: 13, endYear: 2026 }   // Chaitra: Mar 15 - Apr 13
    };
    const monthStr = String(bsMonth).padStart(2, '0');
    const mapping = monthMappings[monthStr];
    if (!mapping) return null;
    const yearOffset = parseInt(bsYear) - 2082;
    const adYear = mapping.year + yearOffset;
    const adEndYear = mapping.endYear ? mapping.endYear + yearOffset : adYear;
    const start = `${adYear}-${String(mapping.month).padStart(2, '0')}-${String(mapping.startDay).padStart(2, '0')}`;
    const end = `${adEndYear}-${String(mapping.endMonth).padStart(2, '0')}-${String(mapping.endDay).padStart(2, '0')}`;
    return { start, end };
  };
  
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

  // Function to generate the monthly diet report
  const generateMonthlyDietReport = async () => {
    if (!selectedReportYear || !selectedReportMonth) return;
    setMonthlyReportLoading(true);
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      };
      const { start, end } = convertBSMonthToADRange(selectedReportYear, selectedReportMonth);
      
      // Initialize counters for each diet type in each meal
      const dietCounts = {
        morning: { 'Normal diet': 0, 'Under 12 years diet': 0, 'Soft diet': 0, 'Liquid diet': 0 },
        morningExtra: { Egg: 0, Milk: 0, 'High protein': 0 },
        launch: { Biscuit: 0, Satu: 0 },
        night: { 'Normal diet': 0, 'Under 12 years diet': 0, 'Soft diet': 0, 'Liquid diet': 0, 'Chapati diet': 0 },
        nightExtra: { Egg: 0, Milk: 0, 'High protein': 0 }
      };
      
      // Fetch all records for the date range
      const res = await axios.get(`${API_BASE_URL}/vendor/records/by-range?start=${start}&end=${end}`, config);
      const records = res.data.records || [];
      
      // Aggregate data for all records
      for (const record of records) {
        for (const patient of record.patients) {
          // Count morning meals
          if (patient.morningMeal && dietCounts.morning.hasOwnProperty(patient.morningMeal)) {
            dietCounts.morning[patient.morningMeal]++;
          }
          // Count morning extras
          if (patient.morningExtra && dietCounts.morningExtra.hasOwnProperty(patient.morningExtra)) {
            dietCounts.morningExtra[patient.morningExtra]++;
          }
          // Count launch
          if (patient.launch && dietCounts.launch.hasOwnProperty(patient.launch)) {
            dietCounts.launch[patient.launch]++;
          }
          // Count night meals
          if (patient.nightMeal && dietCounts.night.hasOwnProperty(patient.nightMeal)) {
            dietCounts.night[patient.nightMeal]++;
          }
          // Count night extras
          if (patient.nightExtra && dietCounts.nightExtra.hasOwnProperty(patient.nightExtra)) {
            dietCounts.nightExtra[patient.nightExtra]++;
          }
        }
      }
      
      // The table expects an array with a single object in this grouped format
      setMonthlyReportData([{ ...dietCounts }]);
    } catch (error) {
      console.error("Error generating monthly report:", error);
      showToast('Error generating monthly report', 'error');
      setMonthlyReportData([]);
    } finally {
      setMonthlyReportLoading(false);
    }
  };

  // Download monthly report as PDF
  const handleDownloadMonthlyReport = () => {
    if (!monthlyReportData.length) return;
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const darkColor = '#374151';
    const headerTextColor = '#FFFFFF';
    const bodyTextColor = '#111827';

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(bodyTextColor);
    doc.text('Monthly Diet Report', pageWidth / 2, 40, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`Year: ${selectedReportYear}  Month: ${nepaliMonths.find(m => m.number === selectedReportMonth)?.name || ''}`, pageWidth / 2, 60, { align: 'center' });

    const data = monthlyReportData[0];
    const sec = (title) => [[{ content: title, colSpan: 2, styles: { fillColor: '#f5f5f5', fontStyle: 'bold', halign: 'left' } }]];
    const row = (label, value) => [label, String(value || 0)];

    autoTable(doc, {
      startY: 80,
      head: [[{ content: 'Diet', styles: { fontStyle: 'bold' } }, { content: 'Orders', styles: { fontStyle: 'bold' } }]],
      body: [
        ...sec('Morning meal'),
        row('Normal diet', data.morning['Normal diet'] || 0),
        row('Under 12 years diet', data.morning['Under 12 years diet'] || 0),
        row('Soft diet', data.morning['Soft diet'] || 0),
        row('Liquid diet', data.morning['Liquid diet'] || 0),
        ...sec('Any one'),
        row('Egg', data.morningExtra['Egg'] || 0),
        row('Milk', data.morningExtra['Milk'] || 0),
        row('High protein', data.morningExtra['High protein'] || 0),
        ...sec('Snacks'),
        row('Biscuit', data.launch['Biscuit'] || 0),
        row('Satu', data.launch['Satu'] || 0),
        ...sec('Night Meal (any one)'),
        row('Normal diet', data.night['Normal diet'] || 0),
        row('Under 12 years diet', data.night['Under 12 years diet'] || 0),
        row('Soft diet', data.night['Soft diet'] || 0),
        row('Liquid diet', data.night['Liquid diet'] || 0),
        row('Chapati diet', data.night['Chapati diet'] || 0),
        ...sec('Any one'),
        row('Egg', data.nightExtra['Egg'] || 0),
        row('Milk', data.nightExtra['Milk'] || 0),
        row('High protein', data.nightExtra['High protein'] || 0),
      ],
      theme: 'grid',
      styles: {
        font: 'helvetica',
        textColor: bodyTextColor,
        lineColor: '#E5E7EB',
        lineWidth: 1,
        fontSize: 10,
        halign: 'left',
        cellPadding: 6,
      },
      headStyles: {
        fillColor: darkColor,
        textColor: headerTextColor,
        fontStyle: 'bold',
        halign: 'left',
      },
      columnStyles: {
        0: { cellWidth: 300 },
        1: { halign: 'center' },
      },
      margin: { left: 40, right: 40 },
    });

    doc.save(`Monthly_Diet_Report_${selectedReportYear}_${selectedReportMonth}.pdf`);
  };

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
      <div className="dashboard-date-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
        
        {/* Monthly Report Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            className="button button-primary"
            onClick={() => setShowMonthlyReport(true)}
            style={{ minWidth: 120, width: 'auto', display: 'inline-block' }}
          >
            Generate Monthly Report
          </button>
        </div>
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

        {/* Monthly Report Modal */}
        {showMonthlyReport && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="card" style={{ maxWidth: 900, width: '95%', position: 'relative', maxHeight: '90vh', overflowY: 'auto', padding: '32px 24px 24px 24px' }}>
              <button 
                onClick={() => {
                  setShowMonthlyReport(false);
                  setMonthlyReportData([]);
                  setSelectedReportMonth('');
                }} 
                style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}
              >
                &times;
              </button>
              <h2 className="section-title" style={{ textAlign: 'center' }}>Monthly Diet Report</h2>
              
              {/* Month Selection */}
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: '1.5rem' }}>
                <select 
                  value={selectedReportYear} 
                  onChange={e => setSelectedReportYear(e.target.value)}
                  style={{ fontSize: 16, padding: '0.2rem 0.5rem' }}
                >
                  <option value="2082">2082</option>
                </select>
                <select 
                  value={selectedReportMonth} 
                  onChange={e => {
                    setSelectedReportMonth(e.target.value);
                    setMonthlyReportData([]);
                  }}
                  style={{ fontSize: 16, padding: '0.2rem 0.5rem' }}
                >
                  <option value="" disabled>Select Month</option>
                  {nepaliMonths.map(m => (
                    <option key={m.number} value={m.number}>{m.name}</option>
                  ))}
                </select>
                <button 
                  className="button button-success"
                  onClick={generateMonthlyDietReport}
                  disabled={!selectedReportMonth || monthlyReportLoading}
                >
                  {monthlyReportLoading ? 'Generating...' : 'Generate'}
                </button>
                {monthlyReportData.length > 0 && !monthlyReportLoading && (
                  <button
                    className="button button-primary"
                    onClick={handleDownloadMonthlyReport}
                  >
                    Download PDF
                  </button>
                )}
              </div>

              {/* Report Table */}
              {monthlyReportData.length > 0 && (
                <div style={{ maxHeight: '400px', overflowX: 'auto', overflowY: 'auto' }}>
                  <table className="data-table" style={{ width: '100%', minWidth: '400px', color: '#111' }}>
                    <thead>
                      <tr>
                        <th className="table-cell-header">Diet</th>
                        <th className="table-cell-header">Orders</th>
                      </tr>
                    </thead>
                    <tbody style={{ color: '#111' }}>
                      {/* Morning meal */}
                      <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Morning meal</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Normal diet</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.morning["Normal diet"] || 0}</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Under 12 years diet</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.morning["Under 12 years diet"] || 0}</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Soft diet</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.morning["Soft diet"] || 0}</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Liquid diet</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.morning["Liquid diet"] || 0}</td></tr>
                      {/* Any one (morning extras) */}
                      <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Any one</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Egg</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.morningExtra["Egg"] || 0}</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Milk</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.morningExtra["Milk"] || 0}</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>High protein</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.morningExtra["High protein"] || 0}</td></tr>
                      {/* Snacks */}
                      <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Snacks</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Biscuit</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.launch["Biscuit"] || 0}</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Satu</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.launch["Satu"] || 0}</td></tr>
                      {/* Night Meal (any one) */}
                      <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Night Meal (any one)</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Normal diet</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.night["Normal diet"] || 0}</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Under 12 years diet</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.night["Under 12 years diet"] || 0}</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Soft diet</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.night["Soft diet"] || 0}</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Liquid diet</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.night["Liquid diet"] || 0}</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Chapati diet</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.night["Chapati diet"] || 0}</td></tr>
                      {/* Any one (night extras) */}
                      <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Any one</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Egg</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.nightExtra["Egg"] || 0}</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>Milk</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.nightExtra["Milk"] || 0}</td></tr>
                      <tr><td style={{ paddingLeft: 24, color: '#111' }}>High protein</td><td style={{ color: '#111' }}>{monthlyReportData[0]?.nightExtra["High protein"] || 0}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              {monthlyReportLoading && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                  <Spinner />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  export default VendorDashboard;
