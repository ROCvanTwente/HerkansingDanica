import React, { useEffect, useMemo, useState } from 'react';
import LoginScreen from './LoginScreen';
import {
  AlertCircleIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  CheckIcon,
  ClipboardListIcon,
  ClockIcon,
  GraduationCapIcon,
  LayoutGridIcon,
  LogInIcon,
  LogOutIcon,
  MonitorIcon,
  ShieldCheckIcon
} from './icons';

const tabs = [
  { id: 'overview', label: 'Beschikbaarheid', icon: LayoutGridIcon },
  { id: 'my-reservations', label: 'Mijn reserveringen', icon: CalendarDaysIcon },
  { id: 'admin', label: 'Beheer', icon: ClipboardListIcon }
];

const typeOptions = ['Mediatheek'];

const modalStyles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    backdropFilter: 'blur(4px)',
    padding: '1rem'
  },
  content: {
    width: '100%',
    maxWidth: '500px',
    background: '#1e1e2f',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    padding: '2rem',
    border: '1px solid #2d2d3d'
  }
};

function isTimeOverlapping(startTime, endTime, candidateStart, candidateEnd) {
  return startTime < candidateEnd && endTime > candidateStart;
}

function getPlaceStatus(place, date, time, reservations) {
  if (!date || !time) return 'Vrij';
  const [hours, minutes] = time.split(':').map(Number);
  const selectedStart = hours * 60 + minutes;
  const selectedEnd = selectedStart + 60;

  const isBooked = reservations.some(reservation => {
    if (reservation.studyPlaceId !== place.id || reservation.date !== date) return false;
    const [startHours, startMinutes] = reservation.startTime.slice(0, 5).split(':').map(Number);
    const [endHours, endMinutes] = reservation.endTime.slice(0, 5).split(':').map(Number);
    const reservationStart = startHours * 60 + startMinutes;
    const reservationEnd = endHours * 60 + endMinutes;
    return isTimeOverlapping(reservationStart, reservationEnd, selectedStart, selectedEnd);
  });

  return isBooked ? 'Bezet' : 'Vrij';
}

