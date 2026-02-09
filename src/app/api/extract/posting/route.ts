import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Posting extraction schema for structured output
 */
const postingSchema = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "A concise posting title (max 100 characters)",
    },
    description: {
      type: "string",
      description:
        "A clear description explaining what the posting is about and what's being built",
    },
    skills: {
      type: "array",
      items: { type: "string" },
      description:
        "List of required technical skills, programming languages, frameworks, and tools needed",
    },
    category: {
      type: "string",
      enum: ["study", "hackathon", "personal", "professional", "social"],
      description: "Category of the posting",
    },
    estimated_time: {
      type: "string",
      description:
        "Estimated time to complete (e.g., '2 weeks', '3 months', 'ongoing')",
    },
    team_size_min: {
      type: "number",
      minimum: 1,
      description: "Minimum number of people needed for the team",
    },
    team_size_max: {
      type: "number",
      minimum: 1,
      description: "Maximum number of people needed for the team",
    },
    skill_level_min: {
      type: "number",
      minimum: 1,
      maximum: 5,
      description: "Minimum skill level required (1=beginner, 5=expert)",
    },
    tags: {
      type: "array",
      items: { type: "string" },
      description:
        "Tags or keywords describing the posting (e.g., 'hackathon', 'open-source', 'MVP')",
    },
    goals: {
      type: "array",
      items: { type: "string" },
      description: "Key goals or milestones for the posting",
    },
  },
  required: ["title", "description", "skills"],
};

/**
 * POST /api/extract/posting
 * Extracts posting information from unstructured text using OpenAI
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
        {
          error: "Please provide more text to extract posting information from",
        },
        { status: 400 },
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
            content: `You are an expert at extracting posting requirements from unstructured text.
Extract as much relevant information as possible from the provided text, which could be:
- A Slack/Discord message looking for collaborators
- A project idea description
- A GitHub repository README
- A hackathon project pitch
- Any text describing a posting that needs collaborators

Be thorough in extracting skills - look for programming languages, frameworks, tools, and technologies.
Categorize the posting as study, hackathon, personal, professional, or social based on context.
Infer team size range from context if not explicitly stated.
Create a clear, concise title if one isn't provided.
Return only the extracted data, do not make up information that cannot be inferred.`,
          },
          {
            role: "user",
            content: `Extract posting information from this text:\n\n${text}`,
          },
        ],
        functions: [
          {
            name: "extract_posting",
            description: "Extract posting requirements from text",
            parameters: postingSchema,
          },
        ],
        function_call: { name: "extract_posting" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      return NextResponse.json(
        { error: "Failed to process text. Please try again." },
        { status: 500 },
      );
    }

    const data = await response.json();
    const functionCall = data.choices?.[0]?.message?.function_call;

    if (!functionCall || functionCall.name !== "extract_posting") {
      return NextResponse.json(
        { error: "Failed to extract posting information" },
        { status: 500 },
      );
    }

    const extractedPosting = JSON.parse(functionCall.arguments);

    return NextResponse.json({
      success: true,
      posting: extractedPosting,
    });
  } catch (error) {
    console.error("Posting extraction error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to extract posting",
      },
      { status: 500 },
    );
  }
}
