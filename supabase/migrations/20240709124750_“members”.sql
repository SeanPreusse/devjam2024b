--------------- USERS ON TEAM ---------------


CREATE TYPE workspaceRoles as enum (
  'member',
  'owner',
  'guest'
);

-- TABLE --
DROP TABLE IF EXISTS users_on_team;
CREATE TABLE users_on_team (
    id bigint primary key generated always as identity,
    role workspaceRoles,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone not null default now()
);

--------------- USER INVITES ---------------

-- TABLE --
CREATE TABLE user_invites (
    id bigint primary key generated always as identity,
    code TEXT,
    created_at timestamp with time zone not null default now(),
    email TEXT,
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role workspaceRoles,
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id)
);

-- RLS --


-- FUNCTIONS --

CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS TRIGGER AS $$
BEGIN
    NEW.code := (SELECT SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 24)); -- Generates an 8-character random code
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER before_insert_user_invites
BEFORE INSERT ON user_invites
FOR EACH ROW
EXECUTE FUNCTION generate_invite_code();