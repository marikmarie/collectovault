import { Router, Request, Response, NextFunction } from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = Router();

const BASE_URL = process.env.COLLECTO_BASE_URL;
const API_KEY = process.env.COLLECTO_API_KEY;
const PEGASUS_CARD_API_BASE_URL = (process.env.PEGASUS_CARD_API_BASE_URL || "").replace(/\/$/, "");
const PEGASUS_CARD_API_KEY = process.env.PEGASUS_CARD_API_KEY;


const pendingPayments: Map<
  string,
  { payment: any; status: "pending" | "confirmed" | "failed"; createdAt: Date }
> = new Map();

type CardFinalization = {
  state: "processing" | "completed";
  response?: unknown;
};

// Card checkout is provider-hosted. This small in-process guard prevents a user
// from sending the same successful collection to Collecto twice while a server
// instance is running; the provider collection ID is also sent downstream so
// the merchant system can retain the provider payment reference.
const completedCardPayments = new Map<string, CardFinalization>();

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

function cardPaymentsConfig() {
  if (!PEGASUS_CARD_API_BASE_URL || !PEGASUS_CARD_API_KEY) {
    throw new Error("Pegasus card payments are not configured");
  }
  return {
    baseUrl: PEGASUS_CARD_API_BASE_URL,
    headers: { "x-api-key": PEGASUS_CARD_API_KEY },
  };
}

function cardCollectionId(value: unknown): string | null {
  const id = typeof value === "string" ? value.trim() : "";
  return /^[A-Za-z0-9_-]{1,60}$/.test(id) ? id : null;
}

function amount(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function cardDescription(value: unknown, fallback: string): string {
  const input = typeof value === "string" ? value.trim() : "";
  // PegPay's signed fields are ASCII-only. Replace unsupported characters with
  // spaces rather than allowing a client-side label to break checkout creation.
  const safe = (input || fallback).replace(/[^\x20-\x7E]/g, " ").replace(/\s+/g, " ").trim();
  return safe.slice(0, 200) || fallback;
}

function providerStatus(value: unknown): string {
  return String(value || "PENDING").trim().toUpperCase();
}

function isProviderSuccess(value: unknown): boolean {
  return providerStatus(value) === "SUCCESS";
}

function requireVaultSession(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization;
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) {
    return res.status(401).json({ message: "A valid Vault session is required" });
  }
  next();
}

// A Vault session is required for every hosted card operation. The PegPay API
// key remains strictly server-side and cannot be used by a browser or app.
// The session is forwarded to Collecto when the confirmed payment is applied,
// which keeps this gateway compatible with Vault's OTP-token session format.
router.use("/pegasus/card-collections", requireVaultSession);

/** Create a hosted PegPay card session without exposing its service credentials to Vault clients. */
router.post("/pegasus/card-collections", async (req: Request, res: Response) => {
  try {
    const input = req.body || {};
    const paymentAmount = amount(input.amount);
    if (!paymentAmount) return res.status(400).json({ message: "Enter a valid card payment amount" });
    if (!input.collectoId || !input.clientId) {
      return res.status(400).json({ message: "Missing collectoId or clientId" });
    }

    const cardApi = cardPaymentsConfig();
    const response = await axios.post(
      `${cardApi.baseUrl}/api/v1/pegasus/card-collections`,
      {
        amount: String(paymentAmount),
        currency: "UGX",
        description: cardDescription(input.description, "Collecto Vault payment"),
        ...(typeof input.customerName === "string" && input.customerName.trim()
          ? { customer_name: cardDescription(input.customerName, "Collecto Vault customer").slice(0, 120) }
          : {}),
        ...(typeof input.customerEmail === "string" && input.customerEmail.trim()
          ? { customer_email: input.customerEmail.trim() }
          : {}),
      },
      { headers: cardApi.headers, timeout: 30000 },
    );

    const collection = response.data?.data;
    if (!collection?.id || !collection?.checkout_url) {
      return res.status(502).json({ message: "Card checkout service returned an invalid response" });
    }
    return res.status(201).json({ data: collection });
  } catch (err: any) {
    const status = err?.response?.status;
    const message = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to start card checkout";
    console.error("Pegasus card checkout creation failed:", message);
    return res.status(status && status < 500 ? status : 503).json({ message });
  }
});