function App() {
  const [places, setPlaces] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlace, setSelectedPlace] = useState(null);
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedTime, setSelectedTime] = useState(new Date().toTimeString().slice(0, 5));
  
  const [selectedType, setSelectedType] = useState('Mediatheek');
  const [onlyWithMonitor, setOnlyWithMonitor] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(window.localStorage.getItem('study-session'));
  });
  const [currentUser, setCurrentUser] = useState(() => {
    if (typeof window === 'undefined') return null;
    const saved = window.localStorage.getItem('study-session');
    return saved ? JSON.parse(saved) : null;
  });
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [newPlace, setNewPlace] = useState({ code: '', type: 'Mediatheek', hasMonitor: false });
  const [placeMessage, setPlaceMessage] = useState({ type: '', text: '' });
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    startTime: new Date().toTimeString().slice(0, 5),
    endTime: '23:59'
  });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  const loadData = async () => {
    try {
      const [placesResponse, reservationsResponse] = await Promise.all([
        fetch('http://localhost:5289/api/StudyPlaces'),
        fetch('http://localhost:5289/api/Reservations')
      ]);
      const placesData = await placesResponse.json();
      const reservationsData = await reservationsResponse.json();
      setPlaces(placesData);
      setReservations(reservationsData);
      setLoading(false);
    } catch (error) {
      console.error('Kon data niet laden.', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'admin') {
      loadData();
    }
  }, [activeTab]);

  const isAdmin = currentUser && (currentUser.role === 'administrator' || currentUser.role === 'admin');

  const filteredPlaces = useMemo(() => {
    return places.filter(place => {
      const matchesType = selectedType === 'Alle' || place.type === selectedType || place.type === 'Mediatheek';
      const matchesMonitor = !onlyWithMonitor || place.hasMonitor;
      return matchesType && matchesMonitor;
    });
  }, [places, selectedType, onlyWithMonitor]);

  const handleReserveClick = place => {
    setSelectedPlace(place);
    setFormMessage({ type: '', text: '' });
    
    const [hours, minutes] = selectedTime.split(':').map(Number);
    const endHours = Math.min(hours + 1, 23);
    const endTimeString = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    setFormData({
      date: selectedDate,
      startTime: selectedTime,
      endTime: endTimeString
    });
  };

  const handleLoginSubmit = async ({ studentNumber, password }) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const response = await fetch('http://localhost:5289/api/Auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ studentNumber, password })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Inloggen mislukt.');
      }
      const normalizedUser = {
        id: data.user.id,
        name: data.user.name,
        studentNumber: data.user.studentNumber,
        role: data.role.toLowerCase() === 'admin' ? 'administrator' : 'student'
      };
      window.localStorage.setItem('study-session', JSON.stringify(normalizedUser));
      setCurrentUser(normalizedUser);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      setAuthLoading(false);
      await loadData();
    } catch (error) {
      setAuthLoading(false);
      setAuthError(error.message || 'Kan niet inloggen.');
    }
  };

  const handleLogout = () => {
    window.localStorage.removeItem('study-session');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setProfileMenuOpen(false);
  };

  const handleReservationSubmit = async event => {
    event.preventDefault();
    setFormMessage({ type: '', text: '' });
    if (!selectedPlace) {
      setFormMessage({ type: 'error', text: 'Selecteer eerst een studieplek.' });
      return;
    }

    const vandaagString = new Date().toISOString().slice(0, 10);
    if (formData.date === vandaagString) {
      const nu = new Date();
      const huidigeTijdString = nu.toTimeString().slice(0, 5);
      
      if (formData.startTime < huidigeTijdString) {
        setFormMessage({ type: 'error', text: 'De gekozen starttijd is vandaag al voorbij.' });
        return;
      }
    }

    const reservationData = {
      studyPlaceId: selectedPlace.id,
      studentName: currentUser.name,
      studentNumber: currentUser.studentNumber,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime
    };

    try {
      const response = await fetch('http://localhost:5289/api/Reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(reservationData)
      });
      const text = await response.text();
      if (!response.ok) {
        throw new Error(text || 'Reservering geweigerd.');
      }
      await loadData();
      setSelectedPlace(null);
      setActiveTab('my-reservations');
    } catch (error) {
      setFormMessage({ type: 'error', text: error.message || 'Kon reservering niet maken.' });
    }
  };

  const handleCancelReservation = async reservationId => {
    try {
      const response = await fetch(`http://localhost:5289/api/Reservations/${reservationId}`, { method: 'DELETE' });
      if (response.ok || response.status === 204) {
        await loadData();
      }
    } catch (error) {
      console.error('Annuleren mislukt', error);
    }
  };

  const handleCreatePlace = async event => {
    event.preventDefault();
    setPlaceMessage({ type: '', text: '' });
    try {
      const response = await fetch('http://localhost:5289/api/StudyPlaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ code: newPlace.code, type: newPlace.type, hasMonitor: newPlace.hasMonitor })
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Plek kon niet worden aangemaakt.');
      }
      await loadData();
      setNewPlace({ code: '', type: 'Mediatheek', hasMonitor: false });
      setPlaceMessage({ type: 'success', text: 'Studieplek toegevoegd.' });
    } catch (error) {
      setPlaceMessage({ type: 'error', text: error.message || 'Kon studieplek niet toevoegen.' });
    }
  };

  const handleDeletePlace = async placeId => {
    try {
      const response = await fetch(`http://localhost:5289/api/StudyPlaces/${placeId}`, { method: 'DELETE' });
      if (response.ok || response.status === 204) {
        await loadData();
      }
    } catch (error) {
      console.error('Verwijderen mislukt', error);
    }
  };

  if (!isAuthenticated) {
    return <LoginScreen onSubmit={handleLoginSubmit} authError={authError} authLoading={authLoading} />;
  }

  return (
    <div className="app-shell">
      <nav className="topbar">
        <div className="brand-block">
          <div className="brand-icon"><BookOpenIcon className="icon" /></div>
          <div>
            <div className="brand-title">Mediatheek | Reserveringssysteem</div>
            <div className="brand-subtitle">Digitale toewijzing van studieplekken</div>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="status-pill"><span className="status-dot" /> Online</span>
          <div className="profile-chip-wrap">
            <button className="profile-chip is-auth" onClick={() => setProfileMenuOpen(prev => !prev)}>
              <div className="avatar-badge">
                {isAdmin ? <ShieldCheckIcon className="icon" /> : <GraduationCapIcon className="icon" />}
              </div>
              <div className="profile-meta">
                <span className="profile-name">{currentUser.name.split(' ')[0]}</span>
                <span className="profile-role">{isAdmin ? 'Beheerder' : 'Student'}</span>
              </div>
            </button>
            {profileMenuOpen && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-top">
                  <div className="avatar-badge large">
                    {isAdmin ? <ShieldCheckIcon className="icon" /> : <GraduationCapIcon className="icon" />}
                  </div>
                  <div>
                    <div className="profile-name">{currentUser.name}</div>
                    <div className="profile-role mono">{currentUser.studentNumber}</div>
                  </div>
                </div>
                <div className="role-pill">{isAdmin ? 'Beheerder' : 'Student'}</div>
                <ul className="permission-list">
                  <li><CheckIcon className="icon" /> Reserveringen bekijken</li>
                  <li><CheckIcon className="icon" /> Studieplekken beheren</li>
                  <li><CheckIcon className="icon" /> Annuleringen uitvoeren</li>
                </ul>
                <button className="logout-btn" onClick={handleLogout}><LogOutIcon className="icon" /> Uitloggen</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="tabbar">
        {tabs.map(tab => {
          if (tab.id === 'admin' && !isAdmin) return null;
          
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} className={`tab-pill ${active ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <Icon className="icon" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <main className="page-shell">
        {activeTab === 'overview' && (
          <section className="panel-stack">
            <div className="toolbar-card">
              <div className="toolbar-row">
                <label className="field-group compact">
                  <span className="field-label">Datum</span>
                  <input type="date" value={selectedDate} min={new Date().toISOString().slice(0, 10)} onChange={event => setSelectedDate(event.target.value)} className="dark-input" />
                </label>
                <label className="field-group compact">
                  <span className="field-label">Tijd</span>
                  <input type="time" value={selectedTime} onChange={event => setSelectedTime(event.target.value)} className="dark-input" />
                </label>
                <div className="pill-group">
                  {typeOptions.map(type => (
                    <button key={type} className={`pill-btn ${selectedType === type ? 'active' : ''}`} onClick={() => setSelectedType(type)}>
                      {type}
                    </button>
                  ))}
                </div>
                <button className={`pill-btn ${onlyWithMonitor ? 'active' : ''}`} onClick={() => setOnlyWithMonitor(prev => !prev)}>
                  Alleen met monitor
                </button>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-heading">Beschikbaarheid studieplekken</div>
              {loading ? (
                <div className="empty-state">Gegevens laden...</div>
              ) : (
                <div className="table-shell">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Type</th>
                        <th>Monitor</th>
                        <th>Status</th>
                        <th>Actie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlaces.map(place => {
                        const status = getPlaceStatus(place, selectedDate, selectedTime, reservations);
                        const isBooked = status === 'Bezet';
                        return (
                          <tr key={place.id}>
                            <td className="mono-cell">{place.code}</td>
                            <td>{place.type}</td>
                            <td>{place.hasMonitor ? 'Ja' : 'Nee'}</td>
                            <td><span className={`status-pill inline ${isBooked ? 'red' : 'green'}`}>{status}</span></td>
                            <td>
                              {!isBooked && (
                                <button className="text-link" onClick={() => handleReserveClick(place)}>
                                  Reserveer →
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pop-up met gegarandeerde inline CSS-stijlen */}
            {selectedPlace && (
              <div style={{ ...modalStyles.overlay, backgroundColor: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(4px)' }} onClick={() => setSelectedPlace(null)}>
                <div style={{ ...modalStyles.content, backgroundColor: '#ffffff', color: '#1f1f2e', border: '1px solid rgba(0, 0, 0, 0.08)', boxShadow: '0 0.5rem 2rem rgba(0, 0, 0, 0.1)' }} onClick={event => event.stopPropagation()}>
                  <div className="panel-heading" style={{ margin: 0, paddingBottom: '1rem', borderBottom: '1px solid #e1e1e8' }}>
                    Reservering maken voor {selectedPlace.code}
                  </div>
                  
                  <form onSubmit={handleReservationSubmit} className="reservation-form" style={{ marginTop: '1.5rem' }}>
                    <div className="field-group">
                      <label className="field-label">Datum</label>
                      <input 
                        type="date" 
                        className="dark-input" 
                        value={formData.date} 
                        min={new Date().toISOString().slice(0, 10)} 
                        onChange={event => setFormData(prev => ({ ...prev, date: event.target.value }))} 
                        style={{ background: '#f4f4f7', border: '1px solid #e1e1e8', color: '#1f1f2e', padding: '8px', borderRadius: '4px', width: '100%' }}
                      />
                    </div>
                    
                    <div className="time-row" style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
                      <div className="field-group" style={{ flex: 1 }}>
                        <label className="field-label">Starttijd</label>
                        <input type="time" className="dark-input" value={formData.startTime} onChange={event => setFormData(prev => ({ ...prev, startTime: event.target.value }))} style={{ background: '#f4f4f7', border: '1px solid #e1e1e8', color: '#1f1f2e', padding: '8px', borderRadius: '4px', width: '100%' }} />
                      </div>
                      <div className="field-group" style={{ flex: 1 }}>
                        <label className="field-label">Eindtijd</label>
                        <input type="time" className="dark-input" value={formData.endTime} onChange={event => setFormData(prev => ({ ...prev, endTime: event.target.value }))} style={{ background: '#f4f4f7', border: '1px solid #e1e1e8', color: '#1f1f2e', padding: '8px', borderRadius: '4px', width: '100%' }} />
                      </div>
                    </div>

                    {formMessage.text && (
                      <div className={`form-message ${formMessage.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1rem', color: formMessage.type === 'error' ? '#cc0000' : '#00aa66' }}>
                        {formMessage.text}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                      <button className="submit-btn" type="submit" style={{ flex: 1, background: 'var(--accent-bg)', color: 'var(--accent)', border: '2px solid transparent', padding: '10px', borderRadius: '5px' }}>
                        Bevestigen
                      </button>
                      <button className="cancel-btn" type="button" onClick={() => setSelectedPlace(null)} style={{ padding: '0 1.5rem', background: '#e1e1e8', color: '#1f1f2e', border: 'none', borderRadius: '5px' }}>
                        Annuleren
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}

        {activeTab === 'my-reservations' && (
          <section className="panel-stack">
            <div className="panel-card">
              <div className="panel-heading">Mijn reserveringen</div>
              {reservations.filter(reservation => reservation.studentNumber === currentUser.studentNumber).length === 0 ? (
                <div className="empty-state">Je hebt nog geen reserveringen.</div>
              ) : (
                <div className="reservation-list">
                  {reservations.filter(reservation => reservation.studentNumber === currentUser.studentNumber).map(reservation => (
                    <div key={reservation.id} className="reservation-card">
                      <div className="reservation-badge">{places.find(place => place.id === reservation.studyPlaceId)?.code ?? reservation.studyPlaceId}</div>
                      <div className="reservation-main">
                        <div className="reservation-name">{reservation.studentName}</div>
                        <div className="reservation-meta-row">
                          <span className="meta-chip">{reservation.date}</span>
                          <span className="meta-chip clock"><ClockIcon className="icon" />{reservation.startTime.slice(0, 5)} – {reservation.endTime.slice(0, 5)}</span>
                        </div>
                      </div>
                      <button className="cancel-btn" onClick={() => handleCancelReservation(reservation.id)}>Annuleer</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'admin' && isAdmin && (
          <section className="panel-stack">
            <div className="panel-card">
              <div className="panel-heading">Alle reserveringen</div>
              <div className="reservation-list">
                {reservations.map(reservation => (
                  <div key={reservation.id} className="reservation-card">
                    <div className="reservation-badge">{places.find(place => place.id === reservation.studyPlaceId)?.code ?? reservation.studyPlaceId}</div>
                    <div className="reservation-main">
                      <div className="reservation-name">{reservation.studentName}</div>
                      <div className="reservation-meta-row">
                        <span className="meta-chip mono">{reservation.studentNumber}</span>
                        <span className="meta-chip">{reservation.date}</span>
                        <span className="meta-chip clock"><ClockIcon className="icon" />{reservation.startTime.slice(0, 5)} – {reservation.endTime.slice(0, 5)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-heading">Studieplekken beheren</div>
              <form className="admin-form" onSubmit={handleCreatePlace}>
                <div className="field-group">
                  <label className="field-label">Code</label>
                  <input className="dark-input" value={newPlace.code} onChange={event => setNewPlace(prev => ({ ...prev, code: event.target.value }))} placeholder="Tafel 01" />
                </div>
                <div className="field-group">
                  <label className="field-label">Type</label>
                  <input className="dark-input" value="Mediatheek" readOnly />
                </div>
                <label className="checkbox-row">
                  <input type="checkbox" checked={newPlace.hasMonitor} onChange={event => setNewPlace(prev => ({ ...prev, hasMonitor: event.target.checked }))} />
                  <span>Met monitor</span>
                </label>
                <button className="submit-btn small" type="submit">Toevoegen</button>
              </form>
              {placeMessage.text ? <div className={`form-message ${placeMessage.type === 'error' ? 'error' : 'success'}`}>{placeMessage.text}</div> : null}
              <div className="reservation-list">
                {places.map(place => (
                  <div key={place.id} className="reservation-card">
                    <div className="reservation-badge">{place.code}</div>
                    <div className="reservation-main">
                      <div className="reservation-name">{place.type}</div>
                      <div className="reservation-meta-row">
                        <span className="meta-chip">{place.hasMonitor ? 'Monitor' : 'Geen monitor'}</span>
                      </div>
                    </div>
                    <button className="cancel-btn" onClick={() => handleDeletePlace(place.id)}>Verwijderen</button>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;