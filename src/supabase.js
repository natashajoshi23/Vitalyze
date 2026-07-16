import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ixurbrdzevyfbfujsgik.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_H-CU8ZqYsziYUpJDTcnZIg_3O69qmT_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