/** Get the locally-verified card payment state, with an optional fresh PegPay status query. */
router.get("/pegasus/card-collections/:id", async (req: Request, res: Response) => {
  const id = cardCollectionId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid card collection reference" });

  try {
    const cardApi = cardPaymentsConfig();
    const refresh = String(req.query.refresh || "false") === "true";
    const response = await axios.get(
      `${cardApi.baseUrl}/api/v1/pegasus/card-collections/${encodeURIComponent(id)}`,
      { headers: cardApi.headers, params: refresh ? { refresh: true } : undefined, timeout: 30000 },
    );
    return res.json({ data: response.data?.data });
  } catch (err: any) {
    const status = err?.response?.status;
    const message = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to check card payment";
    console.error("Pegasus card status check failed:", message);
    return res.status(status && status < 500 ? status : 503).json({ message });
  }
});

/**
 * Record a confirmed hosted-card payment in Collecto. The caller supplies the
 * original Vault payment payload only after this route has independently
 * rechecked that PegPay marked the card collection successful.
 */
router.post("/pegasus/card-collections/:id/complete", async (req: Request, res: Response) => {
  const id = cardCollectionId(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid card collection reference" });

  const existing = completedCardPayments.get(id);
  if (existing?.state === "completed") return res.json(existing.response);
  if (existing?.state === "processing") {
    return res.status(202).json({ status: "processing", message: "Your confirmed card payment is being applied." });
  }

  try {
    const input = { ...(req.body || {}) };
    if (!input.collectoId || !input.clientId || !input.reference) {
      return res.status(400).json({ message: "Missing payment reference, collectoId, or clientId" });
    }

    const cardApi = cardPaymentsConfig();
    const cardResponse = await axios.get(
      `${cardApi.baseUrl}/api/v1/pegasus/card-collections/${encodeURIComponent(id)}`,
      { headers: cardApi.headers, params: { refresh: true }, timeout: 30000 },
    );
    const collection = cardResponse.data?.data;
    if (!isProviderSuccess(collection?.status)) {
      return res.status(409).json({
        status: String(collection?.status || "PENDING").toLowerCase(),
        message: collection?.reason || "Card payment is not confirmed yet.",
        data: collection,
      });
    }

    const chargedAmount = amount(collection?.amount);
    if (!chargedAmount) return res.status(502).json({ message: "Confirmed card payment has no valid amount" });
    const expectedCardAmount = amount(input.cardAmount ?? input.amount);
    if (!expectedCardAmount || expectedCardAmount !== chargedAmount) {
      return res.status(409).json({ message: "The confirmed card amount does not match this payment." });
    }

    completedCardPayments.set(id, { state: "processing" });
    const userToken = req.headers.authorization;
    const collectoResponse = await axios.post(
      `${BASE_URL}/requestToPay`,
      {
        ...input,
        cardAmount: undefined,
        paymentOption: "card",
        cardCollectionId: id,
        cardTransactionId: collection?.provider_transaction_id || undefined,
      },
      { headers: collectoHeaders(userToken), timeout: 30000 },
    );

    const collectoData = collectoResponse.data || {};
    const innerData = collectoData?.data || {};
    const response = {
      status: "confirmed",
      status_message: collectoData.status_message || "Card payment confirmed",
      data: {
        requestToPay: false,
        transactionId: innerData.transactionId || innerData.transaction_id || innerData.id || id,
        cardCollectionId: id,
        message: innerData.message || "Your card payment has been confirmed.",
      },
    };
    completedCardPayments.set(id, { state: "completed", response });
    return res.json(response);
  } catch (err: any) {
    completedCardPayments.delete(id);
    const status = err?.response?.status;
    const message = err?.response?.data?.error || err?.response?.data?.message || err?.message || "Unable to apply the confirmed card payment";
    console.error("Pegasus card payment completion failed:", message);
    return res.status(status && status < 500 ? status : 503).json({ message });
  }
});

router.post("/requestToPay", async (req: Request, res: Response) => {
  try {
    const userToken = req.headers.authorization;
    const payload = { ...req.body }; 

    if (!payload.paymentOption)
      return res.status(400).send("Missing payment method");

    if (!payload.collectoId || !payload.clientId)
      return res.status(400).send("Missing collectoId or clientId");

    // Normalize phone to 256 format (only if provided)
    if (payload.phone) {
      payload.phone = payload.phone.replace(/^0/, "256");
    }

    try {
      
      const response = await axios.post(
        `${BASE_URL}/requestToPay`,
        req.body,
        { headers: collectoHeaders(userToken) }
      );

      const collectoData = response.data;
      const innerData = collectoData?.data || {};

      const transactionId = innerData.transactionId || innerData.id || null;


      return res.json({
        status: collectoData.status || "200",
        status_message: collectoData.status_message || "success",
        data: {
          requestToPay: true,
          message:
            innerData.message ||
            "Confirm payment via the prompt on your phone.",
          transactionId,
        },
      });
    } catch (err: any) {
      console.error("Collecto Request failed:", err.message);
      return res.status(500).json({
        message: "Request to pay failed",
        error: err.message,
      });
    }
  } catch (err: any) {
    console.error("Critical BuyPoints Error:", err.message);
    return res.status(500).json({
      message: "Buy points failed",
      error: err.message,
    });
  }
});

// Query payment/invoice status via POST
router.post("/requestToPayStatus", async (req: Request, res: Response) => {
  try {
    const userToken = req.headers.authorization;
    const { transactionId } = req.body;
 
    if (!transactionId)
      return res.status(400).send("Missing transactionId in body");

 
    try {
 
      const response = await axios.post(
        `${BASE_URL}/requestToPayStatus`,
        req.body,
        {
          headers: collectoHeaders(userToken),
        },
      );

     const data = response.data;
      let payment: any = data.data;

      // Extract status from payment
      const statusFromCollecto = (
        payment.status ||
        payment.paymentStatus ||
        payment.invoiceStatus ||
        (payment.invoice && payment.invoice.status) ||
        ""
      )
        .toString()
        .toLowerCase();

      const isConfirmed = ["success", "paid", "confirmed"].some((s) =>
        statusFromCollecto.includes(s),
      );

      // Regular transactions (no local record)
      return res.json({
        transactionId,
        status: isConfirmed ? "confirmed" : "pending",
        payment
      });

    } catch (err: any) {
      console.warn(
        "Failed to query Collecto for payment status:",
        err?.response?.data || err.message,
      );

      // Fallback to local store using transactionId as the key
      const local = pendingPayments.get(transactionId);
      if (local) {
        return res.json({
          transactionId,
          status: local.status,
          payment: local.payment,
          message: "Local record used - Collecto unreachable",
        });
      }

      return res.status(503).json({
        transactionId,
        status: "unknown",
        message: "Collecto unreachable and no local record",
      });
    }
  } catch (err: any) {
    console.error(err?.response?.data || err.message);
    return res.status(err?.response?.status || 500).json({
      message: "Failed to get invoice status",
      error: err?.response?.data || err.message,
    });
  }
});



router.post("/verifyPhoneNumber", async (req: Request, res: Response) => {
  try {
    const userToken = req.headers.authorization;
    const { vaultOTPToken, collectoId, clientId, phoneNumber } = req.body;
    console.log("Phone verification request for number:", req.body);

    if (!phoneNumber) return res.status(400).send("Missing phoneNumber");

    try {
      const response = await axios.post(
        `${BASE_URL}/verifyPhoneNumber`,
        { vaultOTPToken, collectoId, clientId, phone: phoneNumber },
        { headers: collectoHeaders(userToken) },
      );
   return res.json(response.data);
    } catch (err: any) {
      console.warn(
        "Collecto phone verification failed, returning local dummy:",
        err?.response?.data || err.message,
      );
      const trxnId = `VER-${Date.now()}`;
      return res.json({
        success: true,
        phoneNumber: phoneNumber,
        verified: true,
        trxnId,
        message: "Local verification (Collecto unreachable)",
      });
    }
  } catch (err: any) {
    console.error(err?.response?.data || err.message);
    return res.status(err?.response?.status || 500).json({
      message: "Phone verification failed",
      error: err?.response?.data || err.message,
    });
  }
});


router.post("/services", async (req: Request, res: Response) => {
  try {
    const { vaultOTPToken, collectoId, page } = req.body;
    const token = req.headers.authorization as string | undefined;
    const pageNumber = typeof page === "number" ? page : parseInt(page) || 1;
    
    console.log(req.body);
    
    if (!collectoId && !vaultOTPToken) {
      return res
        .status(400)
        .json({ message: "collectoId is required in the request body" });
    }

    const response = await axios.post(
      `${BASE_URL}/servicesAndProducts`,
      { vaultOTPToken, collectoId, page: pageNumber },
      {
        headers: collectoHeaders(token),
      },
    );
    return res.json(response.data);
  } catch (err: any) {
    console.error("Fetch Error:", err?.response?.data || err.message);
    return res.status(err?.response?.status || 500).json({
      message: "Failed to fetch services",
      error: err?.response?.data || err.message,
    });
  }
});

router.post("/invoiceDetails", async (req: Request, res: Response) => {
  try {
    // const token = req.headers.authorization;
    const token = req.headers.authorization as string | undefined;
   
    const response = await axios.post(`${BASE_URL}/invoiceDetails`, req.body, {
      headers: collectoHeaders(token),
    });
   
    return res.json(response.data);
  } catch (error: any) {
    console.error(
      "Failed to fetch invoice details",
      error?.response?.data || error.message,
    );
    return res.status(error?.response?.status || 500).json({
      message: "Failed to fetch invoices",
      error: error?.response?.data || error.message,
    });
  }
});

router.post("/invoice", async (req: Request, res: Response) => {
  try {
    const userToken = req.headers.authorization;
    const { items, vaultOTPToken, totalAmount, staffId } = req.body;

    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).send("Invalid or missing items");

    const collectoId = items[0].collectoId || req.body.collectoId;
    const clientId = items[0].clientId || req.body.clientId;

    if (!collectoId || !clientId) {
      return res.status(400).send("collectoId and clientId are required");
    }

    // 2. Normalize items to a standard shape
    const forwardItems = items.map((it: any) => {
      const quantity = Number(it.quantity ?? it.Quantity ?? it.qty ?? 0);
      const total = Number(it.totalAmount ?? it.total ?? it.amount ?? 0);

      const unitAmount =
        it.amount && !it.totalAmount
          ? Number(it.amount)
          : quantity > 0
            ? total / quantity
            : total;

      return {
        serviceId: it.serviceId,
        serviceName: it.serviceName,
        amount: unitAmount,
        quantity: quantity,
      };
    });

    // 3. Determine final total
    const computedTotal = forwardItems.reduce(
      (acc, it) => acc + it.amount * it.quantity,
      0,
    );
    const finalAmount =
      totalAmount !== undefined ? Number(totalAmount) : computedTotal;

    const payload = {
      ...(vaultOTPToken && { vaultOTPToken }),
      items: forwardItems,
      amount: finalAmount,
      collectoId: String(collectoId),
      clientId: String(clientId),
      ...(staffId && { staffId })
    };

    const response = await axios.post(`${BASE_URL}/createInvoice`, payload, {
      headers: collectoHeaders(userToken),
    });

    return res.json(response.data);
  } catch (err: any) {
    const status = err?.response?.status || 500;
    const data = err?.response?.data || err.message;
    console.error("Invoice Error:", data);
    return res
      .status(status)
      .json({ message: "Invoice creation failed", error: data });
  }
});


router.post("/loyaltySettings", async (req: Request, res: Response) => {
  try {
    const userToken = req.headers.authorization;
    const { collectoId, clientId } = req.body; 
    if (!collectoId || !clientId) {
      return res.status(400).send("collectoId and clientId are required");
    }
    try {
      const response = await axios.post(
        `${BASE_URL}/loyaltySettings`,
        { collectoId, clientId },
        { headers: collectoHeaders(userToken) },
      );
        return res.json(response.data);
    } catch (err: any) {
      console.warn(
        "Collecto loyalty settings fetch failed, returning local dummy:",
        err?.response?.data || err.message,
      );
      return res.json({
        success: true,  
        collectoId,
        clientId,
        pointsToCurrencyRate: 100,  
        message: "Local loyalty settings (Collecto unreachable)",
      });
    } 
  } catch (err: any) {
    console.error("Loyalty Settings Error:", err?.response?.data || err.message);
    return res.status(err?.response?.status || 500).json({
      message: "Failed to fetch loyalty settings",
      error: err?.response?.data || err.message,
    });
  }
});

export default router;
