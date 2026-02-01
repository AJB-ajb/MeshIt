import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Profile extraction schema for structured output
 */
const profileSchema = {
  type: "object",
  properties: {
    full_name: {
      type: "string",
      description: "The person's full name",
    },
    headline: {
      type: "string",
      description: "A short professional headline (e.g., 'Full-stack Developer' or 'Senior React Engineer')",
    },
    bio: {
      type: "string",
      description: "A brief bio or summary about the person",
    },
    location: {
      type: "string",
      description: "Location or timezone if mentioned",
    },
    experience_level: {
      type: "string",
      enum: ["junior", "intermediate", "senior", "lead"],
      description: "Inferred experience level based on years of experience and skills",
    },
    collaboration_style: {
      type: "string",
      enum: ["async", "sync", "hybrid"],
      description: "Preferred collaboration style if mentioned, default to 'async'",
    },
    availability_hours: {
      type: "number",
      description: "Hours per week available for projects",
    },
    skills: {
      type: "array",
      items: { type: "string" },
      description: "List of technical skills, programming languages, frameworks, and tools",
    },
    interests: {
      type: "array",
      items: { type: "string" },
      description: "Areas of interest (e.g., AI, fintech, gaming, education)",
    },
    portfolio_url: {
      type: "string",
      description: "Portfolio website URL if mentioned",
    },
    github_url: {
      type: "string",
      description: "GitHub profile URL if mentioned",
    },
    project_preferences: {
      type: "object",
      properties: {
        project_types: {
          type: "array",
          items: { type: "string" },
          description: "Types of projects interested in (e.g., SaaS, hackathon, open source)",
        },
        preferred_roles: {
          type: "array",
          items: { type: "string" },
          description: "Preferred roles (e.g., Frontend, Backend, Full-stack, DevOps)",
        },
        preferred_stack: {
          type: "array",
          items: { type: "string" },
          description: "Preferred tech stack",
        },
        commitment_level: {
          type: "string",
          enum: ["5", "10", "15", "20"],
          description: "Hours per week commitment preference",
        },
        timeline_preference: {
          type: "string",
          enum: ["weekend", "1_week", "1_month", "ongoing"],
          description: "Preferred project timeline",
        },
      },
    },
  },
  required: ["skills"],
};

/**
 * POST /api/extract/profile
 * Extracts profile information from unstructured text using OpenAI
 */
export async function POST(request: Request) {
  try {
    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 503 }
      );
    }

    const supabase = await createClient();

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text } = await request.json();

    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return NextResponse.json(
        { error: "Please provide more text to extract profile information from" },
        { status: 400 }
      );
    }

    // Use OpenAI function calling for structured extraction
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
            content: `You are an expert at extracting developer profile information from unstructured text. 
Extract as much relevant information as possible from the provided text, which could be:
- A GitHub profile README
- A LinkedIn bio
- A personal introduction
- A resume snippet
- Any text describing a developer

Be thorough in extracting skills - look for programming languages, frameworks, tools, and technologies.
Infer experience level from context (years of experience, complexity of projects mentioned).
If information is not explicitly stated, make reasonable inferences based on context.
Return only the extracted data, do not make up information that cannot be inferred.`,
          },
          {
            role: "user",
            content: `Extract profile information from this text:\n\n${text}`,
          },
        ],
        functions: [
          {
            name: "extract_profile",
            description: "Extract developer profile information from text",
            parameters: profileSchema,
          },
        ],
        function_call: { name: "extract_profile" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        { error: "Failed to process text. Please try again." },
        { status: 500 }
      );
    }

    const data = await response.json();
    const functionCall = data.choices?.[0]?.message?.function_call;

    if (!functionCall || functionCall.name !== "extract_profile") {
      return NextResponse.json(
        { error: "Failed to extract profile information" },
        { status: 500 }
      );
    }

    const extractedProfile = JSON.parse(functionCall.arguments);

    return NextResponse.json({
      success: true,
      profile: extractedProfile,
    });
  } catch (error) {
    console.error("Profile extraction error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to extract profile" },
      { status: 500 }
    );
  }
}
