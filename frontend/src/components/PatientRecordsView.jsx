import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import Spinner from './Spinner';
import KoshiHospitalLogo from '../assets/koshi_hospital_logo.jpg';
import NepaliDate from 'nepali-date-converter';
import './PatientRecordsView.css';
import { bsStringToAdString, getDaysInBsMonth } from '../utils/nepaliDate';

const PatientRecordsView = ({ user, onClose }) => {
    const { showToast, API_BASE_URL } = useAuth();
    const bsNow = new NepaliDate().getBS();
    const [years] = useState([bsNow.year - 1, bsNow.year, bsNow.year + 1]);
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
    const [selectedYear, setSelectedYear] = useState(String(bsNow.year));
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [dates, setDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [patientData, setPatientData] = useState([]);
    const [loading, setLoading] = useState(false);

    // Generate dates for the selected month
    useEffect(() => {
        if (selectedMonth) {
            try {
                const daysInMonth = getDaysInBsMonth(selectedYear, selectedMonth.number);
                
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

    // Convert BS date to AD date using reliable converter
    const convertBSToAD = (bsDate) => bsStringToAdString(bsDate);

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
                                            key={`${year}-${month.number}`}
                                            className={`month-button ${selectedMonth?.number === month.number && selectedYear === String(year) ? 'selected' : ''}`}
                                            onClick={() => {
                                                setSelectedYear(String(year));
                                                setSelectedMonth(month);
                                            }}
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
