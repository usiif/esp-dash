-- Create enrollments table
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'confirmed', 'cancelled', 'waitlist')),
  attendance_status TEXT CHECK (attendance_status IN ('attended', 'no-show', 'excused', NULL)),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Prevent duplicate enrollments for the same student and class
  UNIQUE(student_id, class_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_enrollments_updated_at
  BEFORE UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollments_updated_at();

-- Enable Row Level Security
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your auth setup)
-- Students can view their own enrollments
CREATE POLICY "Students can view their own enrollments"
  ON enrollments FOR SELECT
  USING (auth.uid() = student_id OR auth.role() = 'authenticated');

-- Students can insert their own enrollments
CREATE POLICY "Students can create enrollments"
  ON enrollments FOR INSERT
  WITH CHECK (auth.uid() = student_id);

-- Students can update their own enrollments (for cancellation)
CREATE POLICY "Students can update their enrollments"
  ON enrollments FOR UPDATE
  USING (auth.uid() = student_id);

-- Admin/service role can do anything
CREATE POLICY "Service role full access"
  ON enrollments FOR ALL
  USING (auth.role() = 'service_role');
