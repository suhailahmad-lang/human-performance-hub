
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  age_range text,
  height_cm numeric check (height_cm is null or (height_cm between 80 and 250)),
  weight_kg numeric check (weight_kg is null or (weight_kg between 20 and 350)),
  gender text,
  experience text check (experience in ('beginner','intermediate','advanced')),
  primary_goal text,
  secondary_goals text[] not null default '{}',
  days_per_week int check (days_per_week between 1 and 7),
  session_minutes int check (session_minutes between 10 and 180),
  equipment text[] not null default '{}',
  location text,
  preferred_domains text[] not null default '{}',
  activity_level text,
  limitations text,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "own profile delete" on public.profiles for delete to authenticated using (auth.uid() = id);

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name) values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  domain text not null check (domain in ('strength','calisthenics','sprint','endurance','combat','mobility','plyometrics','cardio','yoga','recovery')),
  difficulty text not null check (difficulty in ('beginner','intermediate','advanced')),
  equipment text[] not null default '{}',
  pattern text not null,
  description text not null,
  cues text[] not null default '{}',
  prescription text not null,
  high_intensity boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.exercises to anon, authenticated;
grant all on public.exercises to service_role;
alter table public.exercises enable row level security;
create policy "catalogue readable" on public.exercises for select to anon, authenticated using (true);

create table public.training_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  week_start date not null,
  rationale text[] not null default '{}',
  safety_notes text[] not null default '{}',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index on public.training_plans(user_id, active);
