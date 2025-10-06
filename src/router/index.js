import { createRouter, createWebHistory } from "vue-router";
import Test from "../views/Test.vue";
import Profile from "../views/Profile.vue";
import Login from "../views/Login.vue";
import OAuthCallback from "../views/OAuthCallback.vue";
import VerifyEmail from "../views/VerifyEmail.vue";

const routes = [
  { path: "/", name: "Test", component: Test },
  { path: "/profile", name: "Profile", component: Profile },
  { path: "/login", name: "Login", component: Login },
  { path: "/oauth/callback", name: "OAuthCallback", component: OAuthCallback },
  { path: "/verify-email", name: "VerifyEmail", component: VerifyEmail },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior() {
    return { top: 0 }; // always scroll to top on navigation
  },
});

export default router;
