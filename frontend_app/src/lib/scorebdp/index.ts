import { apiRepository } from "./api-repository";
import { demoRepository } from "./demo-repository";
export const dataMode =
  process.env.NEXT_PUBLIC_DATA_MODE === "api" ? "api" : "demo";
export const repository = dataMode === "api" ? apiRepository : demoRepository;
