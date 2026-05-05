const Customer = require("../models/Customer");
const OCRModel = require("../models/OCRDocument");

function getDocData(record) {
  // 1. Check extractedText FIRST!
  if (typeof record?.extractedText === "string") {
    try {
      const parsed = JSON.parse(record.extractedText);
      // Catch standard formatting
      if (parsed?.data && Object.keys(parsed.data).length > 0) {
        return parsed.data;
      } 
      // Catch flat JSON objects if the AI forgets the "data" wrapper
      else if (parsed && Object.keys(parsed).length > 0) {
        return parsed;
      }
    } catch {
      // Fallback if parsing fails
    }
  }

  // 2. Fall back to rawJson
  if (record?.rawJson?.data) return record.rawJson.data;
  if (record?.data) return record.data;

  return {};
}

function formatDateOnly(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().split("T")[0];
}

// 🚀 UPGRADED: Safely extracts numbers. Solves the bug where 
// "Rs. 2388" or "₹ 2,388" breaks the math!
function parseAmount(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    // Strip commas, then match the first pure number block it finds
    const match = val.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : 0;
  }
  return 0;
}

// 🚀 UPGRADED: Keeps searching until it finds an ACTUAL number > 0
function extractAmount(data) {
  if (!data || typeof data !== "object") return 0;
  
  // 1. Try standard exact matches first
  const candidates = [
    data.total_amount, data.total, data.amount_due, 
    data.amount, data.grand_total, data.balance_due
  ];
  
  for (const val of candidates) {
    const num = parseAmount(val);
    if (num > 0) return num;
  }

  // 2. Smart search for dynamic utility bill keys
  for (const [key, val] of Object.entries(data)) {
    const k = key.toLowerCase();
    if (k.startsWith('after_') || k.startsWith('before_') || k.startsWith('between_')) {
      const num = parseAmount(val);
      if (num > 0) return num; // Only stop if it actually found a number!
    }
  }

  // 3. Fallback to searching for money words
  for (const [key, val] of Object.entries(data)) {
     const k = key.toLowerCase();
     const hasMoneyWord = k.includes("amount") || k.includes("total") || k.includes("due") || k.includes("balance");
     const isNotDate = !k.includes("date") && !k.includes("time") && !k.includes("day");
     
     if (hasMoneyWord && isNotDate) {
        const num = parseAmount(val);
        if (num > 0) return num; // Only stop if it actually found a number!
     }
  }

  return 0;
}

function buildCustomerKey(data) {
  return (
    data?.consumer_number ||
    data?.customer_id ||
    data?.account_number ||
    data?.account_holder ||
    data?.customer_name ||
    data?.vendor_name ||
    data?.name ||
    "Unknown Customer"
  );
}

module.exports.getCustomerSummary = async (req, res) => {
  try {
    const [ocrDocs, overrides] = await Promise.all([
      OCRModel.find({ createdBy: req.user.id }).lean(),
      Customer.find({ createdBy: req.user.id }).lean(),
    ]);

    const overrideMap = new Map(overrides.map((c) => [c.key, c]));
    const customerMap = new Map();

    for (const record of ocrDocs) {
      const data = getDocData(record);
      const key = buildCustomerKey(data);

      const recordDate = data.bill_date || data.date || record.createdAt || record.uploadedAt || record.updatedAt;
      const recordDateMs = new Date(recordDate).getTime();

      if (!customerMap.has(key)) {
        const baseName =
          data.account_holder || data.customer_name || data.vendor_name || data.name || "Unknown Customer";
        const idDisplay =
          data.consumer_number || data.customer_id || data.account_number || (record._id ? String(record._id).slice(0, 8).toUpperCase() : "N/A");

        const ov = overrideMap.get(key);

        customerMap.set(key, {
          key,
          rowKey: key,
          id: idDisplay,
          name: ov?.name || baseName,
          email: ov?.email || data.email || null,
          phone: ov?.phone || data.phone || data.contact_number || null,
          address: ov?.address || data.address || null,
          totalInvoices: 0,
          totalAmountNum: 0,
          lastInvoice: formatDateOnly(recordDate),
          lastInvoiceTs: Number.isNaN(recordDateMs) ? 0 : recordDateMs,
          status: "active",
        });
      }

      const customer = customerMap.get(key);
      customer.totalInvoices += 1;
      
      // Calculate the total safely
      customer.totalAmountNum += extractAmount(data);

      if (!Number.isNaN(recordDateMs) && recordDateMs > customer.lastInvoiceTs) {
        customer.lastInvoiceTs = recordDateMs;
        customer.lastInvoice = formatDateOnly(recordDate);
      }
    }

    // Also include "manual" customers that don't yet have OCR docs
    for (const ov of overrides) {
      if (customerMap.has(ov.key)) continue;
      customerMap.set(ov.key, {
        key: ov.key,
        rowKey: ov.key,
        id: ov.key,
        name: ov.name || ov.key,
        email: ov.email || null,
        phone: ov.phone || null,
        address: ov.address || null,
        totalInvoices: 0,
        totalAmountNum: 0,
        lastInvoice: "N/A",
        lastInvoiceTs: 0,
        status: "active",
      });
    }

    const customers = Array.from(customerMap.values())
      .map((c) => ({
        ...c,
        totalAmount: `₹${Number(c.totalAmountNum || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      }))
      .sort((a, b) => (b.totalInvoices || 0) - (a.totalInvoices || 0));

    return res.status(200).json({ success: true, data: customers });
  } catch (error) {
    console.error("Error building customer summary:", error);
    return res.status(500).json({ success: false, message: "Failed to get customers", error: error.message });
  }
};

module.exports.getCustomerDetails = async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const override = await Customer.findOne({ createdBy: req.user.id, key }).lean();
    const docs = await OCRModel.find({ createdBy: req.user.id, "rawJson.data.consumer_number": key })
      .sort({ uploadedAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        key,
        customer: override || null,
        invoices: docs,
      },
    });
  } catch (error) {
    console.error("Error getting customer details:", error);
    return res.status(500).json({ success: false, message: "Failed to get customer details", error: error.message });
  }
};

module.exports.upsertCustomer = async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);
    const { name = null, email = null, phone = null, address = null } = req.body || {};

    const updated = await Customer.findOneAndUpdate(
      { createdBy: req.user.id, key },
      { $set: { name, email, phone, address } },
      { new: true, upsert: true }
    );

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating customer:", error);
    return res.status(500).json({ success: false, message: "Failed to update customer", error: error.message });
  }
};

module.exports.deleteCustomer = async (req, res) => {
  try {
    const key = decodeURIComponent(req.params.key);

    await Customer.deleteOne({ createdBy: req.user.id, key });

    // If key looks like an actual customer id, delete OCR docs for it.
    await OCRModel.deleteMany({ createdBy: req.user.id, "rawJson.data.consumer_number": key });

    return res.status(200).json({ success: true, message: "Customer deleted" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return res.status(500).json({ success: false, message: "Failed to delete customer", error: error.message });
  }
};