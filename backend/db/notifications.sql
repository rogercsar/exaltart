-- Notifications table for user alerts

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN (
    'GROUP_MEMBER_ADDED',
    'GROUP_ITEM_PUBLISHED',
    'SCALE_PUBLISHED',
    'SCALE_ASSIGNMENT'
  )),
  entity_type text CHECK (entity_type IN ('GROUP','SCALE')),
  entity_id uuid,
  title text NOT NULL,
  message text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);