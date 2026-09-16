import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data, error } = await supabase
      .from("resume")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ resume: data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch resume";
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

    // 1. Fetch current resume row for this user if it exists
    const { data: existingResume } = await supabase
      .from("resume")
      .select("*")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    let fileUrl = existingResume?.file_url || "";
    let fileName = existingResume?.file_name || "";

    // 2. If a new file is uploaded, validate and upload to user's isolated folder in Supabase Storage
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
    }

    if (!fileUrl && (!file || file.size === 0)) {
      return NextResponse.json(
        { error: "Please upload a resume PDF." },
        { status: 400 }
      );
    }

    // 3. Update or Insert in resume table scoped to user.id
    let savedData;
    if (existingResume?.id) {
      const { data, error } = await supabase
        .from("resume")
        .update({
          file_url: fileUrl,
          file_name: fileName,
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
    const message = err instanceof Error ? err.message : "Failed to save resume";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
