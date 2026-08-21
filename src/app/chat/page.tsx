import { redirect } from "next/navigation";
import { isAgeVerified } from "@/lib/session";
import ChatApp from "@/components/ChatApp";

export default async function ChatPage() {
  if (!(await isAgeVerified())) {
    redirect("/");
  }
  return <ChatApp />;
}