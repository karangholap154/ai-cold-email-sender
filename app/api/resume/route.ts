import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PRO_RESUME_LIMIT = 3;

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: resumes, error } = await supabase
      .from("resume")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("updated_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const defaultResume = resumes?.find((r) => r.is_default) || null;

    // Repair legacy data where more than one resume was marked as default.
    if (defaultResume && resumes) {
      const duplicateDefaultIds = resumes
        .filter((r) => r.is_default && r.id !== defaultResume.id)
        .map((r) => r.id);

      if (duplicateDefaultIds.length > 0) {
        await supabase
          .from("resume")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .in("id", duplicateDefaultIds);
      }
    }

    const normalizedResumes = (resumes || []).map((resume) => ({
      ...resume,
      is_default: resume.id === defaultResume?.id,
    }));
    const activeResume = defaultResume || normalizedResumes[0] || null;

    return NextResponse.json({
      resumes: normalizedResumes,
      activeResume,
      resume: activeResume, // Backwards compatibility for single-resume callers
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch resumes";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const skillsSummary = (formData.get("skills_summary") as string) || "";
    const label = (formData.get("label") as string) || "Primary Résumé";
    const resumeId = (formData.get("resume_id") as string) || null;
    const isDefaultInput = formData.get("is_default");

    // Fetch user's plan and existing count
    const [{ data: profile }, { count: existingCount }] = await Promise.all([
      supabase.from("profiles").select("plan").eq("id", user.id).single(),
      supabase
        .from("resume")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id),
    ]);

    const isPro = profile?.plan === "pro";
    const count = existingCount ?? 0;

    // Check plan limits: Free tier users can only have 1 resume
    if (!resumeId && !isPro && count >= 1) {
      return NextResponse.json(
        {
          error:
            "Multiple résumé versions are a Pro feature. Upgrade to Pro to add more targeted résumés.",
          code: "PRO_FEATURE_REQUIRED",
        },
        { status: 403 }
      );
    }

    if (!resumeId && isPro && count >= PRO_RESUME_LIMIT) {
      return NextResponse.json(
        {
          error: `Pro accounts can have up to ${PRO_RESUME_LIMIT} résumé versions. Delete an existing version before adding another.`,
          code: "RESUME_LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    // Check existing resume row if resumeId is provided
    let existingResume = null;
    if (resumeId) {
      const { data } = await supabase
        .from("resume")
        .select("*")
        .eq("id", resumeId)
        .eq("user_id", user.id)
        .maybeSingle();
      existingResume = data;
    }

    let fileUrl = existingResume?.file_url || "";
    let fileName = existingResume?.file_name || "";
    let fileSize: number | null = existingResume?.file_size || null;

    // If a new PDF file is uploaded, validate and upload to user's isolated folder in Supabase Storage
    if (file && file.size > 0) {
      if (file.type !== "application/pdf") {
        return NextResponse.json(
          { error: "Only PDF files are supported." },
          { status: 400 }
        );
      }

      // Max size: 10MB
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: "File size exceeds 10MB limit." },
          { status: 400 }
        );
      }

      const fileBuffer = await file.arrayBuffer();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${user.id}/${Date.now()}_${sanitizedName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(storagePath, Buffer.from(fileBuffer), {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        return NextResponse.json(
          { error: `Storage upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      fileUrl = uploadData.path;
      fileName = file.name;
      fileSize = file.size;
    }

    if (!fileUrl && (!file || file.size === 0)) {
      return NextResponse.json(
        { error: "Please upload a résumé PDF." },
        { status: 400 }
      );
    }

    // Determine default status
    const shouldBeDefault =
      isDefaultInput === "true" ||
      isDefaultInput === "1" ||
      count === 0 ||
      (existingResume?.is_default && isDefaultInput !== "false");

    if (shouldBeDefault) {
      // Unset default on any other resumes for this user
      await supabase
        .from("resume")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    let savedData;
    if (existingResume?.id) {
      const { data, error } = await supabase
        .from("resume")
        .update({
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          label: label.trim() || "Primary Résumé",
          is_default: shouldBeDefault,
          skills_summary: skillsSummary.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingResume.id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      savedData = data;
    } else {
      const { data, error } = await supabase
        .from("resume")
        .insert({
          user_id: user.id,
          file_url: fileUrl,
          file_name: fileName,
          file_size: fileSize,
          label: label.trim() || "Primary Résumé",
          is_default: shouldBeDefault,
          skills_summary: skillsSummary.trim(),
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      savedData = data;
    }

    return NextResponse.json({
      success: true,
      resume: savedData,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to save résumé";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, is_default, label, skills_summary } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Résumé ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: existing, error: fetchErr } = await supabase
      .from("resume")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json(
        { error: "Résumé not found or access denied" },
        { status: 404 }
      );
    }

    if (is_default === true) {
      // Clear default on all other resumes for this user
      await supabase
        .from("resume")
        .update({ is_default: false })
        .eq("user_id", user.id);
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof is_default === "boolean") updates.is_default = is_default;
    if (typeof label === "string" && label.trim()) updates.label = label.trim();
    if (typeof skills_summary === "string")
      updates.skills_summary = skills_summary.trim();

    const { data: updated, error: updateErr } = await supabase
      .from("resume")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, resume: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update résumé";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const resumeId = url.searchParams.get("id");

    if (!resumeId) {
      return NextResponse.json(
        { error: "Résumé ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership & get storage path
    const { data: existing, error: fetchErr } = await supabase
      .from("resume")
      .select("*")
      .eq("id", resumeId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchErr || !existing) {
      return NextResponse.json(
        { error: "Résumé not found or access denied" },
        { status: 404 }
      );
    }

    // Delete file from Supabase Storage bucket
    if (existing.file_url) {
      await supabase.storage.from("resumes").remove([existing.file_url]);
    }

    // Delete row from database
    const { error: deleteErr } = await supabase
      .from("resume")
      .delete()
      .eq("id", resumeId)
      .eq("user_id", user.id);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    // If the deleted resume was default, assign default to another resume if one exists
    if (existing.is_default) {
      const { data: nextResume } = await supabase
        .from("resume")
        .select("id")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (nextResume?.id) {
        await supabase
          .from("resume")
          .update({ is_default: true })
          .eq("id", nextResume.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete résumé";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
