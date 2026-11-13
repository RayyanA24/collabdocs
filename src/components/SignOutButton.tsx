"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { btn } from "./ui";

export default function SignOutButton() {
  const router = useRouter();
  return (
    <button className={btn} onClick={async () => {
      await createClient().auth.signOut();
      router.replace("/login");
      router.refresh();
    }}>
      Sign out
    </button>
  );
}
