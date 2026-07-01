import React, { useState } from 'react';
import { AlertCircleIcon, GraduationCapIcon, LogInIcon, ShieldCheckIcon } from './icons';

export default function LoginScreen({ onSubmit, authError, authLoading }) {
  const [activeTab, setActiveTab] = useState('student');
  const [studentNumber, setStudentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = event => {
    event.preventDefault();
    onSubmit({
      studentNumber: activeTab === 'student' ? studentNumber : 'admin',
      password
    });
  };

  return (
    <div className="app-shell">
      <div className="modal-backdrop">
        <div className="auth-modal">
          <div className="auth-tabs">
            <button className={`auth-tab ${activeTab === 'student' ? 'active' : ''}`} onClick={() => setActiveTab('student')}>
              <GraduationCapIcon className="icon" /> Student
            </button>
            <button className={`auth-tab ${activeTab === 'admin' ? 'active' : ''}`} onClick={() => setActiveTab('admin')}>
              <ShieldCheckIcon className="icon" /> Beheerder
            </button>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label className="field-group">
              <span className="field-label">{activeTab === 'student' ? 'Studentnummer' : 'Gebruikersnaam'}</span>
              <input
                type="text"
                className="dark-input"
                value={studentNumber}
                onChange={event => setStudentNumber(event.target.value)}
                placeholder={activeTab === 'student' ? 'S204812' : 'admin'}
              />
            </label>

            <label className="field-group">
              <span className="field-label">Wachtwoord</span>
              <div className="password-row">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="dark-input"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  placeholder="••••••••"
                />
                <button type="button" className="pill-btn tiny" onClick={() => setShowPassword(prev => !prev)}>
                  {showPassword ? 'Verborgen' : 'Toon'}
                </button>
              </div>
            </label>

            {authError ? (
              <div className="form-message error">
                <AlertCircleIcon className="icon" />
                <span>{authError}</span>
              </div>
            ) : null}

            <div className="demo-box">
              <span className="field-label">Demo hint</span>
              <div className="mono">{activeTab === 'student' ? 'S204812 / student123' : 'admin / admin123'}</div>
            </div>

            <button className="submit-btn" type="submit" disabled={authLoading}>
              {authLoading ? 'Inloggen…' : <>Inloggen <LogInIcon className="icon" /></>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