grant select, insert, update, delete on public.training_plans to authenticated;
grant all on public.training_plans to service_role;
alter table public.training_plans enable row level security;
create policy "own plans" on public.training_plans for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.planned_workouts (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.training_plans(id) on delete cascade,
  user_id uuid not null,
  scheduled_date date not null,
  domain text not null,
  title text not null,
  focus text not null,
  duration_min int not null check (duration_min between 5 and 240),
  intensity text not null check (intensity in ('low','moderate','high')),
  blocks jsonb not null default '{}'::jsonb,
  status text not null default 'planned' check (status in ('planned','completed','skipped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.planned_workouts(user_id, scheduled_date);
grant select, insert, update, delete on public.planned_workouts to authenticated;
grant all on public.planned_workouts to service_role;
alter table public.planned_workouts enable row level security;
create policy "own planned" on public.planned_workouts for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create trigger planned_touch before update on public.planned_workouts for each row execute function public.touch_updated_at();

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  planned_workout_id uuid references public.planned_workouts(id) on delete set null,
  performed_on date not null default current_date,
  domain text not null,
  title text not null,
  duration_min int not null check (duration_min between 0 and 600),
  rpe int check (rpe between 1 and 10),
  notes text check (char_length(notes) <= 2000),
  status text not null default 'completed' check (status in ('completed','skipped','modified')),
  created_at timestamptz not null default now()
);
create index on public.workout_sessions(user_id, performed_on);
grant select, insert, update, delete on public.workout_sessions to authenticated;
grant all on public.workout_sessions to service_role;
alter table public.workout_sessions enable row level security;
create policy "own sessions" on public.workout_sessions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.set_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null,
  exercise_name text not null,
  set_number int not null check (set_number between 1 and 50),
  reps int check (reps between 0 and 1000),
  load_kg numeric check (load_kg between 0 and 1000),
  seconds int check (seconds between 0 and 36000),
  distance_m numeric check (distance_m between 0 and 200000),
  created_at timestamptz not null default now()
);
create index on public.set_logs(user_id, session_id);
grant select, insert, update, delete on public.set_logs to authenticated;
grant all on public.set_logs to service_role;
alter table public.set_logs enable row level security;
create policy "own sets" on public.set_logs for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.progress_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  recorded_on date not null default current_date,
  energy int check (energy between 1 and 5),
  sleep_quality int check (sleep_quality between 1 and 5),
  soreness int check (soreness between 1 and 5),
  notes text check (char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  unique (user_id, recorded_on)
);
grant select, insert, update, delete on public.progress_records to authenticated;
grant all on public.progress_records to service_role;
alter table public.progress_records enable row level security;
create policy "own progress" on public.progress_records for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into public.exercises (slug,name,domain,difficulty,equipment,pattern,description,cues,prescription,high_intensity) values
('goblet-squat','Goblet Squat','strength','beginner','{dumbbell,kettlebell}','squat','Front-loaded squat that builds leg strength and teaches upright posture.','{"Hold weight at chest","Knees track over toes","Sit between the hips"}','3 x 8-10, rest 90s',false),
('back-squat','Barbell Back Squat','strength','intermediate','{barbell,rack}','squat','Foundational lower-body strength lift.','{"Brace before descent","Full-foot pressure","Drive hips and chest together"}','4 x 5, rest 2-3 min',false),
('romanian-deadlift','Romanian Deadlift','strength','intermediate','{barbell,dumbbell}','hinge','Hip hinge building hamstrings and posterior chain.','{"Soft knees","Push hips back","Bar close to legs"}','3 x 8, rest 2 min',false),
('db-bench-press','Dumbbell Bench Press','strength','beginner','{dumbbell,bench}','push','Horizontal press for chest, shoulders and triceps.','{"Shoulder blades set","Elbows ~45°","Controlled lowering"}','3 x 8-10, rest 90s',false),
('one-arm-row','One-Arm Dumbbell Row','strength','beginner','{dumbbell,bench}','pull','Unilateral row for upper back.','{"Flat back","Pull elbow to hip","Pause at top"}','3 x 10 each, rest 60s',false),
('overhead-press','Standing Overhead Press','strength','intermediate','{barbell,dumbbell}','push','Vertical press building shoulder strength.','{"Squeeze glutes","Bar path straight","Head through at top"}','3 x 6-8, rest 2 min',false),
('push-up','Push-Up','calisthenics','beginner','{none}','push','Bodyweight horizontal press. Elevate hands to regress.','{"Body in one line","Hands under shoulders","Chest to fist height"}','3 x AMRAP-2, rest 60s',false),
('pull-up','Pull-Up','calisthenics','intermediate','{pullup_bar}','pull','Vertical pull. Use band or negatives to regress.','{"Start from dead hang","Lead with chest","Control descent"}','4 x 3-8, rest 2 min',false),
('inverted-row','Inverted Row','calisthenics','beginner','{pullup_bar,rings}','pull','Horizontal bodyweight row.','{"Rigid body","Pull chest to bar","Squeeze shoulder blades"}','3 x 8-12, rest 60s',false),
('pistol-progression','Assisted Pistol Squat','calisthenics','intermediate','{none}','squat','Single-leg squat progression using support.','{"Hold a post","Slow descent","Knee over mid-foot"}','3 x 5 each, rest 90s',false),
('hollow-hold','Hollow Body Hold','calisthenics','beginner','{none}','core','Anti-extension core position.','{"Low back pressed down","Arms by ears","Breathe shallow"}','3 x 20-30s',false),
('a-skip','A-Skip Drill','sprint','beginner','{none}','locomotion','Sprint mechanics drill for posture and rhythm.','{"Tall posture","Knee to hip height","Strike under hips"}','3 x 20m',false),
('acceleration-20','20m Acceleration','sprint','intermediate','{track}','locomotion','Short max-intent accelerations with full recovery.','{"Forward lean","Push the ground back","Full rest between reps"}','6 x 20m, walk-back + 90s',true),
('flying-30','Flying 30m Sprint','sprint','advanced','{track}','locomotion','Top-speed exposure after a build-up zone.','{"Relax face and hands","Stay tall","Stop if any tightness"}','4 x 30m fly, rest 3-4 min',true),
('zone2-run','Zone 2 Run','endurance','beginner','{none}','locomotion','Easy aerobic run at conversational pace.','{"Nasal breathing pace","Light quick steps","Walk breaks are fine"}','25-45 min easy',false),
('tempo-run','Tempo Run','endurance','intermediate','{none}','locomotion','Sustained comfortably-hard effort.','{"Even pacing","Relaxed shoulders","RPE 6-7"}','3 x 8 min, 2 min easy',false),
('long-ride','Long Easy Ride','endurance','beginner','{bike}','cycling','Low-intensity cycling for aerobic base.','{"Steady cadence","Stay conversational","Fuel if >60 min"}','45-90 min easy',false),
('shadow-boxing','Shadow Boxing Rounds','combat','beginner','{none}','striking','Skill conditioning: stance, footwork and combinations in the air.','{"Hands up, chin down","Turn hips","Stay light on feet"}','5 x 2 min, 1 min rest',false),
('heavy-bag','Heavy Bag Intervals','combat','intermediate','{heavy_bag}','striking','Bag conditioning rounds for power endurance and technique.','{"Wrap hands","Exhale on strike","Technique over force"}','6 x 2 min, 1 min rest',true),
('footwork-ladder','Footwork Ladder Drill','combat','beginner','{agility_ladder}','locomotion','Agility and footwork rhythm for combat sports.','{"Stay on balls of feet","Quiet contacts","Eyes up"}','4 x 30s',false),
('sprawl-drill','Sprawl Conditioning','combat','intermediate','{none}','conditioning','Grappling-style conditioning drill (fitness only).','{"Hips to floor","Quick return to stance","Keep breathing"}','5 x 30s on / 30s off',true),
('worlds-greatest','World''s Greatest Stretch','mobility','beginner','{none}','mobility','Full-body mobility flow for hips, T-spine and hamstrings.','{"Long lunge","Elbow to instep","Rotate open slowly"}','2 x 5 each side',false),
('90-90','90/90 Hip Switches','mobility','beginner','{none}','mobility','Hip internal/external rotation.','{"Tall spine","Move slowly","Use hands if needed"}','2 x 8 switches',false),
('cars-shoulder','Shoulder CARs','mobility','beginner','{none}','mobility','Controlled articular rotations for shoulder health.','{"Brace the trunk","Biggest pain-free circle","Slow"}','2 x 3 each direction',false),
('ankle-rock','Ankle Rocks','mobility','beginner','{none}','mobility','Ankle dorsiflexion mobility.','{"Heel stays down","Knee over toes","Pulse gently"}','2 x 10 each',false),
('box-jump','Box Jump','plyometrics','intermediate','{box}','jump','Explosive jump with soft landing on a box.','{"Arm swing","Land soft and quiet","Step down, don''t jump down"}','4 x 4, full rest',true),
('pogo-hops','Pogo Hops','plyometrics','beginner','{none}','jump','Low-amplitude ankle stiffness hops.','{"Stiff ankles","Quick contacts","Stay tall"}','3 x 20',false),
('broad-jump','Broad Jump','plyometrics','intermediate','{none}','jump','Horizontal power jump.','{"Load hips","Explode forward","Stick the landing"}','4 x 3, full rest',true),
('skater-bounds','Skater Bounds','plyometrics','beginner','{none}','jump','Lateral bounding for single-leg power and control.','{"Push sideways","Land on one foot","Hold 1s"}','3 x 6 each',false),
('brisk-walk','Brisk Walk','cardio','beginner','{none}','locomotion','Accessible low-impact cardio.','{"Arms swing","Steady breathing","Comfortable pace"}','20-40 min',false),
('rower-intervals','Rower Intervals','cardio','intermediate','{rower}','rowing','Rowing intervals for full-body cardio.','{"Legs-body-arms","Arms-body-legs on return","Smooth strokes"}','8 x 1 min hard / 1 min easy',true),
('jump-rope','Jump Rope','cardio','beginner','{jump_rope}','jump','Rhythmic cardio and coordination.','{"Wrists turn the rope","Small hops","Relaxed shoulders"}','10 x 1 min, 30s rest',false),
('bike-steady','Steady Bike','cardio','beginner','{bike}','cycling','Steady-state cycling cardio.','{"Moderate effort","Smooth pedalling","Upright posture"}','20-40 min',false),
('sun-salutation','Sun Salutation A','yoga','beginner','{mat}','flow','Classic flowing sequence linking breath and movement.','{"Move with the breath","Soft knees allowed","No forcing"}','5 rounds',false),
('warrior-flow','Standing Warrior Flow','yoga','beginner','{mat}','flow','Strength and balance standing sequence.','{"Front knee over ankle","Long spine","Steady gaze"}','3 rounds each side',false),
('nadi-shodhana','Nadi Shodhana (Alternate Nostril)','yoga','beginner','{none}','breathing','Calm alternate-nostril breathing practice.','{"Sit tall","Slow even breaths","Stop if lightheaded"}','5 min',false),
('box-breathing','Box Breathing','recovery','beginner','{none}','breathing','4-4-4-4 breathing pattern to downshift.','{"Inhale 4","Hold 4","Exhale 4, hold 4"}','5 min',false),
('body-scan','Body Scan Meditation','recovery','beginner','{none}','meditation','Guided attention through the body to relax.','{"Lie or sit comfortably","Notice without judging","Return gently when distracted"}','10 min',false),
('foam-roll','Foam Rolling','recovery','beginner','{foam_roller}','soft_tissue','Self-massage for recovery feel.','{"Slow passes","Avoid joints","Breathe"}','8-10 min',false),
('easy-walk-recovery','Recovery Walk','recovery','beginner','{none}','locomotion','Gentle walk to promote recovery.','{"Very easy pace","Enjoy it","Nasal breathing"}','15-30 min',false);
