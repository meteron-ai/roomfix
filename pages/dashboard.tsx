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
        <h1 className="mx-auto max-w-4xl font-display text-4xl font-bold tracking-normal text-slate-100 sm:text-4xl mb-5">
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
            Browse through your previous room generations below
          </p>
        )}
        {rooms.map((room) => (
          <RoomGeneration
            room={room}
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

  // Concurrently fetch the rooms[n].outputs[1].url. This is the output of the model. Response
  // contains JSON with "output" key that contains base64 encoded image (data:image/png;base64...).
  // We will decode this in the RoomGeneration component.

  let roomImages = await Promise.all(
    rooms.map((room: any) => {
      return fetch(room.outputs[0].url, {
        method: "GET",        
      });
    })
  );

  // Fetch initial prompts, they contain the input image
  let prompts = await Promise.all(
    rooms.map((room: any) => {
      return fetch(room.requestBodyPath, {
        method: "GET",        
      });
    })
  );

  // Add the base64 encoded image to the room object under the "generated"
  rooms = await Promise.all(
    roomImages.map(async (roomImage) => {
      
      let genResponse = await roomImage.json();
      
      return {
        ...rooms[roomImages.indexOf(roomImage)],
        generated: {
          ...genResponse,
        }
      };
    })
  );

  rooms = await Promise.all(
    prompts.map(async (prompt) => {    
      let req = await prompt.json();
      return {
        ...rooms[prompts.indexOf(prompt)],
        original: {
          ...req,
        }
      };
    })
  );

  return {
    props: {
      rooms,
    },
  };
}
