const Customer = require("../models/Customer");
const OCRModel = require("../models/OCRDocument");

function getDocData(record) {
  if (record?.rawJson?.data) return record.rawJson.data;
  if (record?.data) return record.data;

  if (typeof record?.extractedText === "string") {
    try {
      const parsed = JSON.parse(record.extractedText);
      return parsed?.data || {};
    } catch {
      return {};
    }
  }

  return {};
}

function formatDateOnly(value) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toISOString().split("T")[0];
}

function parseAmount(val) {
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const parsed = parseFloat(val.replace(/,/g, "").replace(/[^\d.-]/g, ""));
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function extractAmount(data) {
  if (!data) return 0;
  if (data.total_amount) return parseAmount(data.total_amount);
  if (data.total) return parseAmount(data.total);
  if (data.amount_due) return parseAmount(data.amount_due);
  if (data.after_jan_20_2025) return parseAmount(data.after_jan_20_2025);
  if (data.between_nov_30_2024_and_jan_20_2025) return parseAmount(data.between_nov_30_2024_and_jan_20_2025);
  if (data.before_nov_30_2024) return parseAmount(data.before_nov_30_2024);
  if (data.before_sep_25_2022) return parseAmount(data.before_sep_25_2022);

  for (const [key, value] of Object.entries(data)) {
    const k = key.toLowerCase();
    if ((k.includes("amount") || k.includes("total")) && (typeof value === "string" || typeof value === "number")) {
      return parseAmount(value);
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

    // If key looks like an actual customer id (consumer number / account number), delete OCR docs for it.
    // This makes "Delete customer" actually remove them from the grid.
    await OCRModel.deleteMany({ createdBy: req.user.id, "rawJson.data.consumer_number": key });

    return res.status(200).json({ success: true, message: "Customer deleted" });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return res.status(500).json({ success: false, message: "Failed to delete customer", error: error.message });
  }
};

