import type { NextApiRequest, NextApiResponse } from "next";

const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // The form data is already parsed by the client, just forward it
    // This is a proxy endpoint that will receive FormData from the client
    const contentType = req.headers["content-type"] || "";

    // Forward the request to the backend
    const response = await fetch(`${base}/api/intake/form/`, {
      method: "POST",
      headers: {
        // Forward content-type header
        ...(contentType ? { "Content-Type": contentType } : {}),
      },
      body: req.body,
    });

    const responseData = await response.json().catch(() => ({}));

    const extractErrorMessage = (data: any): string | null => {
      if (!data) return null;
      if (typeof data === "string") return data;
      if (Array.isArray(data) && data.length) {
        const nested = extractErrorMessage(data[0]);
        return nested || null;
      }
      if (typeof data === "object") {
        if (typeof data.error !== "undefined") {
          const nested = extractErrorMessage(data.error);
          if (nested) return nested;
        }
        for (const value of Object.values(data)) {
          const nested = extractErrorMessage(value);
          if (nested) return nested;
        }
      }
      return null;
    };

    if (!response.ok) {
      let errorMessage = "Failed to submit form";

      if (responseData) {
        const backendMessage = extractErrorMessage(responseData);
        if (
          typeof backendMessage === "string" &&
          backendMessage.includes("email must make a unique set")
        ) {
          errorMessage =
            "The email is already used. Please use a unique email.";
        } else if (
          typeof backendMessage === "string" &&
          backendMessage.includes("Enter a valid email address")
        ) {
          errorMessage = "Please enter a valid email address";
        } else if (backendMessage) {
          errorMessage = backendMessage;
        }
      }

      return res.status(response.status).json({ error: errorMessage });
    }

    return res.status(201).json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error submitting intake form:", error);
    return res.status(500).json({
      error: "An unexpected error occurred. Please try again.",
    });
  }
}
