import { runSimulation } from "@/lib/simulation";

export async function POST(req) {
  try {
    const body = await req.json();
    const result = runSimulation(body);
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 400 });
  }
}
