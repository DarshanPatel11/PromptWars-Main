-- ============================================================
-- MindCompass AI — Seed Data
-- ============================================================
-- This file seeds a demo user "Priya" (JEE aspirant) with
-- 3 weeks of realistic journal entries showing:
--   Week 1: Optimistic, good sleep, score ~72
--   Week 2: Mock test slump, sleep drops, self-comparison peaks, score ~52
--   Week 3: Partial recovery, journaling consistency, score ~63
--
-- Purpose: Powers the Tier 2 demo features (trigger detection,
-- pattern discovery, burnout prediction, "what changed" insights).
-- The demo user ID is a fixed UUID for reproducibility.
-- ============================================================

-- Demo user UUID (will be created via auth in the demo)
-- Replace 'DEMO_USER_ID' with actual auth user UUID after creating the demo account
DO $$
DECLARE
  demo_user_id UUID := '00000000-0000-0000-0000-000000000001'::UUID;
  today DATE := CURRENT_DATE;
BEGIN

-- ─────────────────────────────────────────────
-- User Profile
-- ─────────────────────────────────────────────
INSERT INTO public.user_profiles (user_id, name, exam_type, exam_date, stress_level, avg_sleep, confidence, check_in_count)
VALUES (
  demo_user_id,
  'Priya Sharma',
  'JEE',
  (today + INTERVAL '45 days')::DATE,
  7,
  6.5,
  6,
  21
) ON CONFLICT (user_id) DO NOTHING;

-- ─────────────────────────────────────────────
-- WEEK 1 (21–15 days ago): Optimistic start
-- ─────────────────────────────────────────────

INSERT INTO public.daily_metrics (user_id, mood_score, energy_score, confidence_score, sleep_hours, study_hours, check_in_date) VALUES
(demo_user_id, 7, 8, 7, 7.5, 9, today - 21),
(demo_user_id, 8, 7, 8, 8.0, 10, today - 20),
(demo_user_id, 7, 7, 7, 7.0, 8, today - 19),
(demo_user_id, 9, 8, 8, 7.5, 10, today - 18),
(demo_user_id, 7, 8, 7, 8.0, 9, today - 17),
(demo_user_id, 8, 9, 8, 8.0, 11, today - 16),
(demo_user_id, 7, 7, 7, 7.5, 9, today - 15)
ON CONFLICT (user_id, check_in_date) DO NOTHING;

INSERT INTO public.journal_entries (user_id, content, entry_date) VALUES
(demo_user_id, 'Had a great study session today. Physics concepts are finally clicking. Feeling confident about my preparation strategy. Slept well last night which helped a lot.', today - 21),
(demo_user_id, 'Completed all planned chapters. Math practice went really well — solved 40 problems in 2 hours. Tomorrow I will start Chemistry revision.', today - 20),
(demo_user_id, 'Bit tired today but still managed to cover Organic Chemistry. Need to maintain this momentum. Planning to take a short break this weekend to recharge.', today - 19),
(demo_user_id, 'Best study day this week! Everything made sense. Watched a motivational video about IIT toppers and felt inspired. I know I can do this if I stay consistent.', today - 18),
(demo_user_id, 'Consistent preparation. Did revision of last week chapters. Sleep has been good this week which I think is really helping my focus and retention.', today - 17),
(demo_user_id, 'Completed a full-length practice test. Scored better than expected — 78 percentile. Feeling motivated. Just need to improve Physical Chemistry.', today - 16),
(demo_user_id, 'Weekend study session was productive. Reviewed weak areas. Family was supportive. Feeling balanced and ready for the week ahead.', today - 15)
ON CONFLICT (user_id, entry_date) DO NOTHING;

-- ─────────────────────────────────────────────
-- WEEK 2 (14–8 days ago): Mock test slump
-- ─────────────────────────────────────────────

INSERT INTO public.daily_metrics (user_id, mood_score, energy_score, confidence_score, sleep_hours, study_hours, check_in_date) VALUES
(demo_user_id, 5, 6, 5, 6.0, 11, today - 14),
(demo_user_id, 4, 5, 4, 5.5, 12, today - 13),
(demo_user_id, 4, 4, 4, 5.0, 13, today - 12),
(demo_user_id, 3, 4, 3, 5.0, 11, today - 11),
(demo_user_id, 4, 4, 3, 5.5, 12, today - 10),
(demo_user_id, 5, 5, 4, 6.0, 10, today - 9),
(demo_user_id, 4, 5, 4, 5.5, 11, today - 8)
ON CONFLICT (user_id, check_in_date) DO NOTHING;

