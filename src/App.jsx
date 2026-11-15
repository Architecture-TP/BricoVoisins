import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { isDemo } from './services/api.js';
import './rendu.css';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import AddTool from './pages/AddTool';
import ToolDetail from './pages/ToolDetail';
import Reservations from './pages/Reservations';
import Espace from './pages/Espace';
import ManageReservations from './pages/ManageReservations';

export default function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ajouter" element={<AddTool />} />
        <Route path="/outil/:id" element={<ToolDetail />} />
        <Route path="/reservations" element={<Reservations />} />
        <Route path="/demandes" element={<ManageReservations />} />
        <Route path="/connexion" element={<Login />} />
        <Route path="/inscription" element={<Login key="inscription" mode="inscription" />} />
        {isDemo && <Route path="/mot-de-passe" element={<Login key="reset" mode="reset" />} />}
        {isDemo && <Route path="/espace" element={<Espace key="espace" />} />}
        {isDemo && <Route path="/profil" element={<Espace key="profil" section="profil" />} />}
        {isDemo && <Route path="/mes-outils" element={<Espace key="outils" section="outils" />} />}
        {isDemo && <Route path="/messages" element={<Espace key="messages" section="messages" />} />}
        {isDemo && <Route path="/administration" element={<Espace key="admin" section="administration" />} />}
        <Route path="*" element={<main className="espace"><h1>Page introuvable</h1><Link to="/">Retour à l’accueil</Link></main>} />
      </Routes>
      <footer style={{ padding: "1.5rem", textAlign: "center", color: "#475569" }}>
        Projet d’architecture logicielle ECE · Amine ABOUTITE, Maxime Noel et Valentin Parade
        {isDemo && <small className="demo-note">Démonstration · données fictives enregistrées dans le navigateur</small>}
      </footer>
    </Router>
  );
}