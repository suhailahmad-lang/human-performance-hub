REVOKE ALL ON public.profiles, public.training_plans, public.planned_workouts, public.workout_sessions, public.set_logs, public.progress_records FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles, public.training_plans, public.planned_workouts, public.workout_sessions, public.set_logs, public.progress_records TO authenticated;
GRANT ALL ON public.profiles, public.training_plans, public.planned_workouts, public.workout_sessions, public.set_logs, public.progress_records, public.exercises TO service_role;
REVOKE ALL ON public.exercises FROM anon, authenticated;
GRANT SELECT ON public.exercises TO anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
ALTER POLICY "own profile update" ON public.profiles WITH CHECK (auth.uid() = id);
ALTER TABLE public.training_plans ADD CONSTRAINT training_plans_id_owner_unique UNIQUE (id, user_id);
ALTER TABLE public.planned_workouts ADD CONSTRAINT planned_workouts_id_owner_unique UNIQUE (id, user_id);
ALTER TABLE public.workout_sessions ADD CONSTRAINT workout_sessions_id_owner_unique UNIQUE (id, user_id);
ALTER TABLE public.planned_workouts ADD CONSTRAINT planned_workouts_owned_parent FOREIGN KEY (plan_id, user_id) REFERENCES public.training_plans(id, user_id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.workout_sessions ADD CONSTRAINT workout_sessions_owned_parent FOREIGN KEY (planned_workout_id, user_id) REFERENCES public.planned_workouts(id, user_id) ON DELETE SET NULL (planned_workout_id) NOT VALID;
ALTER TABLE public.set_logs ADD CONSTRAINT set_logs_owned_parent FOREIGN KEY (session_id, user_id) REFERENCES public.workout_sessions(id, user_id) ON DELETE CASCADE NOT VALID;
ALTER TABLE public.planned_workouts VALIDATE CONSTRAINT planned_workouts_owned_parent;
ALTER TABLE public.workout_sessions VALIDATE CONSTRAINT workout_sessions_owned_parent;
ALTER TABLE public.set_logs VALIDATE CONSTRAINT set_logs_owned_parent;
ALTER POLICY "own planned" ON public.planned_workouts WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.training_plans p WHERE p.id = plan_id AND p.user_id = auth.uid()));
ALTER POLICY "own sessions" ON public.workout_sessions WITH CHECK (auth.uid() = user_id AND (planned_workout_id IS NULL OR EXISTS (SELECT 1 FROM public.planned_workouts p WHERE p.id = planned_workout_id AND p.user_id = auth.uid())));
ALTER POLICY "own sets" ON public.set_logs WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.workout_sessions s WHERE s.id = session_id AND s.user_id = auth.uid()));
CREATE OR REPLACE FUNCTION public.replace_training_plan(p_start date, p_rationale text[], p_safety text[], p_days jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE owner_id uuid := auth.uid(); new_plan uuid;
BEGIN
 IF owner_id IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 IF jsonb_typeof(p_days) IS DISTINCT FROM 'array' OR jsonb_array_length(p_days) NOT BETWEEN 1 AND 7 THEN RAISE EXCEPTION 'Invalid training days'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(owner_id::text, 0));
 INSERT INTO public.training_plans(user_id,week_start,rationale,safety_notes,active) VALUES(owner_id,p_start,p_rationale,p_safety,false) RETURNING id INTO new_plan;
 INSERT INTO public.planned_workouts(plan_id,user_id,scheduled_date,domain,title,focus,duration_min,intensity,blocks)
 SELECT new_plan,owner_id,p_start + d."dayOffset",d.domain,d.title,d.focus,d.duration_min,d.intensity,d.blocks
 FROM jsonb_to_recordset(p_days) AS d("dayOffset" int, domain text,title text,focus text,duration_min int,intensity text,blocks jsonb);
 IF EXISTS (SELECT 1 FROM public.planned_workouts WHERE plan_id=new_plan AND (scheduled_date < p_start OR scheduled_date > p_start+6)) THEN RAISE EXCEPTION 'Invalid schedule'; END IF;
 UPDATE public.training_plans SET active=false WHERE user_id=owner_id AND active;
 UPDATE public.training_plans SET active=true WHERE id=new_plan;
 UPDATE public.profiles SET onboarded=true WHERE id=owner_id;
 RETURN new_plan;
END $$;
REVOKE ALL ON FUNCTION public.replace_training_plan(date,text[],text[],jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.replace_training_plan(date,text[],text[],jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.finish_workout(p_workout uuid, p_status text, p_duration int, p_rpe int, p_notes text, p_date date, p_sets jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE owner_id uuid := auth.uid(); workout public.planned_workouts%ROWTYPE; saved_id uuid;
BEGIN
 IF owner_id IS NULL THEN RAISE EXCEPTION 'Sign in required'; END IF;
 SELECT * INTO workout FROM public.planned_workouts WHERE id=p_workout AND user_id=owner_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Workout not found'; END IF;
 SELECT id INTO saved_id FROM public.workout_sessions WHERE planned_workout_id=p_workout AND user_id=owner_id ORDER BY created_at LIMIT 1;
 IF saved_id IS NOT NULL THEN RETURN saved_id; END IF;
 IF workout.status <> 'planned' THEN RAISE EXCEPTION 'Workout already closed'; END IF;
 IF p_status IS NULL OR p_status NOT IN ('completed','modified','skipped') THEN RAISE EXCEPTION 'Invalid status'; END IF;
 IF p_status <> 'skipped' AND (p_duration IS NULL OR p_duration NOT BETWEEN 1 AND 600 OR p_rpe IS NULL OR p_rpe NOT BETWEEN 1 AND 10) THEN RAISE EXCEPTION 'Invalid duration or RPE'; END IF;
 IF p_date IS NULL OR jsonb_typeof(p_sets) IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Invalid log'; END IF;
 INSERT INTO public.workout_sessions(user_id,planned_workout_id,performed_on,domain,title,duration_min,rpe,notes,status)
 VALUES(owner_id,p_workout,p_date,workout.domain,workout.title,CASE WHEN p_status='skipped' THEN 0 ELSE p_duration END,CASE WHEN p_status='skipped' THEN NULL ELSE p_rpe END,p_notes,p_status) RETURNING id INTO saved_id;
 IF p_status <> 'skipped' THEN
 INSERT INTO public.set_logs(session_id,user_id,exercise_name,set_number,reps,load_kg,seconds,distance_m)
 SELECT saved_id,owner_id,s.exercise_name,s.set_number,s.reps,s.load_kg,s.seconds,s.distance_m FROM jsonb_to_recordset(p_sets) AS s(exercise_name text,set_number int,reps int,load_kg numeric,seconds int,distance_m numeric);
 END IF;
 UPDATE public.planned_workouts SET status=CASE WHEN p_status='skipped' THEN 'skipped' ELSE 'completed' END WHERE id=p_workout AND user_id=owner_id;
 RETURN saved_id;
END $$;
REVOKE ALL ON FUNCTION public.finish_workout(uuid,text,int,int,text,date,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finish_workout(uuid,text,int,int,text,date,jsonb) TO authenticated;