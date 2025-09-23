// user-client/src/components/UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import Spinner from './Spinner';
import Toast from './Toast';
import KoshiHospitalLogo from '../assets/koshi_hospital_logo.jpg';
import NepaliDate from 'nepali-date-converter';
import NepaliEmblem from '../assets/nepali_emblem.png';
import NepaliFlag from '../assets/nepal_flag.png';
import './UserDashboard.css';

const groupSeparatorStyle = {
  borderRight: '3px solid #374151', // dark border
};
const groupSeparatorLeftStyle = {
  borderLeft: '3px solid #374151',
};
const groupSeparatorBottomStyle = {
  borderBottom: '3px solid #374151',
};
const groupSeparatorRightStyle = {
  borderRight: '3px solid #374151',
};

const UserDashboard = () => {
    const { user, logout, showToast, API_BASE_URL } = useAuth();
    
    // Use the new today/tomorrow variables for date logic
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    const bsToday = new NepaliDate(today);
    const bsTomorrow = new NepaliDate(tomorrow);
    const bsTodayStr = `${bsToday.getBS().year}/${String(bsToday.getBS().month + 1).padStart(2, '0')}/${String(bsToday.getBS().date).padStart(2, '0')}`;
    const bsTomorrowStr = `${bsTomorrow.getBS().year}/${String(bsTomorrow.getBS().month + 1).padStart(2, '0')}/${String(bsTomorrow.getBS().date).padStart(2, '0')}`;
    const adTodayStr = today.toISOString().split('T')[0];
    const adTomorrowStr = tomorrow.toISOString().split('T')[0];

    const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]); // Keep English date for API
    const [nepaliDate, setNepaliDate] = useState(bsTodayStr);
    const [patientRows, setPatientRows] = useState([{}, {}]);
    const [fetchingPatients, setFetchingPatients] = useState(true);
    const [savingData, setSavingData] = useState(false);
    // Removed showDischarged state

    // Add state for date selection (today/tomorrow)
    const [dateOption, setDateOption] = useState('today');

    // Update selectedDate and nepaliDate when dateOption changes
    useEffect(() => {
        if (dateOption === 'today') {
            setNepaliDate(bsTodayStr);
            setSelectedDate(adTodayStr);
        } else {
            setNepaliDate(bsTomorrowStr);
            setSelectedDate(adTomorrowStr);
        }
    }, [dateOption]);

    const [lastFetchedTodayPatients, setLastFetchedTodayPatients] = useState([]);

    // Helper to fetch admitted patients for a given date
    const fetchAdmittedPatients = async (date) => {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        // Fetch the most recent previous record (including the date itself)
        const res = await axios.get(`${API_BASE_URL}/patients/${date}?findPrevious=true`, config);
        // Only include admitted (not discharged) patients
        return (res.data.patients || []).filter(p => p.isActive !== false && p.bedNo && p.ipdNumber && p.name && p.age);
    };

    // Helper to fetch all patients for a given date (may include discharged)
    const fetchAllPatients = async (date) => {
        const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
        const res = await axios.get(`${API_BASE_URL}/patients/${date}`, config);
        return res.data.patients || [];
    };

    // When tomorrow is selected, always merge today's admitted patients into tomorrow's list
    useEffect(() => {
        const updateTomorrowRows = async () => {
            setFetchingPatients(true);
            try {
                // 1. Fetch all admitted patients as of today
                const admittedToday = await fetchAdmittedPatients(adTodayStr);
                // 2. Fetch all patients for tomorrow (may include discharged)
                const tomorrowPatients = await fetchAllPatients(adTomorrowStr);
                // 3. Merge: ensure all admittedToday patients are present in tomorrow's list
                const tomorrowKeys = new Set(tomorrowPatients.map(p => `${p.bedNo}|${p.ipdNumber}`));
                const merged = [...tomorrowPatients];
                admittedToday.forEach(p => {
                    const key = `${p.bedNo}|${p.ipdNumber}`;
                    if (!tomorrowKeys.has(key)) {
                        merged.push({
                            bedNo: p.bedNo,
                            ipdNumber: p.ipdNumber,
                            name: p.name,
                            age: p.age,
                            isActive: true,
                            status: 'admit',
                            morningMeal: null,
                            morningExtra: null,
                            launch: null,
                            nightMeal: null,
                            nightExtra: null
                        });
                    }
                });
                setPatientRows(merged.length > 0 ? merged : [{}]);
            } catch (error) {
                setPatientRows([{}]);
            } finally {
                setFetchingPatients(false);
            }
        };
        if (dateOption === 'tomorrow' && user && selectedDate === adTomorrowStr) {
            updateTomorrowRows();
        }
    }, [dateOption, user, selectedDate, adTodayStr, adTomorrowStr, API_BASE_URL]);

    // Function to convert Nepali to English date with corrected month mappings
    const convertBSToAD = (bsDate) => {
        const [year, month, day] = bsDate.split('/').map(num => parseInt(num));

        // 2082 BS to 2025/2026 AD month and start day mappings
        const monthMappings = {
            '01': { year: 2025, month: 4, startDay: 14 },  // Baisakh starts April 14
            '02': { year: 2025, month: 5, startDay: 15 },  // Jestha starts May 15
            '03': { year: 2025, month: 6, startDay: 15 },  // Ashar starts June 15
            '04': { year: 2025, month: 7, startDay: 17 },  // Shrawan starts July 17
            '05': { year: 2025, month: 8, startDay: 17 },  // Bhadra starts August 17
            '06': { year: 2025, month: 9, startDay: 17 },  // Ashwin starts September 17
            '07': { year: 2025, month: 10, startDay: 18 }, // Kartik starts October 18
            '08': { year: 2025, month: 11, startDay: 17 }, // Mangsir starts November 17
            '09': { year: 2025, month: 12, startDay: 17 }, // Poush starts December 17
            '10': { year: 2026, month: 1, startDay: 16 },  // Magh starts January 16
            '11': { year: 2026, month: 2, startDay: 15 },  // Falgun starts February 15
            '12': { year: 2026, month: 3, startDay: 15 }   // Chaitra starts March 15
        };

        const monthStr = String(month).padStart(2, '0');
        const mapping = monthMappings[monthStr];
        
        if (!mapping) {
            console.error('Invalid BS month:', month);
            return null;
        }

        // Apply year offset for years after 2082 BS
        const yearOffset = year - 2082;
        const adYear = mapping.year + yearOffset;
        
        // Calculate the AD date
        const date = new Date(adYear, mapping.month - 1, mapping.startDay);
        date.setDate(date.getDate() + day - 1);
        
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // Function to handle date change
    const handleDateChange = (bsDate) => {
        setNepaliDate(bsDate);
        const adDate = convertBSToAD(bsDate);
        setSelectedDate(adDate);
    };

    // Fetch patients data on component mount and date change
    const fetchPatients = async () => {
        if (!user || !selectedDate) {
            setPatientRows([{}, {}]);
            setFetchingPatients(false);
            return;
        }

        setFetchingPatients(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            };
            const res = await axios.get(`${API_BASE_URL}/patients/${selectedDate}`, config);
            const existingPatients = res.data.patients;
            
            setPatientRows(existingPatients.length > 0 ? existingPatients : [{}, {}]);
            // If fetching for today, update lastFetchedTodayPatients
            if (selectedDate === adTodayStr) {
                setLastFetchedTodayPatients(existingPatients);
            }
        } catch (error) {
            console.error("Error fetching patient data:", error.response?.data?.message || error.message);
            showToast(error.response?.data?.message || 'Error fetching patient data.');
            setPatientRows([{}, {}]);
            if (selectedDate === adTodayStr) {
                setLastFetchedTodayPatients([]);
            }
        } finally {
            setFetchingPatients(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'user') {
            fetchPatients();
        } else {
            setFetchingPatients(false);
        }
    }, [selectedDate]);

    // After saving or discharging, always fetch the latest data from backend
    const handleSave = async () => {
        const filledRows = patientRows.filter(row => row.bedNo && row.name && row.age);
        
        if (filledRows.length === 0) {
            showToast('Please provide all patient details', 'error');
            return;
        }

        setSavingData(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            };

            // Add status field to each patient if not present
            const patientsWithStatus = filledRows.map(patient => ({
                ...patient,
                status: patient.status || 'active',
                // Do not overwrite isActive; preserve as set in the row
            }));

            await axios.post(`${API_BASE_URL}/patients`, {
                date: selectedDate,
                patients: patientsWithStatus
            }, config);
            
            await fetchPatients(); // Always refresh from backend after save
            showToast('Patient data saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving patient data:', error.response?.data?.message || error.message);
            showToast(error.response?.data?.message || 'Error saving patient data', 'error');
        } finally {
            setSavingData(false);
        }
    };

    const handleDischargePatient = async (bedNo, ipdNumber, isActive) => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            };

            await axios.put(`${API_BASE_URL}/patients/${selectedDate}/discharge`, {
                bedNo,
                ipdNumber,
                isActive
            }, config);

            showToast(`Patient ${isActive ? 'activated' : 'discharged'} successfully!`, 'success');
            
            await fetchPatients(); // Always refresh from backend after discharge
        } catch (error) {
            console.error('Error updating patient status:', error.response?.data?.message || error.message);
            showToast(error.response?.data?.message || 'Error updating patient status', 'error');
        }
    };

    const addPatientRow = () => {
        setPatientRows([...patientRows, {}]);
    };

    // Helper to check if any diet is selected
    const isAnyDietSelected = (row) => {
        return !!(row.morningMeal || row.morningExtra || row.launch || row.nightMeal || row.nightExtra);
    };

    // Add a status field to each row if not present, default to 'admit'
    const ensureStatus = (rows) => rows.map(row => ({ ...row, status: row.status || 'admit' }));

    // Status button click handler
    const handleStatusButtonClick = (rowIdx) => {
        const newRows = ensureStatus([...patientRows]);
        const row = newRows[rowIdx];
        if (row.status === 'admit') {
            if (!isAnyDietSelected(row)) {
                // Remove row if no diet selected
                newRows.splice(rowIdx, 1);
            } else {
                // Set to discharged if any diet selected
                row.status = 'discharged';
                row.isActive = false;
            }
        } else if (row.status === 'discharged') {
            // Set back to admit, keep diets
            row.status = 'admit';
            row.isActive = true;
        }
        setPatientRows(newRows);
    };

    // Diet selection handler: do NOT auto-change status
    const handleInputChange = (rowIndex, field, value) => {
        const newRows = ensureStatus([...patientRows]);
        if (!newRows[rowIndex]) {
            newRows[rowIndex] = { status: 'admit' };
        }
        // Toggle/deselect for diet options
        if ([
            'morningMeal', 'morningExtra', 'launch', 'nightMeal', 'nightExtra'
        ].includes(field)) {
            if (newRows[rowIndex][field] === value) {
                newRows[rowIndex][field] = undefined;
            } else {
                newRows[rowIndex][field] = value;
            }
        } else {
            newRows[rowIndex][field] = value;
        }
        setPatientRows(newRows);
    };

    // Compute totals for the summary row
    const filledPatientRows = (patientRows || []).filter(r => r && r.bedNo && r.ipdNumber && r.name && r.age);
    const patientsCount = filledPatientRows.length;

    const morningMealOptions = ['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet'];
    const morningExtraOptions = ['Egg', 'Milk', 'High protein'];
    const snacksOptions = ['Biscuit', 'Satu']; // launch
    const nightMealOptions = ['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet', 'Chapati diet'];
    const nightExtraOptions = ['Egg', 'Milk', 'High protein'];

    const morningMealTotals = morningMealOptions.map(opt => filledPatientRows.filter(r => r.morningMeal === opt).length);
    const morningExtraTotals = morningExtraOptions.map(opt => filledPatientRows.filter(r => r.morningExtra === opt).length);
    const snacksTotals = snacksOptions.map(opt => filledPatientRows.filter(r => r.launch === opt).length);
    const nightMealTotals = nightMealOptions.map(opt => filledPatientRows.filter(r => r.nightMeal === opt).length);
    const nightExtraTotals = nightExtraOptions.map(opt => filledPatientRows.filter(r => r.nightExtra === opt).length);

    if (!user || user.role !== 'user') {
        return (
            <div className="access-denied-container">
                <div className="card">
                    <h2 className="form-title error-text">Access Denied</h2>
                    <p className="message-text">You must be logged in as a user to view this page.</p>
                    <button onClick={logout} className="button button-danger">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-container">
            {/* Header: logo left, logout right */}
            <div className="header" style={{ alignItems: 'center', marginBottom: '1.5rem' }}>
                <img src={KoshiHospitalLogo} alt="Koshi Hospital Logo" className="logo" style={{ marginRight: '1.5rem', marginBottom: 0 }} />
                <div style={{ flex: 1 }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <button
                        onClick={logout}
                        className="button button-danger dashboard-logout-btn"
                        style={{ minWidth: 120, marginBottom: 4 }}
                    >
                        Logout
                    </button>
                    {user.name && (
                        <div className="dashboard-user-name">{user.name}</div>
                    )}
                </div>
            </div>

            <div className="dashboard-main-content">
                <div className="dashboard-center-titles">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', gap: 32 }}>
                        <img src={NepaliEmblem} alt="Nepali Emblem" style={{ height: '120px', width: 'auto' }} />
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.2 }}>
                            <div style={{ fontSize: 16, color: '#b71c1c', fontWeight: 400 }}>नेपाल सरकार</div>
                            <div style={{ fontSize: 16, color: '#b71c1c', fontWeight: 400 }}>स्वास्थ्य तथा जनसंख्या मन्त्रालय</div>
                            <div style={{ fontSize: 28, color: '#111', fontWeight: 700, margin: '6px 0 0 0' }}>कोशी अस्पताल</div>
                            <div style={{ fontSize: 16, color: '#b71c1c', fontWeight: 400 }}>विराटनगर, नेपाल</div>
                        </div>
                        <img src={NepaliFlag} alt="Nepali Flag" style={{ height: '120px', width: 'auto' }} />
                    </div>
                    <h2 className="dashboard-form-title">बिरामीहरुको डाईट फारम</h2>
                </div>
                <div className="dashboard-ward-date-row">
                    <div className="dashboard-ward">Ward: <span className="dashboard-ward-value">{user.department?.charAt(0).toUpperCase() + user.department?.slice(1)}</span></div>
                    <div className="dashboard-date">
                        Date: 
                        <select value={dateOption} onChange={e => setDateOption(e.target.value)} style={{ fontWeight: 700, color: '#2563eb', fontSize: 18, border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer' }}>
                            <option value="today">{bsTodayStr}</option>
                            <option value="tomorrow">{bsTomorrowStr}</option>
                        </select>
                    </div>
                </div>

                {/* Removed dashboard-filter-row and button */}

                <div className="dashboard-table-section">
                    <table className="patient-table">
                        <thead>
                            <tr>
                                <th rowSpan="2" className="diet-stack" style={{ ...groupSeparatorLeftStyle, borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Bed<br/>No.</th>
                                <th rowSpan="2" className="diet-stack" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>IPD<br/>No.</th>
                                <th rowSpan="2" className="diet-stack" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Patient<br/>name</th>
                                <th rowSpan="2" className="dark-border" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Age</th>
                                <th colSpan="4" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Morning meal</th>
                                <th colSpan="3" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Any one</th>
                                <th colSpan="2" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Snacks</th>
                                <th colSpan="5" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Night Meal (any one)</th>
                                <th colSpan="3" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151' }}>Any one</th>
                                <th rowSpan="2" className="diet-stack" style={{ ...groupSeparatorRightStyle, borderTop: '3px solid #374151' }}>Status</th>
                            </tr>
                            <tr>
                                <th className="light-border diet-stack">Normal<br/>diet</th>
                                <th className="light-border diet-stack under12-col">Under<br/>12<br/>years<br/>diet</th>
                                <th className="light-border diet-stack">Soft<br/>diet</th>
                                <th className="dark-border diet-stack" style={{ borderRight: '3px solid #374151' }}>Liquid<br/>diet</th>
                                <th className="light-border">Egg</th>
                                <th className="dark-border">Milk</th>
                                <th className="light-border" style={{ borderRight: '3px solid #374151' }}>High protein</th>
                                <th className="light-border">Biscuit</th>
                                <th className="dark-border" style={{ borderRight: '3px solid #374151' }}>Satu</th>
                                <th className="light-border diet-stack">Normal<br/>diet</th>
                                <th className="light-border diet-stack under12-col">Under<br/>12<br/>years<br/>diet</th>
                                <th className="light-border diet-stack">Soft<br/>diet</th>
                                <th className="light-border diet-stack">Liquid<br/>diet</th>
                                <th className="dark-border diet-stack chapati-col" style={{ borderRight: '3px solid #374151' }}>Chapati<br/>diet</th>
                                <th className="light-border">Egg</th>
                                <th className="light-border">Milk</th>
                                <th className="light-border" style={{ borderRight: '3px solid #374151' }}>High protein</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patientRows
                                // Do not filter out discharged patients; show all
                                .map((row, rowIdx) => (
                                <tr key={rowIdx} className={row.isActive === false ? 'discharged-patient' : ''}>
                                    <td className="table-cell" style={{
                                        ...groupSeparatorLeftStyle,
                                        borderRight: '3px solid #374151',
                                        borderTop: '3px solid #374151',
                                        ...(rowIdx === patientRows.length - 1 ? { borderBottom: '3px solid #374151' } : {})
                                    }}>
                                        <input 
                                            className="table-input table-input-small" 
                                            type="text" 
                                            value={row.bedNo || ''}
                                            onChange={(e) => handleInputChange(rowIdx, 'bedNo', e.target.value)}
                                            maxLength={4}
                                            style={{ width: '60px' }}
                                            disabled={row.isActive === false}
                                        />
                                    </td>
                                    <td className="table-cell" style={{
                                        borderRight: '3px solid #374151',
                                        borderTop: '3px solid #374151',
                                        ...(rowIdx === patientRows.length - 1 ? { borderBottom: '3px solid #374151' } : {})
                                    }}>
                                        <input 
                                            className="table-input table-input-small" 
                                            type="text" 
                                            value={row.ipdNumber || ''}
                                            onChange={(e) => handleInputChange(rowIdx, 'ipdNumber', e.target.value)}
                                            style={{ width: '80px' }}
                                            disabled={row.isActive === false}
                                        />
                                    </td>
                                    <td className="table-cell" style={{
                                        borderRight: '3px solid #374151',
                                        borderTop: '3px solid #374151',
                                        ...(rowIdx === patientRows.length - 1 ? { borderBottom: '3px solid #374151' } : {})
                                    }}>
                                        <input 
                                            className="table-input table-input-patient-name" 
                                            type="text" 
                                            value={row.name || ''}
                                            onChange={(e) => handleInputChange(rowIdx, 'name', e.target.value)}
                                            disabled={row.isActive === false}
                                        />
                                    </td>
                                    <td className="table-cell dark-border" style={{
                                        borderRight: '3px solid #374151',
                                        borderTop: '3px solid #374151',
                                        ...(rowIdx === patientRows.length - 1 ? { borderBottom: '3px solid #374151' } : {})
                                    }}>
                                        <input 
                                            className="table-input table-input-small" 
                                            type="number" 
                                            min="0" 
                                            max="120" 
                                            value={row.age || ''}
                                            onChange={(e) => handleInputChange(rowIdx, 'age', e.target.value)}
                                            maxLength={3}
                                            style={{ width: '50px' }}
                                            disabled={row.isActive === false}
                                        />
                                    </td>
                                    {/* Morning meal options */}
                                    {['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet'].map((opt, i) => (
                                        <td
                                            className={`table-cell diet-cell${i < 3 ? ' light-border' : ' dark-border'}${opt === 'Under 12 years diet' ? ' under12-col' : ''}`}
                                            key={`morningMeal-${i}`}
                                            style={{
                                                borderTop: '3px solid #374151',
                                                ...(rowIdx === patientRows.length - 1 ? { borderBottom: '3px solid #374151' } : {}),
                                                ...(i === 3 ? { borderRight: '3px solid #374151' } : {})
                                            }}
                                        >
                                            <span 
                                                className={`diet-box ${row.morningMeal === opt ? 'selected' : ''}`}
                                                onClick={() => handleInputChange(rowIdx, 'morningMeal', opt)}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={opt}
                                            />
                                        </td>
                                    ))}
                                    {/* Morning Extra options (Any one) */}
                                    {['Egg', 'Milk', 'High protein'].map((opt, i) => (
                                        <td
                                            className={`table-cell diet-cell${i === 0 ? ' light-border' : i === 1 ? ' dark-border' : ' light-border'}`}
                                            key={`morningExtra-${i}`}
                                            style={{
                                                borderTop: '3px solid #374151',
                                                ...(rowIdx === patientRows.length - 1 ? { borderBottom: '3px solid #374151' } : {}),
                                                ...(i === 2 ? { borderRight: '3px solid #374151' } : {})
                                            }}
                                        >
                                            <span 
                                                className={`diet-box ${row.morningExtra === opt ? 'selected' : ''}`}
                                                onClick={() => handleInputChange(rowIdx, 'morningExtra', opt)}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={opt}
                                            />
                                        </td>
                                    ))}
                                    {/* Snacks options */}
                                    {['Biscuit', 'Satu'].map((opt, i) => (
                                        <td
                                            className={`table-cell diet-cell${i === 0 ? ' light-border biscuit-col' : ' dark-border'}`}
                                            key={`launch-${i}`}
                                            style={{
                                                borderTop: '3px solid #374151',
                                                ...(rowIdx === patientRows.length - 1 ? { borderBottom: '3px solid #374151' } : {}),
                                                ...(i === 1 ? { borderRight: '3px solid #374151' } : {})
                                            }}
                                        >
                                            <span 
                                                className={`diet-box ${row.launch === opt ? 'selected' : ''}`}
                                                onClick={() => handleInputChange(rowIdx, 'launch', opt)}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={opt}
                                            />
                                        </td>
                                    ))}
                                    {/* Night Meal options */}
                                    {['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet', 'Chapati diet'].map((opt, i) => (
                                        <td className={`table-cell diet-cell${i < 4 ? ' light-border' : ' dark-border'}${opt === 'Under 12 years diet' ? ' under12-col' : ''}${opt === 'Chapati diet' ? ' chapati-col' : ''}`} key={`nightMeal-${i}`}
                                            style={{
                                                borderTop: '3px solid #374151',
                                                ...(rowIdx === patientRows.length - 1 ? { borderBottom: '3px solid #374151' } : {}),
                                                ...(i === 4 ? { borderRight: '3px solid #374151' } : {})
                                            }}>
                                            <span 
                                                className={`diet-box ${row.nightMeal === opt ? 'selected' : ''}`}
                                                onClick={() => handleInputChange(rowIdx, 'nightMeal', opt)}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={opt}
                                            />
                                        </td>
                                    ))}
                                    {/* Night Extra options (Any one) */}
                                    {['Egg', 'Milk', 'High protein'].map((opt, i) => (
                                        <td className={`table-cell diet-cell${i === 0 ? ' light-border' : i === 1 ? '' : ' light-border'}`} key={`nightExtra-${i}`}
                                            style={{
                                                borderTop: '3px solid #374151',
                                                ...(rowIdx === patientRows.length - 1 ? { borderBottom: '3px solid #374151' } : {}),
                                                ...(i === 2 ? { borderRight: '3px solid #374151' } : {})
                                            }}>
                                            <span 
                                                className={`diet-box ${row.nightExtra === opt ? 'selected' : ''}`}
                                                onClick={() => handleInputChange(rowIdx, 'nightExtra', opt)}
                                                role="button"
                                                tabIndex={0}
                                                aria-label={opt}
                                            />
                                        </td>
                                    ))}
                                    {/* Status column */}
                                    <td className="table-cell diet-cell" style={{
                                        ...groupSeparatorStyle,
                                        ...groupSeparatorRightStyle,
                                        borderTop: '3px solid #374151',
                                        ...(rowIdx === patientRows.length - 1 ? { borderBottom: '3px solid #374151' } : {})
                                    }}>
                                        {row.bedNo && row.ipdNumber ? (
                                            <button
                                                className={`button table-input-small ${row.isActive === false ? 'button-success' : 'button-danger'}`}
                                                onClick={() => handleStatusButtonClick(rowIdx)}
                                                style={{
                                                    fontSize: '1rem',
                                                    padding: '0.3rem 1.6rem',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    minWidth: '140px',
                                                    backgroundColor: row.isActive === false ? '#22c55e' : undefined,
                                                    color: row.isActive === false ? '#166534' : undefined
                                                }}
                                            >
                                                {row.isActive === false ? 'Discharged' : 'Admitted'}
                                            </button>
                                        ) : (
                                            <span className="table-input-small" style={{ color: '#999' }}>N/A</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {/* Totals row */}
                            <tr>
                                {/* Bed + IPD merged */}
                                <td
                                    className="table-cell"
                                    colSpan="2"
                                    style={{
                                        ...groupSeparatorLeftStyle,
                                        borderRight: '3px solid #374151',
                                        borderTop: '3px solid #374151',
                                        borderBottom: '3px solid #374151',
                                        fontWeight: 700,
                                        textAlign: 'center'
                                    }}
                                >
                                    Total
                                </td>
                                {/* Patient name + Age merged */}
                                <td
                                    className="table-cell"
                                    colSpan="2"
                                    style={{
                                        borderRight: '3px solid #374151',
                                        borderTop: '3px solid #374151',
                                        borderBottom: '3px solid #374151',
                                        fontWeight: 600,
                                        textAlign: 'center'
                                    }}
                                >
                                    {patientsCount} {patientsCount === 1 ? 'patient' : 'patients'}
                                </td>
                                {/* Morning meal totals (4) */}
                                {morningMealTotals.map((count, i) => (
                                    <td
                                        key={`total-morningMeal-${i}`}
                                        className={`table-cell diet-cell${i < 3 ? ' light-border' : ' dark-border'}${morningMealOptions[i] === 'Under 12 years diet' ? ' under12-col' : ''}`}
                                        style={{
                                            borderTop: '3px solid #374151',
                                            borderBottom: '3px solid #374151',
                                            ...(i === 3 ? { borderRight: '3px solid #374151' } : {})
                                        }}
                                    >
                                        <span className="table-input-small" style={{ fontWeight: 700 }}>{count}</span>
                                    </td>
                                ))}
                                {/* Morning Extra totals (3) */}
                                {morningExtraTotals.map((count, i) => (
                                    <td
                                        key={`total-morningExtra-${i}`}
                                        className={`table-cell diet-cell${i === 0 ? ' light-border' : i === 1 ? ' dark-border' : ' light-border'}`}
                                        style={{
                                            borderTop: '3px solid #374151',
                                            borderBottom: '3px solid #374151',
                                            ...(i === 2 ? { borderRight: '3px solid #374151' } : {})
                                        }}
                                    >
                                        <span className="table-input-small" style={{ fontWeight: 700 }}>{count}</span>
                                    </td>
                                ))}
                                {/* Snacks totals (2) */}
                                {snacksTotals.map((count, i) => (
                                    <td
                                        key={`total-launch-${i}`}
                                        className={`table-cell diet-cell${i === 0 ? ' light-border biscuit-col' : ' dark-border'}`}
                                        style={{
                                            borderTop: '3px solid #374151',
                                            borderBottom: '3px solid #374151',
                                            ...(i === 1 ? { borderRight: '3px solid #374151' } : {})
                                        }}
                                    >
                                        <span className="table-input-small" style={{ fontWeight: 700 }}>{count}</span>
                                    </td>
                                ))}
                                {/* Night meal totals (5) */}
                                {nightMealTotals.map((count, i) => (
                                    <td
                                        key={`total-nightMeal-${i}`}
                                        className={`table-cell diet-cell${i < 4 ? ' light-border' : ' dark-border'}${nightMealOptions[i] === 'Under 12 years diet' ? ' under12-col' : ''}${nightMealOptions[i] === 'Chapati diet' ? ' chapati-col' : ''}`}
                                        style={{
                                            borderTop: '3px solid #374151',
                                            borderBottom: '3px solid #374151',
                                            ...(i === 4 ? { borderRight: '3px solid #374151' } : {})
                                        }}
                                    >
                                        <span className="table-input-small" style={{ fontWeight: 700 }}>{count}</span>
                                    </td>
                                ))}
                                {/* Night Extra totals (3) */}
                                {nightExtraTotals.map((count, i) => (
                                    <td
                                        key={`total-nightExtra-${i}`}
                                        className={`table-cell diet-cell${i === 0 ? ' light-border' : i === 1 ? '' : ' light-border'}`}
                                        style={{
                                            borderTop: '3px solid #374151',
                                            borderBottom: '3px solid #374151',
                                            ...(i === 2 ? { borderRight: '3px solid #374151' } : {})
                                        }}
                                    >
                                        <span className="table-input-small" style={{ fontWeight: 700 }}>{count}</span>
                                    </td>
                                ))}
                                {/* Status column (empty) */}
                                <td
                                    className="table-cell diet-cell"
                                    style={{
                                        ...groupSeparatorStyle,
                                        ...groupSeparatorRightStyle,
                                        borderTop: '3px solid #374151',
                                        borderBottom: '3px solid #374151',
                                        fontWeight: 700,
                                        textAlign: 'center'
                                    }}
                                >
                                    -
                                </td>
                            </tr>
                            <tr>
                                <td colSpan="22" style={{ textAlign: 'center', padding: '1rem 0' }}>
                                    <button 
                                        className="button button-success dashboard-save-btn compact-save-btn"
                                        type="button"
                                        onClick={handleSave}
                                        disabled={savingData}
                                        style={{ padding: '0.4rem 1.2rem', fontSize: '1rem', width: 'auto', maxWidth: '160px', minWidth: '80px', display: 'inline-block' }}
                                    >
                                        {savingData ? 'Saving...' : 'Save Data'}
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div className="add-patient-container" style={{ gap: '1rem' }}>
                    <button 
                        className="button button-primary dashboard-add-row-btn" 
                        type="button" 
                        onClick={addPatientRow}
                    >
                        + Add Patient
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;