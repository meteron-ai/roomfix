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
      "X-Model": "replicate",
      "X-Async": "false",
      "X-User": session.user.email,
      Authorization: "Bearer " + process.env.METERON_API_KEY,
    },
    body: JSON.stringify({
      version:
        "854e8727697a057c525cdb45ab037f64ecca770a1769cc52287c2e56472a247b",
      input: {
        image: imageUrl,
        prompt: prompt,
        scale: 9,
        a_prompt:
          "best quality, photo from Pinterest, interior, cinematic photo, ultra-detailed, ultra-realistic, award-winning, interior design",
        n_prompt:
          "longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality",
      },
    }),
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
