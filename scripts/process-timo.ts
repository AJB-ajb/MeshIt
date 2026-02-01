import { createClient } from '@supabase/supabase-js';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const message = `Timo — 21/01/2026, 10:24
I am looking for people to join my Team 🚀
Looking for: 1 full-stack dev , 1 designer
skills: python, 3D-Modelling, UI-Design
Idea: Building on the 3D body scanners that already exist in gyms, we are constructing a modular platform that uses AI to develop and adapt customized training and nutrition plans based on this data. Additional modules can be added later. If you would like to know which additional modules, please contact me and join my team. 😉`;

async function processMessage() {
  console.log('\n🚀 Processing Timo\'s Discord message...\n');

  // Extract profile with AI
  const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Extract developer profile from Discord message. Return JSON with:
- full_name (use "Timo" if no full name)
- headline (professional title based on skills)
- bio (brief summary of what they're working on)
- skills (array of technical skills mentioned)
- interests (array of interests like AI, fitness, health tech, etc)
- experience_level (junior/intermediate/senior/lead based on context)
- availability_hours (default 15 for hackathon)
- github_url (if mentioned)
- portfolio_url (if mentioned)
Be thorough in extracting skills and interests!`,
        },
        {
          role: 'user',
          content: message,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });

  const aiData = await aiResponse.json();
  const profile = JSON.parse(aiData.choices[0].message.content);

  console.log('📋 Extracted Profile:');
  console.log(JSON.stringify(profile, null, 2));
  console.log('');

  // Create auth user
  const email = 'timo_discord@meshit.hackathon';
  const username = 'Timo';

  let userId: string;
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers?.users.find(u => u.email === email);

  if (existing) {
    userId = existing.id;
    console.log(`✅ User exists: ${email}`);
  } else {
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: {
        full_name: profile.full_name || username,
        discord_username: username,
        imported_from: 'discord_hackathon',
        import_date: new Date().toISOString(),
      },
    });

    if (error) {
      console.error('❌ Auth error:', error);
      throw error;
    }
    userId = newUser.user!.id;
    console.log(`✅ Created auth user: ${email}`);
  }

  // Generate embedding
  let embedding: number[] | null = null;
  if (profile.skills?.length) {
    const embText = [
      profile.headline,
      profile.bio,
      ...(profile.skills || []),
      ...(profile.interests || []),
    ]
      .filter(Boolean)
      .join(' ');

    const embResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: embText,
      }),
    });

    const embData = await embResponse.json();
    embedding = embData.data[0].embedding;
    console.log('✅ Generated embedding vector');
  }

  // Save profile
  const profileData = {
    user_id: userId,
    full_name: profile.full_name || username,
    headline: profile.headline,
    bio: profile.bio,
    skills: profile.skills || [],
    interests: profile.interests || [],
    experience_level: profile.experience_level || 'senior',
    collaboration_style: 'hybrid',
    availability_hours: profile.availability_hours || 15,
    github_url: profile.github_url || null,
    portfolio_url: profile.portfolio_url || null,
    project_preferences: {},
    embedding: embedding ? `[${embedding.join(',')}]` : null,
    updated_at: new Date().toISOString(),
  };

  const { error: profileError } = await supabase.from('profiles').upsert(profileData);

  if (profileError) {
    console.error('❌ Profile error:', profileError);
    throw profileError;
  }

  console.log('✅ Profile saved to Supabase!\n');
  console.log('📊 Summary:');
  console.log(`   Name: ${profileData.full_name}`);
  console.log(`   Headline: ${profileData.headline}`);
  console.log(`   Skills: ${profileData.skills.join(', ')}`);
  console.log(`   Interests: ${profileData.interests.join(', ')}`);
  console.log(`   Experience: ${profileData.experience_level}`);
  console.log(`   Email: ${email}`);
  console.log('\n✨ Done!\n');
}

processMessage().catch(console.error);
