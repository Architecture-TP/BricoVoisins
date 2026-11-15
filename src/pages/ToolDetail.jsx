import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { isDemo, readUser } from '../services/api.js';
import { MapPin, Tag, User, Calendar, CheckCircle } from 'lucide-react';

export default function ToolDetail() {
  const { id } = useParams();
  return <ToolDetailPage key={id} id={id} />;
}

function ToolDetailPage({ id }) {
  const navigate = useNavigate();
  const [tool, setTool] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reportStatus, setReportStatus] = useState('');
  const [dates, setDates] = useState({ date_debut: '', date_fin: '' });

  useEffect(() => {
    let active = true;
    api.get(`get_annonce_detail.php?id=${encodeURIComponent(id)}`)
      .then(res => {
        if (!active) return;
        if (res.data?.titre) setTool(res.data);
        else setLoadError(true);
      })
      .catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [id]);

  const handleReservation = async (event) => {
    event.preventDefault();
    if (submitting) return;
    setSubmitError('');
    if (!dates.date_debut || !dates.date_fin || dates.date_fin < dates.date_debut) {
      setSubmitError('La date de fin doit être égale ou postérieure à la date de début.');
      return;
    }
    const user = readUser();
    if (!user?.id) {
      setSubmitError('Connecte-toi avant de demander un emprunt.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('add_reservation.php', {
        annonce_id: id,
        emprunteur_id: user.id,
        ...dates
      });
      if (res.data.success) navigate('/reservations');
      else setSubmitError(res.data.message || res.data.error || 'La réservation a été refusée.');
    } catch {
      setSubmitError('Impossible de contacter le serveur. Réessaie dans un instant.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadError) return <p role="alert" style={{ padding: '2rem' }}>Impossible de charger cet outil.</p>;
  if (!tool) return <p style={{ padding: '2rem' }}>Chargement...</p>;

  return (
    <div style={styles.container}>
      <div className="tool-detail-grid" style={styles.grid}>
        <div>
          <img src={tool.photo_url || '/outil.svg'} alt={tool.titre} style={styles.image} />
          <h1 style={styles.title}>{tool.titre}</h1>
          <div style={styles.meta}>
            <span style={styles.badge}><Tag size={14} /> {tool.categorie}</span>
            <span><MapPin size={14} /> {tool.ville}</span>
            <span><User size={14} /> Proposé par <strong>{tool.proprietaire}</strong></span>
          </div>
          <h3>Description</h3>
          {tool.etat && <p>État de l’outil · {tool.etat}</p>}
          <p style={styles.desc}>{tool.description || "Aucune description renseignée."}</p>
          {isDemo && (
            <section className="espace">
              <h2>Avis sur le prêteur</h2>
              {tool.avis?.length ? <ul>{tool.avis.map(review => <li key={review.id}>
                {review.auteur} · {review.note}/5 — {review.texte}
              </li>)}</ul> : <p>Aucun avis publié.</p>}
              {readUser() && <details>
                <summary>Signaler cette annonce</summary>
                <form className="espace-form" onSubmit={async event => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  try {
                    const { data } = await api.post('signalement', { id: Number(id), texte: new FormData(form).get('motif') });
                    setReportStatus(data.success ? 'Signalement transmis.' : data.message);
                    if (data.success) form.reset();
                  } catch {
                    setReportStatus('Impossible de transmettre le signalement.');
                  }
                }}>
                  <label>Motif <textarea name="motif" required /></label>
                  <button type="submit">Envoyer le signalement</button>
                </form>
                {reportStatus && <p role="status">{reportStatus}</p>}
              </details>}
            </section>
          )}
        </div>

        {/* Formulaire de réservation */}
        <div style={styles.bookingBox}>
          <h3 style={styles.bookingTitle}><Calendar size={20} color="#2563eb" /> Réserver cet outil</h3>
          <form onSubmit={handleReservation} style={styles.form}>
            <label htmlFor="date-debut" style={styles.label}>Date de début :</label>
            <input
              id="date-debut"
              type="date"
              required
              style={styles.input}
              onChange={e => setDates({ ...dates, date_debut: e.target.value })}
            />

            <label htmlFor="date-fin" style={styles.label}>Date de fin :</label>
            <input
              id="date-fin"
              type="date"
              required
              style={styles.input}
              onChange={e => setDates({ ...dates, date_fin: e.target.value })}
            />

            {submitError && <p role="alert">{submitError}</p>}
            <button type="submit" style={styles.button} disabled={submitting}>
              <CheckCircle size={18} /> {submitting ? "Envoi…" : "Confirmer la réservation"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1000px', margin: '2rem auto', padding: '1rem' },
  grid: { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' },
  image: { width: '100%', height: '350px', objectFit: 'cover', borderRadius: '12px' },
  title: { fontSize: '2rem', marginTop: '1rem', color: '#0f172a' },
  meta: { display: 'flex', gap: '1.2rem', alignItems: 'center', color: '#64748b', margin: '1rem 0' },
  badge: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.3rem 0.8rem', borderRadius: '20px', fontWeight: '600', fontSize: '0.85rem' },
  desc: { lineHeight: '1.6', color: '#334155' },
  bookingBox: { backgroundColor: '#fff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', height: 'fit-content' },
  bookingTitle: { display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#0f172a' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.8rem' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#475569' },
  input: { padding: '0.6rem', borderRadius: '6px', border: '1px solid #cbd5e1' },
  button: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.8rem', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', marginTop: '1rem' }
};