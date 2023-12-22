import Head from "next/head";
import Header from "../components/Header";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Footer from "../components/Footer";
import { RoomGeneration } from "../components/RoomGenerator";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]";

export default function Dashboard({ rooms }: { rooms: [] }) {
  const { data: session } = useSession();

  return (
    <div className="flex max-w-6xl mx-auto flex-col items-center justify-center py-2 min-h-screen">
      <Head>
        <title>RoomFix Dashboard</title>
      </Head>
      <Header photo={session?.user?.image || undefined} />
      <main className="flex flex-1 w-full flex-col items-center justify-center text-center px-4 mt-12 sm:mb-0 mb-8">
        <h1 className="mx-auto max-w-4xl font-display text-4xl font-bold tracking-normal text-slate-100 sm:text-6xl mb-5">
          View your <span className="text-blue-600">room</span> generations
        </h1>
        {rooms.length === 0 ? (
          <p className="text-gray-300">
            You have no room generations. Generate one{" "}
            <Link
              href="/dream"
              className="text-blue-600 underline underline-offset-2"
            >
              here
            </Link>
          </p>
        ) : (
          <p className="text-gray-300">
            Browse through your previous room generations below. Any feedback?
            Email hey@meteron.ai
          </p>
        )}
        {rooms.map((room) => (         
          <RoomGeneration
            originalBase64={room.requestBody}
            generated={room.outputImages[1].url}
          />
        ))}
      </main>
      <Footer />
    </div>
  );
}

export async function getServerSideProps(ctx: any) {
  const session = await getServerSession(ctx.req, ctx.res, authOptions);
  if (!session || !session.user) {
    return { props: { rooms: [] } };
  }

  let roomsResponse = await fetch("https://app.meteron.ai/api/images/generations?" + new URLSearchParams({
        user: session.user.email,
        model: process.env.METERON_MODEL_ID,
        status: "completed",
    }), {
    method: "GET",   
    headers: {
      "Content-Type": "application/json",     
      Authorization: "Bearer " + process.env.METERON_API_KEY,
    },
  });

  let jsonRoomsResponse = await roomsResponse.json();

  let rooms = jsonRoomsResponse.results;

  return {
    props: {
      rooms,
    },
  };
}
