import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
  },
  {
    path: '/events/:id',
    name: 'EventDetails',
    component: () => import('../views/EventDetailsView.vue'),
    props: true,
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('../views/AdminDashboard.vue'),
    meta: { requiresAdmin: true },
  },
  {
    path: '/admin/events/new',
    name: 'AdminEventNew',
    component: () => import('../views/AdminEventFormView.vue'),
    meta: { requiresAdmin: true },
    props: { eventId: null },
  },
  {
    path: '/admin/events/:id/edit',
    name: 'AdminEventEdit',
    component: () => import('../views/AdminEventFormView.vue'),
    meta: { requiresAdmin: true },
    props: true,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

function isAdmin() {
  const userStr = localStorage.getItem('user');
  if (!userStr) return false;
  try {
    const user = JSON.parse(userStr);
    return user?.role === 'admin';
  } catch {
    return false;
  }
}

function hasValidToken() {
  return !!localStorage.getItem('token');
}

router.beforeEach((to, _from, next) => {
  if (to.meta.requiresAdmin) {
    if (!hasValidToken()) {
      next({ path: '/', query: { login: '1' } });
      return;
    }
    if (!isAdmin()) {
      next({ path: '/' });
      return;
    }
  }
  next();
});

export default router;
