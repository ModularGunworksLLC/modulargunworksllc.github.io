import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { hasLedgerIntake, env } from "@/lib/env";

type Body = {
  name?: string;
  email?: string;
  phone?: string;
  message?: string;
  serviceCode?: string;
  serviceLabel?: string;
  fflTransferFirearmCount?: number;
};

export async function POST(request: Request) {
  if (!hasLedgerIntake()) {
    return NextResponse.json(
      { error: "Ledger intake not configured (LEDGER_INTAKE_URL + TOKEN)" },
      { status: 503 },
    );
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  const message = String(body.message || "").trim();
  if (!name || !email || !message) {
    return NextResponse.json({ error: "name, email, and message are required" }, { status: 400 });
  }

  const payload = {
    name,
    email,
    phone: String(body.phone || "").trim(),
    serviceCode: body.serviceCode || "gunsmithing_other",
    serviceLabel: body.serviceLabel || "",
    message,
    source: "vercel_storefront",
    sourceUrl: request.headers.get("referer") || env.siteUrl || "",
    fflTransferFirearmCount: Math.max(1, Number(body.fflTransferFirearmCount) || 1),
  };

  const idempotencyKey = createHash("sha256")
    .update(
      JSON.stringify({
        name: name.toLowerCase(),
        email: email.toLowerCase(),
        phone: payload.phone.replace(/\D/g, ""),
        service: payload.serviceCode,
        message: message.toLowerCase(),
      }),
    )
    .digest("hex");

  const res = await fetch(env.ledgerIntake.url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Intake-Token": env.ledgerIntake.token,
      "X-Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(12_000),
  });

  const text = await res.text();
  if (!res.ok) {
    return NextResponse.json(
      { error: `Ledger intake HTTP ${res.status}`, detail: text.slice(0, 500) },
      { status: 502 },
    );
  }

  let data: unknown = { ok: true };
  try {
    data = JSON.parse(text);
  } catch {
    /* empty or non-json ok */
  }

  return NextResponse.json(data);
}
