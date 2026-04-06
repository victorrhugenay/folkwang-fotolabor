import AdminUsers from "./AdminUsers";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { Shield } from "lucide-react";

export default function Admin() {
  const { isAdmin, loading: userLoading } = useCurrentUser();

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>);
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <Shield className="h-10 w-10 opacity-40" />
        <p className="font-medium">Kein Zugriff – nur für Administratoren</p>
      </div>);
  }

  return <AdminUsers />;
}