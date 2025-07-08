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
import jsPDF from 'jspdf';
import './AdminDashboard.css';
import SettingsLogo from '../assets/settings_logo.png';

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
    const defaultYear = String(bsToday.getBS().year);
    const defaultMonth = String(bsToday.getBS().month + 1).padStart(2, '0');
    const [reportYear, setReportYear] = useState(defaultYear);
    const [reportMonth, setReportMonth] = useState(defaultMonth);
    const [showMonthlyDietReport, setShowMonthlyDietReport] = useState(false);
    const [monthlyDietReport, setMonthlyDietReport] = useState([]);
    const [monthlyReportLoading, setMonthlyReportLoading] = useState(false);
    const [selectedReportMonth, setSelectedReportMonth] = useState('');
    const [selectedReportYear, setSelectedReportYear] = useState(defaultYear);
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
                const { start, end } = convertBSMonthToADRange(reportYear, reportMonth);
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

    // Function to generate the monthly diet report
    const generateMonthlyDietReport = async () => {
        if (!selectedReportYear || !selectedReportMonth) return;
        setMonthlyReportLoading(true);
        try {
            const config = {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            };
            const { start, end } = convertBSMonthToADRange(selectedReportYear, selectedReportMonth);
            // Fetch all users across all wards
            const usersRes = await axios.get(`${API_BASE_URL}/admin/users`, config);
            const users = usersRes.data.users;
            // Initialize counters for each diet type in each meal
            const dietCounts = {
                morning: { 'Normal diet': 0, 'Under 12 years diet': 0, 'Soft diet': 0, 'Liquid diet': 0 },
                morningExtra: { Egg: 0, Milk: 0, 'High protein': 0 },
                launch: { Biscuit: 0, Satu: 0 },
                night: { 'Normal diet': 0, 'Under 12 years diet': 0, 'Soft diet': 0, 'Liquid diet': 0, 'Chapati diet': 0 },
                nightExtra: { Egg: 0, Milk: 0, 'High protein': 0 }
            };
            // Fetch and aggregate data for all users
            for (const user of users) {
                // Fetch all records for this user in the AD date range
                const res = await axios.get(`${API_BASE_URL}/patients/user/${user._id}/range?start=${start}&end=${end}`, config);
                const records = res.data.records || [];
                for (const rec of records) {
                    for (const patient of rec.patients) {
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
            }
            // The table expects an array with a single object in this grouped format
            setMonthlyDietReport([{ ...dietCounts }]);
        } catch (error) {
            console.error("Error generating monthly report:", error);
            showToast('Error generating monthly report', 'error');
            setMonthlyDietReport([]);
        } finally {
            setMonthlyReportLoading(false);
        }
    };

    // Download monthly report as PDF
    const handleDownloadMonthlyReport = () => {
        if (!monthlyDietReport.length) return;
        const doc = new jsPDF();
        let y = 20;
        doc.setFontSize(16);
        doc.text('Monthly Diet Report', 105, y, { align: 'center' });
        y += 10;
        doc.setFontSize(12);
        doc.text(`Year: ${selectedReportYear}  Month: ${nepaliMonths.find(m => m.number === selectedReportMonth)?.name || ''}`, 105, y, { align: 'center' });
        y += 10;
        // Table headers
        doc.setFontSize(12);
        doc.text('Diet', 20, y);
        doc.text('Orders', 120, y);
        y += 8;
        // Helper to print main and sub rows
        const printMain = (main, subs, data) => {
            doc.setFont(undefined, 'bold');
            doc.text(main, 20, y);
            y += 7;
            doc.setFont(undefined, 'normal');
            subs.forEach(sub => {
                doc.text(sub, 28, y);
                doc.text(String(data[sub] || 0), 120, y);
                y += 7;
            });
        };
        printMain('Tomorrow\'s Morning meal', ['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet'], monthlyDietReport[0].morning);
        printMain('Any one', ['Egg', 'Milk', 'High protein'], monthlyDietReport[0].morningExtra);
        printMain('Snacks', ['Biscuit', 'Satu'], monthlyDietReport[0].launch);
        printMain('Night Meal (any one)', ['Normal diet', 'Under 12 years diet', 'Soft diet', 'Liquid diet', 'Chapati diet'], monthlyDietReport[0].night);
        printMain('Any one', ['Egg', 'Milk', 'High protein'], monthlyDietReport[0].nightExtra);
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

            {/* Centered main title */}
            <h1 className="main-title" style={{ marginTop: 0, marginBottom: '2rem', textAlign: 'center' }}>
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
                        <option value="2082">2082</option>
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
                            <th colSpan="4">Tomorrow's Morning meal</th>
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
                    style={{ minWidth: 120, width: 'auto', display: 'inline-block' }}
                    onClick={() => setShowMonthlyDietReport(true)}
                >
                    Generate Monthly Report
                </button>
            </div>

            {/* Monthly Diet Report Modal */}
            {showMonthlyDietReport && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.2)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="card" style={{ maxWidth: 900, width: '95%', position: 'relative' }}>
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
                                    setMonthlyDietReport([]);
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
                            <div style={{ maxHeight: '400px', overflowX: 'auto' }}>
                                <table className="data-table" style={{ width: '100%', minWidth: '400px', color: '#111' }}>
                                    <thead>
                                        <tr>
                                            <th className="table-cell-header">Diet</th>
                                            <th className="table-cell-header">Orders</th>
                                        </tr>
                                    </thead>
                                    <tbody style={{ color: '#111' }}>
                                        {/* Tomorrow's Morning meal */}
                                        <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Tomorrow's Morning meal</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Normal diet</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.morning["Normal diet"] || 0}</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Under 12 years diet</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.morning["Under 12 years diet"] || 0}</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Soft diet</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.morning["Soft diet"] || 0}</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Liquid diet</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.morning["Liquid diet"] || 0}</td></tr>
                                        {/* Any one (morning extras) */}
                                        <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Any one</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Egg</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.morningExtra["Egg"] || 0}</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Milk</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.morningExtra["Milk"] || 0}</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>High protein</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.morningExtra["High protein"] || 0}</td></tr>
                                        {/* Snacks */}
                                        <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Snacks</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Biscuit</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.launch["Biscuit"] || 0}</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Satu</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.launch["Satu"] || 0}</td></tr>
                                        {/* Night Meal (any one) */}
                                        <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Night Meal (any one)</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Normal diet</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.night["Normal diet"] || 0}</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Under 12 years diet</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.night["Under 12 years diet"] || 0}</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Soft diet</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.night["Soft diet"] || 0}</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Liquid diet</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.night["Liquid diet"] || 0}</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Chapati diet</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.night["Chapati diet"] || 0}</td></tr>
                                        {/* Any one (night extras) */}
                                        <tr><td colSpan="2" style={{ fontWeight: 700, background: '#f5f5f5' }}>Any one</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Egg</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.nightExtra["Egg"] || 0}</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>Milk</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.nightExtra["Milk"] || 0}</td></tr>
                                        <tr><td style={{ paddingLeft: 24, color: '#111' }}>High protein</td><td style={{ color: '#111' }}>{monthlyDietReport[0]?.nightExtra["High protein"] || 0}</td></tr>
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