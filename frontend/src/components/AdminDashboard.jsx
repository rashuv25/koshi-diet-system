// admin-client/src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../App';
import Spinner from './Spinner';
import Toast from './Toast';
import PatientRecordsView from './PatientRecordsView';
import UserRecordsWindow from './UserRecordsWindow';
import KoshiHospitalLogo from '../assets/koshi_hospital_logo.jpg';
import NepaliDate from 'nepali-date-converter';
import 'jspdf-autotable';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminDashboard.css';
import SettingsLogo from '../assets/settings_logo.png';
import NepaliEmblem from '../assets/nepali_emblem.png';
import NepaliFlag from '../assets/nepal_flag.png';
import { bsStringToAdString, getBsMonthDateRange, getDaysInBsMonth } from '../utils/nepaliDate';

const AdminDashboard = () => {
    const { user, logout, showToast, API_BASE_URL } = useAuth();
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [userPhone, setUserPhone] = useState('');
    const [userDepartment, setUserDepartment] = useState('ortho'); // Default department
      // States for viewing user data
    const [selectedUser, setSelectedUser] = useState(null);
    const [showPatientRecords, setShowPatientRecords] = useState(false);
    const [creatingUser, setCreatingUser] = useState(false);
    const [createdUsers, setCreatedUsers] = useState([]);
    const [fetchingUsers, setFetchingUsers] = useState(true);
    const [showCreateUser, setShowCreateUser] = useState(false);
    const [showEditUser, setShowEditUser] = useState(false);
    const [editUserData, setEditUserData] = useState(null);
    const [showDeleteUser, setShowDeleteUser] = useState(false);
    const [deleteUserId, setDeleteUserId] = useState(null);
    const [reportData, setReportData] = useState([]);
    const [reportLoading, setReportLoading] = useState(false);
    const today = new Date();
    const bsToday = new NepaliDate(today);
    const bsTodayParts = bsToday.getBS();
    const defaultYear = String(bsTodayParts.year);
    const defaultMonth = String(bsTodayParts.month + 1).padStart(2, '0');
    const defaultDay = String(bsTodayParts.date).padStart(2, '0');
    const availableBsYears = [bsTodayParts.year - 1, bsTodayParts.year, bsTodayParts.year + 1];
    const [reportYear, setReportYear] = useState(defaultYear);
    const [reportMonth, setReportMonth] = useState(defaultMonth);
    const [showMonthlyDietReport, setShowMonthlyDietReport] = useState(false);
    const [monthlyDietReport, setMonthlyDietReport] = useState([]);
    const [monthlyReportLoading, setMonthlyReportLoading] = useState(false);
    const [selectedReportMonth, setSelectedReportMonth] = useState('');
    const [selectedReportYear, setSelectedReportYear] = useState(defaultYear);
    const [isMonthlyWardWise, setIsMonthlyWardWise] = useState(false);
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

    const [wards, setWards] = useState([]);
    const [wardsLoading, setWardsLoading] = useState(true);
    const [showWardSettings, setShowWardSettings] = useState(false);
    const [newWardName, setNewWardName] = useState('');
    const [editingWard, setEditingWard] = useState(null);
    const [editingWardName, setEditingWardName] = useState('');

    // Fetch wards from backend
    useEffect(() => {
        const fetchWards = async () => {
            setWardsLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
                const res = await axios.get(`${API_BASE_URL}/admin/wards`, config);
                setWards(res.data.wards.map(w => w.name));
            } catch (err) {
                showToast('Error fetching wards', 'error');
            } finally {
                setWardsLoading(false);
            }
        };
        fetchWards();
    }, [API_BASE_URL]);

    // CRUD handlers for wards
    const handleCreateWard = async (e) => {
        e.preventDefault();
        if (!newWardName.trim()) return;
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            await axios.post(`${API_BASE_URL}/admin/wards`, { name: newWardName.trim() }, config);
            setNewWardName('');
            setShowWardSettings(false);
            showToast('Ward created', 'success');
            // Refresh wards
            const res = await axios.get(`${API_BASE_URL}/admin/wards`, config);
            setWards(res.data.wards.map(w => w.name));
        } catch (err) {
            showToast(err.response?.data?.message || 'Error creating ward', 'error');
        }
    };
    const handleEditWard = (ward) => {
        setEditingWard(ward);
        setEditingWardName(ward);
    };
    const handleUpdateWard = async (e) => {
        e.preventDefault();
        if (!editingWardName.trim()) return;
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            const wardObj = await axios.get(`${API_BASE_URL}/admin/wards`, config);
            const wardId = wardObj.data.wards.find(w => w.name === editingWard)._id;
            await axios.put(`${API_BASE_URL}/admin/wards/${wardId}`, { name: editingWardName.trim() }, config);
            setEditingWard(null);
            setEditingWardName('');
            showToast('Ward updated', 'success');
            // Refresh wards
            const res = await axios.get(`${API_BASE_URL}/admin/wards`, config);
            setWards(res.data.wards.map(w => w.name));
        } catch (err) {
            showToast(err.response?.data?.message || 'Error updating ward', 'error');
        }
    };
    const handleDeleteWard = async (ward) => {
        if (!window.confirm('Are you sure you want to delete this ward?')) return;
        try {
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            const wardObj = await axios.get(`${API_BASE_URL}/admin/wards`, config);
            const wardId = wardObj.data.wards.find(w => w.name === ward)._id;
            await axios.delete(`${API_BASE_URL}/admin/wards/${wardId}`, config);
            showToast('Ward deleted', 'success');
            // Refresh wards
            const res = await axios.get(`${API_BASE_URL}/admin/wards`, config);
            setWards(res.data.wards.map(w => w.name));
        } catch (err) {
            showToast(err.response?.data?.message || 'Error deleting ward', 'error');
        }
    };

    // Diet columns for report
    const dietColumns = [
        { key: 'morningMeal_Normal diet', label: 'Normal diet' },
        { key: 'morningMeal_Under 12 years diet', label: 'Under 12 years diet' },
        { key: 'morningMeal_Soft diet', label: 'Soft diet' },
        { key: 'morningMeal_Liquid diet', label: 'Liquid diet' },
        { key: 'morningExtra_Egg', label: 'Egg' },
        { key: 'morningExtra_Milk', label: 'Milk' },
        { key: 'morningExtra_High protein', label: 'High protein' },
        { key: 'launch_Biscuit', label: 'Biscuit' },
        { key: 'launch_Satu', label: 'Satu' },
        { key: 'nightMeal_Normal diet', label: 'Normal diet' },
        { key: 'nightMeal_Under 12 years diet', label: 'Under 12 years diet' },
        { key: 'nightMeal_Soft diet', label: 'Soft diet' },
        { key: 'nightMeal_Liquid diet', label: 'Liquid diet' },
        { key: 'nightMeal_Chapati diet', label: 'Chapati diet' },
        { key: 'nightExtra_Egg', label: 'Egg' },
        { key: 'nightExtra_Milk', label: 'Milk' },
        { key: 'nightExtra_High protein', label: 'High protein' },
    ];

    // Fetch users created by this admin
    useEffect(() => {
        const fetchCreatedUsers = async () => {
            try {
                const config = {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                };
                const res = await axios.get(`${API_BASE_URL}/admin/users`, config);
                setCreatedUsers(res.data.users);
            } catch (error) {
                console.error("Error fetching created users:", error.response?.data?.message || error.message);
                showToast(error.response?.data?.message || 'Error fetching created users.', 'error');
            } finally {
                setFetchingUsers(false);
            }
        };

        if (user && user.role === 'admin') {
            fetchCreatedUsers();
        } else {
            setFetchingUsers(false);
        }
    }, [user, API_BASE_URL, showToast]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreatingUser(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            };
            const res = await axios.post(`${API_BASE_URL}/admin/users`, {
                name: userName,
                email: userEmail,
                password: userPassword,
                phone: userPhone,
                department: userDepartment,
            }, config);
            showToast(res.data.message, 'success');
            // Add the newly created user to the local state
            setCreatedUsers(prevUsers => [...prevUsers, res.data.user]);
            // Clear form
            setUserName('');
            setUserEmail('');
            setUserPassword(''); // Clear password field
            setUserPhone('');
            setUserDepartment('ortho');
            setShowCreateUser(false); // Close modal after success
        } catch (error) {
            console.error("Error creating user:", error.response?.data?.message || error.message);
            showToast(error.response?.data?.message || 'Error creating user', 'error');
        } finally {
            setCreatingUser(false);
        }
    };

    // Handler to open edit modal
    const handleEditClick = (userItem) => {
        setEditUserData({ ...userItem });
        setShowEditUser(true);
    };

    // Handler for edit form changes
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditUserData((prev) => ({ ...prev, [name]: value }));
    };

    // Handler to save edited user
    const handleEditSave = async (e) => {
        e.preventDefault();
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            };
            const res = await axios.put(`${API_BASE_URL}/admin/users/${editUserData._id}`, {
                name: editUserData.name,
                email: editUserData.email,
                phone: editUserData.phone,
                department: editUserData.department,
            }, config);
            showToast(res.data.message, 'success');
            setCreatedUsers((prev) => prev.map(u => u._id === editUserData._id ? { ...u, ...res.data.user } : u));
            setShowEditUser(false);
            setEditUserData(null);
        } catch (error) {
            showToast(error.response?.data?.message || 'Error updating user', 'error');
        }
    };

    // Handler to open delete confirmation
    const handleDeleteClick = (userId) => {
        setDeleteUserId(userId);
        setShowDeleteUser(true);
    };

    // Handler to confirm delete
    const handleDeleteConfirm = async () => {
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            };
            await axios.delete(`${API_BASE_URL}/admin/users/${deleteUserId}`, config);
            setCreatedUsers((prev) => prev.filter(u => u._id !== deleteUserId));
            showToast('User deleted successfully', 'success');
        } catch (error) {
            showToast(error.response?.data?.message || 'Error deleting user', 'error');
        } finally {
            setShowDeleteUser(false);
            setDeleteUserId(null);
        }
    };    // Handler to view user data
    const handleViewUserData = (userItem) => {
        setSelectedUser(userItem);
        setShowPatientRecords(true);
    };

    // Handler to view patient data for a specific date
    const handleViewDateData = async (date) => {
        if (!selectedUser) return;
        
        setSelectedDate(date);
        setLoadingPatients(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            };
            const res = await axios.get(`${API_BASE_URL}/patients/user/${selectedUser._id}/${date}`, config);
            setPatientData(res.data.patients);
        } catch (error) {
            console.error("Error fetching patient data:", error.response?.data?.message || error.message);
            showToast(error.response?.data?.message || 'Error fetching patient data', 'error');
            setPatientData([]);
        } finally {
            setLoadingPatients(false);
        }
    };

    // Fetch report data for all wards for the selected Nepali month
    useEffect(() => {
        const fetchReport = async () => {
            if (!reportYear || !reportMonth) return;
            setReportLoading(true);
            try {
                const config = {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                };
                const usersRes = await axios.get(`${API_BASE_URL}/admin/users`, config);
                const users = usersRes.data.users;
                const { start, end } = getBsMonthDateRange(reportYear, reportMonth);
                const wardNames = wards; // Use the wards state
                const reportRows = [];
                let sn = 1;
                for (const ward of wardNames) {
                    const wardUsers = users.filter(u => u.department === ward);
                    // Diet counts for this ward
                    let dietCounts = {
                        morning: { 'Normal diet': 0, 'Under 12 years diet': 0, 'Soft diet': 0, 'Liquid diet': 0 },
                        morningExtra: { Egg: 0, Milk: 0, 'High protein': 0 },
                        launch: { Biscuit: 0, Satu: 0 },
                        night: { 'Normal diet': 0, 'Under 12 years diet': 0, 'Soft diet': 0, 'Liquid diet': 0, 'Chapati diet': 0 },
                        nightExtra: { Egg: 0, Milk: 0, 'High protein': 0 }
                    };
                    for (const u of wardUsers) {
                        // Fetch all records for this user in the AD date range
                        const res = await axios.get(`${API_BASE_URL}/patients/user/${u._id}/range?start=${start}&end=${end}`, config);
                        const records = res.data.records || [];
                        for (const rec of records) {
                            for (const patient of rec.patients) {
                                if (patient.morningMeal) dietCounts.morning[patient.morningMeal] = (dietCounts.morning[patient.morningMeal] || 0) + 1;
                                if (patient.morningExtra) dietCounts.morningExtra[patient.morningExtra] = (dietCounts.morningExtra[patient.morningExtra] || 0) + 1;
                                if (patient.launch) dietCounts.launch[patient.launch] = (dietCounts.launch[patient.launch] || 0) + 1;
                                if (patient.nightMeal) dietCounts.night[patient.nightMeal] = (dietCounts.night[patient.nightMeal] || 0) + 1;
                                if (patient.nightExtra) dietCounts.nightExtra[patient.nightExtra] = (dietCounts.nightExtra[patient.nightExtra] || 0) + 1;
                            }
                        }
                    }
                    reportRows.push({ sn, ward, ...dietCounts });
                    sn++;
                }
                setReportData(reportRows);
            } catch (err) {
                showToast('Error fetching report data', 'error');
                setReportData([]);
            } finally {
                setReportLoading(false);
            }
        };
        if (user && user.role === 'admin') fetchReport();
    }, [user, API_BASE_URL, reportYear, reportMonth, wards]);

    const monthlyDietSections = [
        { key: 'morning', title: 'Morning meal', diets: ['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet'] },
        { key: 'morningExtra', title: 'Any one', diets: ['Egg', 'Milk', 'High protein'] },
        { key: 'launch', title: 'Snacks', diets: ['Biscuit', 'Satu'] },
        { key: 'night', title: 'Night Meal (any one)', diets: ['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet', 'Chapati diet'] },
        { key: 'nightExtra', title: 'Any one', diets: ['Egg', 'Milk', 'High protein'] },
    ];

    // Function to generate the monthly diet report (Diet × Ward × Orders)
    const generateMonthlyDietReport = async () => {
        if (!selectedReportYear || !selectedReportMonth) return;
        setMonthlyReportLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            };
            const { start, end } = getBsMonthDateRange(selectedReportYear, selectedReportMonth);
            // Fetch all users across all wards
            const usersRes = await axios.get(`${API_BASE_URL}/admin/users`, config);
            const users = usersRes.data.users;
            // Build ward list
            const wardList = Array.isArray(wards) && wards.length ? wards : [...new Set(users.map(u => u.department).filter(Boolean))];

            const zeroWardMap = () => wardList.reduce((acc, w) => { acc[w] = 0; return acc; }, {});

            // Initialize matrix Diet × Ward
            const matrix = {
                morning: {
                    'Normal diet': zeroWardMap(),
                    'Under 12 years diet': zeroWardMap(),
                    'Soft diet': zeroWardMap(),
                    'Liquid diet': zeroWardMap(),
                },
                morningExtra: {
                    'Egg': zeroWardMap(),
                    'Milk': zeroWardMap(),
                    'High protein': zeroWardMap(),
                },
                launch: {
                    'Biscuit': zeroWardMap(),
                    'Satu': zeroWardMap(),
                },
                night: {
                    'Normal diet': zeroWardMap(),
                    'Under 12 years diet': zeroWardMap(),
                    'Soft diet': zeroWardMap(),
                    'Liquid diet': zeroWardMap(),
                    'Chapati diet': zeroWardMap(),
                },
                nightExtra: {
                    'Egg': zeroWardMap(),
                    'Milk': zeroWardMap(),
                    'High protein': zeroWardMap(),
                },
            };

            // Fetch and aggregate data for all users, grouped by ward
            for (const u of users) {
                const wardName = u.department;
                if (!wardName) continue;
                const res = await axios.get(`${API_BASE_URL}/patients/user/${u._id}/range?start=${start}&end=${end}`, config);
                const records = res.data.records || [];
                for (const rec of records) {
                    for (const patient of rec.patients) {
                        if (patient.morningMeal && matrix.morning[patient.morningMeal]) {
                            matrix.morning[patient.morningMeal][wardName] = (matrix.morning[patient.morningMeal][wardName] || 0) + 1;
                        }
                        if (patient.morningExtra && matrix.morningExtra[patient.morningExtra]) {
                            matrix.morningExtra[patient.morningExtra][wardName] = (matrix.morningExtra[patient.morningExtra][wardName] || 0) + 1;
                        }
                        if (patient.launch && matrix.launch[patient.launch]) {
                            matrix.launch[patient.launch][wardName] = (matrix.launch[patient.launch][wardName] || 0) + 1;
                        }
                        if (patient.nightMeal && matrix.night[patient.nightMeal]) {
                            matrix.night[patient.nightMeal][wardName] = (matrix.night[patient.nightMeal][wardName] || 0) + 1;
                        }
                        if (patient.nightExtra && matrix.nightExtra[patient.nightExtra]) {
                            matrix.nightExtra[patient.nightExtra][wardName] = (matrix.nightExtra[patient.nightExtra][wardName] || 0) + 1;
                        }
                    }
                }
            }

            const overallTotals = monthlyDietSections.reduce((acc, section) => {
                acc[section.key] = section.diets.reduce((dietAcc, diet) => {
                    dietAcc[diet] = wardList.reduce((sum, ward) => sum + (matrix[section.key][diet][ward] || 0), 0);
                    return dietAcc;
                }, {});
                return acc;
            }, {});

            const wardSummaries = wardList.map(wardName => {
                const summary = { ward: wardName };
                monthlyDietSections.forEach(section => {
                    summary[section.key] = section.diets.reduce((dietAcc, diet) => {
                        dietAcc[diet] = matrix[section.key][diet][wardName] || 0;
                        return dietAcc;
                    }, {});
                });
                return summary;
            });

            setMonthlyDietReport([{ matrix, wards: wardList, wardSummaries, overallTotals }]);
        } catch (error) {
            console.error("Error generating monthly report:", error);
            showToast('Error generating monthly report', 'error');
            setMonthlyDietReport([]);
        } finally {
            setMonthlyReportLoading(false);
        }
    };

    // Download monthly report as PDF (Diet × Ward matrix)
    const handleDownloadMonthlyReport = () => {
        if (!monthlyDietReport.length) return;
        const { matrix, wards: wardList, wardSummaries = [], overallTotals = {} } = monthlyDietReport[0];

        if (isMonthlyWardWise) {
            const doc = new jsPDF('p', 'pt', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const darkColor = '#374151';
            const headerTextColor = '#FFFFFF';
            const bodyTextColor = '#111827';

            const buildSummaryBody = (source) => {
                const rows = [];
                monthlyDietSections.forEach(section => {
                    rows.push([{ content: section.title, colSpan: 2, styles: { fillColor: '#f5f5f5', fontStyle: 'bold', halign: 'left' } }]);
                    section.diets.forEach(diet => {
                        const value = (source[section.key] && source[section.key][diet]) || 0;
                        rows.push([diet, String(value)]);
                    });
                });
                return rows;
            };

            const drawPageHeader = () => {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(18);
                doc.setTextColor(bodyTextColor);
                doc.text('Ward-wise Monthly Diet Report', pageWidth / 2, 40, { align: 'center' });
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(12);
                doc.text(`Year: ${selectedReportYear}  Month: ${nepaliMonths.find(m => m.number === selectedReportMonth)?.name || ''}`, pageWidth / 2, 60, { align: 'center' });
            };

            const tableStartY = 110;
            drawPageHeader();
            const sortedSummaries = [...wardSummaries].sort((a, b) => a.ward.localeCompare(b.ward));
            sortedSummaries.forEach((summary, idx) => {
                if (idx > 0) {
                    doc.addPage();
                    drawPageHeader();
                }

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(13);
                doc.text(`Ward: ${summary.ward}`, 40, tableStartY - 20);

                autoTable(doc, {
                    startY: tableStartY,
                    head: [['Diet', 'Orders']],
                    body: buildSummaryBody(summary),
                    theme: 'grid',
                    styles: { font: 'helvetica', textColor: bodyTextColor, lineColor: '#E5E7EB', lineWidth: 1, fontSize: 9, cellPadding: 5 },
                    headStyles: { fillColor: darkColor, textColor: headerTextColor, fontStyle: 'bold', halign: 'center' },
                    columnStyles: { 0: { cellWidth: 200, halign: 'left' }, 1: { halign: 'center' } },
                    margin: { left: 30, right: 30 },
                });
            });

            if (Object.keys(overallTotals).length) {
                doc.addPage();
                drawPageHeader();
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text('All wards monthly total', 40, tableStartY - 20);
                autoTable(doc, {
                    startY: tableStartY,
                    head: [['Diet', 'Orders']],
                    body: buildSummaryBody(overallTotals),
                    theme: 'grid',
                    styles: { font: 'helvetica', textColor: bodyTextColor, lineColor: '#E5E7EB', lineWidth: 1, fontSize: 9, cellPadding: 5 },
                    headStyles: { fillColor: darkColor, textColor: headerTextColor, fontStyle: 'bold', halign: 'center' },
                    columnStyles: { 0: { cellWidth: 200, halign: 'left' }, 1: { halign: 'center' } },
                    margin: { left: 30, right: 30 },
                });
            }

            doc.save(`Ward_Wise_Monthly_Diet_Report_${selectedReportYear}_${selectedReportMonth}.pdf`);
            return;
        }

        const doc = new jsPDF('l', 'pt', 'a4');
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

        const buildSection = (title, dietsObj) => {
            const head = [['Diet', ...wardList, 'Total']];
            const body = [];
            body.push([{ content: title, colSpan: head[0].length, styles: { fillColor: '#f5f5f5', fontStyle: 'bold', halign: 'left' } }]);
            Object.keys(dietsObj).forEach(dietName => {
                const wardCounts = wardList.map(w => dietsObj[dietName][w] || 0);
                const total = wardCounts.reduce((a, b) => a + b, 0);
                body.push([dietName, ...wardCounts.map(String), String(total)]);
            });
            return { head, body };
        };

        const sections = [
            ['Morning meal', matrix.morning],
            ['Any one', matrix.morningExtra],
            ['Snacks', matrix.launch],
            ['Night Meal (any one)', matrix.night],
            ['Any one', matrix.nightExtra],
        ];

        let startY = 80;
        sections.forEach(([title, diets]) => {
            const { head, body } = buildSection(title, diets);
            autoTable(doc, {
                startY,
                head,
                body,
                theme: 'grid',
                styles: { font: 'helvetica', textColor: bodyTextColor, lineColor: '#E5E7EB', lineWidth: 1, fontSize: 9, cellPadding: 5 },
                headStyles: { fillColor: darkColor, textColor: headerTextColor, fontStyle: 'bold', halign: 'center' },
                columnStyles: { 0: { cellWidth: 160, halign: 'left' } },
                margin: { left: 30, right: 30 },
                didDrawPage: (data) => {
                    startY = data.cursor.y + 16;
                },
            });
        });

        doc.save(`Monthly_Diet_Report_${selectedReportYear}_${selectedReportMonth}.pdf`);
    };

    const [selectedDate, setSelectedDate] = useState(null);
    const [loadingPatients, setLoadingPatients] = useState(false);
    const [patientData, setPatientData] = useState([]);

    // Vendor user management states
    const [vendorName, setVendorName] = useState('');
    const [vendorEmail, setVendorEmail] = useState('');
    const [vendorPassword, setVendorPassword] = useState('');
    const [vendorPhone, setVendorPhone] = useState('');
    const [creatingVendor, setCreatingVendor] = useState(false);
    const [createdVendors, setCreatedVendors] = useState([]);
    const [fetchingVendors, setFetchingVendors] = useState(true);
    const [showCreateVendor, setShowCreateVendor] = useState(false);
    // Vendor edit/delete modal state
    const [showEditVendor, setShowEditVendor] = useState(false);
    const [editVendorData, setEditVendorData] = useState(null);
    const [showDeleteVendor, setShowDeleteVendor] = useState(false);
    const [deleteVendorId, setDeleteVendorId] = useState(null);

    // Fetch vendors
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const config = {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                };
                const res = await axios.get(`${API_BASE_URL}/vendor`, config);
                setCreatedVendors(res.data);
            } catch (error) {
                showToast(error.response?.data?.error || 'Error fetching vendors', 'error');
            } finally {
                setFetchingVendors(false);
            }
        };
        if (user && user.role === 'admin') fetchVendors();
        else setFetchingVendors(false);
    }, [user, API_BASE_URL, showToast]);

    const handleCreateVendor = async (e) => {
        e.preventDefault();
        setCreatingVendor(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            };
            const res = await axios.post(`${API_BASE_URL}/vendor/create`, {
                name: vendorName,
                email: vendorEmail,
                password: vendorPassword,
                phone: vendorPhone, // <-- send phone
            }, config);
            showToast(res.data.message, 'success');
            setCreatedVendors(prev => [...prev, res.data.vendor]);
            setVendorName(''); setVendorEmail(''); setVendorPassword(''); setVendorPhone('');
            setShowCreateVendor(false);
        } catch (error) {
            showToast(error.response?.data?.error || 'Error creating vendor', 'error');
        } finally {
            setCreatingVendor(false);
        }
    };

    // Handler to open edit vendor modal
    const handleEditVendorClick = (vendor) => {
        setEditVendorData({ ...vendor });
        setShowEditVendor(true);
    };
    // Handler to open delete vendor modal
    const handleDeleteVendorClick = (vendorId) => {
        setDeleteVendorId(vendorId);
        setShowDeleteVendor(true);
    };

    // Add vendor delete logic
    const handleDeleteVendorConfirm = async () => {
        if (!deleteVendorId) return;
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            };
            await axios.delete(`${API_BASE_URL}/vendor/${deleteVendorId}`, config);
            setCreatedVendors(prev => prev.filter(v => v._id !== deleteVendorId));
            showToast('Vendor deleted successfully', 'success');
        } catch (error) {
            showToast(error.response?.data?.error || 'Error deleting vendor', 'error');
        } finally {
            setShowDeleteVendor(false);
            setDeleteVendorId(null);
        }
    };

    // --- Daily Report Modal State ---
    const [showDailyReportModal, setShowDailyReportModal] = useState(false);
    const [dailyReportYear, setDailyReportYear] = useState(defaultYear);
    const [dailyReportMonth, setDailyReportMonth] = useState(defaultMonth);
    const [dailyReportDay, setDailyReportDay] = useState(defaultDay);
    const [dailyReportWard, setDailyReportWard] = useState('');
    const [dailyReportLoading, setDailyReportLoading] = useState(false);
    const [dailyReportRows, setDailyReportRows] = useState([]);

    useEffect(() => {
        const maxDay = getDaysInBsMonth(dailyReportYear, dailyReportMonth);
        if (parseInt(dailyReportDay, 10) > maxDay) {
            setDailyReportDay(String(maxDay).padStart(2, '0'));
        }
    }, [dailyReportYear, dailyReportMonth]);

    const dailyReportDayCount = getDaysInBsMonth(dailyReportYear, dailyReportMonth);

    // --- Fetch Daily Report Data ---
    const handleGenerateDailyReport = async () => {
        setDailyReportLoading(true);
        setDailyReportRows([]);
        try {
            // Convert BS date to AD
            const bsDate = `${dailyReportYear}/${dailyReportMonth}/${dailyReportDay}`;
            const adDateString = bsStringToAdString(bsDate);
            if (!adDateString) {
                throw new Error('Invalid Nepali date');
            }
            const config = { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } };
            // Fetch all users
            const usersRes = await axios.get(`${API_BASE_URL}/admin/users`, config);
            let users = usersRes.data.users;
            if (dailyReportWard !== 'ALL_WARDS') {
                users = users.filter(u => u.department === dailyReportWard);
            }
            const allPatients = [];
            const processedIpdNumbers = new Set(); // Keep track of processed patients to avoid duplicates

            for (const u of users) {
                // Fetch all records for this user for the selected date
                const res = await axios.get(`${API_BASE_URL}/patients/user/${u._id}/range?start=${adDateString}&end=${adDateString}`, config);
                const records = res.data.records || [];
                for (const rec of records) {
                    for (const patient of rec.patients) {
                        // Use IPD number as the unique key to prevent duplicates
                        const ipdKey = patient.ipdNumber;
                        if (ipdKey && !processedIpdNumbers.has(ipdKey)) {
                        allPatients.push({
                            ...(dailyReportWard === 'ALL_WARDS' ? { ward: u.department } : {}),
                            bedNo: patient.bedNo || '',
                            ipdNumber: patient.ipdNumber || '',
                            name: patient.name || '',
                            age: patient.age || '',
                            morningMeal: patient.morningMeal || '',
                            morningExtra: patient.morningExtra || '',
                            launch: patient.launch || '',
                            nightMeal: patient.nightMeal || '',
                            nightExtra: patient.nightExtra || ''
                        });
                            processedIpdNumbers.add(ipdKey);
                        } else if (!ipdKey) {
                            // If there's no IPD number, add the patient record but warn about potential duplicates
                            console.warn("Patient record without IPD number found, may cause duplicates:", patient);
                            allPatients.push({
                                ...(dailyReportWard === 'ALL_WARDS' ? { ward: u.department } : {}),
                                bedNo: patient.bedNo || '',
                                ipdNumber: '',
                                name: patient.name || '',
                                age: patient.age || '',
                                morningMeal: patient.morningMeal || '',
                                morningExtra: patient.morningExtra || '',
                                launch: patient.launch || '',
                                nightMeal: patient.nightMeal || '',
                                nightExtra: patient.nightExtra || ''
                            });
                        }
                    }
                }
            }
            setDailyReportRows(allPatients);
        } catch (err) {
            showToast('Error fetching daily report data', 'error');
            setDailyReportRows([]);
        } finally {
            setDailyReportLoading(false);
        }
    };

    // --- Download Daily Report as PDF ---
    const handleDownloadDailyReport = async () => {
        if (!dailyReportRows.length) return;

        const doc = new jsPDF('l', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const tick = 'selected'; // Represents a selected diet, you can change this

        // --- PDF styles ---
        const darkColor = '#374151'; // Dark gray for borders and headers
        const lightColor = '#6B7280'; // Medium gray for internal borders (darker than before)
        const headerTextColor = '#FFFFFF';
        const bodyTextColor = '#111827';
        const tickColor = '#2563EB'; // Blue for the selected box

        // --- Title ---
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(bodyTextColor);
        doc.text('Daily Diet Report', pageWidth / 2, 40, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(12);
        doc.text(`Year: ${dailyReportYear}  Month: ${nepaliMonths.find(m => m.number === dailyReportMonth)?.name || ''}  Day: ${dailyReportDay}`, pageWidth / 2, 60, { align: 'center' });

        const processWard = (patients, wardName, startY) => {
            if (wardName) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(14);
                doc.text(`Ward: ${wardName}`, 40, startY);
                startY += 25;
            }

            const head = [
                [
                    { content: 'BED\nNO.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'IPD\nNO.', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'PATIENT\nNAME', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'AGE', rowSpan: 2, styles: { halign: 'center', valign: 'middle' } },
                    { content: 'MORNING MEAL', colSpan: 4, styles: { halign: 'center' } },
                    { content: 'ANY ONE', colSpan: 3, styles: { halign: 'center' } },
                    { content: 'SNACKS', colSpan: 2, styles: { halign: 'center' } },
                    { content: 'NIGHT MEAL (ANY ONE)', colSpan: 5, styles: { halign: 'center' } },
                    { content: 'ANY ONE', colSpan: 3, styles: { halign: 'center' } }
                ],
                [
                    'NORMAL\nDIET', 'UNDER 12\nYEARS DIET', 'SOFT\nDIET', 'LIQUID\nDIET',
                    'EGG', 'MILK', 'HIGH\nPROTEIN',
                    'BISCUIT', 'SATU',
                    'NORMAL\nDIET', 'UNDER 12\nYEARS DIET', 'SOFT\nDIET', 'LIQUID\nDIET', 'CHAPATI\nDIET',
                    'EGG', 'MILK', 'HIGH\nPROTEIN'
                ]
            ];

            const body = patients.map(row => [
                row.bedNo, row.ipdNumber, row.name, row.age,
                // Morning meal
                row.morningMeal === 'Normal diet' ? tick : '',
                row.morningMeal === 'Under 12 years diet' ? tick : '',
                row.morningMeal === 'Soft diet' ? tick : '',
                row.morningMeal === 'Liquid diet' ? tick : '',
                // Morning Extra
                row.morningExtra === 'Egg' ? tick : '',
                row.morningExtra === 'Milk' ? tick : '',
                row.morningExtra === 'High protein' ? tick : '',
                // Snacks
                row.launch === 'Biscuit' ? tick : '',
                row.launch === 'Satu' ? tick : '',
                // Night Meal
                row.nightMeal === 'Normal diet' ? tick : '',
                row.nightMeal === 'Under 12 years diet' ? tick : '',
                row.nightMeal === 'Soft diet' ? tick : '',
                row.nightMeal === 'Liquid diet' ? tick : '',
                row.nightMeal === 'Chapati diet' ? tick : '',
                // Night Extra
                row.nightExtra === 'Egg' ? tick : '',
                row.nightExtra === 'Milk' ? tick : '',
                row.nightExtra === 'High protein' ? tick : '',
            ]);

            // Compute totals for this ward
            const totals = patients.reduce((acc, p) => {
                acc.morningNormal += p.morningMeal === 'Normal diet' ? 1 : 0;
                acc.morningUnder12 += p.morningMeal === 'Under 12 years diet' ? 1 : 0;
                acc.morningSoft += p.morningMeal === 'Soft diet' ? 1 : 0;
                acc.morningLiquid += p.morningMeal === 'Liquid diet' ? 1 : 0;
                acc.morningEgg += p.morningExtra === 'Egg' ? 1 : 0;
                acc.morningMilk += p.morningExtra === 'Milk' ? 1 : 0;
                acc.morningHighProtein += p.morningExtra === 'High protein' ? 1 : 0;
                acc.snackBiscuit += p.launch === 'Biscuit' ? 1 : 0;
                acc.snackSatu += p.launch === 'Satu' ? 1 : 0;
                acc.nightNormal += p.nightMeal === 'Normal diet' ? 1 : 0;
                acc.nightUnder12 += p.nightMeal === 'Under 12 years diet' ? 1 : 0;
                acc.nightSoft += p.nightMeal === 'Soft diet' ? 1 : 0;
                acc.nightLiquid += p.nightMeal === 'Liquid diet' ? 1 : 0;
                acc.nightChapati += p.nightMeal === 'Chapati diet' ? 1 : 0;
                acc.nightEgg += p.nightExtra === 'Egg' ? 1 : 0;
                acc.nightMilk += p.nightExtra === 'Milk' ? 1 : 0;
                acc.nightHighProtein += p.nightExtra === 'High protein' ? 1 : 0;
                return acc;
            }, {
                morningNormal: 0, morningUnder12: 0, morningSoft: 0, morningLiquid: 0,
                morningEgg: 0, morningMilk: 0, morningHighProtein: 0,
                snackBiscuit: 0, snackSatu: 0,
                nightNormal: 0, nightUnder12: 0, nightSoft: 0, nightLiquid: 0, nightChapati: 0,
                nightEgg: 0, nightMilk: 0, nightHighProtein: 0,
            });

            const totalsRow = [
                { content: 'TOTAL', colSpan: 4, styles: { fontStyle: 'bold', halign: 'center' } },
                totals.morningNormal, totals.morningUnder12, totals.morningSoft, totals.morningLiquid,
                totals.morningEgg, totals.morningMilk, totals.morningHighProtein,
                totals.snackBiscuit, totals.snackSatu,
                totals.nightNormal, totals.nightUnder12, totals.nightSoft, totals.nightLiquid, totals.nightChapati,
                totals.nightEgg, totals.nightMilk, totals.nightHighProtein,
            ];

            autoTable(doc, {
                head,
                body: [...body, totalsRow],
                startY,
                theme: 'grid',
                rowPageBreak: 'avoid',
                styles: {
                    font: 'helvetica',
                    textColor: bodyTextColor,
                    lineColor: lightColor,
                    lineWidth: 1,
                    halign: 'center',
                    valign: 'middle',
                    fontSize: 8,
                    cellPadding: 4,
                },
                headStyles: {
                    fillColor: darkColor,
                    textColor: headerTextColor,
                    fontStyle: 'bold',
                    fontSize: 7,
                    lineColor: darkColor,
                    lineWidth: 2,
                    cellPadding: 4,
                },
                columnStyles: {
                    0: { cellWidth: 32, halign: 'center' },
                    1: { cellWidth: 32, halign: 'center' },
                    2: { cellWidth: 90, halign: 'left' },
                    3: { cellWidth: 32, halign: 'center' },
                    4: { cellWidth: 38, halign: 'center' },
                    5: { cellWidth: 38, halign: 'center' },
                    6: { cellWidth: 38, halign: 'center' },
                    7: { cellWidth: 38, halign: 'center' },
                    8: { cellWidth: 38, halign: 'center' },
                    9: { cellWidth: 38, halign: 'center' },
                    10: { cellWidth: 42, halign: 'center' },
                    11: { cellWidth: 38, halign: 'center' },
                    12: { cellWidth: 38, halign: 'center' },
                    13: { cellWidth: 38, halign: 'center' },
                    14: { cellWidth: 38, halign: 'center' },
                    15: { cellWidth: 38, halign: 'center' },
                    16: { cellWidth: 38, halign: 'center' },
                    17: { cellWidth: 38, halign: 'center' },
                    18: { cellWidth: 37, halign: 'center' },
                    19: { cellWidth: 42, halign: 'center' },
                },
                margin: { left: 2.5, right: 0.2 },
                didDrawCell: (data) => {
                    const darkBorderCols = [3, 7, 10, 12, 17, 20];

                    if (data.section === 'head') {
                        doc.setLineWidth(2);
                        doc.setDrawColor(darkColor);
                        doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                        doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
                        doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);

                        if (!darkBorderCols.includes(data.column.index)) {
                            doc.setLineWidth(1);
                            doc.setDrawColor(lightColor);
                            doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                        }
                    }

                    if (data.section === 'body') {
                        doc.setLineWidth(1);
                        doc.setDrawColor(lightColor);
                        doc.line(data.cell.x, data.cell.y, data.cell.x + data.cell.width, data.cell.y);
                        doc.line(data.cell.x, data.cell.y + data.cell.height, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                        doc.line(data.cell.x, data.cell.y, data.cell.x, data.cell.y + data.cell.height);
                        doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);

                        if (darkBorderCols.includes(data.column.index)) {
                            doc.setLineWidth(2);
                            doc.setDrawColor(darkColor);
                            doc.line(data.cell.x + data.cell.width, data.cell.y, data.cell.x + data.cell.width, data.cell.y + data.cell.height);
                        }
                    }

                    if (data.section === 'body' && data.cell.raw === tick) {
                        const x = data.cell.x + (data.cell.width / 2) - 6;
                        const y = data.cell.y + (data.cell.height / 2) - 6;
                        doc.setFillColor(tickColor);
                        doc.setDrawColor(darkColor);
                        doc.setLineWidth(1);
                        doc.rect(x, y, 12, 12, 'FD');
                        data.cell.text = '';
                    }
                },
                didParseCell: function (data) {
                    if (data.section === 'body' && data.cell.raw === tick) {
                        data.cell.text = '';
                    }
                },
            });

            return doc.lastAutoTable.finalY;
        };
        
        if (dailyReportWard === 'ALL_WARDS') {
            const wardGroups = dailyReportRows.reduce((acc, patient) => {
                const ward = patient.ward || 'Unassigned';
                if (!acc[ward]) acc[ward] = [];
                acc[ward].push(patient);
                return acc;
            }, {});

            let startY = 80;
            const sortedWards = Object.keys(wardGroups).sort();
            for (let i = 0; i < sortedWards.length; i++) {
                const ward = sortedWards[i];
                const patients = wardGroups[ward];
                const finalY = processWard(patients, ward, startY);

                startY = finalY + 40;
                if (i < sortedWards.length - 1 && startY > doc.internal.pageSize.height - 100) {
                    doc.addPage();
                    startY = 40;
                }
            }

            // Overall daily summary across all wards
            const totals = dailyReportRows.reduce((acc, p) => {
                acc.morning[p.morningMeal] = (acc.morning[p.morningMeal] || 0) + (p.morningMeal ? 1 : 0);
                acc.morningExtra[p.morningExtra] = (acc.morningExtra[p.morningExtra] || 0) + (p.morningExtra ? 1 : 0);
                acc.launch[p.launch] = (acc.launch[p.launch] || 0) + (p.launch ? 1 : 0);
                acc.night[p.nightMeal] = (acc.night[p.nightMeal] || 0) + (p.nightMeal ? 1 : 0);
                acc.nightExtra[p.nightExtra] = (acc.nightExtra[p.nightExtra] || 0) + (p.nightExtra ? 1 : 0);
                return acc;
            }, { morning: {}, morningExtra: {}, launch: {}, night: {}, nightExtra: {} });

            const sec = (title) => [[{ content: title, colSpan: 2, styles: { fillColor: '#f5f5f5', fontStyle: 'bold', halign: 'left' } }]];
            const row = (label, value) => [label, String(value || 0)];

            autoTable(doc, {
                startY: (doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : 80),
                theme: 'grid',
                head: [[{ content: 'Daily diet summary', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } }]],
                body: [
                    ...sec('Morning meal'),
                    row('Normal diet', totals.morning['Normal diet'] || 0),
                    row('Under 12 years diet', totals.morning['Under 12 years diet'] || 0),
                    row('Soft diet', totals.morning['Soft diet'] || 0),
                    row('Liquid diet', totals.morning['Liquid diet'] || 0),
                    ...sec('Any one'),
                    row('Egg', totals.morningExtra['Egg'] || 0),
                    row('Milk', totals.morningExtra['Milk'] || 0),
                    row('High protein', totals.morningExtra['High protein'] || 0),
                    ...sec('Snacks'),
                    row('Biscuit', totals.launch['Biscuit'] || 0),
                    row('Satu', totals.launch['Satu'] || 0),
                    ...sec('Night Meal (any one)'),
                    row('Normal diet', totals.night['Normal diet'] || 0),
                    row('Under 12 years diet', totals.night['Under 12 years diet'] || 0),
                    row('Soft diet', totals.night['Soft diet'] || 0),
                    row('Liquid diet', totals.night['Liquid diet'] || 0),
                    row('Chapati diet', totals.night['Chapati diet'] || 0),
                    ...sec('Any one'),
                    row('Egg', totals.nightExtra['Egg'] || 0),
                    row('Milk', totals.nightExtra['Milk'] || 0),
                    row('High protein', totals.nightExtra['High protein'] || 0),
                ],
                styles: { font: 'helvetica', fontSize: 9, halign: 'left' },
                columnStyles: { 0: { cellWidth: 180 }, 1: { halign: 'center' } },
                margin: { left: 60, right: 60 },
            });
        } else {
            processWard(dailyReportRows, dailyReportWard, 80);
        }

        doc.save(`Daily_Diet_Report_${dailyReportYear}_${dailyReportMonth}_${dailyReportDay}_${dailyReportWard}.pdf`);
    };

    {/* --- DAILY REPORT TABLE STYLE OVERRIDES --- */}
    <style>{`
      .patient-table th, .patient-table td, .patient-table .diet-stack, .patient-table .table-cell-header {
        color: #111 !important;
      }
      .patient-table th span, .patient-table td span {
        color: #111 !important;
      }
      .diet-box.selected {
        background: #2563eb !important;
        border: 2px solid #2563eb !important;
        box-shadow: none !important;
      }
    `}</style>

    // Conditional rendering for access control
    if (!user || user.role !== 'admin') {
        return (
            <div className="access-denied-container">
                <div className="card">
                    <h2 className="form-title error-text">Access Denied</h2>
                    <p className="message-text">You must be logged in as an admin to view this page.</p>
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
            <div className="dashboard-header-row">
                <img src={KoshiHospitalLogo} alt="Koshi Hospital Logo" className="logo" />
                <div className="dashboard-header-spacer"></div>
                <div className="dashboard-header-actions">
                    <button
                        onClick={logout}
                        className="button button-danger dashboard-logout-btn"
                    >
                        Logout
                    </button>
                    {user.name && (
                        <div className="dashboard-user-name">{user.name}</div>
                    )}
                </div>
            </div>

            {/* New hospital/emblem/flag header row */}
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

            {/* Centered main title */}
            <h1 className="admin-main-title dashboard-title-center">
                Patient Diet System
            </h1>

            {/* Report section title and month selector */}
            <div className="users-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h2 className="section-title" style={{ margin: 0, textAlign: 'left', fontWeight: 800 }}>Report</h2>
                    <img src={SettingsLogo} alt="Settings" style={{ width: 28, height: 28, cursor: 'pointer' }} onClick={() => setShowWardSettings(true)} />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <select value={reportYear} onChange={e => setReportYear(e.target.value)} style={{ fontSize: 16, padding: '0.2rem 0.5rem' }}>
                        {availableBsYears.map(year => (
                            <option key={year} value={String(year)}>{year}</option>
                        ))}
                    </select>
                    <select value={reportMonth || ''} onChange={e => setReportMonth(e.target.value)} style={{ fontSize: 16, padding: '0.2rem 0.5rem' }}>
                        <option value="" disabled>Select Month</option>
                        {nepaliMonths.map(m => (
                            <option key={m.number} value={m.number}>{m.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            {/* Ward Settings Modal */}
            {showWardSettings && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '20px' }}>
                    <div className="card" style={{ maxWidth: 400, width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                        <button onClick={() => setShowWardSettings(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>&times;</button>
                        <h2 className="section-title" style={{ textAlign: 'center' }}>Manage Wards</h2>
                        <form onSubmit={editingWard ? handleUpdateWard : handleCreateWard} className="form-layout">
                            <div className="form-group">
                                <label className="label" htmlFor="ward-name">Ward Name</label>
                                <input type="text" id="ward-name" value={editingWard ? editingWardName : newWardName} onChange={e => editingWard ? setEditingWardName(e.target.value) : setNewWardName(e.target.value)} className="input-field" placeholder="Ward Name" required />
                            </div>
                            <button type="submit" className="button button-success" style={{ width: 200, alignSelf: 'center' }}>
                                {editingWard ? 'Update Ward' : 'Create Ward'}
                            </button>
                        </form>
                        <div style={{ marginTop: 24 }}>
                            <h3 style={{ fontWeight: 600, marginBottom: 8 }}>Existing Wards</h3>
                            {wardsLoading ? <Spinner /> : (
                                <ul style={{ listStyle: 'none', padding: 0 }}>
                                    {wards.map(ward => (
                                        <li key={ward} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span>{ward}</span>
                                            <div>
                                                <button className="button button-primary" style={{ marginRight: 8 }} onClick={() => handleEditWard(ward)}>Edit</button>
                                                <button className="button button-danger" onClick={() => handleDeleteWard(ward)}>Delete</button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <div className="dashboard-table-section" style={{width: '100%', maxWidth: '100%', margin: '1.2rem 0', overflowX: 'auto', color: '#111'}}>
                <div style={{width: '100%', overflowX: 'auto'}}>
                  <table className="patient-table" style={{width: '100%', margin: 0, tableLayout: 'auto'}}>
                    <thead>
                        <tr>
                            <th rowSpan="2" className="diet-stack">Sn.</th>
                            <th rowSpan="2" className="diet-stack">Ward</th>
                            <th colSpan="4">Morning meal</th>
                            <th colSpan="3">Any one</th>
                            <th colSpan="2">Snacks</th>
                            <th colSpan="5">Night Meal (any one)</th>
                            <th colSpan="3">Any one</th>
                        </tr>
                        <tr>
                            <th className="light-border diet-stack">Normal<br/>diet</th>
                            <th className="light-border diet-stack">Under 12<br/>years<br/>diet</th>
                            <th className="light-border diet-stack">Soft<br/>diet</th>
                            <th className="dark-border diet-stack">Liquid<br/>diet</th>
                            <th className="light-border">Egg</th>
                            <th className="dark-border">Milk</th>
                            <th className="light-border">High protein</th>
                            <th className="light-border">Biscuit</th>
                            <th className="dark-border">Satu</th>
                            <th className="light-border diet-stack">Normal<br/>diet</th>
                            <th className="light-border diet-stack">Under 12<br/>years<br/>diet</th>
                            <th className="light-border diet-stack">Soft<br/>diet</th>
                            <th className="light-border diet-stack">Liquid<br/>diet</th>
                            <th className="dark-border diet-stack">Chapati<br/>diet</th>
                            <th className="light-border">Egg</th>
                            <th className="dark-border">Milk</th>
                            <th className="light-border">High protein</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportLoading ? (
                            <tr><td colSpan={18}><Spinner /></td></tr>
                        ) : reportData.length === 0 ? (
                            <tr><td colSpan={18}>No data</td></tr>
                        ) : reportData.map(row => (
                            <tr key={row.ward}>
                                <td className="table-cell">{row.sn}</td>
                                <td className="table-cell capitalize-text">{row.ward}</td>
                                {/* Tomorrow's Morning meal */}
                                <td className="table-cell diet-cell light-border">{row.morning['Normal diet'] || 0}</td>
                                <td className="table-cell diet-cell light-border">{row.morning['Under 12 years diet'] || 0}</td>
                                <td className="table-cell diet-cell light-border">{row.morning['Soft diet'] || 0}</td>
                                <td className="table-cell diet-cell dark-border">{row.morning['Liquid diet'] || 0}</td>
                                {/* Morning Extra */}
                                <td className="table-cell diet-cell light-border">{row.morningExtra['Egg'] || 0}</td>
                                <td className="table-cell diet-cell">{row.morningExtra['Milk'] || 0}</td>
                                <td className="table-cell diet-cell">{row.morningExtra['High protein'] || 0}</td>
                                {/* Snacks */}
                                <td className="table-cell diet-cell light-border">{row.launch['Biscuit'] || 0}</td>
                                <td className="table-cell">{row.launch['Satu'] || 0}</td>
                                {/* Night Meal */}
                                <td className="table-cell diet-cell dark-border">{row.night['Normal diet'] || 0}</td>
                                <td className="table-cell diet-cell light-border">{row.night['Under 12 years diet'] || 0}</td>
                                <td className="table-cell diet-cell light-border">{row.night['Soft diet'] || 0}</td>
                                <td className="table-cell diet-cell light-border">{row.night['Liquid diet'] || 0}</td>
                                <td className="table-cell diet-cell dark-border">{row.night['Chapati diet'] || 0}</td>
                                {/* Night Extra */}
                                <td className="table-cell diet-cell light-border">{row.nightExtra['Egg'] || 0}</td>
                                <td className="table-cell diet-cell">{row.nightExtra['Milk'] || 0}</td>
                                <td className="table-cell diet-cell">{row.nightExtra['High protein'] || 0}</td>
                            </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
            </div>

            {/* Generate Monthly Report Button */}
            <div style={{ textAlign: 'center', marginTop: '1rem', marginBottom: '2rem' }}>
                <button
                    className="button button-primary"
                    style={{ minWidth: 120, width: 'auto', display: 'inline-block', marginRight: 12 }}
                    onClick={() => setShowMonthlyDietReport(true)}
                >
                    Generate Monthly Report
                </button>
                <button
                    className="button button-primary"
                    style={{ minWidth: 120, width: 'auto', display: 'inline-block' }}
                    onClick={() => setShowDailyReportModal(true)}
                >
                    Generate Daily Report
                </button>
            </div>

            {/* Monthly Diet Report Modal */}
            {showMonthlyDietReport && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card" style={{ maxWidth: 1200, width: '95vw', position: 'relative', maxHeight: '90vh', overflowY: 'auto', overflowX: 'auto', padding: '32px 24px 24px 24px' }}>
                        <button 
                            onClick={() => {
                                setShowMonthlyDietReport(false);
                                setMonthlyDietReport([]);
                                setSelectedReportMonth('');
                            }} 
                            style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}
                        >
                            &times;
                        </button>
                        <h2 className="section-title" style={{ textAlign: 'center' }}>Monthly Diet Report</h2>
                        {/* Month Selection */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <select 
                            value={selectedReportYear} 
                            onChange={e => setSelectedReportYear(e.target.value)}
                            style={{ fontSize: 16, padding: '0.2rem 0.5rem' }}
                        >
                            {availableBsYears.map(year => (
                                <option key={year} value={String(year)}>{year}</option>
                            ))}
                        </select>
                        <select 
                            value={selectedReportMonth} 
                            onChange={e => {
                                setSelectedReportMonth(e.target.value);
                                setMonthlyDietReport([]);
                            }}
                            style={{ fontSize: 16, padding: '0.2rem 0.5rem' }}
                        >
                            <option value="" disabled>Select Month</option>
                            {nepaliMonths.map(m => (
                                <option key={m.number} value={m.number}>{m.name}</option>
                            ))}
                        </select>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15 }}>
                            <input 
                                type="checkbox" 
                                checked={isMonthlyWardWise} 
                                onChange={e => {
                                    setIsMonthlyWardWise(e.target.checked);
                                    setMonthlyDietReport([]);
                                }} 
                            />
                            Ward wise
                        </label>
                        <button 
                            className="button button-success"
                            onClick={generateMonthlyDietReport}
                            disabled={!selectedReportMonth || monthlyReportLoading}
                        >
                            {monthlyReportLoading ? 'Generating...' : 'Generate'}
                        </button>
                        {monthlyDietReport.length > 0 && !monthlyReportLoading && (
                            <button
                                className="button button-primary"
                                onClick={handleDownloadMonthlyReport}
                            >
                                Download PDF
                            </button>
                        )}
                    </div>

                    {/* Report Table */}
                    {monthlyDietReport.length > 0 && (
                        (() => {
                            if (isMonthlyWardWise) {
                                const { wardSummaries = [], overallTotals = {} } = monthlyDietReport[0];
                                const renderSummaryRows = (source) => (
                                    <>
                                        {monthlyDietSections.map(section => (
                                            <React.Fragment key={section.key}>
                                                <tr>
                                                    <td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>{section.title}</td>
                                                </tr>
                                                {section.diets.map(diet => (
                                                    <tr key={`${section.key}-${diet}`}>
                                                        <td style={{ paddingLeft: 24 }}>{diet}</td>
                                                        <td style={{ textAlign: 'center' }}>{(source[section.key] && source[section.key][diet]) || 0}</td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        ))}
                                    </>
                                );

                                return (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                        {[...wardSummaries].sort((a, b) => a.ward.localeCompare(b.ward)).map(summary => (
                                            <div key={summary.ward} style={{ width: '100%' }}>
                                                <h3 style={{ marginBottom: 8, fontWeight: 700 }}>Ward: {summary.ward}</h3>
                                                <div className="table-responsive" style={{ maxWidth: 520 }}>
                                                    <table className="data-table" style={{ width: '100%', color: '#111' }}>
                                                        <thead>
                                                            <tr>
                                                                <th className="table-cell-header">Diet</th>
                                                                <th className="table-cell-header">Orders</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody style={{ color: '#111' }}>
                                                            {renderSummaryRows(summary)}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        ))}
                                        {Object.keys(overallTotals).length > 0 && (
                                            <div>
                                                <h3 style={{ marginBottom: 8, fontWeight: 700 }}>All wards monthly total</h3>
                                                <div className="table-responsive" style={{ maxWidth: 520 }}>
                                                    <table className="data-table" style={{ width: '100%', color: '#111' }}>
                                                        <thead>
                                                            <tr>
                                                                <th className="table-cell-header">Diet</th>
                                                                <th className="table-cell-header">Orders</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody style={{ color: '#111' }}>
                                                            {renderSummaryRows(overallTotals)}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            const { matrix, wards: wardList } = monthlyDietReport[0];
                            const renderSection = (title, diets) => (
                                <>
                                    <tr>
                                        <th colSpan={2 + wardList.length} style={{ fontWeight: 700, background: '#f5f5f5', textAlign: 'left' }}>{title}</th>
                                    </tr>
                                    {Object.keys(diets).map(dietName => (
                                        <tr key={dietName}>
                                            <td style={{ paddingLeft: 16 }}>{dietName}</td>
                                            {wardList.map(w => (
                                                <td key={w + dietName} style={{ textAlign: 'center' }}>{diets[dietName][w] || 0}</td>
                                            ))}
                                            <td style={{ fontWeight: 600, textAlign: 'center' }}>{wardList.reduce((sum, w) => sum + (diets[dietName][w] || 0), 0)}</td>
                                        </tr>
                                    ))}
                                </>
                            );
                            return (
                                <div style={{ maxHeight: '400px', overflowX: 'auto', overflowY: 'auto' }}>
                                    <table className="data-table" style={{ width: '100%', minWidth: Math.max(600, 180 + wardList.length * 100), color: '#111' }}>
                                        <thead>
                                            <tr>
                                                <th className="table-cell-header" style={{ minWidth: 160, textAlign: 'left' }}>Diet</th>
                                                {wardList.map(w => (
                                                    <th key={w} className="table-cell-header" style={{ minWidth: 90, textAlign: 'center' }}>{w}</th>
                                                ))}
                                                <th className="table-cell-header" style={{ minWidth: 90, textAlign: 'center' }}>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody style={{ color: '#111' }}>
                                            {renderSection('Morning meal', matrix.morning)}
                                            {renderSection('Any one', matrix.morningExtra)}
                                            {renderSection('Snacks', matrix.launch)}
                                            {renderSection('Night Meal (any one)', matrix.night)}
                                            {renderSection('Any one', matrix.nightExtra)}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })()
                    )}

                    {monthlyReportLoading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <Spinner />
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Daily Report Modal */}
        {showDailyReportModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ maxWidth: 1600, width: '98vw', position: 'relative', maxHeight: '90vh', overflowY: 'auto', padding: '32px 24px 24px 24px' }}>
                    <button 
                        onClick={() => {
                            setShowDailyReportModal(false);
                            setDailyReportRows([]);
                        }} 
                        style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}
                    >
                        &times;
                    </button>
                    <h2 className="section-title" style={{ textAlign: 'center' }}>Daily Diet Report</h2>
                    {/* Date and Ward Selection */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        <select value={dailyReportYear} onChange={e => setDailyReportYear(e.target.value)} style={{ fontSize: 16, padding: '0.2rem 0.5rem' }}>
                            {availableBsYears.map(year => (
                                <option key={year} value={String(year)}>{year}</option>
                            ))}
                        </select>
                        <select value={dailyReportMonth} onChange={e => setDailyReportMonth(e.target.value)} style={{ fontSize: 16, padding: '0.2rem 0.5rem' }}>
                            {nepaliMonths.map(m => (
                                <option key={m.number} value={m.number}>{m.name}</option>
                            ))}
                        </select>
                        <select value={dailyReportDay} onChange={e => setDailyReportDay(e.target.value)} style={{ fontSize: 16, padding: '0.2rem 0.5rem' }}>
                            {Array.from({ length: dailyReportDayCount }, (_, idx) => idx + 1).map(d => (
                                <option key={d} value={String(d).padStart(2, '0')}>{d}</option>
                            ))}
                        </select>
                        <select value={dailyReportWard} onChange={e => setDailyReportWard(e.target.value)} style={{ fontSize: 16, padding: '0.2rem 0.5rem' }}>
                            <option value="" disabled>Select Ward</option>
                            <option value="ALL_WARDS">All Wards</option>
                            {wards.map(w => (
                                <option key={w} value={w}>{w}</option>
                            ))}
                        </select>
                        <button 
                            className="button button-success"
                            onClick={handleGenerateDailyReport}
                            disabled={!dailyReportWard || dailyReportLoading}
                        >
                            {dailyReportLoading ? 'Generating...' : 'Generate'}
                        </button>
                        {dailyReportRows.length > 0 && !dailyReportLoading && (
                            <button
                                className="button button-primary"
                                onClick={handleDownloadDailyReport}
                            >
                                Download PDF
                            </button>
                        )}
                    </div>
                    {/* Report Table */}
                    {dailyReportRows.length > 0 && (
                        <div className="table-container" style={{ maxHeight: '400px', maxWidth: '1500px', width: '100%', overflowX: 'auto', overflowY: 'auto' }}>
                            <table className="patient-table" style={{ color: '#111', borderCollapse: 'separate', borderSpacing: 0, width: '100%' }}>
                                <thead style={{ color: '#111' }}>
                                    <tr>
                                        <th className="diet-stack" rowSpan="2" style={{ color: '#111', borderRight: '3px solid #374151', borderTop: '3px solid #374151', borderLeft: '3px solid #374151', background: '#fff', fontWeight: 700 }}>Bed<br/>No.</th>
                                        <th className="diet-stack" rowSpan="2" style={{ color: '#111', borderRight: '3px solid #374151', borderTop: '3px solid #374151', background: '#fff', fontWeight: 700 }}>IPD<br/>No.</th>
                                        <th className="diet-stack" rowSpan="2" style={{ color: '#111', borderRight: '3px solid #374151', borderTop: '3px solid #374151', background: '#fff', fontWeight: 700 }}>Patient<br/>name</th>
                                        <th rowSpan="2" className="dark-border" style={{ color: '#111', borderRight: '3px solid #374151', borderTop: '3px solid #374151', background: '#fff', fontWeight: 700 }}>Age</th>
                                        <th colSpan="4" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151', color: '#111', background: '#fff', fontWeight: 700 }}>Morning meal</th>
                                        <th colSpan="3" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151', color: '#111', background: '#fff', fontWeight: 700 }}>Any one</th>
                                        <th colSpan="2" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151', color: '#111', background: '#fff', fontWeight: 700 }}>Snacks</th>
                                        <th colSpan="5" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151', color: '#111', background: '#fff', fontWeight: 700 }}>Night Meal (any one)</th>
                                        <th colSpan="3" style={{ borderRight: '3px solid #374151', borderTop: '3px solid #374151', color: '#111', background: '#fff', fontWeight: 700 }}>Any one</th>
                                    </tr>
                                    <tr>
                                        <th className="light-border diet-stack" style={{ color: '#111', background: '#fff', fontWeight: 700 }}>Normal<br/>diet</th>
                                        <th className="light-border diet-stack under12-col" style={{ color: '#111', background: '#fff', fontWeight: 700 }}>Under 12<br/>years<br/>diet</th>
                                        <th className="light-border diet-stack" style={{ color: '#111', background: '#fff', fontWeight: 700 }}>Soft<br/>diet</th>
                                        <th className="dark-border diet-stack" style={{ color: '#111', borderRight: '3px solid #374151', background: '#fff', fontWeight: 700 }}>Liquid<br/>diet</th>
                                        <th className="light-border" style={{ color: '#111', background: '#fff', fontWeight: 700 }}>Egg</th>
                                        <th className="dark-border" style={{ color: '#111', background: '#fff', fontWeight: 700 }}>Milk</th>
                                        <th className="light-border" style={{ color: '#111', borderRight: '3px solid #374151', background: '#fff', fontWeight: 700 }}>High protein</th>
                                        <th className="light-border" style={{ color: '#111', background: '#fff', fontWeight: 700 }}>Biscuit</th>
                                        <th className="dark-border" style={{ color: '#111', borderRight: '3px solid #374151', background: '#fff', fontWeight: 700 }}>Satu</th>
                                        <th className="light-border diet-stack" style={{ color: '#111', background: '#fff', fontWeight: 700 }}>Normal<br/>diet</th>
                                        <th className="light-border diet-stack under12-col" style={{ color: '#111', background: '#fff', fontWeight: 700 }}>Under 12<br/>years<br/>diet</th>
                                        <th className="light-border diet-stack" style={{ color: '#111', background: '#fff', fontWeight: 700 }}>Soft<br/>diet</th>
                                        <th className="light-border diet-stack" style={{ color: '#111', background: '#fff', fontWeight: 700 }}>Liquid<br/>diet</th>
                                        <th className="dark-border diet-stack chapati-col" style={{ color: '#111', borderRight: '3px solid #374151', background: '#fff', fontWeight: 700 }}>Chapati<br/>diet</th>
                                        <th className="light-border" style={{ color: '#111', background: '#fff', fontWeight: 700 }}>Egg</th>
                                        <th className="light-border" style={{ color: '#111', background: '#fff', fontWeight: 700 }}>Milk</th>
                                        <th className="light-border" style={{ color: '#111', borderRight: '3px solid #374151', background: '#fff', fontWeight: 700 }}>High protein</th>
                                    </tr>
                                </thead>
                                <tbody style={{ color: '#111' }}>
                                    {dailyReportRows.map((patient, idx) => (
                                        <tr key={idx} style={{ color: '#111' }}>
                                            <td className="table-cell" style={{ color: '#111', borderRight: '3px solid #374151', borderTop: '3px solid #374151', borderLeft: '3px solid #374151', background: '#fff', fontWeight: 500 }}>{patient.bedNo}</td>
                                            <td className="table-cell" style={{ color: '#111', borderRight: '3px solid #374151', borderTop: '3px solid #374151', background: '#fff', fontWeight: 500 }}>{patient.ipdNumber}</td>
                                            <td className="table-cell" style={{ color: '#111', borderRight: '3px solid #374151', borderTop: '3px solid #374151', background: '#fff', fontWeight: 500 }}>{patient.name}</td>
                                            <td className="table-cell dark-border" style={{ color: '#111', borderRight: '3px solid #374151', borderTop: '3px solid #374151', background: '#fff', fontWeight: 500 }}>{patient.age}</td>
                                            {/* Morning meal */}
                                            {['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet'].map((opt, i) => (
                                                <td
                                                    className={`table-cell diet-cell${i < 3 ? ' light-border' : ' dark-border'}`}
                                                    key={`morningMeal-${opt}`}
                                                    style={{ color: '#111', borderTop: '3px solid #374151', background: '#fff', fontWeight: 500, ...(i === 3 ? { borderRight: '3px solid #374151' } : {}) }}
                                                >
                                                    <span className={`diet-box ${patient.morningMeal === opt ? 'selected' : ''}`} style={{ color: '#111', background: '#fff' }}></span>
                                                </td>
                                            ))}
                                            {/* Morning Extra */}
                                            {['Egg', 'Milk', 'High protein'].map((opt, i) => (
                                                <td
                                                    className={`table-cell diet-cell${i === 0 ? ' light-border' : i === 1 ? ' dark-border' : ' light-border'}`}
                                                    key={`morningExtra-${opt}`}
                                                    style={{ color: '#111', borderTop: '3px solid #374151', background: '#fff', fontWeight: 500, ...(i === 2 ? { borderRight: '3px solid #374151' } : {}) }}
                                                >
                                                    <span className={`diet-box ${patient.morningExtra === opt ? 'selected' : ''}`} style={{ color: '#111', background: '#fff' }}></span>
                                                </td>
                                            ))}
                                            {/* Snacks */}
                                            {['Biscuit', 'Satu'].map((opt, i) => (
                                                <td
                                                    className={`table-cell diet-cell${i === 0 ? ' light-border biscuit-col' : ' dark-border'}`}
                                                    key={`launch-${opt}`}
                                                    style={{ color: '#111', borderTop: '3px solid #374151', background: '#fff', fontWeight: 500, ...(i === 1 ? { borderRight: '3px solid #374151' } : {}) }}
                                                >
                                                    <span className={`diet-box ${patient.launch === opt ? 'selected' : ''}`} style={{ color: '#111', background: '#fff' }}></span>
                                                </td>
                                            ))}
                                            {/* Night Meal */}
                                            {['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet', 'Chapati diet'].map((opt, i) => (
                                                <td
                                                    className={`table-cell diet-cell${i < 4 ? ' light-border' : ' dark-border'}${opt === 'Under 12 years diet' ? ' under12-col' : ''}${opt === 'Chapati diet' ? ' chapati-col' : ''}`}
                                                    key={`nightMeal-${opt}`}
                                                    style={{ color: '#111', borderTop: '3px solid #374151', background: '#fff', fontWeight: 500, ...(i === 4 ? { borderRight: '3px solid #374151' } : {}) }}
                                                >
                                                    <span className={`diet-box ${patient.nightMeal === opt ? 'selected' : ''}`} style={{ color: '#111', background: '#fff' }}></span>
                                                </td>
                                            ))}
                                            {/* Night Extra */}
                                            {['Egg', 'Milk', 'High protein'].map((opt, i) => (
                                                <td
                                                    className={`table-cell diet-cell${i === 0 ? ' light-border' : i === 1 ? '' : ' light-border'}`}
                                                    key={`nightExtra-${opt}`}
                                                    style={{ color: '#111', borderTop: '3px solid #374151', background: '#fff', fontWeight: 500, ...(i === 2 ? { borderRight: '3px solid #374151' } : {}) }}
                                                >
                                                    <span className={`diet-box ${patient.nightExtra === opt ? 'selected' : ''}`} style={{ color: '#111', background: '#fff' }}></span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    {/* Totals Row */}
                                    {(() => {
                                        const totals = dailyReportRows.reduce((acc, p) => {
                                            // Morning
                                            acc.morningNormal += p.morningMeal === 'Normal diet' ? 1 : 0;
                                            acc.morningUnder12 += p.morningMeal === 'Under 12 years diet' ? 1 : 0;
                                            acc.morningSoft += p.morningMeal === 'Soft diet' ? 1 : 0;
                                            acc.morningLiquid += p.morningMeal === 'Liquid diet' ? 1 : 0;
                                            // Morning extra
                                            acc.morningEgg += p.morningExtra === 'Egg' ? 1 : 0;
                                            acc.morningMilk += p.morningExtra === 'Milk' ? 1 : 0;
                                            acc.morningHighProtein += p.morningExtra === 'High protein' ? 1 : 0;
                                            // Snacks
                                            acc.snackBiscuit += p.launch === 'Biscuit' ? 1 : 0;
                                            acc.snackSatu += p.launch === 'Satu' ? 1 : 0;
                                            // Night
                                            acc.nightNormal += p.nightMeal === 'Normal diet' ? 1 : 0;
                                            acc.nightUnder12 += p.nightMeal === 'Under 12 years diet' ? 1 : 0;
                                            acc.nightSoft += p.nightMeal === 'Soft diet' ? 1 : 0;
                                            acc.nightLiquid += p.nightMeal === 'Liquid diet' ? 1 : 0;
                                            acc.nightChapati += p.nightMeal === 'Chapati diet' ? 1 : 0;
                                            // Night extra
                                            acc.nightEgg += p.nightExtra === 'Egg' ? 1 : 0;
                                            acc.nightMilk += p.nightExtra === 'Milk' ? 1 : 0;
                                            acc.nightHighProtein += p.nightExtra === 'High protein' ? 1 : 0;
                                            return acc;
                                        }, {
                                            morningNormal: 0, morningUnder12: 0, morningSoft: 0, morningLiquid: 0,
                                            morningEgg: 0, morningMilk: 0, morningHighProtein: 0,
                                            snackBiscuit: 0, snackSatu: 0,
                                            nightNormal: 0, nightUnder12: 0, nightSoft: 0, nightLiquid: 0, nightChapati: 0,
                                            nightEgg: 0, nightMilk: 0, nightHighProtein: 0,
                                        });
                                        return (
                                            <tr style={{ background: '#f9fafb' }}>
                                                <td className="table-cell" colSpan={4} style={{ fontWeight: 800, textAlign: 'center', borderLeft: '3px solid #374151', borderTop: '3px solid #374151', borderRight: '3px solid #374151', color: '#111' }}>TOTAL</td>
                                                <td className="table-cell diet-cell light-border" style={{ borderTop: '3px solid #374151' }}>{totals.morningNormal}</td>
                                                <td className="table-cell diet-cell light-border" style={{ borderTop: '3px solid #374151' }}>{totals.morningUnder12}</td>
                                                <td className="table-cell diet-cell light-border" style={{ borderTop: '3px solid #374151' }}>{totals.morningSoft}</td>
                                                <td className="table-cell diet-cell dark-border" style={{ borderTop: '3px solid #374151', borderRight: '3px solid #374151' }}>{totals.morningLiquid}</td>
                                                <td className="table-cell diet-cell light-border" style={{ borderTop: '3px solid #374151' }}>{totals.morningEgg}</td>
                                                <td className="table-cell diet-cell dark-border" style={{ borderTop: '3px solid #374151' }}>{totals.morningMilk}</td>
                                                <td className="table-cell diet-cell light-border" style={{ borderTop: '3px solid #374151', borderRight: '3px solid #374151' }}>{totals.morningHighProtein}</td>
                                                <td className="table-cell diet-cell light-border" style={{ borderTop: '3px solid #374151' }}>{totals.snackBiscuit}</td>
                                                <td className="table-cell diet-cell dark-border" style={{ borderTop: '3px solid #374151', borderRight: '3px solid #374151' }}>{totals.snackSatu}</td>
                                                <td className="table-cell diet-cell light-border" style={{ borderTop: '3px solid #374151' }}>{totals.nightNormal}</td>
                                                <td className="table-cell diet-cell light-border" style={{ borderTop: '3px solid #374151' }}>{totals.nightUnder12}</td>
                                                <td className="table-cell diet-cell light-border" style={{ borderTop: '3px solid #374151' }}>{totals.nightSoft}</td>
                                                <td className="table-cell diet-cell light-border" style={{ borderTop: '3px solid #374151' }}>{totals.nightLiquid}</td>
                                                <td className="table-cell diet-cell dark-border" style={{ borderTop: '3px solid #374151', borderRight: '3px solid #374151' }}>{totals.nightChapati}</td>
                                                <td className="table-cell diet-cell light-border" style={{ borderTop: '3px solid #374151' }}>{totals.nightEgg}</td>
                                                <td className="table-cell diet-cell" style={{ borderTop: '3px solid #374151' }}>{totals.nightMilk}</td>
                                                <td className="table-cell diet-cell" style={{ borderTop: '3px solid #374151', borderRight: '3px solid #374151' }}>{totals.nightHighProtein}</td>
                                            </tr>
                                        );
                                    })()}
                                    {/* Add bottom border to the last row */}
                                    <tr>
                                        <td colSpan={24} style={{ borderBottom: '3px solid #374151', padding: 0, height: 0 }}></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    )}
                    {/* All Wards Daily Summary */}
                    {dailyReportRows.length > 0 && dailyReportWard === 'ALL_WARDS' && (
                        <div style={{ marginTop: '16px' }}>
                            <div className="table-responsive" style={{ display: 'flex', justifyContent: 'center' }}>
                                <table className="data-table" style={{ width: '100%', maxWidth: 520, color: '#111' }}>
                                    <thead>
                                        <tr>
                                            <th className="table-cell-header">Diet</th>
                                            <th className="table-cell-header">Orders</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ color: '#111' }}>
                                        {(() => {
                                            const totals = dailyReportRows.reduce((acc, p) => {
                                                // Morning
                                                acc.morning[ p.morningMeal ] = (acc.morning[ p.morningMeal ] || 0) + (p.morningMeal ? 1 : 0);
                                                // Morning extra
                                                acc.morningExtra[ p.morningExtra ] = (acc.morningExtra[ p.morningExtra ] || 0) + (p.morningExtra ? 1 : 0);
                                                // Snacks
                                                acc.launch[ p.launch ] = (acc.launch[ p.launch ] || 0) + (p.launch ? 1 : 0);
                                                // Night
                                                acc.night[ p.nightMeal ] = (acc.night[ p.nightMeal ] || 0) + (p.nightMeal ? 1 : 0);
                                                // Night extra
                                                acc.nightExtra[ p.nightExtra ] = (acc.nightExtra[ p.nightExtra ] || 0) + (p.nightExtra ? 1 : 0);
                                                return acc;
                                            }, { morning: {}, morningExtra: {}, launch: {}, night: {}, nightExtra: {} });
                                            const safe = (obj, key) => obj[key] || 0;
                                            return (
                                                <>
                                                    <tr><td colSpan="2" style={{ fontWeight: 800, background: '#f5f5f5', textAlign: 'center' }}>Daily diet summary</td></tr>
                                                    <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Morning meal</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Normal diet</td><td>{safe(totals.morning, 'Normal diet')}</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Under 12 years diet</td><td>{safe(totals.morning, 'Under 12 years diet')}</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Soft diet</td><td>{safe(totals.morning, 'Soft diet')}</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Liquid diet</td><td>{safe(totals.morning, 'Liquid diet')}</td></tr>
                                                    <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Any one</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Egg</td><td>{safe(totals.morningExtra, 'Egg')}</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Milk</td><td>{safe(totals.morningExtra, 'Milk')}</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>High protein</td><td>{safe(totals.morningExtra, 'High protein')}</td></tr>
                                                    <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Snacks</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Biscuit</td><td>{safe(totals.launch, 'Biscuit')}</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Satu</td><td>{safe(totals.launch, 'Satu')}</td></tr>
                                                    <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Night Meal (any one)</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Normal diet</td><td>{safe(totals.night, 'Normal diet')}</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Under 12 years diet</td><td>{safe(totals.night, 'Under 12 years diet')}</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Soft diet</td><td>{safe(totals.night, 'Soft diet')}</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Liquid diet</td><td>{safe(totals.night, 'Liquid diet')}</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Chapati diet</td><td>{safe(totals.night, 'Chapati diet')}</td></tr>
                                                    <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Any one</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Egg</td><td>{safe(totals.nightExtra, 'Egg')}</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>Milk</td><td>{safe(totals.nightExtra, 'Milk')}</td></tr>
                                                    <tr><td style={{ paddingLeft: 24 }}>High protein</td><td>{safe(totals.nightExtra, 'High protein')}</td></tr>
                                                </>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                    {dailyReportLoading && (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
                            <Spinner />
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* Users section title */}
        <div className="users-header-row" style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1rem' }}>
            <h2 className="section-title" style={{ margin: 0, textAlign: 'left', fontWeight: 800 }}>Users</h2>
        </div>

        {/* Users Table */}
        {fetchingUsers ? (
            <Spinner />
        ) : (
            <div className="table-responsive">
                <table className="data-table styled-table">
                    <thead className="table-header">
                        <tr>
                            <th className="table-cell-header">Name</th>
                            <th className="table-cell-header">Email</th>
                            <th className="table-cell-header">Ward</th>
                            <th className="table-cell-header">Phone</th>
                            <th className="table-cell-header">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {createdUsers.length === 0 ? (
                            <tr className="empty-table-row">
                                <td className="empty-table-cell" colSpan={5}>
                                    <span className="table-empty-message">No users created yet.</span>
                                </td>
                            </tr>
                        ) : (
                            createdUsers.map((userItem, idx) => (
                                <tr key={userItem._id} className={`table-row user-row${idx % 2 === 0 ? ' even-row' : ' odd-row'}`}> 
                                    <td className="table-cell">
                                        <button 
                                            onClick={() => handleViewUserData(userItem)}
                                            className="link-button"
                                            style={{ color: '#4A90E2', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                        >
                                            {userItem.name}
                                        </button>
                                    </td>
                                    <td className="table-cell">{userItem.email}</td>
                                    <td className="table-cell capitalize-text">{userItem.department}</td>
                                    <td className="table-cell">{userItem.phone}</td>
                                    <td className="table-cell">
                                        <div className="admin-action-row">
                                            <button className="button button-primary admin-action-btn" onClick={() => handleEditClick(userItem)}>Edit</button>
                                            <button className="button button-danger admin-action-btn" onClick={() => handleDeleteClick(userItem._id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {/* Create User Button below users table */}
                <div style={{ textAlign: 'right', marginTop: '1rem', marginRight: '2rem' }}>
                    <button
                        className="button button-primary"
                        style={{ minWidth: 120, width: 'auto', display: 'inline-block' }}
                        onClick={() => setShowCreateUser(true)}
                    >
                        Create User
                    </button>
                </div>
            </div>
        )}

        {/* Create User Modal */}
        {showCreateUser && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '20px' }}>
                <div className="card" style={{ maxWidth: 400, width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                    <button onClick={() => setShowCreateUser(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>&times;</button>
                    <h2 className="section-title" style={{ textAlign: 'center' }}>Create New User</h2>
                    <form onSubmit={handleCreateUser} className="form-layout">
                        <div className="form-group">
                            <label className="label" htmlFor="new-user-name">Name</label>
                            <input type="text" id="new-user-name" value={userName} onChange={e => setUserName(e.target.value)} className="input-field" placeholder="User Name" required />
                        </div>
                        <div className="form-group">
                            <label className="label" htmlFor="new-user-email">Email</label>
                            <input type="email" id="new-user-email" value={userEmail} onChange={e => setUserEmail(e.target.value)} className="input-field" placeholder="User Email" required />
                        </div>
                        <div className="form-group">
                            <label className="label" htmlFor="new-user-password">Password</label>
                            <input type="password" id="new-user-password" value={userPassword} onChange={e => setUserPassword(e.target.value)} className="input-field" placeholder="User Password" required />
                        </div>
                        <div className="form-group">
                            <label className="label" htmlFor="new-user-phone">Phone Number</label>
                            <input type="tel" id="new-user-phone" value={userPhone} onChange={e => setUserPhone(e.target.value)} className="input-field" placeholder="Phone Number" required />
                        </div>
                        <div className="form-group">
                            <label className="label" htmlFor="new-user-department">Ward</label>
                            <select id="new-user-department" value={userDepartment} onChange={e => setUserDepartment(e.target.value)} className="input-field">
                                {wards.map(ward => (
                                    <option key={ward} value={ward}>{ward.charAt(0).toUpperCase() + ward.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="button button-success" disabled={creatingUser} style={{ width: 200, alignSelf: 'center' }}>
                            {creatingUser ? 'Creating...' : 'Create User'}
                        </button>
                    </form>
                </div>
            </div>
        )}

        {/* Edit User Modal */}
        {showEditUser && editUserData && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ maxWidth: 400, width: '100%', position: 'relative' }}>
                    <button onClick={() => { setShowEditUser(false); setEditUserData(null); }} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>&times;</button>
                    <h2 className="section-title" style={{ textAlign: 'center' }}>Edit User</h2>
                    <form onSubmit={handleEditSave} className="form-layout">
                        <div className="form-group">
                            <label className="label" htmlFor="edit-user-name">Name</label>
                            <input type="text" id="edit-user-name" name="name" value={editUserData.name} onChange={handleEditChange} className="input-field" required />
                        </div>
                        <div className="form-group">
                            <label className="label" htmlFor="edit-user-email">Email</label>
                            <input type="email" id="edit-user-email" name="email" value={editUserData.email} onChange={handleEditChange} className="input-field" required />
                        </div>
                        <div className="form-group">
                            <label className="label" htmlFor="edit-user-phone">Phone Number</label>
                            <input type="tel" id="edit-user-phone" name="phone" value={editUserData.phone} onChange={handleEditChange} className="input-field" required />
                        </div>
                        <div className="form-group">
                            <label className="label" htmlFor="edit-user-department">Ward</label>
                            <select id="edit-user-department" name="department" value={editUserData.department} onChange={handleEditChange} className="input-field">
                                {wards.map(ward => (
                                    <option key={ward} value={ward}>{ward.charAt(0).toUpperCase() + ward.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                                                   <button type="submit" className="button button-success" style={{ width: 200, alignSelf: 'center' }}>
                            Save Changes
                        </button>
                    </form>
                </div>
            </div>
        )}            {/* Delete User Confirmation Modal */}
        {showDeleteUser && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ maxWidth: 350, width: '100%', position: 'relative', textAlign: 'center' }}>
                    <h2 className="section-title">Delete User</h2>
                    <p className="message-text">Are you sure you want to delete this user?</p>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 }}>
                        <button className="button button-primary" style={{ width: 100, margin: 0 }} onClick={() => { setShowDeleteUser(false); setDeleteUserId(null); }}>Cancel</button>
                        <button className="button button-danger" style={{ width: 100, margin: 0 }} onClick={handleDeleteConfirm}>Yes</button>
                    </div>
                </div>
            </div>
        )}

        {/* Patient Records View Modal */}
        {showPatientRecords && selectedUser && (
            <UserRecordsWindow
                user={selectedUser}
                onClose={() => {
                    setShowPatientRecords(false);
                    setSelectedUser(null);
                }}
            />
        )}

        {/* Vendor Users Section */}
        <div className="users-header-row" style={{ display: 'flex', alignItems: 'center', width: '100%', marginBottom: '1rem', marginTop: '2.5rem' }}>
            <h2 className="section-title" style={{ margin: 0, textAlign: 'left', fontWeight: 800 }}>Vendor Users</h2>
        </div>
        {/* Vendor Users Table */}
        {fetchingVendors ? (
            <Spinner />
        ) : (
            <div className="table-responsive">
                <table className="data-table styled-table">
                    <thead className="table-header">
                        <tr>
                            <th className="table-cell-header">Name</th>
                            <th className="table-cell-header">Email</th>
                            <th className="table-cell-header">Phone</th>
                            <th className="table-cell-header">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {createdVendors.length === 0 ? (
                            <tr className="empty-table-row">
                                <td className="empty-table-cell" colSpan={4}>
                                    <span className="table-empty-message">No vendor users created yet.</span>
                                </td>
                            </tr>
                        ) : (
                            createdVendors.map((vendor, idx) => (
                                <tr key={vendor._id} className={`table-row user-row${idx % 2 === 0 ? ' even-row' : ' odd-row'}`}> 
                                    <td className="table-cell">{vendor.name}</td>
                                    <td className="table-cell">{vendor.email}</td>
                                    <td className="table-cell">{vendor.phone || vendor.phoneNumber || '-'}</td>
                                    <td className="table-cell">
                                        <div className="admin-action-row">
                                            <button className="button button-primary admin-action-btn" onClick={() => handleEditVendorClick(vendor)}>Edit</button>
                                            <button className="button button-danger admin-action-btn" onClick={() => handleDeleteVendorClick(vendor._id)}>Delete</button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {/* Create Vendor User Button below vendor users table */}
                <div style={{ textAlign: 'right', marginTop: '1rem', marginRight: '2rem' }}>
                    <button
                        className="button button-primary"
                        style={{ minWidth: 160, width: 'auto', display: 'inline-block' }}
                        onClick={() => setShowCreateVendor(true)}
                    >
                        Create Vendor User
                    </button>
                </div>
            </div>
        )}
        {showEditVendor && editVendorData && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ maxWidth: 400, width: '100%', position: 'relative' }}>
                    <button onClick={() => { setShowEditVendor(false); setEditVendorData(null); }} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>&times;</button>
                    <h2 className="section-title" style={{ textAlign: 'center' }}>Edit Vendor</h2>
                    {/* Implement vendor edit form here if needed */}
                    <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                        <span className="message-text">Edit vendor functionality coming soon.</span>
                    </div>
                </div>
            </div>
        )}
        {showDeleteVendor && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="card" style={{ maxWidth: 350, width: '100%', position: 'relative', textAlign: 'center' }}>
                    <h2 className="section-title">Delete Vendor</h2>
                    <p className="message-text">Are you sure you want to delete this vendor?</p>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 24 }}>
                        <button className="button button-primary" style={{ width: 100, margin: 0 }} onClick={() => { setShowDeleteVendor(false); setDeleteVendorId(null); }}>Cancel</button>
                        <button className="button button-danger" style={{ width: 100, margin: 0 }} onClick={handleDeleteVendorConfirm}>Yes</button>
                    </div>
                </div>
            </div>
        )}

        {/* Create Vendor User Modal */}
        {showCreateVendor && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '20px' }}>
                <div className="card" style={{ maxWidth: 400, width: '100%', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                    <button onClick={() => setShowCreateVendor(false)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#888' }}>&times;</button>
                    <h2 className="section-title" style={{ textAlign: 'center' }}>Create Vendor User</h2>
                    <form onSubmit={handleCreateVendor} className="form-layout">
                        <div className="form-group">
                            <label className="label" htmlFor="vendor-name">Name</label>
                            <input type="text" id="vendor-name" value={vendorName} onChange={e => setVendorName(e.target.value)} className="input-field" placeholder="Vendor Name" required />
                        </div>
                        <div className="form-group">
                            <label className="label" htmlFor="vendor-email">Email</label>
                            <input type="email" id="vendor-email" value={vendorEmail} onChange={e => setVendorEmail(e.target.value)} className="input-field" placeholder="Vendor Email" required />
                        </div>
                        <div className="form-group">
                            <label className="label" htmlFor="vendor-password">Password</label>
                            <input type="password" id="vendor-password" value={vendorPassword} onChange={e => setVendorPassword(e.target.value)} className="input-field" placeholder="Vendor Password" required />
                        </div>
                        <div className="form-group">
                            <label className="label" htmlFor="vendor-phone">Phone Number</label>
                            <input type="tel" id="vendor-phone" value={vendorPhone} onChange={e => setVendorPhone(e.target.value)} className="input-field" placeholder="Phone Number" required />
                        </div>
                        <button type="submit" className="button button-success" disabled={creatingVendor} style={{ width: 200, alignSelf: 'center' }}>
                            {creatingVendor ? 'Creating...' : 'Create Vendor'}
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
);
};

export default AdminDashboard;