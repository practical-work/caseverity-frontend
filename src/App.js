import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showInstructions, setShowInstructions] = useState(true);

  const [file, setFile] = useState(null);
  const [caseId, setCaseId] = useState('CASE-2026-001');
  const [user, setUser] = useState(''); 
  const [uploadData, setUploadData] = useState(null);
  const [verifyDocId, setVerifyDocId] = useState('');
  const [verifyHash, setVerifyHash] = useState('');
  const [verifyResult, setVerifyResult] = useState(null);
  
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState(''); 

  useEffect(() => {
    if (isLoggedIn) {
      fetchLogs();
    }
  }, [isLoggedIn]);

  const fetchLogs = async () => {
    try {
      const response = await axios.get('https://caseverity-backend.onrender.com/api/documents/audit-logs');
      setAuditLogs(response.data);
    } catch (error) {
      console.error("Error fetching logs", error);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginId.toLowerCase().includes('admin')) {
      setRole('System Administrator');
      setUser(loginId);
      setIsLoggedIn(true);
    } else if (loginId !== '' && password !== '') {
      setRole('Investigating Officer');
      setUser(loginId);
      setIsLoggedIn(true);
    } else {
      alert("Invalid Credentials. Please enter your Officer ID and Password.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser('');
    setRole('');
    setShowInstructions(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return alert("Please select a file first!");
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', caseId);
    formData.append('user', user);

    try {
      const response = await axios.post('https://caseverity-backend.onrender.com/api/documents/upload', formData);
      setUploadData(response.data);
      setVerifyDocId(response.data.documentId);
      setVerifyHash(response.data.fileHash);
      fetchLogs(); 
    } catch (error) {
      alert("Error uploading file.");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://caseverity-backend.onrender.com/api/documents/verify', {
        documentId: verifyDocId,
        providedHash: verifyHash
      });
      setVerifyResult({ type: 'success', message: response.data.message });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setVerifyResult({ type: 'danger', message: error.response.data.message });
      } else {
        alert("Verification Error");
      }
    }
  };

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.currentHash.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ==========================================
  // RENDER LOGIN SCREEN (WHITE & BLUE)
  // ==========================================
  if (!isLoggedIn) {
    return (
      <div className="login-wrapper">
        {showInstructions && (
          <div className="premium-popup">
            <button className="close-popup-btn" onClick={() => setShowInstructions(false)} title="Dismiss">✖</button>
            <h3>✨ Demo Access Guide</h3>
            <p><strong>Admin Access:</strong> Use any ID containing "admin" (e.g., <em>admin_01</em>).</p>
            <p><strong>Officer Access:</strong> Use your assigned name (e.g., <em>Officer_name</em>).</p>
            <p className="popup-note">*Prototype bypasses strict password checks for demo purposes.</p>
          </div>
        )}

        <div className="card login-card">
          <div className="login-header">
            <h2 className="section-title">CaseVerity Auth</h2>
            <span className="section-subtitle">Authorized Personnel Only</span>
          </div>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Officer ID / Username</label>
              <input type="text" className="form-control" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="e.g., Officer_Name" required />
            </div>
            <div className="form-group">
              <label>Secure Password</label>
              <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: '15px' }}>Authenticate & Login</button>
          </form>
          <div className="login-footer">Powered by SHA-256 Encryption & RBAC</div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER MAIN DASHBOARD (WHITE & BLUE)
  // ==========================================
  return (
    <div className="app-layout">
      <nav className="top-nav">
        <div className="nav-brand">
          <h1>CaseVerity</h1>
          <span>Secure Digital Document Management | SIH26190</span>
        </div>
        <div className="nav-user">
          <div className="user-info">
            Active Session: <strong>{user}</strong> <br/>
            <span>Role: {role}</span>
          </div>
          <button className="btn-logout" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <main className="main-container">
        <div className="dashboard-grid">
          
          <div className="card">
            <div className="card-header">
              <h2 className="section-title">Evidence Intake</h2>
            </div>
            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label>Assigned Case ID</label>
                <input type="text" className="form-control" value={caseId} onChange={(e) => setCaseId(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Document Source (PDF/Image)</label>
                <input type="file" className="form-control" onChange={(e) => setFile(e.target.files[0])} required />
              </div>
              <button type="submit" className="btn btn-primary">Generate Hash & Store</button>
            </form>

            {uploadData && (
              <div className="alert-box alert-success">
                <strong>SYSTEM LOG:</strong> Document Secured<br/>
                <strong>ID:</strong> {uploadData.documentId} <br/>
                <strong>SHA-256 Digest:</strong> <br/>
                <span className="hash-badge">{uploadData.fileHash}</span>
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="section-title">Integrity Verification</h2>
              <span className="section-subtitle">Cross-reference cryptographic digests.</span>
            </div>
            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label>Document ID</label>
                <input type="text" className="form-control" value={verifyDocId} onChange={(e) => setVerifyDocId(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>Target SHA-256 Hash</label>
                <input type="text" className="form-control" value={verifyHash} onChange={(e) => setVerifyHash(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-secondary" style={{marginTop: '10px'}}>Verify File Integrity</button>
            </form>

            {verifyResult && (
              <div className={`alert-box ${verifyResult.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                <strong>{verifyResult.type === 'success' ? 'STATUS: VERIFIED' : 'STATUS: TAMPERED'}</strong><br/> 
                {verifyResult.message}
              </div>
            )}
          </div>

        </div>

        <div className="card full-width">
          <div className="table-header-flex">
            <div>
              <h2 className="section-title">Cryptographic Audit Ledger</h2>
              <span className="section-subtitle">Immutable hash-chained records.</span>
            </div>
            <div className="form-group search-bar">
              <input 
                type="text" 
                className="form-control" 
                placeholder="🔍 Search user, action, or hash..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User Identity</th>
                  <th>System Action</th>
                  <th>Chain Hash (Target)</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                  <tr key={log._id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td><strong>{log.user}</strong></td>
                    <td><span className="action-badge">{log.action}</span></td>
                    <td>
                      <span className="hash-badge" title={log.currentHash}>
                        {log.currentHash.substring(0, 16)}...
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="4" className="empty-table">No records found matching your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <footer className="dev-footer">
        System Prototype Developed by <strong>TEAM</strong> | B.Tech CSE-AIML | SIH 2026 Submission
      </footer>
    </div>
  );
}

export default App;