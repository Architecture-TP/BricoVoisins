import React, { useState, useEffect } from 'react';
import api, { readUser } from '../services/api.js';
import { Inbox, Check, X, Clock, User, Mail } from 'lucide-react';

export default function ManageReservations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const user = readUser();
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    api.get(`get_owner_reservations.php?owner_id=${userId}`)
      .then(res => {
        if (Array.isArray(res.data)) {
          setRequests(res.data);
        } else {
          setLoadError(true);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur :", err);
        setLoadError(true);
        setLoading(false);
      });
  }, [userId]);

  const handleStatusUpdate = (reservationId, newStatus) => {
    api.post('update_reservation_status.php', {
      reservation_id: reservationId,
      statut: newStatus
    })
    .then(res => {
      if (res.data.success) {
        // Mise à jour de la liste locale
        setRequests(current => current.map(req => req.id === reservationId ? { ...req, statut: newStatus } : req));
      } else {
        alert(res.data.message || "Erreur lors de la mise à jour");
      }
    })
    .catch(() => alert("Impossible de contacter le serveur."));
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}><Inbox size={24} color="#2563eb" /> Demandes reçues pour mes outils</h2>

      {!userId ? <p>Connectez-vous pour gérer vos demandes.</p> : loading ? (
        <p>Chargement des demandes...</p>
      ) : loadError ? (
        <p role="alert">Impossible de charger les demandes reçues.</p>
      ) : requests.length === 0 ? (
        <p style={{ color: '#64748b' }}>Vous n'avez reçu aucune demande pour le moment.</p>
      ) : (
        <div style={styles.list}>
          {requests.map(req => (
            <div key={req.id} className="reservation-card" style={styles.card}>
              <img src={req.photo || '/outil.svg'} alt={req.outil_titre} style={styles.image} />

              <div style={styles.info}>
                <h3 style={styles.toolTitle}>{req.outil_titre}</h3>
                <p style={styles.subtext}><User size={14} /> Demandé par : <strong>{req.emprunteur}</strong></p>
                <p style={styles.subtext}><Mail size={14} /> Contact : {req.emprunteur_email}</p>
                <p style={styles.dates}><Clock size={14} /> Du <strong>{req.date_debut}</strong> au <strong>{req.date_fin}</strong></p>
              </div>

              <div style={styles.actions}>
                {req.statut === 'en_attente' ? (
                  <>
                    <button onClick={() => handleStatusUpdate(req.id, 'confirmee')} style={styles.acceptBtn}>
                      <Check size={16} /> Accepter
                    </button>
                    <button onClick={() => handleStatusUpdate(req.id, 'refusee')} style={styles.rejectBtn}>
                      <X size={16} /> Refuser
                    </button>
                  </>
                ) : (
                  <span style={req.statut === 'confirmee' ? styles.badgeAccepted : styles.badgeRejected}>
                    {req.statut === 'confirmee' ? 'Acceptée' : 'Refusée'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: { maxWidth: '850px', margin: '2rem auto', padding: '1rem' },
  title: { display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.5rem', color: '#0f172a', marginBottom: '1.5rem' },
  list: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  card: { display: 'flex', gap: '1rem', backgroundColor: '#fff', padding: '1.2rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.04)', alignItems: 'center' },
  image: { width: '90px', height: '90px', objectFit: 'cover', borderRadius: '8px' },
  info: { flex: 1 },
  toolTitle: { fontSize: '1.1rem', margin: '0 0 0.4rem 0', color: '#0f172a' },
  subtext: { color: '#64748b', fontSize: '0.85rem', margin: '0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem' },
  dates: { color: '#334155', fontSize: '0.9rem', margin: '0.4rem 0 0 0', display: 'flex', alignItems: 'center', gap: '0.4rem' },
  actions: { display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '120px' },
  acceptBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem 0.8rem', backgroundColor: '#16a34a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
  rejectBtn: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', padding: '0.5rem 0.8rem', backgroundColor: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' },
  badgeAccepted: { textAlign: 'center', padding: '0.4rem 0.8rem', backgroundColor: '#dcfce7', color: '#166534', borderRadius: '20px', fontWeight: '600', fontSize: '0.85rem' },
  badgeRejected: { textAlign: 'center', padding: '0.4rem 0.8rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '20px', fontWeight: '600', fontSize: '0.85rem' }
};