import React, { useEffect, useState } from 'react';

// 🔥 Update: refreshTrigger toegevoegd aan de props
export default function StudyPlaces({ selectedPlace, onSelectPlace, refreshTrigger }) {
    const [places, setPlaces] = useState([]);
    const [reservations, setReservations] = useState([]); // Nieuwe state voor de reserveringen uit SSMS
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We halen nu parallel zowel de plekken als de reserveringen op
        Promise.all([
            fetch('http://localhost:5289/api/StudyPlaces').then(res => res.json()),
            fetch('http://localhost:5289/api/Reservations').then(res => res.json())
        ])
        .then(([placesData, reservationsData]) => {
            setPlaces(placesData);
            setReservations(reservationsData);
            setLoading(false);
        })
        .catch(error => {
            console.error('Fout bij ophalen data:', error);
            setLoading(false);
        });
    }, [refreshTrigger]); // 🔥 Zodra refreshTrigger ophoogt, wordt alles opnieuw live opgehaald!

    if (loading) return <div className="alert alert-secondary">Gegevens laden...</div>;

    return (
        <div className="d-flex flex-column gap-4">
            {/* TABEL 1: BESCHIKBARE STUDIEPLEKKEN */}
            <div className="card shadow-sm" style={{ backgroundColor: '#16161f', color: '#e8e8f0', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.25rem' }}>
                <div className="card-body p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <h2 className="h4 fw-bold mb-0 uppercase-track">Beschikbare Studieplekken</h2>
                        <span className="small text-light-emphasis">{places.length} plekken</span>
                    </div>

                    <div className="table-responsive">
                        <table className="study-table table table-hover table-dark table-striped-columns mb-0">
                            <thead>
                                <tr>
                                    <th>Plek</th>
                                    <th>Type</th>
                                    <th>Monitor</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {places.map(place => {
                                    const isSelected = selectedPlace?.id === place.id;
                                    const status = place.isReserved || place.status === 'Bezet' ? 'Bezet' : 'Vrij';

                                    return (
                                        <tr key={place.id} className={isSelected ? 'is-selected' : ''}>
                                            <td className="font-mono fw-semibold">{place.code}</td>
                                            <td>{place.type}</td>
                                            <td>
                                                <span className="badge rounded-pill" style={{ backgroundColor: place.hasMonitor ? 'rgba(74,222,128,0.1)' : 'rgba(255,255,255,0.08)', color: place.hasMonitor ? '#4ade80' : '#9ca3af' }}>
                                                    {place.hasMonitor ? '🖥 Monitor' : '— Geen'}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="badge rounded-pill" style={{ backgroundColor: status === 'Vrij' ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)', color: status === 'Vrij' ? '#4ade80' : '#f87171' }}>
                                                    {status}
                                                </span>
                                            </td>
                                            <td>
                                                <button type="button" className="btn btn-link btn-sm p-0 text-decoration-none" style={{ color: '#c8a96e' }} onClick={() => onSelectPlace(place)}>
                                                    Select
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* 🔥 NIEUW - TABEL 2: BESTAANDE RESERVERINGEN */}
            <div className="card shadow-sm" style={{ backgroundColor: '#16161f', color: '#e8e8f0', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.25rem' }}>
                <div className="card-body p-4">
                    <h2 className="h4 fw-bold mb-3 uppercase-track">Jouw Reserveringen</h2>
                    
                    {reservations.length === 0 ? (
                        <p className="text-muted mb-0">Je hebt nog geen reserveringen geplaatst.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover table-dark mb-0">
                                <thead>
                                    <tr>
                                        <th>Datum</th>
                                        <th>Plek ID</th>
                                        <th>Van</th>
                                        <th>Tot</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reservations.map(res => (
                                        <tr key={res.id}>
                                            <td>{new Date(res.date).toLocaleDateString('nl-NL')}</td>
                                            <td className="font-mono text-warning">#{res.studyPlaceId}</td>
                                            <td>{res.startTime}</td>
                                            <td>{res.endTime}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}