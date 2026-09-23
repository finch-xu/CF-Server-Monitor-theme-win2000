import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', name: 'Dashboard', component: () => import('./views/Dashboard.vue') },
  { path: '/server/:id', name: 'Server', component: () => import('./views/ServerDetail.vue') },
  // 管理后台由内置默认主题接管，主题只负责跳转
  { path: '/admin', beforeEnter: () => { window.location.href = '/admin#admin'; return false } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})
