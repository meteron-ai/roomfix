import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export type GenerateResponseData = {
  original: string | null;
  generated: string | null;
  id: string;
};

interface ExtendedNextApiRequest extends NextApiRequest {
  body: {
    imageUrl: string;
    theme: string;
    room: string;
  };
}

export default async function handler(
  req: ExtendedNextApiRequest,
  res: NextApiResponse<GenerateResponseData | string>
) {
  // Check if user is logged in
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    return res.status(500).json("Login to upload.");
  }

  // Rate Limiter Code
  if (ratelimit) {
    const identifier = session.user.email;
    const result = await ratelimit.limit(identifier!);
    res.setHeader("X-RateLimit-Limit", result.limit);
    res.setHeader("X-RateLimit-Remaining", result.remaining);

    // Calcualte the remaining time until generations are reset
    const diff = Math.abs(
      new Date(result.reset).getTime() - new Date().getTime()
    );
    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor(diff / 1000 / 60) - hours * 60;

    if (!result.success) {
      return res
        .status(429)
        .json(
          `Your generations will renew in ${hours} hours and ${minutes} minutes. Email hassan@hey.com if you have any questions.`
        );
    }
  }

  const { imageUrl, theme, room } = req.body;
  const prompt =
    room === "Gaming Room"
      ? "a room for gaming with gaming computers, gaming consoles, and gaming chairs"
      : `a ${theme.toLowerCase()} ${room.toLowerCase()}`;

  // POST request to Replicate to start the image restoration generation process
  let startResponse = await fetch("https://app.meteron.ai/api/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Cluster": "replicate",
      "X-Async": "false",
      "X-User": session.user.email,
      Authorization: "Bearer " + process.env.METERON_API_KEY,
    },
  });

  let jsonStartResponse = await startResponse.json();

  let generatedImage = jsonStartResponse.outputImages[1].url as string;

  res.status(200).json(
    generatedImage
      ? {
          original: 'http://todo',
          generated: generatedImage,
          id: jsonStartResponse.id,
        }
      : "Failed to restore image"
  );
}
