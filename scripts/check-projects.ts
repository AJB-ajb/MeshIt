import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jirgkhjdxahfsgqxprhh.supabase.co',
  '***REMOVED***'
);

async function checkProjects() {
  const { data, error } = await supabase.from('projects').select('*').limit(2);
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkProjects();
