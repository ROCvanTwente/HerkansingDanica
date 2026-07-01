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
  SearchIcon,
  ShieldCheckIcon
} from './icons';

const tabs = [
  { id: 'overview', label: 'Overzicht Studieplekken', icon: LayoutGridIcon },
  { id: 'reserve', label: 'Reservering Maken', icon: CalendarDaysIcon },
  { id: 'manage', label: 'Beheren & Annuleren', icon: ClipboardListIcon }
];

const typeOptions = ['Alle', 'Stilteplek', 'Groepsruimte', 'Computerplek'];

const studentDirectory = {
  1: { name: 'Emma de Vries', studentNumber: 'S204812' },
  2: { name: 'Lars Peters', studentNumber: 'S198321' },
  3: { name: 'Nina Schouten', studentNumber: 'S215609' }
};

function formatDateLabel(dateValue) {
  if (!dateValue) return 'Selecteer een datum';
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getPlaceStatus(place, date, reservations) {
  if (!date) return 'Vrij';
  const isBooked = reservations.some(reservation =>
    reservation.studyPlaceId === place.id && reservation.date === date &&
    reservation.startTime < reservation.endTime
  );
  return isBooked ? 'Bezet' : 'Vrij';
}

function App() {
  const [places, setPlaces] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [overviewDate, setOverviewDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedType, setSelectedType] = useState('Alle');
  const [onlyWithMonitor, setOnlyWithMonitor] = useState(false);
  const [managementSearch, setManagementSearch] = useState('');
  const [managementDate, setManagementDate] = useState('');
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [pendingPlace, setPendingPlace] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [newPlace, setNewPlace] = useState({ code: '', type: '', hasMonitor: false });
  const [placeMessage, setPlaceMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    name: '',
    studentNumber: '',
    date: new Date().toISOString().slice(0, 10),
    startTime: '09:00',
    endTime: '10:00',
    studyPlaceId: ''
  });
  const [formMessage, setFormMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    Promise.all([
      fetch('http://localhost:5289/api/StudyPlaces').then(res => res.json()),
      fetch('http://localhost:5289/api/Reservations').then(res => res.json())
    ])
      .then(([placesData, reservationsData]) => {
        const normalizedReservations = reservationsData.map(reservation => ({
          ...reservation,
          studentName: studentDirectory[reservation.studentId]?.name ?? 'Gast Student',
          studentNumber: studentDirectory[reservation.studentId]?.studentNumber ?? 'S000000'
        }));
        setPlaces(placesData);
        setReservations(normalizedReservations);
        setLoading(false);
      })
      .catch(error => {
        console.error('Kon data niet laden.', error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (selectedPlace) {
      setFormData(prev => ({ ...prev, studyPlaceId: String(selectedPlace.id) }));
    }
  }, [selectedPlace]);

  const filteredPlaces = useMemo(() => {
    return places.filter(place => {
      const matchesType = selectedType === 'Alle' || place.type === selectedType;
      const matchesMonitor = !onlyWithMonitor || place.hasMonitor;
      return matchesType && matchesMonitor;
    });
  }, [places, selectedType, onlyWithMonitor]);

  const overviewCounts = useMemo(() => {
    const occupied = filteredPlaces.filter(place => getPlaceStatus(place, overviewDate, reservations) === 'Bezet').length;
    return { occupied, free: filteredPlaces.length - occupied };
  }, [filteredPlaces, overviewDate, reservations]);

  const visibleReservations = useMemo(() => {
    const search = managementSearch.trim().toLowerCase();
    return reservations.filter(reservation => {
      const matchesDate = !managementDate || reservation.date === managementDate;
      const matchesSearch = !search || [
        reservation.studentName,
        reservation.studentNumber,
        String(reservation.studyPlaceId)
      ].some(value => value.toLowerCase().includes(search));
      const matchesUser = !currentUser || currentUser.role === 'administrator' || reservation.studentId === currentUser.id;
      return matchesDate && matchesSearch && matchesUser;
    });
  }, [reservations, managementDate, managementSearch, currentUser]);

  const groupedReservations = useMemo(() => {
    return visibleReservations.reduce((groups, reservation) => {
      const dateKey = reservation.date;
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(reservation);
      return groups;
    }, {});
  }, [visibleReservations]);

  const handleReserveClick = place => {
    setSelectedPlace(place);
    setPendingPlace(place);
    if (!isAuthenticated) {
      setShowAuthModal(true);
      setAuthError('');
      return;
    }
    setActiveTab('reserve');
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

      setCurrentUser(normalizedUser);
      setIsAuthenticated(true);
      setShowAuthModal(false);
      setAuthLoading(false);
      if (pendingPlace) {
        setSelectedPlace(pendingPlace);
        setActiveTab('reserve');
        setPendingPlace(null);
      }
    } catch (error) {
      setAuthLoading(false);
      setAuthError(error.message || 'Kan niet inloggen.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setProfileMenuOpen(false);
  };

  const handleReservationSubmit = async event => {
    event.preventDefault();
    setFormMessage({ type: '', text: '' });

    const reservationData = {
      studentId: currentUser?.role === 'administrator' ? 99 : currentUser?.id ?? 1,
      studyPlaceId: Number(formData.studyPlaceId),
      date: formData.date,
      startTime: formData.startTime.length === 5 ? `${formData.startTime}:00` : formData.startTime,
      endTime: formData.endTime.length === 5 ? `${formData.endTime}:00` : formData.endTime
    };

    try {
      const response = await fetch('http://localhost:5289/api/Reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(reservationData)
      });

      if (response.ok) {
        const createdReservation = {
          id: Date.now(),
          ...reservationData,
          studentName: currentUser?.name ?? 'Emma de Vries',
          studentNumber: currentUser?.studentNumber ?? 'S204812'
        };
        setReservations(prev => [createdReservation, ...prev]);
        setFormMessage({ type: 'success', text: 'Reservering bevestigd. Dubbele reserveringen worden automatisch geweigerd.' });
        setFormData(prev => ({ ...prev, studyPlaceId: '', name: '', studentNumber: '', date: prev.date, startTime: '09:00', endTime: '10:00' }));
        setSelectedPlace(null);
        setActiveTab('manage');
      } else {
        const errorText = await response.text();
        setFormMessage({ type: 'error', text: errorText || 'Reservering geweigerd.' });
      }
    } catch (error) {
      console.error('Reservation submit failed', error);
      setFormMessage({ type: 'error', text: 'Kan geen verbinding maken met de backend API.' });
    }
  };

  const handleCancelClick = async reservationId => {
    if (confirmCancelId === reservationId) {
      try {
        const response = await fetch(`http://localhost:5289/api/Reservations/${reservationId}`, { method: 'DELETE' });
        if (response.ok || response.status === 204) {
          setReservations(prev => prev.filter(reservation => reservation.id !== reservationId));
        }
      } catch (error) {
        console.error('Delete reservation failed', error);
      }
      setConfirmCancelId(null);
      return;
    }
    setConfirmCancelId(reservationId);
  };

  const handleCreatePlace = async event => {
    event.preventDefault();
    setPlaceMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:5289/api/StudyPlaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(newPlace)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Plek kon niet worden aangemaakt.');
      }

      const createdPlace = await response.json();
      setPlaces(prev => [...prev, createdPlace]);
      setNewPlace({ code: '', type: '', hasMonitor: false });
      setPlaceMessage({ type: 'success', text: 'Studieplek toegevoegd.' });
    } catch (error) {
      setPlaceMessage({ type: 'error', text: error.message || 'Kon studieplek niet toevoegen.' });
    }
  };

  const handleDeletePlace = async placeId => {
    try {
      const response = await fetch(`http://localhost:5289/api/StudyPlaces/${placeId}`, { method: 'DELETE' });
      if (response.ok || response.status === 204) {
        setPlaces(prev => prev.filter(place => place.id !== placeId));
      }
    } catch (error) {
      console.error('Delete place failed', error);
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
            {isAuthenticated ? (
              <button className="profile-chip is-auth" onClick={() => setProfileMenuOpen(prev => !prev)}>
                <div className="avatar-badge">
                  {currentUser.role === 'administrator' ? <ShieldCheckIcon className="icon" /> : <GraduationCapIcon className="icon" />}
                </div>
                <div className="profile-meta">
                  <span className="profile-name">{currentUser.name.split(' ')[0]}</span>
                  <span className="profile-role">{currentUser.role === 'administrator' ? 'Beheerder' : 'Student'}</span>
                </div>
              </button>
            ) : (
              <button className="profile-chip" onClick={() => { setShowAuthModal(true); setAuthError(''); }}>
                <LogInIcon className="icon" />
                <span>Inloggen</span>
              </button>
            )}
            {profileMenuOpen && isAuthenticated && (
              <div className="profile-dropdown">
                <div className="profile-dropdown-top">
                  <div className="avatar-badge large">
                    {currentUser.role === 'administrator' ? <ShieldCheckIcon className="icon" /> : <GraduationCapIcon className="icon" />}
                  </div>
                  <div>
                    <div className="profile-name">{currentUser.name}</div>
                    <div className="profile-role mono">{currentUser.studentNumber}</div>
                  </div>
                </div>
                <div className="role-pill">{currentUser.role === 'administrator' ? 'Beheerder' : 'Student'}</div>
                <ul className="permission-list">
                  <li><CheckIcon className="icon" /> Reserveringen bekijken</li>
                  <li><CheckIcon className="icon" /> Beperkingen beheren</li>
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
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} className={`tab-pill ${active ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
              <Icon className="icon" />
              <span>{tab.label}</span>
              {tab.id === 'overview' ? <span className="tab-badge">{filteredPlaces.length}</span> : null}
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
                  <input type="date" value={overviewDate} onChange={event => setOverviewDate(event.target.value)} className="dark-input" />
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
                <div className="count-group">
                  <span className="count-pill gold">{overviewCounts.free} vrij</span>
                  <span className="count-pill muted">{overviewCounts.occupied} bezet</span>
                </div>
              </div>
            </div>

            <div className="panel-card">
              <div className="panel-heading">
                <span>Overzicht studieplekken</span>
              </div>
              {currentUser.role === 'administrator' ? (
                <div className="admin-panel-block">
                  <form className="admin-form" onSubmit={handleCreatePlace}>
                    <div className="field-group">
                      <label className="field-label">Plekcode</label>
                      <input className="dark-input" value={newPlace.code} onChange={event => setNewPlace(prev => ({ ...prev, code: event.target.value }))} placeholder="S204" />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Type</label>
                      <input className="dark-input" value={newPlace.type} onChange={event => setNewPlace(prev => ({ ...prev, type: event.target.value }))} placeholder="Computerplek" />
                    </div>
                    <label className="checkbox-row">
                      <input type="checkbox" checked={newPlace.hasMonitor} onChange={event => setNewPlace(prev => ({ ...prev, hasMonitor: event.target.checked }))} />
                      <span>Met monitor</span>
                    </label>
                    <button className="submit-btn small" type="submit">Plek toevoegen</button>
                  </form>
                  {placeMessage.text ? <div className={`form-message ${placeMessage.type === 'error' ? 'error' : 'success'}`}>{placeMessage.text}</div> : null}
                </div>
              ) : null}
              {loading ? (
                <div className="empty-state">Gegevens laden...</div>
              ) : (
                <div className="table-shell">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Plek</th>
                        <th>Type</th>
                        <th>Monitor</th>
                        <th>Status op datum</th>
                        <th>Actie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlaces.map(place => {
                        const status = getPlaceStatus(place, overviewDate, reservations);
                        return (
                          <tr key={place.id}>
                            <td className="mono-cell">{place.code}</td>
                            <td>{place.type}</td>
                            <td>
                              <span className={`status-pill inline ${place.hasMonitor ? 'green' : 'muted'}`}>
                                <MonitorIcon className="icon" />
                                {place.hasMonitor ? 'Monitor' : 'Geen'}
                              </span>
                            </td>
                            <td>
                              <span className={`status-pill inline ${status === 'Vrij' ? 'green' : 'red'}`}>
                                {status}
                              </span>
                            </td>
                            <td>
                              <div className="table-actions">
                                <button className="text-link" onClick={() => handleReserveClick(place)}>
                                  Reserveer →
                                </button>
                                {currentUser.role === 'administrator' ? (
                                  <button className="cancel-btn small" onClick={() => handleDeletePlace(place.id)}>Verwijderen</button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}

        {activeTab === 'reserve' && (
          <section className="reservation-grid">
            <div className="panel-card form-card">
              <div className="form-header">
                <div>
                  <div className="panel-heading small">Reservering maken</div>
                  <h2>{selectedPlace ? `Plek ${selectedPlace.code}` : 'Selecteer een plek rechts →'}</h2>
                </div>
                <div className={`selection-box ${selectedPlace ? 'selected' : ''}`}>
                  {selectedPlace ? `Geselecteerd: ${selectedPlace.code}` : 'Nog geen plek gekozen'}
                </div>
              </div>

              <form onSubmit={handleReservationSubmit} className="reservation-form">
                <div className="field-group">
                  <label className="field-label">Naam</label>
                  <input type="text" className="dark-input" value={formData.name} onChange={event => setFormData(prev => ({ ...prev, name: event.target.value }))} placeholder="Bijv. Emma de Vries" />
                </div>

                <div className="field-group">
                  <label className="field-label">Studentnummer</label>
                  <input type="text" className="dark-input mono" value={formData.studentNumber} onChange={event => setFormData(prev => ({ ...prev, studentNumber: event.target.value }))} placeholder="S204812" />
                </div>

                <div className="field-group">
                  <label className="field-label">Datum</label>
                  <input type="date" className="dark-input" value={formData.date} onChange={event => setFormData(prev => ({ ...prev, date: event.target.value }))} />
                </div>

                <div className="time-row">
                  <div className="field-group">
                    <label className="field-label">Starttijd</label>
                    <input type="time" className="dark-input" value={formData.startTime} onChange={event => setFormData(prev => ({ ...prev, startTime: event.target.value }))} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Eindtijd</label>
                    <input type="time" className="dark-input" value={formData.endTime} onChange={event => setFormData(prev => ({ ...prev, endTime: event.target.value }))} />
                  </div>
                </div>

                <button className="submit-btn" type="submit">Reservering Bevestigen</button>
                {formMessage.text ? (
                  <div className={`form-message ${formMessage.type === 'error' ? 'error' : 'success'}`}>
                    {formMessage.type === 'error' ? <AlertCircleIcon className="icon" /> : <CheckIcon className="icon" />}
                    <span>{formMessage.text}</span>
                  </div>
                ) : null}
                <p className="hint-text">Dubbele reserveringen worden automatisch geweigerd.</p>
              </form>
            </div>

            <div className="panel-card place-picker-card">
              <div className="panel-heading">Beschikbare plekken</div>
              <div className="place-list">
                {filteredPlaces.map(place => {
                  const status = getPlaceStatus(place, formData.date, reservations);
                  const isOccupied = status === 'Bezet';
                  const isSelected = selectedPlace?.id === place.id;
                  return (
                    <button key={place.id} className={`place-card ${isSelected ? 'selected' : ''} ${isOccupied ? 'occupied' : ''}`} onClick={() => !isOccupied && setSelectedPlace(place)} disabled={isOccupied}>
                      <div className="place-card-top">
                        <span className="mono-cell">{place.code}</span>
                        <span className={`status-pill inline ${isOccupied ? 'red' : isSelected ? 'gold' : 'green'}`}>
                          {isOccupied ? 'Bezet' : isSelected ? '✓ Geselecteerd' : 'Beschikbaar'}
                        </span>
                      </div>
                      <div className="place-card-meta">
                        <span>{place.type}</span>
                        {place.hasMonitor ? <MonitorIcon className="icon" /> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {activeTab === 'manage' && (
          <section className="panel-stack">
            <div className="toolbar-card management-toolbar">
              <label className="field-group compact flex-grow">
                <span className="field-label">Zoeken</span>
                <div className="search-input-wrap">
                  <SearchIcon className="icon" />
                  <input type="text" className="dark-input" value={managementSearch} onChange={event => setManagementSearch(event.target.value)} placeholder="Bijv. S204812 of Emma..." />
                </div>
              </label>
              <label className="field-group compact">
                <span className="field-label">Datum</span>
                <input type="date" className="dark-input" value={managementDate} onChange={event => setManagementDate(event.target.value)} />
              </label>
              {managementDate ? <button className="pill-btn" onClick={() => setManagementDate('')}>Wis filter</button> : null}
              <span className="count-pill gold">{visibleReservations.length} reserveringen</span>
            </div>

            <div className="panel-card">
              <div className="panel-heading">Beheer reserveringen</div>
              {Object.entries(groupedReservations).length === 0 ? (
                <div className="empty-state">Geen reserveringen gevonden.</div>
              ) : (
                <div className="reservation-groups">
                  {Object.entries(groupedReservations).sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => (
                    <div key={date} className="reservation-group">
                      <div className="group-header">
                        <div className="group-title">
                          <CalendarDaysIcon className="icon" />
                          <span>{formatDateLabel(date)}</span>
                        </div>
                        <div className="group-rule" />
                      </div>
                      <div className="reservation-list">
                        {items.map(reservation => (
                          <div key={reservation.id} className={`reservation-card ${confirmCancelId === reservation.id ? 'confirming' : ''}`}>
                            <div className="reservation-badge">{reservation.studyPlaceId}</div>
                            <div className="reservation-main">
                              <div className="reservation-person">
                                <div className="reservation-name">{reservation.studentName}</div>
                                <div className="reservation-meta-row">
                                  <span className="meta-chip mono">{reservation.studentNumber}</span>
                                  <span className="meta-chip">{places.find(place => place.id === reservation.studyPlaceId)?.type ?? 'Studieplek'}</span>
                                  <span className="meta-chip clock"><ClockIcon className="icon" />{reservation.startTime.slice(0, 5)} – {reservation.endTime.slice(0, 5)}</span>
                                </div>
                              </div>
                            </div>
                            {confirmCancelId === reservation.id ? (
                              <div className="cancel-actions">
                                <button className="cancel-confirm" onClick={() => handleCancelClick(reservation.id)}>Ja, annuleer</button>
                                <button className="cancel-deny" onClick={() => setConfirmCancelId(null)}>Nee</button>
                              </div>
                            ) : (
                              <button className="cancel-btn" onClick={() => handleCancelClick(reservation.id)}>
                                {currentUser.role === 'administrator' ? 'Annuleren' : 'Verwijder'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {showAuthModal ? (
        <div className="modal-backdrop" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal" onClick={event => event.stopPropagation()}>
            <LoginScreen onSubmit={handleLoginSubmit} authError={authError} authLoading={authLoading} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;