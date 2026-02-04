import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://jirgkhjdxahfsgqxprhh.supabase.co",
  "***REMOVED***",
);

async function checkProfiles() {
  const { data, error: _error } = await supabase
    .from("profiles")
    .select("*")
    .limit(10);

  console.log(JSON.stringify(data, null, 2));
}

checkProfiles();
