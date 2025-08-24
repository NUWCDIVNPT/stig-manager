import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

// function removeQueryParams(to) {
//   console.log('Removing query params:', to.query)
//   if (Object.keys(to.query).length)
//     return { path: to.path, query: {}, hash: to.hash }
// }

// function removeHash(to) {
//   console.log('Removing hash:', to.hash)
//   if (to.hash) return { path: to.path, query: to.query, hash: '' }
// }

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      // beforeEnter: [removeQueryParams, removeHash],
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
      // beforeEnter: [removeQueryParams, removeHash],
    },
  ],
})

export default router
