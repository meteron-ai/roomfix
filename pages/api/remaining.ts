import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check if user is logged in
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user) {
    console.log("User not logged in");
    return res.status(401).json("Login to upload.");
  }

  let remainingResp = await fetch("https://app.meteron.ai/api/remaining/generations?" + new URLSearchParams({
        user: session.user.email,
        cluster: "replicate",
    }), {
    method: "GET",   
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.METERON_API_KEY,
    },
  });

  let remaining = await remainingResp.json();

  return res.status(200).json({ remainingGenerations: remaining.remaining });
}
