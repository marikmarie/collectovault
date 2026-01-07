import { Router } from "express";
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

const router = Router();

const BASE_URL = process.env.COLLECTO_BASE_URL;
const API_KEY = process.env.COLLECTO_API_KEY;

if (!BASE_URL || !API_KEY) {
  throw new Error("Collecto env variables missing");
}

function collectoHeaders(userToken?: string) {
  const headers: Record<string, string> = {
    "x-api-key": API_KEY!,
  };
  if (userToken) {
    headers["authorization"] = userToken;
  }
  return headers;
} 

router.post("/services", async (req, res) => {
  try {
    // In a POST request, data usually comes from req.body
    const { collectoId, page } = req.body;
    const token = req.headers.authorization as string | undefined;
    const pageNumber = typeof page === "number" ? page : parseInt(page) || 1;
    console.log("Collecto ID:", collectoId);

    if (!collectoId) {
      return res
        .status(400)
        .json({ message: "collectoId is required in the request body" });
    }

    const response = await axios.post(
      `${BASE_URL}/servicesAndProducts`,
      { collectoId, page: pageNumber },
      {
        headers: collectoHeaders(token),
      }
    );
    console.log("Services Response:", JSON.stringify(response.data, null, 2));
    return res.json(response.data);
  } catch (err: any) {
    console.error("Fetch Error:", err?.response?.data || err.message);
    return res.status(err?.response?.status || 500).json({
      message: "Failed to fetch services",
      error: err?.response?.data || err.message,
    });
  }
});

router.get("/invoices", async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).send("Missing user token");

    const response = await axios.get(`${BASE_URL}/invoices`, {
      headers: collectoHeaders(token),
    });
    console.log(response);
    return res.json(response.data);
  } catch (error: any) {}
});
/**
 * POST /api/invoice
 * Unified invoice endpoint for Pay Now and Pay Later
 * body: {
 *   items: [{ serviceId, serviceName, amount, quantity }],
 *   amount: number,
 *   phone?: string,
 *   payNow?: number | boolean (1 / 0)
 * }
 */

router.post("/invoice", async (req, res) => {
  try {
    const userToken = req.headers.authorization;
    const { items, amount, phone, payNow, collectoId, clientId } = req.body;

    if (!userToken) return res.status(401).send("Missing user token");
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).send("Missing items in request body");
    if (typeof amount !== "number" && typeof amount !== "string")
      return res.status(400).send("Missing or invalid amount");
    if (!collectoId) return res.status(400).send("collectoId is required");
    if (!clientId) return res.status(400).send("clientId (customer id) is required");

    const payload: any = {
      items,
      amount: Number(amount),
      collectoId,
      clientId,
    };

    if (phone) payload.phone = phone;
    if (payNow !== undefined) payload.payNow = payNow ? 1 : 0;

    // Forward to Collecto createInvoice endpoint (server will handle payNow)
    const response = await axios.post(`${BASE_URL}/createInvoice`, payload, {
      headers: collectoHeaders(userToken),
    });

    return res.json(response.data);
  } catch (err: any) {
    console.error(err?.response?.data || err.message);
    return res.status(err?.response?.status || 500).json({
      message: "Invoice creation failed",
      error: err?.response?.data,
    });
  }
});

/**
 * POST /api/pay
 * DEPRECATED: use POST /api/invoice with { payNow: 1 }
 */
router.post("/pay", async (req, res) => {
  return res.status(400).json({ message: "Endpoint deprecated. Use POST /invoice with payNow: 1" });
});


// Pay an existing invoice
router.post("/invoice/pay", async (req, res) => {
  try {
    const userToken = req.headers.authorization;
    const { invoiceId, method, phone } = req.body; // method: 'points' | 'mm'

    if (!userToken) return res.status(401).send("Missing user token");
    if (!invoiceId || !method) return res.status(400).send("Missing invoiceId or method");

    // Build payload expected by Collecto - include phone for mobile money
    const payload: any = { invoiceId, method };
    if (phone) payload.phone = phone;

    const response = await axios.post(`${BASE_URL}/pay`, payload, {
      headers: collectoHeaders(userToken),
    });

    return res.json(response.data);
  } catch (err: any) {
    console.error(err?.response?.data || err.message);
    return res.status(err?.response?.status || 500).json({
      message: "Invoice payment failed",
      error: err?.response?.data,
    });
  }
});

export default router;