INSERT INTO public.journal_entries (user_id, content, entry_date) VALUES
(demo_user_id, 'Got my mock test results today. 62 percentile. I feel like everyone else is ahead of me. My friends are scoring 90+ and I don''t understand how. Maybe I am just not smart enough for JEE.', today - 14),
(demo_user_id, 'Stayed up until 2am studying but still feel like I''m not retaining anything. My mind is always comparing myself to others. Topper in my coaching scores 180 in physics alone. I feel so far behind. Slept only 5 hours.', today - 13),
(demo_user_id, 'Another mock test. 58 percentile. I studied all day and still performed poorly. Why is everyone else improving and I am stuck? I feel exhausted and don''t know what I am doing wrong.', today - 12),
(demo_user_id, 'Cried today after looking at the AIR rankings. My rank projection keeps dropping. Parents are expecting so much. I studied 11 hours but still feel like a failure. Nobody understands how tired I am.', today - 11),
(demo_user_id, 'Skipped sleep again to finish Electrochemistry. I know I should sleep but there is too much to cover. My confidence is at an all time low. What if I fail? What will everyone think?', today - 10),
(demo_user_id, 'Feeling slightly better today. Talked to my friend who reminded me that mock tests are practice not judgement. Still anxious but trying to reframe my thinking. Sleep was a bit better.', today - 9),
(demo_user_id, 'Attempted a sectional test focused only on Physics. Did better than expected — 75 percentile in just Physics. Maybe I just need to trust my preparation more.', today - 8)
ON CONFLICT (user_id, entry_date) DO NOTHING;

-- ─────────────────────────────────────────────
-- WEEK 3 (7–1 days ago): Partial recovery
-- ─────────────────────────────────────────────

INSERT INTO public.daily_metrics (user_id, mood_score, energy_score, confidence_score, sleep_hours, study_hours, check_in_date) VALUES
(demo_user_id, 5, 6, 5, 6.5, 9, today - 7),
(demo_user_id, 6, 6, 5, 7.0, 10, today - 6),
(demo_user_id, 6, 7, 6, 7.0, 9, today - 5),
(demo_user_id, 7, 7, 6, 7.5, 9, today - 4),
(demo_user_id, 6, 6, 6, 7.0, 10, today - 3),
(demo_user_id, 7, 7, 7, 7.5, 9, today - 2),
(demo_user_id, 7, 7, 6, 7.0, 9, today - 1)
ON CONFLICT (user_id, check_in_date) DO NOTHING;

INSERT INTO public.journal_entries (user_id, content, entry_date) VALUES
(demo_user_id, 'Decided to fix my sleep schedule. 7 hours minimum. Also stopped comparing scores with my coaching batch. Focus on my own growth. Feels more sustainable.', today - 7),
(demo_user_id, 'Good study day. Focused on understanding rather than just covering chapters. Made a proper revision schedule. Sleep is improving and I can feel the difference in focus.', today - 6),
(demo_user_id, 'Reconnected with why I want to do engineering. Not for others but because I genuinely love problem solving. This mindset shift is helping. Journaling every day feels good.', today - 5),
(demo_user_id, 'Mock test today: 71 percentile! Up from 58. Consistent study and proper sleep is working. Feeling more hopeful. The self-comparison thoughts are less frequent now.', today - 4),
(demo_user_id, 'Mid-week check. Staying consistent. 10 hours study, 7 hours sleep. Feeling tired but not burnt out. The difference is I am taking breaks and not studying late night anymore.', today - 3),
(demo_user_id, 'Great day overall. Completed all revision targets. Ate proper meals. 7.5 hours sleep. Talked to my parents about my progress — they were understanding and supportive.', today - 2),
(demo_user_id, '45 days left. Feeling a mix of nervous and prepared. The journey has been hard but I know more than I did 3 weeks ago — both in studies and about managing myself.', today - 1)
ON CONFLICT (user_id, entry_date) DO NOTHING;

-- ─────────────────────────────────────────────
-- AI Insights (representative subset)
-- ─────────────────────────────────────────────

