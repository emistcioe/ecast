import type { NextApiRequest, NextApiResponse } from "next";
import { Readable } from "stream";

const base =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://cdn-ecast.tcioe.edu.np";

export const config = {
  api: {
    bodyParser: false,
    sizeLimit: "50mb",
  },
};

async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("=== AMBASSADOR INTAKE SUBMIT ===");
    console.log("Backend URL:", base);
    console.log("Content-Type:", req.headers["content-type"]);

    // Read the entire request body as buffer
    const bodyBuffer = await streamToBuffer(req);
    console.log("Body size:", bodyBuffer.length);

    // Forward to Django backend
    const backendUrl = `${base}/api/ambassador-intake/form/`;
    console.log("Posting to:", backendUrl);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": req.headers["content-type"] || "",
      },
      body: new Uint8Array(bodyBuffer),
    });

    console.log("Backend response status:", response.status);

    let responseData;
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      console.log("Non-JSON response:", text);
      responseData = { message: text };
    }

    console.log("Backend response data:", responseData);

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
