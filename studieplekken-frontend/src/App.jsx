import React, { useState } from 'react';
import StudyPlaces from './StudyPlaces';
import ReservationForm from './ReservationForm';

function App() {
  const [selectedPlace, setSelectedPlace] = useState(null);

  return (
    <div className="min-vh-100">
      <nav className="navbar navbar-expand-lg border-bottom border-secondary" style={{ backgroundColor: '#0a0a0f' }}>
        <div className="container" style={{ maxWidth: '1060px' }}>
          <span className="navbar-brand text-light fw-bold uppercase-track mb-0">Study Place Dashboard</span>
        </div>
      </nav>

      <div className="container py-4 py-lg-5" style={{ maxWidth: '1060px' }}>
        <header className="mb-4">
          <h1 className="display-6 fw-bold mb-2 uppercase-track">Reserveringssysteem Studieplekken</h1>
          <p className="text-light-emphasis mb-0 uppercase-track">Reserveer direct een plek voor je volgende studieblok</p>
        </header>

        <div className="d-flex flex-column flex-lg-row gap-4 align-items-start">
          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            <StudyPlaces selectedPlace={selectedPlace} onSelectPlace={setSelectedPlace} />
          </div>

          <div style={{ width: '100%', maxWidth: '420px', position: 'sticky', top: '1rem' }}>
            <ReservationForm selectedPlace={selectedPlace} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;