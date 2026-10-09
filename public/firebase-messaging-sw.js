/* Firebase Cloud Messaging Service Worker for Doorbly Partner */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyDgF1AvQ5eQtuAfnCtqezLPLNHLoPJ9i1I',
  authDomain: 'doorbly-b0bba.firebaseapp.com',
  projectId: 'doorbly-b0bba',
  storageBucket: 'doorbly-b0bba.firebasestorage.app',
  messagingSenderId: '977376808906',
  appId: '1:977376808906:web:caf01942d3773fb85d4933'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle =
    (payload && payload.notification && payload.notification.title) ||
    'New Doorbly Partner Alert';
  const notificationOptions = {
    body:
      (payload && payload.notification && payload.notification.body) ||
      'Open Doorbly Partner to view live job request details.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200, 100, 300],
    data: (payload && payload.data) || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});
