import { createRouter, createWebHistory } from "vue-router"
import Chatter from "../components/Chatter.vue"
import UnrealEngineClient from "../components/UnrealEngineClient.vue"

const routes = [
    {
        path: "/",
        name: "Home",
        component: Chatter
    },
    {
        path: "/ue",
        name: "Unreal Engine",
        component: UnrealEngineClient
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router