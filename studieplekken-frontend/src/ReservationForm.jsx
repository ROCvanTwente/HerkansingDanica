import React, { useEffect, useState } from 'react';

export default function ReservationForm({ selectedPlace }) {
    const [studyPlaceId, setStudyPlaceId] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (selectedPlace) {
            setStudyPlaceId(String(selectedPlace.id));
        }
    }, [selectedPlace]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccessMessage('');
        setErrorMessage('');

        const reservationData = {
            studentId: 1,
            studyPlaceId: parseInt(studyPlaceId),
            date: date,
            startTime: startTime.length === 5 ? `${startTime}:00` : startTime,
            endTime: endTime.length === 5 ? `${endTime}:00` : endTime
        };

        try {
            const response = await fetch('http://localhost:5289/api/Reservations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(reservationData)
            });

            if (response.ok) {
                setSuccessMessage('🎉 Reservering succesvol aangemaakt!');
                setStudyPlaceId('');
                setDate('');
                setStartTime('');
                setEndTime('');
            } else {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    if (errorData && errorData.title) {
                        setErrorMessage(errorData.title);
                    } else {
                        setErrorMessage('De reservering is geweigerd door de validatie.');
                    }
                } else {
                    const errorText = await response.text();
                    setErrorMessage(errorText || 'Er is iets fout gegaan bij de backend.');
                }
            }
        } catch (error) {
            setErrorMessage('Kan geen verbinding maken met de backend API. Controleer of de backend draait.');
            console.error('Fetch error:', error);
        }
    };

    return (
        <>
            {(successMessage || errorMessage) && (
                <div className={`toast show position-fixed top-0 end-0 m-3 border toast-dark ${errorMessage ? 'error' : 'success'}`} role="alert" aria-live="assertive">
                    <div className="d-flex align-items-start justify-content-between px-3 py-2">
                        <div>
                            <div className="fw-bold mb-1">{errorMessage ? 'Validatie fout' : 'Succes'}</div>
                            <div className="small">{errorMessage || successMessage}</div>
                        </div>
                        <button type="button" className="btn-close btn-close-white ms-3" onClick={() => { setSuccessMessage(''); setErrorMessage(''); }}></button>
                    </div>
                </div>
            )}

            <div className="card shadow-sm h-100" style={{ backgroundColor: '#16161f', color: '#e8e8f0', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.25rem' }}>
                <div className="card-header px-4 py-3" style={{ backgroundColor: '#13131b', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    <div className="uppercase-track mb-1">Nieuwe Reservering</div>
                    <div className="small" style={{ color: '#c8a96e' }}>
                        Geselecteerde plek: {selectedPlace ? selectedPlace.code : '—'}
                    </div>
                </div>

                <div className="card-body p-4">
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label uppercase-track" style={{ color: '#9999b0' }}>Studieplek ID</label>
                            <input type="number" className="form-control reservation-input" value={studyPlaceId} onChange={e => setStudyPlaceId(e.target.value)} required placeholder="Bijv. 1" />
                        </div>

                        <div className="mb-3">
                            <label className="form-label uppercase-track" style={{ color: '#9999b0' }}>Datum</label>
                            <input type="date" className="form-control reservation-input" value={date} onChange={e => setDate(e.target.value)} required />
                        </div>

                        <div className="mb-3">
                            <label className="form-label uppercase-track" style={{ color: '#9999b0' }}>Begintijd</label>
                            <input type="time" className="form-control reservation-input" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                        </div>

                        <div className="mb-3">
                            <label className="form-label uppercase-track" style={{ color: '#9999b0' }}>Eindtijd</label>
                            <input type="time" className="form-control reservation-input" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                        </div>

                        <button type="submit" className="btn reservation-submit w-100 mt-2">
                            Reservering Opslaan
                        </button>
                    </form>
                </div>
            </div>
        </>
    );
}