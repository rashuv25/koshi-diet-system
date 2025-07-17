import React from 'react';
import PatientRecordsView from './PatientRecordsView';
import './UserRecordsWindow.css';

// This component expects user info to be passed via window.opener or localStorage
const UserRecordsWindow = ({ user, onClose }) => {
  if (!user) {
    return <div style={{padding: 40, textAlign: 'center'}}>No user info found.</div>;
  }
  return (
    <div className="records-view-overlay" style={{position: 'fixed', top:0, left:0, width:'100vw', height:'100vh', background:'rgba(0,0,0,0.25)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center'}}>
      <div className="records-view-modal" style={{position:'relative', background:'#fff', borderRadius:12, boxShadow:'0 2px 16px rgba(0,0,0,0.18)', width:'98vw', height:'97vh', maxWidth:'1800px', maxHeight:'98vh', overflow:'auto', padding: '1.5rem 1.5rem 1rem 1.5rem'}}>
        <button onClick={onClose} style={{position:'absolute', top:12, right:16, fontSize:32, background:'none', border:'none', color:'#888', cursor:'pointer', zIndex:10, lineHeight:1}} aria-label="Close">×</button>
        <PatientRecordsView user={user} onClose={onClose} />
      </div>
    </div>
  );
};

export default UserRecordsWindow;
