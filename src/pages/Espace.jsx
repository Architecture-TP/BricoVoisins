import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { writeUser } from '../services/api.js';

const statuses = {
  en_attente: 'En attente', confirmee: 'Confirmée', refusee: 'Refusée',
};

export default function Espace({ section = 'espace' }) {
  const [data, setData] = useState(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    api.get('espace').then(result => setData(result.data)).catch(() => setError(true));
  }, []);

  async function submit(endpoint, payload, message) {
    setNotice('');
    try {
      const { data: result } = await api.post(endpoint, payload);
      if (!result.success) {
        setNotice(result.message);
        return false;
      }
      if (result.user) writeUser(result.user);
      setData((await api.get('espace')).data);
      setNotice(message);
      return true;
    } catch {
      setNotice('Impossible de terminer cette action.');
      return false;
    }
  }

  if (error) return <main className="espace"><p role="alert">Impossible de charger votre espace.</p></main>;
  if (!data) return <main className="espace"><p>Chargement…</p></main>;
  if (!data.user) return <main className="espace"><p>{data.message} <Link to="/connexion">Connexion</Link></p></main>;

  return (
    <main className="espace">
      {section === 'administration' ? (
        <>
          <h1>Tableau de bord d’administration</h1>
          {data.administration ? <Administration data={data.administration} submit={submit} />
            : <p role="alert">Accès réservé à la modération.</p>}
        </>
      ) : (
        <>
          <h1>Mon espace</h1>
          <nav aria-label="Navigation de mon espace" className="espace-actions">
            <Link to="/espace">Vue d’ensemble</Link>
            <Link to="/profil">Mon profil</Link>
            <Link to="/mes-outils">Mes outils</Link>
            <Link to="/messages">Messagerie et avis</Link>
          </nav>
          {section === 'espace' && (
            <section className="espace-card">
              <h2>Bonjour, {data.user.nom}</h2>
              <p>{data.tools.length} annonce(s) et {data.reservations.length} demande(s) au total.</p>
              <div className="espace-actions"><Link to="/reservations">Mes emprunts</Link><Link to="/demandes">Demandes reçues</Link></div>
            </section>
          )}
          {section === 'profil' && (
            <section className="espace-card">
              <h2>Modifier mon profil</h2>
              <form className="espace-form" onSubmit={event => {
                event.preventDefault();
                submit('profil', Object.fromEntries(new FormData(event.currentTarget)), 'Profil mis à jour.');
              }}>
                <label>Nom complet <input name="nom" required defaultValue={data.user.nom} /></label>
                <label>Ville ou quartier <input name="adresse" defaultValue={data.user.adresse} /></label>
                <button type="submit">Enregistrer le profil</button>
              </form>
            </section>
          )}
          {section === 'outils' && (
            <section>
              <h2>Mes outils</h2>
              <Link to="/ajouter">Publier un outil</Link>
              {!data.tools.length && <p>Tu n’as encore publié aucun outil.</p>}
              {data.tools.map(tool => <ToolCard key={tool.id} tool={tool} submit={submit} editable />)}
            </section>
          )}
          {section === 'messages' && <Conversations data={data} submit={submit} />}
        </>
      )}
      {notice && <p className="espace-notice" role="status">{notice}</p>}
    </main>
  );
}