INSERT INTO public.ai_insights (user_id, emotions, dominant_emotion, emotional_summary, coping_strategy, mindfulness_exercise, encouragement, score_inputs, safety_flag, insight_date)
VALUES
(demo_user_id,
  '[{"label":"anxiety","intensity":0.8,"evidence":"compares self to peers, worried about ranking"},{"label":"self_doubt","intensity":0.75,"evidence":"questions own intelligence"}]',
  'anxiety',
  'You are carrying a heavy load of comparison and self-doubt after the mock test results. This is one of the most common challenges JEE aspirants face.',
  '{"title":"Perspective Reset","description":"Write down 3 specific topics you have genuinely improved in this month. Focus on your growth, not others'' scores. Your journey is unique.","duration_minutes":10,"target_emotion":"self_doubt"}',
  '{"title":"4-7-8 Breathing","description":"Breathe in for 4 counts, hold for 7, breathe out for 8. Repeat 4 times. This activates your parasympathetic nervous system.","duration_minutes":5,"target_emotion":"anxiety"}',
  'You have maintained consistent journaling for 8 days straight. That level of self-awareness is a genuine strength that many students overlook.',
  '{"mood_stability":0.45,"energy_stability":0.5,"burnout_risk":0.72,"confidence_trend":0.35,"recovery_habits":0.4}',
  false,
  today - 14),
(demo_user_id,
  '[{"label":"motivation","intensity":0.65,"evidence":"mentions mindset shift and reconnecting with purpose"},{"label":"hope","intensity":0.6,"evidence":"acknowledges improvement and positive trajectory"}]',
  'motivation',
  'There is a meaningful shift in your emotional state this week. You are reconnecting with your intrinsic motivation and the self-comparison thought patterns are reducing.',
  '{"title":"Strength Inventory","description":"Before sleep, note 3 things you handled well today — any size. This trains your brain to notice progress.","duration_minutes":5,"target_emotion":"self_doubt"}',
  '{"title":"Body Scan","description":"Lie down and consciously relax each muscle group from toes to head. Excellent for exam-related tension.","duration_minutes":7,"target_emotion":"anxiety"}',
  'Your mock test score jumped from 58 to 71 percentile in one week. More importantly, your sleep improved by 1.5 hours per night — which research consistently links to better cognitive performance.',
  '{"mood_stability":0.65,"energy_stability":0.62,"burnout_risk":0.45,"confidence_trend":0.62,"recovery_habits":0.72}',
  false,
  today - 4)
ON CONFLICT (user_id, insight_date) DO NOTHING;

-- ─────────────────────────────────────────────
-- Readiness Scores
-- ─────────────────────────────────────────────

INSERT INTO public.readiness_scores (user_id, score, components, explanation, score_date) VALUES
(demo_user_id, 72, '{"mood_stability":0.78,"energy_stability":0.75,"burnout_risk":0.25,"confidence_trend":0.72,"recovery_habits":0.80}', 'Strong week with consistent sleep and high confidence.', today - 15),
(demo_user_id, 52, '{"mood_stability":0.40,"energy_stability":0.42,"burnout_risk":0.78,"confidence_trend":0.30,"recovery_habits":0.38}', 'Mock test results triggered significant anxiety and sleep disruption.', today - 8),
(demo_user_id, 63, '{"mood_stability":0.65,"energy_stability":0.62,"burnout_risk":0.45,"confidence_trend":0.60,"recovery_habits":0.72}', 'Recovering well — sleep improved and self-comparison reduced.', today - 1)
ON CONFLICT (user_id, score_date) DO NOTHING;

-- ─────────────────────────────────────────────
-- Weekly Summaries
-- ─────────────────────────────────────────────

INSERT INTO public.weekly_summaries (user_id, summary, week_ending) VALUES
(demo_user_id,
  'The student exhibited strong emotional stability during Week 1, with consistently positive journaling, adequate sleep (7.5–8h average), and progressive confidence. Week 2 marked a significant downturn triggered by mock test results — self-comparison language intensified sharply, sleep declined to 5–5.5h, and expressions of self-doubt and exhaustion were frequent. Burnout risk indicators were elevated. Week 3 shows meaningful recovery: the student implemented a deliberate sleep schedule (7–7.5h), reduced peer comparison, and reconnected with intrinsic motivation. Journaling consistency has been maintained throughout all three weeks, which is a notable resilience indicator. Mock test percentile improved from 58 to 71 in Week 3.',
  today - 1)
ON CONFLICT (user_id, week_ending) DO NOTHING;

END $$;
