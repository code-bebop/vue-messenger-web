import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import ChatRoom from '../views/ChatRoom.vue'

const routes = [
  {
    path: '/',
    name: 'Login',
    component: Login
  },
  {
    path: '/ChatRoom/:username',
    name: 'ChatRoom',
    component: ChatRoom
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
