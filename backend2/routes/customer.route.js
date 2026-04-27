const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware");
const customerController = require("../controllers/customer.controller");

router.get("/summary", authMiddleware, customerController.getCustomerSummary);
router.get("/:key", authMiddleware, customerController.getCustomerDetails);
router.put("/:key", authMiddleware, customerController.upsertCustomer);
router.delete("/:key", authMiddleware, customerController.deleteCustomer);

module.exports = router;

