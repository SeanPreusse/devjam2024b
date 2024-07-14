"use server";

import InviteEmail from "@/components/emails/invite";
import { createClient } from "@/lib/supabase/server";
import { renderAsync } from "@react-email/components";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { action } from "@/components/utility/action-safe";
import { inviteTeamMembersSchema } from "@/components/utility/action-schems";

const resend = new Resend(process.env.RESEND_API_KEY);
export const inviteTeamMembersAction = action(
    inviteTeamMembersSchema,
    async ({ invites, redirectTo, revalidatePath, currentUser }) => { // Added currentUser as a parameter
      const supabase = createClient();
      
      const location = headers().get("x-vercel-ip-city") ?? "Unknown";
      const ip = headers().get("x-forwarded-for") ?? "127.0.0.1";
  
      const data = invites?.map((invite) => ({
        ...invite,
        workspace_id: currentUser.workspace.workspace_id, // Use currentUser instead of user.data
        invited_by: currentUser.id, // Use currentUser instead of user.data
      }));
  
      // Filter logic remains the same
      const filteredInvites = data.filter((invite) => invite.email !== currentUser.email);
  
      const { data: invitesData } = await supabase
        .from("user_invites")
        .insert(filteredInvites)
        .select("email, code, profile:invited_by(*), workspace:workspace_id(*)");
  
      // Processing emails logic remains the same, replace user.data with currentUser where necessary
      const emails = invitesData?.map(async (invite) => ({
        from: "Sean <sean@rapid-builder.com>",
        to: [invite.email],
        subject: {
          invitedByName: invite.profile.display_name,
          teamName: invite.workspace.name,
        },
        html: await renderAsync(
          InviteEmail({
            invitedByEmail: invite.profile.email,
            invitedByName: invite.profile.display_name,
            email: invite.email,
            teamName: invite.workspace.name,
            inviteCode: invite.code,
            ip,
            location,
            locale: currentUser.locale, // Use currentUser instead of user.data
          })
        ),
      }));

    const htmlEmails = await Promise.all(emails);

    await resend.batch.send(htmlEmails);

    if (revalidatePath) {
      revalidatePathFunc(revalidatePath);
    }

    if (redirectTo) {
      redirect(redirectTo);
    }

  }
);
