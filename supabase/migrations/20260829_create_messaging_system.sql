-- Migration: Create in-app student/admin messaging system
-- Tables: conversations, messages
-- Includes RLS security policies, triggers, and Realtime replication

-- 1. Create conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT DEFAULT 'General Support',
    channel VARCHAR(50) DEFAULT 'support',
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
    last_message_preview TEXT,
    last_message_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_student_conversation UNIQUE (student_id)
);

-- 2. Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id BIGSERIAL PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sender_role VARCHAR(50) NOT NULL DEFAULT 'student' CHECK (sender_role IN ('student', 'staff', 'proprietor', 'admin')),
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    channel VARCHAR(50) DEFAULT 'support',
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create Indexes for fast querying & sorting
CREATE INDEX IF NOT EXISTS idx_conversations_student_id ON public.conversations(student_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at ASC);

-- 4. Trigger to update conversations timestamp and preview on every new message
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET 
        last_message_preview = NEW.message,
        last_message_at = NEW.created_at,
        updated_at = NEW.created_at
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;
CREATE TRIGGER on_message_inserted
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_message();

-- 5. Row Level Security (RLS)
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations RLS Policies
DROP POLICY IF EXISTS "Students can view their own conversations" ON public.conversations;
CREATE POLICY "Students can view their own conversations"
ON public.conversations FOR SELECT
USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can create their own conversations" ON public.conversations;
CREATE POLICY "Students can create their own conversations"
ON public.conversations FOR INSERT
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Students can update their own conversations" ON public.conversations;
CREATE POLICY "Students can update their own conversations"
ON public.conversations FOR UPDATE
USING (student_id = auth.uid())
WITH CHECK (student_id = auth.uid());

DROP POLICY IF EXISTS "Staff and proprietors can manage all conversations" ON public.conversations;
CREATE POLICY "Staff and proprietors can manage all conversations"
ON public.conversations FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('staff', 'proprietor')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('staff', 'proprietor')
    )
);

-- Messages RLS Policies
DROP POLICY IF EXISTS "Students can view messages in their conversations" ON public.messages;
CREATE POLICY "Students can view messages in their conversations"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id AND c.student_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Students can insert messages in their conversations" ON public.messages;
CREATE POLICY "Students can insert messages in their conversations"
ON public.messages FOR INSERT
WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id AND c.student_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Students can update read status in their conversations" ON public.messages;
CREATE POLICY "Students can update read status in their conversations"
ON public.messages FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id AND c.student_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id = conversation_id AND c.student_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Staff and proprietors can manage all messages" ON public.messages;
CREATE POLICY "Staff and proprietors can manage all messages"
ON public.messages FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('staff', 'proprietor')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role IN ('staff', 'proprietor')
    )
);

-- 6. Enable Real-Time replication
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;

-- 7. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
