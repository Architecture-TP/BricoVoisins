import React, { useState, useEffect } from 'react';
import api, { isDemo, readUser } from '../services/api.js';
import { initialState } from '../services/demoApi.js';
import { Link } from 'react-router-dom';
import { Search, MapPin, Tag } from 'lucide-react';

export default function Home() {
  const [tools, setTools] = useState(isDemo ? initialState.tools : []);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('');
  const [nearby, setNearby] = useState(false);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState(false);

  const API_URL = 'get_annonces.php';

  useEffect(() => {
    api.get(API_URL)
      .then(response => {
        if (Array.isArray(response.data)) {
          setTools(response.data);
        } else {
          setError(true);
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Erreur de chargement :", error);
        setError(true);
        setLoading(false);
      });
  }, []);

  const city = readUser()?.adresse?.trim().toLowerCase().split(/\s+/)[0] || '';
  const matchesCity = tool => city && tool.ville?.toLowerCase().split(/\s+/)[0] === city;
  const categories = [...new Set(tools.map(tool => tool.categorie))];
  const filteredTools = tools.filter(tool =>
    tool.titre.toLowerCase().includes(searchTerm.trim().toLowerCase())
    && (!category || tool.categorie === category)
  );
  if (nearby) filteredTools.sort((left, right) => Number(Boolean(matchesCity(right))) - Number(Boolean(matchesCity(left))));

  return (
    <main className="catalogue" style={styles.container}>
      {/* Hero Section */}
      <div style={styles.hero}>
        <h1 style={styles.heroTitle}>Empruntez des outils à vos voisins</h1>
        <p style={styles.heroSubtitle}>Économisez de l'argent et simplifiez vos travaux.</p>

        <div style={styles.searchBar}>
          <Search color="#94a3b8" size={20} />
          <input
            type="search"
            aria-label="Rechercher un outil"
            placeholder="Que cherchez-vous ? (ex: Perceuse, Tondeuse...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      {/* Liste des outils */}
      <h2 style={styles.sectionTitle}>Derniers outils disponibles</h2>

      <details className="catalogue-filters">
        <summary>Filtres</summary>
        <label>Catégorie <select value={category} onChange={event => setCategory(event.target.value)}>
          <option value="">Toutes</option>
          {categories.map(item => <option key={item}>{item}</option>)}
        </select></label>
        {city && <label><input type="checkbox" checked={nearby} onChange={event => setNearby(event.target.checked)} /> Ma ville en premier</label>}
      </details>

      {loading ? (
        <p>Chargement des annonces...</p>
      ) : error ? (
        <p role="alert">Impossible de charger les annonces. Vérifie le serveur puis recharge la page.</p>
      ) : filteredTools.length === 0 ? (
        <p>{tools.length ? "Aucun outil ne correspond à cette recherche." : "Aucune annonce disponible."}</p>
      ) : (
        <div className="catalogue-grid" style={styles.grid}>
          {filteredTools.map(tool => (
            <div key={tool.id} style={styles.card}>
              <img
                src={tool.photo || '/outil.svg'}
                alt={tool.titre}
                style={styles.cardImage}
              />
              <div style={styles.cardContent}>
                <span style={styles.badge}><Tag size={12} /> {tool.categorie}</span>
                <h3 style={styles.cardTitle}>{tool.titre}</h3>
                <p style={styles.location}><MapPin size={14} /> {tool.ville}</p>
                <Link to={`/outil/${tool.id}`} style={styles.cardButton}>Voir la fiche</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

const styles = {
  container: { padding: '2rem', maxWidth: '1216px', margin: '0 auto' },
  hero: { textAlign: 'center', padding: '2.4rem 1rem', backgroundColor: '#eef3f8', borderRadius: '12px', marginBottom: '1.3rem' },
  heroTitle: { fontSize: '2.2rem', color: '#0f172a', marginBottom: '0.5rem' },
  heroSubtitle: { color: '#64748b', fontSize: '1.1rem', marginBottom: '1.5rem' },
  searchBar: { display: 'flex', alignItems: 'center', backgroundColor: '#fff', padding: '0.8rem 1.2rem', borderRadius: '50px', maxWidth: '600px', margin: '0 auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
  input: { border: 'none', outline: 'none', width: '100%', marginLeft: '0.8rem', fontSize: '1rem' },
  sectionTitle: { fontSize: '1.5rem', color: '#1e293b', marginBottom: '.65rem' },
  grid: { display: 'grid', gap: '1.8rem' },
  card: { backgroundColor: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  cardImage: { width: '100%', height: '180px', objectFit: 'cover' },
  cardContent: { padding: '1.2rem' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600' },
  cardTitle: { fontSize: '1.1rem', margin: '0.5rem 0', color: '#1e293b' },
  location: { display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' },
  cardButton: { display: 'block', textAlign: 'center', textDecoration: 'none', padding: '0.6rem', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }
};