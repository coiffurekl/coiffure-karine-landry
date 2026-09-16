/* sw.js — reçoit les avis d'annulation quand le logiciel est fermé.
   Doit être à la racine du site, à côté de index.html : un service worker ne peut agir que sur
   les pages de son dossier et de ceux en dessous.

   Volontairement AUCUNE mise en cache : le logiciel pèse plus de 5 Mo et on se bat déjà contre le
   cache du navigateur après chaque mise à jour (?v=…). Ce fichier ne sert qu'aux avis. */

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { titre: 'Annulation', texte: e.data ? e.data.text() : '' }; }

  const travaux = [
    // Sur iPhone, un avis doit TOUJOURS afficher une notification, sinon Apple coupe l'abonnement.
    self.registration.showNotification(d.titre || 'Annulation', {
      body: d.texte || '',
      icon: 'icon-192-v2.png',
      badge: 'icon-192-v2.png',
      tag: 'annulation-' + Date.now(),
      data: { url: d.url || './' }
    })
  ];
  // Le rond rouge sur l'icône : le nombre d'annulations d'aujourd'hui et des jours suivants.
  if (typeof d.nombre === 'number' && self.navigator && 'setAppBadge' in self.navigator) {
    travaux.push(d.nombre > 0 ? self.navigator.setAppBadge(d.nombre) : self.navigator.clearAppBadge());
  }
  e.waitUntil(Promise.all(travaux).catch(() => {}));
});

// Toucher la notification ouvre le logiciel (ou le ramène devant s'il est déjà ouvert).
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const cible = (e.notification.data && e.notification.data.url) || './';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((fenetres) => {
      for (const f of fenetres) { if ('focus' in f) return f.focus(); }
      return self.clients.openWindow(cible);
    })
  );
});
