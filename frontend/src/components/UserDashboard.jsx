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

    // When tomorrow is selected and no patients exist, auto-populate from today
    useEffect(() => {
        if (dateOption === 'tomorrow' && user && selectedDate === adTomorrowStr) {
            const checkAndPrefill = async () => {
                setFetchingPatients(true);
                try {
                    const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
                    // Check if patients exist for tomorrow
                    const resTomorrow = await axios.get(`${API_BASE_URL}/patients/${adTomorrowStr}`, config);
                    if (resTomorrow.data.patients && resTomorrow.data.patients.length > 0) {
                        setPatientRows(resTomorrow.data.patients);
                    } else {
                        // Use the latest fetched today patients from state
                        const prefill = (lastFetchedTodayPatients || [])
                            .filter(row => row.isActive !== false && row.bedNo && row.ipdNumber && row.name && row.age)
                            .map(row => ({
                                bedNo: row.bedNo,
                                ipdNumber: row.ipdNumber,
                                name: row.name,
                                age: row.age,
                                status: 'admit',
                            }));
                        setPatientRows(prefill.length > 0 ? prefill : [{}]);
                    }
                } catch (error) {
                    setPatientRows([{}]);
                } finally {
                    setFetchingPatients(false);
                }
            };
            checkAndPrefill();
        }
    }, [dateOption, user, selectedDate, adTodayStr, adTomorrowStr, API_BASE_URL, lastFetchedTodayPatients]);

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
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.2rem', gap: 12 }}>
                        <img src={NepaliEmblem} alt="Nepali Emblem" style={{ height: 48, width: 'auto' }} />
                        <h1 className="dashboard-hospital-title" style={{ margin: '0 16px', color: '#b71c1c', fontWeight: 700, fontSize: '2.5rem', textAlign: 'center', letterSpacing: 1 }}>
                            कोशी अस्पताल, विराटनगर
                        </h1>
                        <img src={NepaliFlag} alt="Nepali Flag" style={{ height: 36, width: 'auto' }} />
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
                            <tr>
                                <td colSpan="20" style={{ textAlign: 'center', padding: '1rem 0' }}>
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