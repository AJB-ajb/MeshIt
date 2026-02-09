import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Extraction schema matching the post-redesign DB columns.
 */
const profileSchemaV2 = {
  type: "object",
  properties: {
    updated_text: {
      type: "string",
      description:
        "The full updated source text with the update instruction applied. Preserve all original information unless explicitly contradicted.",
    },
    full_name: {
      type: "string",
      description: "The person's full name",
    },
    headline: {
      type: "string",
      description:
        "A short professional headline (e.g., 'Full-stack Developer')",
    },
    bio: {
      type: "string",
      description: "A brief bio or summary about the person",
    },
    location: {
      type: "string",
      description: "Location or timezone if mentioned",
    },
    skills: {
      type: "array",
      items: { type: "string" },
      description:
        "List of technical skills, programming languages, frameworks, and tools",
    },
    interests: {
      type: "array",
      items: { type: "string" },
      description: "Areas of interest (e.g., AI, fintech, gaming)",
    },
    languages: {
      type: "array",
      items: { type: "string" },
      description: "Spoken languages as ISO codes (e.g., en, de, es)",
    },
    portfolio_url: {
      type: "string",
      description: "Portfolio website URL if mentioned",
    },
    github_url: {
      type: "string",
      description: "GitHub profile URL if mentioned",
    },
    skill_levels: {
      type: "object",
      additionalProperties: { type: "number" },
      description:
        "Map of domain to skill level (0-10). Example: { programming: 7, design: 4 }",
    },
    location_preference: {
      type: "number",
      description:
        "Location preference: 0.0 = in-person only, 0.5 = either, 1.0 = remote only",
    },
  },
  required: ["updated_text", "skills"],
};

/**
 * POST /api/extract/profile/update
 * Applies a free-form update instruction to the profile source text,
 * then extracts structured fields from the result.
 */
export async function POST(request: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sourceText, updateInstruction } = await request.json();

    if (
      !sourceText ||
      typeof sourceText !== "string" ||
      sourceText.trim().length < 5
    ) {
      return NextResponse.json(
        { error: "Please provide source text to update" },
        { status: 400 },
      );
    }

    if (
      !updateInstruction ||
      typeof updateInstruction !== "string" ||
      updateInstruction.trim().length < 3
    ) {
      return NextResponse.json(
        { error: "Please provide an update instruction" },
        { status: 400 },
      );
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are an expert at updating developer profile descriptions and extracting structured data.

You will receive a current profile description and an update instruction. Your job:
1. Apply the update instruction to the profile text. Preserve all original information unless explicitly contradicted by the update. Integrate changes naturally into the text.
2. Extract structured profile fields from the UPDATED text.

Return both the updated text and extracted fields via the function call.`,
          },
          {
            role: "user",
            content: `Current profile description:\n\n${sourceText.trim()}\n\nUpdate instruction: ${updateInstruction.trim()}`,
          },
        ],
        functions: [
          {
            name: "update_and_extract_profile",
            description:
              "Apply an update to the profile text and extract structured fields",
            parameters: profileSchemaV2,
          },
        ],
        function_call: { name: "update_and_extract_profile" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      console.error(
        "OpenAI API error:",
        await response.json().catch(() => ({})),
      );
      return NextResponse.json(
        { error: "Failed to process update. Please try again." },
        { status: 500 },
      );
    }

    const data = await response.json();
    const functionCall = data.choices?.[0]?.message?.function_call;

    if (!functionCall || functionCall.name !== "update_and_extract_profile") {
      return NextResponse.json(
        { error: "Failed to extract profile information" },
        { status: 500 },
      );
    }

    const result = JSON.parse(functionCall.arguments);
    const { updated_text, ...extractedProfile } = result;

    return NextResponse.json({
      success: true,
      updatedSourceText: updated_text,
      extractedProfile,
    });
  } catch (error) {
    console.error("Profile update extraction error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update profile",
      },
      { status: 500 },
    );
  }
}
