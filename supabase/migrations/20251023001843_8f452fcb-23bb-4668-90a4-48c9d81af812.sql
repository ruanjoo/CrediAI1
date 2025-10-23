-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create user_roles table (CRITICAL: separate table for roles)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view their own profile') THEN
    CREATE POLICY "Users can view their own profile"
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update their own profile') THEN
    CREATE POLICY "Users can update their own profile"
      ON public.profiles
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;
END $$;

-- RLS Policies for user_roles
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can view their own roles') THEN
    CREATE POLICY "Users can view their own roles"
      ON public.user_roles
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can view all roles') THEN
    CREATE POLICY "Admins can view all roles"
      ON public.user_roles
      FOR SELECT
      USING (public.has_role(auth.uid(), 'administrador'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can insert roles') THEN
    CREATE POLICY "Admins can insert roles"
      ON public.user_roles
      FOR INSERT
      WITH CHECK (public.has_role(auth.uid(), 'administrador'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins can delete roles') THEN
    CREATE POLICY "Admins can delete roles"
      ON public.user_roles
      FOR DELETE
      USING (public.has_role(auth.uid(), 'administrador'));
  END IF;
END $$;

-- Create table for institutions
CREATE TABLE IF NOT EXISTS public.instituicoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES auth.users(id) NOT NULL
);

-- Enable RLS on instituicoes
ALTER TABLE public.instituicoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for instituicoes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'instituicoes' AND policyname = 'Admins can view all institutions') THEN
    CREATE POLICY "Admins can view all institutions"
      ON public.instituicoes
      FOR SELECT
      USING (public.has_role(auth.uid(), 'administrador'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'instituicoes' AND policyname = 'Admins can insert institutions') THEN
    CREATE POLICY "Admins can insert institutions"
      ON public.instituicoes
      FOR INSERT
      WITH CHECK (public.has_role(auth.uid(), 'administrador'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'instituicoes' AND policyname = 'Admins can update institutions') THEN
    CREATE POLICY "Admins can update institutions"
      ON public.instituicoes
      FOR UPDATE
      USING (public.has_role(auth.uid(), 'administrador'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'instituicoes' AND policyname = 'Admins can delete institutions') THEN
    CREATE POLICY "Admins can delete institutions"
      ON public.instituicoes
      FOR DELETE
      USING (public.has_role(auth.uid(), 'administrador'));
  END IF;
END $$;