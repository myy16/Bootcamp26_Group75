import { supabase } from "./supabase";

export interface ProfileOption {
  id: string;
  name: string;
}

export interface ProfileEditorState {
  skinTypeName: string;
  hairTypeName: string;
  skinConcernNames: string[];
  minBudget: string;
  maxBudget: string;
  onboardingCompleted: boolean;
}

export interface ProfileEditorData {
  skinTypes: ProfileOption[];
  hairTypes: ProfileOption[];
  skinConcerns: ProfileOption[];
  profile: ProfileEditorState;
}

export interface SaveProfileInput {
  fullName?: string;
  currentEmail?: string;
  email?: string;
  password?: string;
  skinTypeName?: string;
  hairTypeName?: string;
  skinConcernNames?: string[];
  minBudget?: number | null;
  maxBudget?: number | null;
  onboardingCompleted?: boolean;
}

function mapOptions(rows: any[] | null | undefined): ProfileOption[] {
  return (rows ?? []).map((row) => ({
    id: String(row.id),
    name: row.name,
  }));
}

function findIdByName(options: ProfileOption[], name?: string | null) {
  if (!name) return null;
  return options.find((option) => option.name === name)?.id ?? null;
}

export async function loadProfileEditorData(userId: string): Promise<ProfileEditorData> {
  const [skinTypesResult, hairTypesResult, skinConcernsResult, profileResult, concernsResult] = await Promise.all([
    supabase.from("skin_types").select("id, name").order("name"),
    supabase.from("hair_types").select("id, name").order("name"),
    supabase.from("skin_concerns").select("id, name").order("name"),
    supabase
      .from("user_profiles")
      .select("skin_type_id, hair_type_id, min_budget, max_budget, onboarding_completed")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("user_skin_concerns").select("skin_concern_id").eq("user_id", userId),
  ]);

  if (skinTypesResult.error) throw skinTypesResult.error;
  if (hairTypesResult.error) throw hairTypesResult.error;
  if (skinConcernsResult.error) throw skinConcernsResult.error;
  if (profileResult.error) throw profileResult.error;
  if (concernsResult.error) throw concernsResult.error;

  const skinTypes = mapOptions(skinTypesResult.data);
  const hairTypes = mapOptions(hairTypesResult.data);
  const skinConcerns = mapOptions(skinConcernsResult.data);

  const skinTypeLookup = new Map(skinTypes.map((option) => [option.id, option.name]));
  const hairTypeLookup = new Map(hairTypes.map((option) => [option.id, option.name]));
  const concernLookup = new Map(skinConcerns.map((option) => [option.id, option.name]));

  return {
    skinTypes,
    hairTypes,
    skinConcerns,
    profile: {
      skinTypeName: profileResult.data?.skin_type_id ? skinTypeLookup.get(String(profileResult.data.skin_type_id)) ?? "" : "",
      hairTypeName: profileResult.data?.hair_type_id ? hairTypeLookup.get(String(profileResult.data.hair_type_id)) ?? "" : "",
      skinConcernNames: (concernsResult.data ?? [])
        .map((item) => concernLookup.get(String(item.skin_concern_id)))
        .filter((value): value is string => Boolean(value)),
      minBudget:
        profileResult.data?.min_budget !== null && profileResult.data?.min_budget !== undefined
          ? String(profileResult.data.min_budget)
          : "",
      maxBudget:
        profileResult.data?.max_budget !== null && profileResult.data?.max_budget !== undefined
          ? String(profileResult.data.max_budget)
          : "",
      onboardingCompleted: Boolean(profileResult.data?.onboarding_completed),
    },
  };
}

export async function saveUserProfile(userId: string, input: SaveProfileInput) {
  const [skinTypesResult, hairTypesResult, skinConcernsResult] = await Promise.all([
    supabase.from("skin_types").select("id, name"),
    supabase.from("hair_types").select("id, name"),
    supabase.from("skin_concerns").select("id, name"),
  ]);

  if (skinTypesResult.error) throw skinTypesResult.error;
  if (hairTypesResult.error) throw hairTypesResult.error;
  if (skinConcernsResult.error) throw skinConcernsResult.error;

  const skinTypeId = findIdByName(mapOptions(skinTypesResult.data), input.skinTypeName);
  const hairTypeId = findIdByName(mapOptions(hairTypesResult.data), input.hairTypeName);
  const skinConcernOptions = mapOptions(skinConcernsResult.data);
  const skinConcernIdMap = new Map(skinConcernOptions.map((option) => [option.name, option.id]));
  const selectedConcernIds = (input.skinConcernNames ?? [])
    .map((name) => skinConcernIdMap.get(name))
    .filter((value): value is string => Boolean(value));

  const profilePayload = {
    user_id: userId,
    skin_type_id: skinTypeId ? Number(skinTypeId) : null,
    hair_type_id: hairTypeId ? Number(hairTypeId) : null,
    min_budget: input.minBudget ?? null,
    max_budget: input.maxBudget ?? null,
    onboarding_completed: input.onboardingCompleted ?? true,
  };

  const { error: profileError } = await supabase
    .from("user_profiles")
    .upsert(profilePayload, { onConflict: "user_id" });

  if (profileError) throw profileError;

  const { error: deleteError } = await supabase
    .from("user_skin_concerns")
    .delete()
    .eq("user_id", userId);

  if (deleteError) throw deleteError;

  if (selectedConcernIds.length > 0) {
    const concernPayload = selectedConcernIds.map((skinConcernId) => ({
      user_id: userId,
      skin_concern_id: Number(skinConcernId),
    }));

    const { error: concernInsertError } = await supabase
      .from("user_skin_concerns")
      .insert(concernPayload);

    if (concernInsertError) throw concernInsertError;
  }

  const authData: {
    email?: string;
    password?: string;
    data?: { full_name?: string };
  } = {};

  if (input.fullName) {
    authData.data = { full_name: input.fullName };
  }

  if (input.email && input.email !== input.currentEmail) {
    authData.email = input.email;
  }

  if (input.password) {
    authData.password = input.password;
  }

  if (authData.email || authData.password || authData.data) {
    const { error: authError } = await supabase.auth.updateUser(authData);

    if (authError) throw authError;
  }
}