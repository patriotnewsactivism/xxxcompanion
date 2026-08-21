import { redirect } from "next/navigation";
import { isAgeVerified } from "@/lib/session";
import AgeGate from "@/components/AgeGate";

export default async function Home() {
  if (await isAgeVerified()) {
    redirect("/chat");
  }
  return <AgeGate />;
}