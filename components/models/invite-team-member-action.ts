"use server";

import { useContext } from "react";
import InviteEmail from "@/components/emails/invite";
import { ChatbotUIContext } from "@/context/context";
import { createClient } from "@/lib/supabase/server"
import { renderAsync } from "@react-email/components";
import { revalidatePath as revalidatePathFunc } from "next/cache";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { action } from "@/components/utility/action-safe";
import { inviteTeamMembersSchema } from "@/components/utility/action-schems";
import { cookies, headers } from "next/headers"


const resend = new Resend(process.env.RESEND_API_KEY);

export const inviteTeamMembersAction = action(
  inviteTeamMembersSchema,
  async ({ invites, redirectTo, revalidatePath }) => {
    const { profile } = useContext(ChatbotUIContext);
    const cookieStore = cookies()
    const supabase = createClient(cookieStore)

    const location = headers().get("x-vercel-ip-city") ?? "Unknown";
    const ip = headers().get("x-forwarded-for") ?? "127.0.0.1";

    const data = invites?.map((invite) => ({
      ...invite,
      team_id: profile?.home_workspace,
      invited_by: profile?.user_id,
    }));

    // Filter out members and previous invited emails
    const filteredInvites = data.filter((invite) => {
      if (invite.email === profile?.email) {
        return false;
      }
      // Additional filtering logic can be added here
      return true;
    });

    const { data: invitesData } = await supabase
      .from("user_invites")
      .insert(filteredInvites)
      .select("email, code, user:invited_by(*), profile:workspace_id(*)");

    const emails = invitesData?.map(async (invite) => ({
      from: "Sean <rapid-builder.com.au>",
      to: [invite.email],
      subject: `You're invited to join ${invite.workspace.name} on VBR`,
      html: await renderAsync(
        InviteEmail({
          invitedByEmail: invite.user.email,
          invitedByName: invite.user.display_name,
          email: invite.email,
          workspaceName: invite.workspace.name,
          inviteCode: invite.code,
          ip,
          location
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