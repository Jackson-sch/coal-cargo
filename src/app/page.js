import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth(); // Si el usuario está autenticado, redirigir al dashboar d
  if (session) {
    redirect("/dashboard");
  }

  // Si no está autenticado, redirigir al logi n
  redirect("/login");
}
