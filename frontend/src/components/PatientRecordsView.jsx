import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import Spinner from './Spinner';
import KoshiHospitalLogo from '../assets/koshi_hospital_logo.jpg';
import NepaliDate from 'nepali-date-converter';
import './PatientRecordsView.css';

const PatientRecordsView = ({ user, onClose }) => {
    const { showToast, API_BASE_URL } = useAuth();
    const [years] = useState([2082]); // Changed to Nepali year
    const [months] = useState([
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
    ]);
    const [selectedYear, setSelectedYear] = useState('2082');
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [dates, setDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [patientData, setPatientData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Nepali calendar days for 2082 BS
    const daysInMonth2082 = {
        '01': 31, // Baisakh
        '02': 31, // Jestha
        '03': 32, // Ashar
        '04': 31, // Shrawan
        '05': 31, // Bhadra
        '06': 31, // Ashwin
        '07': 30, // Kartik
        '08': 30, // Mangsir
        '09': 30, // Poush
        '10': 29, // Magh
        '11': 30, // Falgun
        '12': 30  // Chaitra
    };

    // Generate dates for the selected month
    useEffect(() => {
        if (selectedMonth) {
            try {
                const daysInMonth = daysInMonth2082[selectedMonth.number];
                
                if (!daysInMonth) {
                    console.error('Invalid month number');
                    setDates([]);
                    return;
                }

                const dateList = Array.from({ length: daysInMonth }, (_, i) => {
                    const day = (i + 1).toString().padStart(2, '0');
                    return `${selectedYear}/${selectedMonth.number}/${day}`;
                });
                setDates(dateList);
            } catch (error) {
                console.error('Error generating dates:', error);
                setDates([]);
            }
        } else {
            setDates([]);
        }
    }, [selectedYear, selectedMonth]);    

    // Convert BS date to AD date with corrected month mappings
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

    // Fetch patient data for selected date, always merging in admitted patients from today (or most recent previous record)
    const fetchPatientData = async (date) => {
        setLoading(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            };
            // Convert Nepali date to English date for API
            const formattedDate = convertBSToAD(date);
            // Fetch patient data for the selected date
            const res = await axios.get(`${API_BASE_URL}/patients/${formattedDate}?userId=${user._id}`, config);
            let patients = res.data.patients || [];

            // Always fetch the most recent previous record (today or before)
            // Find today's date in AD
            const today = new Date();
            const yyyy = today.getFullYear();
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const dd = String(today.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;
            // If the selected date is after today, use today; otherwise, use the selected date
            const referenceDate = formattedDate > todayStr ? todayStr : formattedDate;
            // Fetch the most recent previous record (including today)
            const prevRes = await axios.get(`${API_BASE_URL}/patients/${referenceDate}?userId=${user._id}&findPrevious=true`, config);
            const prevPatients = (prevRes.data.patients || []).filter(p => p.isActive !== false);
            // Merge in any missing admitted patients from previous record
            const existingKeys = new Set(patients.map(p => `${p.bedNo}|${p.ipdNumber}`));
            prevPatients.forEach(prevPatient => {
                const key = `${prevPatient.bedNo}|${prevPatient.ipdNumber}`;
                if (!existingKeys.has(key)) {
                    // Add missing admitted patient with empty diets
                    patients.push({
                        bedNo: prevPatient.bedNo,
                        ipdNumber: prevPatient.ipdNumber,
                        name: prevPatient.name,
                        age: prevPatient.age,
                        isActive: true,
                        morningMeal: null,
                        morningExtra: null,
                        launch: null,
                        nightMeal: null,
                        nightExtra: null
                    });
                }
            });
            setPatientData(patients);
        } catch (error) {
            console.error("Error fetching patient data:", error);
            showToast(error.response?.data?.message || 'Error fetching patient data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDateClick = (date) => {
        setSelectedDate(date);
        fetchPatientData(date);
    };

    return (
        <div className="records-view-overlay">
            <div className="records-view-modal">
                <div className="records-view-header">
                    <h2>Patient Records - {user.name}</h2>
                    <button onClick={onClose} className="close-button">×</button>
                </div>

                <div className="navigation-container">
                    {/* Year and Month Selection */}
                    <div className="year-month-section">
                        {years.map(year => (
                            <div key={year} className="year-section">
                                <h3>{year}</h3>
                                <div className="month-grid">
                                    {months.map(month => (
                                        <button
                                            key={month.number}
                                            className={`month-button ${selectedMonth?.number === month.number ? 'selected' : ''}`}
                                            onClick={() => setSelectedMonth(month)}
                                        >
                                            {month.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Dates Grid */}
                    {selectedMonth && (
                        <div className="dates-section">
                            <h3>Select Date</h3>
                            <div className="dates-grid">
                                {dates.map(date => (
                                    <button
                                        key={date}
                                        className={`date-button ${selectedDate === date ? 'selected' : ''}`}
                                        onClick={() => handleDateClick(date)}
                                    >
                                        {date}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Patient Data Display */}
                {selectedDate && (
                    <div className="patient-data-section">
                        <div className="patient-data-header">
                            <img src={KoshiHospitalLogo} alt="Koshi Hospital Logo" className="hospital-logo" />
                            <div className="header-content">
                                <h2>Koshi Hospital, Biratnagar</h2>
                                <h3>Patients Diet Form</h3>
                                <div className="header-info">
                                    <p>Ward: {user.department}</p>
                                    <p>Date: {selectedDate}</p>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <Spinner />
                        ) : (
                            <div className="table-container">
                                <table className="patient-table">
                                    <thead>
                                        <tr>                                            <th className="diet-stack" rowSpan="2"><span>Bed<br/>No.</span></th>
                                            <th className="diet-stack" rowSpan="2"><span>IPD<br/>No.</span></th>
                                            <th className="diet-stack" rowSpan="2"><span>Patient<br/>name</span></th>
                                            <th rowSpan="2" className="dark-border">Age</th>
                                            <th colSpan="4">Morning meal</th>
                                            <th colSpan="3">Any one</th>
                                            <th colSpan="2">Snacks</th>
                                            <th colSpan="5">Night Meal (any one)</th>
                                            <th colSpan="3">Any one</th>
                                        </tr>
                                        <tr>
                                            <th className="light-border"><span>Simple<br/>diet</span></th>
                                            <th className="light-border"><span>Under 12<br/>years<br/>diet</span></th>
                                            <th className="light-border"><span>Soft<br/>diet</span></th>
                                            <th className="dark-border"><span>Liquid<br/>diet</span></th>
                                            <th className="light-border">Egg</th>
                                            <th>Milk</th>
                                            <th className="light-border">High protein</th>
                                            <th className="light-border">Biscuit</th>
                                            <th>Satu</th>
                                            <th className="light-border diet-stack"><span>Simple<br/>diet</span></th>
                                            <th className="light-border diet-stack"><span>Under 12<br/>years<br/>diet</span></th>
                                            <th className="light-border diet-stack"><span>Soft<br/>diet</span></th>
                                            <th className="light-border diet-stack"><span>Liquid<br/>diet</span></th>
                                            <th className="diet-stack"><span>Chapati<br/>diet</span></th>
                                            <th className="light-border">Egg</th>
                                            <th>Milk</th>
                                            <th className="light-border">High protein</th>
                                        </tr>
                                    </thead>                                    <tbody>
                                        {patientData && patientData.length > 0 ? (
                                            patientData.map((patient, index) => (
                                                <tr key={index}>
                                                    <td className="table-cell">{patient.bedNo}</td>
                                                    <td className="table-cell">{patient.ipdNumber}</td>
                                                    <td className="table-cell">{patient.name}</td>
                                                    <td className="table-cell dark-border">{patient.age}</td>
                                                    <td className="table-cell diet-cell light-border">
                                                        <span className={`diet-box ${patient.morningMeal === 'Normal diet' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell light-border">
                                                        <span className={`diet-box ${patient.morningMeal === 'Under 12 years diet' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell light-border">
                                                        <span className={`diet-box ${patient.morningMeal === 'Soft diet' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell dark-border">
                                                        <span className={`diet-box ${patient.morningMeal === 'Liquid diet' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell dark-border">
                                                        <span className={`diet-box ${patient.morningExtra === 'Egg' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell">
                                                        <span className={`diet-box ${patient.morningExtra === 'Milk' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell">
                                                        <span className={`diet-box ${patient.morningExtra === 'High protein' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell dark-border">
                                                        <span className={`diet-box ${patient.launch === 'Biscuit' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell">
                                                        <span className={`diet-box ${patient.launch === 'Satu' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell dark-border">
                                                        <span className={`diet-box ${patient.nightMeal === 'Normal diet' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell light-border">
                                                        <span className={`diet-box ${patient.nightMeal === 'Under 12 years diet' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell light-border">
                                                        <span className={`diet-box ${patient.nightMeal === 'Soft diet' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell light-border">
                                                        <span className={`diet-box ${patient.nightMeal === 'Liquid diet' ? 'selected' : ''}`}></span>
                                                    </td>                                    <td className="table-cell diet-cell">
                                                        <span className={`diet-box ${patient.nightMeal === 'Chapati diet' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell dark-border">
                                                        <span className={`diet-box ${patient.nightExtra === 'Egg' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell">
                                                        <span className={`diet-box ${patient.nightExtra === 'Milk' ? 'selected' : ''}`}></span>
                                                    </td>
                                                    <td className="table-cell diet-cell">
                                                        <span className={`diet-box ${patient.nightExtra === 'High protein' ? 'selected' : ''}`}></span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="18" className="no-data">No patient records found for this date</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
                {/* Add a small space below the table for better visual separation */}
                <div style={{height: '32px'}}></div>
            </div>
        </div>
    );
};

export default PatientRecordsView;
