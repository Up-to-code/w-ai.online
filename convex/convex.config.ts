import { defineApp } from "convex/server"
import actionRetrier from "@convex-dev/action-retrier/convex.config.js"
import crons from "@convex-dev/crons/convex.config.js"
import pushNotifications from "@convex-dev/expo-push-notifications/convex.config.js"
import workOSAuthKit from "@convex-dev/workos-authkit/convex.config"

const app = defineApp()
app.use(actionRetrier)
app.use(crons)
app.use(pushNotifications)
app.use(workOSAuthKit)

export default app
