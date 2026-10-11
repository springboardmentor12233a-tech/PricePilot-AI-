import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function Layout({ title, subtitle, children }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = window.localStorage.getItem("pricepilot_token");
    if (!token) {
      router.replace("/login");
    } else {
      setReady(true);
    }
  }, [router]);

  if (!ready) return null;

  return (
    <div className="min-h-screen flex bg-canvas">
      <Sidebar />
      <div className="flex-1 min-w-0">
        <TopBar title={title} subtitle={subtitle} />
        <main className="p-8 max-w-[1400px]">{children}</main>
      </div>
    </div>
  );
}
