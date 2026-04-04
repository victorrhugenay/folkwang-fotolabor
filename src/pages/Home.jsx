import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";

export default function Home() {
  const { user, isAdmin, loading } = useCurrentUser();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (isAdmin) {
      navigate("/admin", { replace: true });
    } else {
      navigate("/dashboard", { replace: true });
    }
  }, [loading, isAdmin]);

  return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
    </div>
  );
}