import type { NextApiRequest, NextApiResponse } from "next";
import getRawBody from "raw-body";

// Use regular env variable for server-side, fallback to NEXT_PUBLIC for backward compatibility
const base = "https://cdn-ecast.tcioe.edu.np";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Submitting to backend:", base);

    // Get raw body from request
    const rawBody = await getRawBody(req);
    console.log("Raw body length:", rawBody.length);

    // Forward the request to backend with all headers
    const response = await fetch(`${base}/api/ambassador-intake/form/`, {
      method: "POST",
      headers: {
        "content-type": req.headers["content-type"] || "",
      },
      body: new Uint8Array(rawBody),
    });

    console.log("Response status:", response.status);
    const responseData = await response.json().catch(() => ({}));
    console.log("Response data:", responseData);

    if (!response.ok) {
      let errorMessage = "Failed to submit form";
      if (responseData.error) {
        if (responseData.error.includes("email must make a unique set")) {
          errorMessage =
            "The email is already used. Please use a unique email.";
        } else if (responseData.error.includes("Enter a valid email address")) {
          errorMessage = "Please enter a valid email address";
        } else {
          errorMessage = responseData.error;
        }
      }
      return res.status(response.status).json({ error: errorMessage });
    }

    return res.status(201).json({ success: true, data: responseData });
  } catch (error) {
    console.error("Error submitting ambassador intake form:", error);
    // Log the full error details
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return res.status(500).json({
      error: "An unexpected error occurred. Please try again.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
