-- INSTRUCTIONS TO SEED ADMIN USER

-- 1. Create a user in Supabase Auth (via Dashboard or client)
--    Email: admin@example.com
--    Password: securepassword

-- 2. Run this SQL to promote them to admin (replace THE_UUID with effective ID)

-- UPDATE public.profiles
-- SET role = 'admin'
-- WHERE email = 'admin@example.com';

-- Verify:
-- SELECT * FROM public.profiles WHERE role = 'admin';
