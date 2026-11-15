import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { isDemo, writeUser } from '../services/api.js';
import { demoPassword } from '../services/demoApi.js';
import { LogIn, UserPlus, Mail, Lock, User, MapPin } from 'lucide-react';

export default function Login({ mode = 'connexion' }) {
  const register = mode === 'inscription';
  const reset = mode === 'reset';
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setBusy(true);
    const endpoint = reset ? 'reinitialisation' : register ? 'register.php' : 'login.php';
    const payload = { nom: '', adresse: '', ...Object.fromEntries(new FormData(event.currentTarget)) };
    try {
      const { data } = await api.post(endpoint, payload);
      if (!data.success) {
        setError(data.message);
      } else if (reset) {
        setNotice(data.message);
      } else if (register) {
        navigate('/connexion?compte=cree');
      } else {
        writeUser(data.user);
        window.location.assign('/');
      }
    } catch {
      setError('Impossible de contacter le service.');
    } finally {
      setBusy(false);
    }
  }

  const title = reset ? 'Mot de passe oublié' : register ? 'Inscription' : 'Connexion';
  return (
    <main className="auth-page">
      <section className="auth-card">
        <h1>{register ? <UserPlus size={24} /> : <LogIn size={24} />} {title}</h1>
        {error && <p role="alert" className="auth-error">{error}</p>}
        {notice && <p role="status">{notice}</p>}
        {mode === 'connexion' && new URLSearchParams(window.location.search).has('compte') &&
          <p role="status">Compte créé. Tu peux maintenant te connecter.</p>}
        <form className="auth-form" onSubmit={submit}>
          {register && <>
            <label><span><User size={16} /> Nom complet</span>
              <input name="nom" required placeholder="ex: Alex Martin" autoComplete="name" />
            </label>
            <label><span><MapPin size={16} /> Ville / Quartier</span>
              <input name="adresse" placeholder="ex: Paris 11e" autoComplete="address-level2" />
            </label>
          </>}
          <label><span><Mail size={16} /> Email</span>
            <input name="email" type="email" required placeholder="votre@email.com" autoComplete="email" />
          </label>
          {!reset && <label><span><Lock size={16} /> Mot de passe</span>
            <input name="mot_de_passe" type="password" required minLength={register && isDemo ? 6 : undefined}
              placeholder="••••••••" autoComplete={register ? 'new-password' : 'current-password'} />
          </label>}
          <button type="submit" disabled={busy}>{reset ? 'Réinitialiser' : register ? 'S’inscrire' : 'Se connecter'}</button>
        </form>
        <p className="auth-switch">
          {register || reset ? <>Déjà un compte ? <Link to="/connexion">Se connecter</Link></>
            : <>Pas encore de compte ? <Link to="/inscription">S’inscrire</Link></>}
        </p>
      </section>
      {isDemo && !reset && (
        <details className="auth-demo">
          <summary>Comptes de démonstration</summary>
          <p>Prêteur <code>preteur@example.test</code><br />
            Emprunteur <code>emprunteur@example.test</code><br />
            Administration <code>admin@example.test</code><br />
            Mot de passe <code>{demoPassword}</code></p>
        </details>
      )}
      {isDemo && register && <p className="auth-demo">Utilise uniquement une adresse et un mot de passe fictifs.</p>}
      {isDemo && mode === 'connexion' && <Link className="auth-demo" to="/mot-de-passe">Mot de passe oublié ?</Link>}
    </main>
  );
}
