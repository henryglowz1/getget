import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useUsernameRequired() {
  const { user } = useAuth();
  const [needsUsername, setNeedsUsername] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState<string | null>(null);

  const checkUsername = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("username")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      
      setUsername(data?.username || null);
      setNeedsUsername(!data?.username);
    } catch (err) {
      console.error("Error checking username:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUsername();
  }, [user]);

  const refetch = () => {
    setIsLoading(true);
    checkUsername();
  };

  return { needsUsername, isLoading, username, refetch };
}
