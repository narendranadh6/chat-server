const authRoutes = require("./auth");
const aiRoutes = require("./ai");
const roomRoutes = require("./rooms");
const router = express.Router();

router.use("/auth", authRoutes);
router.use("/ai", aiRoutes);
router.use("/rooms", roomRoutes);

// More routes like /ai, /rooms, etc. will be added here
module.exports = router;
