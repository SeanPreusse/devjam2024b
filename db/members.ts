import { supabase } from "@/lib/supabase/browser-client"

export const getTeamMembersQuery = async (workspaceId: string) => {
  const { data } = await supabase
    .from("users_on_team")
    .select(
      `
      id,
      role,
      workspace_id,
      profile:profiles(display_name, email, image_url)
    `
    )
    .eq("workspace_id", workspaceId)
    .order("created_at")
    .throwOnError();

  return {
    data,
  };
}


export const getTeamInvitesQuery = async (workspaceId: string) => {
  const { data } = await supabase
  .from("user_invites")
  .select("id, email, code, role, profile:invited_by(*), workspace:workspace_id(*)")
  .eq("workspace_id", workspaceId)
  .throwOnError();
}

















export async function deleteTeam(supabase: Client, teamId: string) {
  return supabase.from("teams").delete().eq("id", teamId);
}

type DeleteTeamMemberParams = {
  userId: string;
  teamId: string;
};

export async function deleteTeamMember(
  supabase: Client,
  params: DeleteTeamMemberParams
) {
  return supabase
    .from("users_on_team")
    .delete()
    .eq("user_id", params.userId)
    .eq("team_id", params.teamId)
    .select()
    .single();
}





export async function updateUserTeamRole(
  supabase: Client,
  params: UpdateUserTeamRoleParams
) {
  const { role, userId, teamId } = params;

  return supabase
    .from("users_on_team")
    .update({
      role,
    })
    .eq("user_id", userId)
    .eq("team_id", teamId)
    .select()
    .single();
}



export async function joinTeamByInviteCode(supabase: Client, code: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user.email) {
    return;
  }

  const { data: inviteData } = await getUserInviteQuery(supabase, {
    code,
    email: session.user.email,
  });

  if (inviteData) {
    // Add user team
    await supabase.from("users_on_team").insert({
      user_id: session.user.id,
      team_id: inviteData?.team_id,
      role: inviteData.role,
    });

    // Set current team
    const { data } = await supabase
      .from("users")
      .update({
        team_id: inviteData?.team_id,
      })
      .eq("id", session.user.id)
      .select()
      .single();

    // remove invite
    await supabase.from("user_invites").delete().eq("code", code);

    return data;
  }

  return null;
}



export async function leaveTeam(supabase: Client, params: LeaveTeamParams) {
  await supabase
    .from("users")
    .update({
      team_id: null,
    })
    .eq("id", params.userId)
    .eq("team_id", params.teamId);

  return supabase
    .from("users_on_team")
    .delete()
    .eq("team_id", params.teamId)
    .eq("user_id", params.userId)
    .select()
    .single();
}