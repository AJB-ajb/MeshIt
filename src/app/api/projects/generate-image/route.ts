import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, title, description, required_skills, team_size, timeline } = body;

    console.log('🎨 Starting image generation for project:', project_id);

    // Step 1: Generate optimized prompt using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const promptGenerationPrompt = `You are an expert at creating image generation prompts. Based on the following project details, create a detailed, specific prompt for generating a professional project thumbnail image.

Project Title: ${title}
Description: ${description}
Required Skills: ${required_skills?.join(', ') || 'general tech'}
Team Size: ${team_size || 3} people
Timeline: ${timeline?.replace('_', ' ') || 'flexible'}

Create a single-paragraph image generation prompt that captures the essence of this project. The image should be:
- Professional and modern
- Tech-focused with relevant abstract elements (code, networks, geometric shapes)
- Clean and minimalist design
- Suitable as a project thumbnail
- NO text or words in the image

Return ONLY the image prompt, nothing else.`;

    const promptResult = await model.generateContent(promptGenerationPrompt);
    const optimizedPrompt = promptResult.response.text().trim();

    console.log('✅ Generated prompt:', optimizedPrompt.substring(0, 100) + '...');

    // Step 2: Generate image using Gemini Imagen via REST API
    // Note: Imagen is not yet available in the SDK, use direct API call
    const imageResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt: optimizedPrompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            negativePrompt: 'text, words, letters, watermark, blurry, low quality',
            personGeneration: 'allow_adult',
          },
        }),
      }
    );

    if (!imageResponse.ok) {
      const errorText = await imageResponse.text();
      throw new Error(`Imagen API failed: ${errorText}`);
    }

    const imageData = await imageResponse.json();
    const base64Image = imageData.predictions?.[0]?.bytesBase64Encoded;

    if (!base64Image) {
      throw new Error('No image data in response');
    }

    console.log('✅ Image generated, size:', base64Image.length, 'bytes');

    // Step 3: Upload to Supabase Storage
    const fileName = `${project_id}.png`;
    const imageBuffer = Buffer.from(base64Image, 'base64');

    const { error: uploadError } = await supabase.storage
      .from('project-images')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    console.log('✅ Image uploaded to storage');

    // Step 4: Get public URL and update project
    const { data: urlData } = supabase.storage
      .from('project-images')
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('projects')
      .update({ image_url: imageUrl })
      .eq('id', project_id);

    if (updateError) {
      throw new Error(`Update failed: ${updateError.message}`);
    }

    console.log('✅ Project updated with image URL');

    return NextResponse.json({
      success: true,
      project_id,
      image_url: imageUrl,
      message: 'Project thumbnail generated successfully',
    });

  } catch (error: any) {
    console.error('❌ Image generation failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
