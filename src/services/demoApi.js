export const demoSessionKey = 'bricovoisins-demo-user';
export const demoPassword = 'demo1234';
const storageKey = 'bricovoisins-demo-v2';

export const initialState = {
  accounts: [
    { id: 1, nom: 'Camille Laurent', email: 'preteur@example.test', adresse: 'Paris 4', role: 'membre', password: demoPassword },
    { id: 2, nom: 'Alex Martin', email: 'emprunteur@example.test', adresse: 'Paris', role: 'membre', password: demoPassword },
    { id: 3, nom: 'Équipe de modération', email: 'admin@example.test', adresse: '', role: 'admin', password: demoPassword },
  ],
  tools: [
    { id: 1, utilisateur_id: 1, titre: 'Marteau', categorie: 'Bricolage', ville: 'Paris 4', photo: '/marteau.png', etat: 'Bon état', description: 'Marteau à manche en bois, disponible sur réservation.' },
    { id: 2, utilisateur_id: 1, titre: 'Pelle', categorie: 'Bricolage', ville: 'Paris', photo: '/perceuse.png', etat: 'Bon état', description: 'Outil proposé en prêt à Paris.' },
    { id: 3, utilisateur_id: 1, titre: 'Marteau', categorie: 'Bricolage', ville: 'Paris', photo: '/perceuse.png', etat: 'Bon état', description: 'Outil proposé en prêt à Paris.' },
  ],
  reservations: [],
  messages: [],
  reviews: [],
  reports: [],
};

function readState() {
  const saved = localStorage.getItem(storageKey);
  return saved ? JSON.parse(saved) : structuredClone(initialState);
}

function currentUser(state) {
  const saved = JSON.parse(localStorage.getItem(demoSessionKey));
  return state.accounts.find(account => account.id === saved?.id && account.active !== false);
}

function publicUser(account) {
  return { id: account.id, nom: account.nom, email: account.email, adresse: account.adresse, role: account.role };
}

function response(data) {
  return { data };
}

function failure(message) {
  return response({ success: false, message });
}

function save(state, data = {}) {
  localStorage.setItem(storageKey, JSON.stringify(state));
  return response({ success: true, ...data });
}

function nextId(rows) {
  return Math.max(0, ...rows.map(row => row.id)) + 1;
}

function reservationRows(state, user) {
  if (!user) return [];
  return state.reservations.flatMap(reservation => {
    const tool = state.tools.find(item => item.id === reservation.annonce_id);
    if (![tool?.utilisateur_id, reservation.emprunteur_id].includes(user.id)) return [];
    const borrower = state.accounts.find(account => account.id === reservation.emprunteur_id);
    const owner = state.accounts.find(account => account.id === tool.utilisateur_id);
    return [{ ...reservation, owner_id: owner.id, outil_titre: tool.titre, ville: tool.ville, photo: tool.photo,
      proprietaire: owner.nom, emprunteur: borrower.nom, emprunteur_email: borrower.email }];
  });
}

function toolFields(payload) {
  return {
    titre: payload.titre.trim(), ville: payload.ville.trim(), categorie: payload.categorie,
    description: payload.description?.trim() || '', etat: payload.etat || 'Bon état',
    photo: payload.photo?.trim() || '',
  };
}

