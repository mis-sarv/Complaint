// ============================================================
// Sarv India MIS — Service Worker for Web Push Notifications
// ============================================================
// This SW handles:
//   1. Push events  → show notification with sound + vibration
//   2. Notification click → open / focus the app
//   3. Notification close → (optional) analytics later
// ============================================================

const APP_URL = self.location.origin + self.location.pathname.replace(/sw\.js$/, 'index.html');

// ---------- Push Event ----------
self.addEventListener('push', (event) => {
  let data = { title: '⏰ Task Reminder!', body: 'Aapke liye ek task pending hai.', taskId: null };

  if (event.data) {
    try {
      const json = event.data.json();
      data = { ...data, ...json };
    } catch (e) {
      data.body = event.data.text() || data.body;
    }
  }

  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: data.taskId ? `task-${data.taskId}` : 'sarv-push',
    renotify: true,
    requireInteraction: true,   // stays until user taps
    vibrate: [300, 150, 300, 150, 300, 150, 300],
    data: { url: APP_URL, taskId: data.taskId },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ---------- Notification Click ----------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = (event.notification.data && event.notification.data.url) || APP_URL;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If app is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes('index.html') && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      return clients.openWindow(url);
    })
  );
});

// ---------- Activate: claim all clients immediately ----------
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// ---------- Install: skip waiting ----------
self.addEventListener('install', () => {
  self.skipWaiting();
});
