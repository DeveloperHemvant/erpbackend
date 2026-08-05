import { NestFactory } from "@nestjs/core";
import { AppModule } from "../../app.module";
import { SimulatorService } from "./simulator.service";

async function bootstrap() {
  console.log("Bootstrapping NestJS Context for ESOS Simulator...");
  const app = await NestFactory.createApplicationContext(AppModule);
  const simulator = app.get(SimulatorService);
  
  // Run simulation with 3 Campuses, 6000 Students, 3 Academic Sessions
  await simulator.runSimulation({
    campuses: 3,
    students: 6000,
    sessions: 3,
    startYear: 2025,
  });

  console.log("Shutting down ESOS Standalone Context.");
  await app.close();
}

bootstrap().catch((err) => {
  console.error("Simulation run failed:", err);
  process.exit(1);
});