export default {
  async get(path) {
    const [endpoint, query] = path.split('?');
    const state = readState();
    if (endpoint === 'get_annonces.php') return response(state.tools.filter(tool => !tool.hidden && !tool.deleted));
    if (endpoint === 'get_annonce_detail.php') {
      const id = Number(new URLSearchParams(query).get('id'));
      const tool = state.tools.find(item => item.id === id && !item.hidden && !item.deleted);
      if (!tool) throw new Error('Outil introuvable');
      const owner = state.accounts.find(account => account.id === tool.utilisateur_id);
      return response({ ...tool, photo_url: tool.photo, proprietaire: owner.nom,
        avis: state.reviews.filter(review => review.recipient_id === owner.id) });
    }
    const user = currentUser(state);
    const reservations = reservationRows(state, user);
    if (endpoint === 'get_reservations.php') return response(reservations.filter(row => row.emprunteur_id === user?.id));
    if (endpoint === 'get_owner_reservations.php') return response(reservations.filter(row => row.owner_id === user?.id));
    if (endpoint === 'espace') {
      if (!user) return failure('Connectez-vous pour accéder à votre espace.');
      return response({
        user: publicUser(user), reservations,
        tools: state.tools.filter(tool => tool.utilisateur_id === user.id && !tool.deleted),
        messages: state.messages.filter(message => reservations.some(row => row.id === message.reservation_id)),
        reviews: state.reviews.filter(review => reservations.some(row => row.id === review.reservation_id)),
        administration: user.role === 'admin' ? {
          accounts: state.accounts.map(account => ({ ...publicUser(account), active: account.active !== false })),
          tools: state.tools.filter(tool => !tool.deleted),
          reports: state.reports,
        } : null,
      });
    }
    throw new Error('Route de démonstration inconnue');
  },

  async post(path, payload) {
    const state = readState();
    if (path === 'login.php') {
      const user = state.accounts.find(account => account.email === payload.email.trim().toLowerCase());
      return user && user.active !== false && payload.mot_de_passe === user.password
        ? response({ success: true, user: publicUser(user) })
        : failure('Identifiants incorrects ou compte suspendu.');
    }
    if (path === 'register.php') {
      const email = payload.email.trim().toLowerCase();
      if (state.accounts.some(account => account.email === email)) return failure('Cette adresse est déjà utilisée.');
      if (!payload.nom.trim() || payload.mot_de_passe.length < 6) return failure('Indiquez un nom et un mot de passe fictif de six caractères minimum.');
      state.accounts.push({ id: nextId(state.accounts), nom: payload.nom.trim(), email,
        adresse: payload.adresse.trim(), role: 'membre', password: payload.mot_de_passe });
      return save(state);
    }
    if (path === 'reinitialisation') {
      return response({ success: true, message: 'Si le compte existe, une demande de réinitialisation est simulée.' });
    }

    const user = currentUser(state);
    if (!user) return failure('Connecte-toi pour effectuer cette action.');

    if (path === 'profil') {
      if (!payload.nom.trim()) return failure('Indiquez votre nom.');
      Object.assign(user, { nom: payload.nom.trim(), adresse: payload.adresse.trim() });
      return save(state, { user: publicUser(user) });
    }

    if (path === 'add_annonce.php' || path === 'modifier-annonce') {
      const fields = toolFields(payload);
      if (!fields.titre || !fields.ville) return failure('Indiquez un titre et une ville.');
      if (path === 'add_annonce.php') {
        state.tools.push({ ...fields, id: nextId(state.tools), utilisateur_id: user.id });
      } else {
        const tool = state.tools.find(item => item.id === payload.id && item.utilisateur_id === user.id && !item.deleted);
        if (!tool) return failure('Annonce introuvable.');
        Object.assign(tool, fields);
      }
      return save(state);
    }

    if (path === 'signalement') {
      const tool = state.tools.find(item => item.id === payload.id && !item.deleted && !item.hidden);
      if (!tool || !payload.texte.trim()) return failure('Indiquez le motif du signalement.');
      state.reports.push({ id: nextId(state.reports), annonce_id: tool.id, titre: tool.titre, texte: payload.texte.trim() });
      return save(state);
    }

    if (path === 'etat-annonce') {
      const tool = state.tools.find(item => item.id === payload.id && !item.deleted);
      if (!tool || (tool.utilisateur_id !== user.id && user.role !== 'admin')) return failure('Action interdite.');
      if (payload.action === 'supprimer') tool.deleted = true;
      if (payload.action === 'suspendre') tool.hidden = true;
      if (payload.action === 'réactiver') tool.hidden = false;
      return save(state);
    }

    if (path === 'etat-compte') {
      const account = state.accounts.find(item => item.id === payload.id && item.role !== 'admin');
      if (user.role !== 'admin' || !account) return failure('Action interdite.');
      account.active = payload.active;
      return save(state);
    }

    if (path === 'traiter-signalement') {
      if (user.role !== 'admin') return failure('Action interdite.');
      const report = state.reports.find(item => item.id === payload.id);
      if (!report) return failure('Signalement introuvable.');
      report.traite = true;
      return save(state);
    }

    if (path === 'add_reservation.php') {
      const tool = state.tools.find(item => item.id === Number(payload.annonce_id) && !item.hidden && !item.deleted);
      if (!tool) return failure('Outil introuvable.');
      if (tool.utilisateur_id === user.id) return failure('Tu es le propriétaire de cet outil.');
      const { date_debut, date_fin } = payload;
      if (!date_debut || !date_fin || date_fin < date_debut) return failure('Vérifie les dates.');
      const overlap = state.reservations.some(item => item.annonce_id === tool.id
        && item.statut !== 'refusee' && (item.statut === 'confirmee' || item.emprunteur_id === user.id)
        && item.date_debut <= date_fin && item.date_fin >= date_debut);
      if (overlap) return failure('Cet outil est déjà demandé ou réservé sur ces dates.');
      state.reservations.push({ id: nextId(state.reservations), annonce_id: tool.id,
        emprunteur_id: user.id, date_debut, date_fin, statut: 'en_attente' });
      return save(state);
    }

    const booking = reservationRows(state, user).find(row => row.id === payload.reservation_id);
    if (!booking) return failure('Demande introuvable.');
    if (path === 'update_reservation_status.php') {
      if (booking.owner_id !== user.id || booking.statut !== 'en_attente' || !['confirmee', 'refusee'].includes(payload.statut)) {
        return failure('Cette demande ne peut pas être modifiée.');
      }
      if (payload.statut === 'confirmee' && state.reservations.some(row => row.id !== booking.id
        && row.annonce_id === booking.annonce_id && row.statut === 'confirmee'
        && row.date_debut <= booking.date_fin && row.date_fin >= booking.date_debut)) {
        return failure('Un autre emprunt est déjà confirmé sur ces dates.');
      }
      state.reservations.find(row => row.id === booking.id).statut = payload.statut;
      return save(state);
    }
    if (path === 'message') {
      if (!payload.texte.trim()) return failure('Écrivez un message.');
      state.messages.push({ id: nextId(state.messages), reservation_id: booking.id, auteur: user.nom, texte: payload.texte.trim() });
      return save(state);
    }
    if (path === 'avis') {
      if (booking.statut !== 'confirmee' || booking.date_fin >= new Date().toLocaleDateString('sv-SE')) {
        return failure('Vous pourrez publier un avis après la fin du prêt.');
      }
      const score = Number(payload.note);
      if (!Number.isInteger(score) || score < 1 || score > 5 || !payload.texte.trim()) return failure('Indiquez une note et un commentaire.');
      if (state.reviews.some(review => review.reservation_id === booking.id && review.author_id === user.id)) return failure('Votre avis est déjà publié.');
      state.reviews.push({ id: nextId(state.reviews), reservation_id: booking.id, author_id: user.id,
        recipient_id: booking.owner_id === user.id ? booking.emprunteur_id : booking.owner_id,
        auteur: user.nom, note: score, texte: payload.texte.trim() });
      return save(state);
    }
    throw new Error('Route de démonstration inconnue');
  },
};
