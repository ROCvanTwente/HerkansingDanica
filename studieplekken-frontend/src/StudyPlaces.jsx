import React, { useEffect, useState } from 'react';

export default function StudyPlaces({ selectedPlace, onSelectPlace }) {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:5289/api/StudyPlaces')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Netwerkrespons was niet oké');
                }
                return response.json();
            })
            .then(data => {
                setPlaces(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Fout bij ophalen studieplekken:', error);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="alert alert-secondary">Studieplekken laden...</div>;

    return (
        <div className="card shadow-sm h-100" style={{ backgroundColor: '#16161f', color: '#e8e8f0', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.25rem' }}>
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
    );
}