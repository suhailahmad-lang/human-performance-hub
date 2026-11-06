import { toPlannerProfile, type Profile } from "./data";
export { trainingDayCount, allowHighIntensity } from "./planner";
export const toPlannerProfileSafe = (p: Profile) => toPlannerProfile(p);