function ToolCard({ tool, submit, editable }) {
  const action = tool.hidden ? 'réactiver' : 'suspendre';
  return (
    <article className="espace-card">
      <h3>{tool.titre}</h3>
      <p>{tool.categorie} · {tool.ville} · {tool.hidden ? 'Suspendue' : 'Publiée'}</p>
      {editable && (
        <details>
          <summary>Modifier l’annonce</summary>
          <form className="espace-form" onSubmit={event => {
            event.preventDefault();
            submit('modifier-annonce', { id: tool.id, ...Object.fromEntries(new FormData(event.currentTarget)) }, 'Annonce mise à jour.');
          }}>
            <label>Titre <input name="titre" required defaultValue={tool.titre} /></label>
            <label>Ville <input name="ville" required defaultValue={tool.ville} /></label>
            <label>Catégorie <select name="categorie" defaultValue={tool.categorie}>
              {['Bricolage', 'Jardinage', 'Nettoyage', 'Manutention'].map(category => <option key={category}>{category}</option>)}
            </select></label>
            <label>État <input name="etat" defaultValue={tool.etat} /></label>
            <label>Lien ou chemin de la photo <input name="photo" defaultValue={tool.photo} /></label>
            <label>Description <textarea name="description" defaultValue={tool.description} /></label>
            <button type="submit">Enregistrer l’annonce</button>
          </form>
        </details>
      )}
      <div className="espace-actions">
        <button onClick={() => submit('etat-annonce', { id: tool.id, action }, 'Visibilité mise à jour.')}>{tool.hidden ? 'Réactiver' : 'Suspendre'}</button>
        <button className="button-secondary" onClick={() => {
          if (window.confirm('Supprimer cette annonce ?')) {
            submit('etat-annonce', { id: tool.id, action: 'supprimer' }, 'Annonce supprimée.');
          }
        }}>Supprimer</button>
      </div>
    </article>
  );
}

function Conversations({ data, submit }) {
  return (
    <section>
      <h2>Messagerie et avis</h2>
      {!data.reservations.length && <p>Les conversations et avis apparaissent ici après une demande d’emprunt.</p>}
      {data.reservations.map(row => (
        <article className="espace-card" key={row.id}>
          <h3>{row.outil_titre}</h3>
          <p>{row.proprietaire} et {row.emprunteur} · {statuses[row.statut]}</p>
          <ul>
            {data.messages.filter(message => message.reservation_id === row.id).map(message => (
              <li key={message.id}><strong>{message.auteur}</strong> — {message.texte}</li>
            ))}
          </ul>
          <form className="espace-form" onSubmit={async event => {
            event.preventDefault();
            const form = event.currentTarget;
            if (await submit('message', { reservation_id: row.id, texte: new FormData(form).get('texte') }, 'Message envoyé.')) form.reset();
          }}>
            <label>Message <textarea name="texte" required /></label>
            <button type="submit">Envoyer</button>
          </form>
          <ul>
            {data.reviews.filter(review => review.reservation_id === row.id).map(review => (
              <li key={review.id}>{review.auteur} · {review.note}/5 — {review.texte}</li>
            ))}
          </ul>
          {row.statut === 'confirmee' && <details>
            <summary>Donner un avis après le prêt</summary>
            <form className="espace-form" onSubmit={async event => {
              event.preventDefault();
              const form = event.currentTarget;
              if (await submit('avis', { reservation_id: row.id, ...Object.fromEntries(new FormData(form)) }, 'Avis publié.')) form.reset();
            }}>
              <label>Note sur cinq <input type="number" name="note" required min="1" max="5" /></label>
              <label>Commentaire <textarea name="texte" required /></label>
              <button type="submit">Publier l’avis</button>
            </form>
          </details>}
        </article>
      ))}
    </section>
  );
}

function Administration({ data, submit }) {
  return <>
    <section className="espace-card">
      <h2>Utilisateurs</h2>
      {data.accounts.map(account => <div className="espace-actions" key={account.id}>
        <span>{account.nom} · {account.active ? 'Actif' : 'Suspendu'}</span>
        {account.role !== 'admin' && <button onClick={() => submit('etat-compte', { id: account.id, active: !account.active }, 'Compte mis à jour.')}>
          {account.active ? 'Suspendre le compte' : 'Réactiver le compte'}
        </button>}
      </div>)}
    </section>
    <section className="espace-card">
      <h2>Signalements</h2>
      {!data.reports.length && <p>Aucun signalement.</p>}
      {data.reports.map(report => <div className="espace-actions" key={report.id}>
        <span>{report.titre} — {report.texte}</span>
        {report.traite ? <span>Traité</span>
          : <button onClick={() => submit('traiter-signalement', { id: report.id }, 'Signalement traité.')}>Marquer comme traité</button>}
      </div>)}
    </section>
    <section>
      <h2>Annonces</h2>
      {data.tools.map(tool => <ToolCard key={tool.id} tool={tool} submit={submit} />)}
    </section>
  </>;
}
