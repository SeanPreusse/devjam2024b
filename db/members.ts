import { supabase } from "@/lib/supabase/browser-client"
import { TablesInsert, TablesUpdate } from "@/supabase/types"


export const getTeamMembersQuery = async (teamId: string) => {
    const { data, error } = await supabase
      .from("users_on_team")
      .select(
        `
        id,
        role,
        team_id,
        user:users(id, full_name, avatar_url, email)
      `
      )
      .eq("team_id", teamId)
      .order("created_at")
      .throwOnError();
  
    if (error) {
      throw new Error(error.message);
    }
  
    return {
      data,
    };
  };
  
  type GetTeamUserParams = {
    teamId: string;
    userId: string;
  };
  
  export const getTeamUserQuery = async (params: GetTeamUserParams) => {
    const { data } = await supabase
      .from("users_on_team")
      .select(
        `
        id,
        role,
        team_id,
        user:users(id, full_name, avatar_url, email)
      `
      )
      .eq("team_id", params.teamId)
      .eq("user_id", params.userId)
      .throwOnError()
      .single();
  
    return {
      data,
    };
  };
  
  export const getTeamInvitesQuery = async (teamId: string) => {
    return supabase
      .from("user_invites")
      .select("id, email, code, role, user:invited_by(*), team:team_id(*)")
      .eq("team_id", teamId)
      .throwOnError();
  };
  
  export const getUserInvitesQuery = async (email: string) => {
    return supabase
      .from("user_invites")
      .select("id, email, code, role, user:invited_by(*), team:team_id(*)")
      .eq("email", email)
      .throwOnError();
  };
  
  export const getUserInviteQuery = async (supabase: Client, params: GetUserInviteQueryParams) => {
    return supabase
      .from("user_invites")
      .select("*")
      .eq("code", params.code)
      .eq("email", params.email)
      .single();
  };