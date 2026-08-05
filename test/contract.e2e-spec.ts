import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { App } from "supertest/types";
import jwt from "jsonwebtoken";
import { AppModule } from "../src/app.module";

describe("API Contract Validation (e2e)", () => {
  let app: INestApplication<App>;
  let token: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    // Generate valid JWT token for bypass
    token = jwt.sign(
      {
        userId: "550e8400-e29b-41d4-a716-446655440000",
        email: "admin@futureinternationalschool.com",
        permissions: ["*"],
        role: "Admin",
        campusId: "550e8400-e29b-41d4-a716-446655440001",
      },
      "hemvant"
    );
  });

  it("POST /visitor - rejects empty payload with 400 Bad Request", () => {
    return request(app.getHttpServer())
      .post("/visitor")
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(400);
  });

  it("POST /visitor - rejects invalid phone type", () => {
    return request(app.getHttpServer())
      .post("/visitor")
      .set("Authorization", `Bearer ${token}`)
      .send({
        fullName: "John Doe",
        phone: 12345, // invalid type, should be string
        purpose: "Meeting",
      })
      .expect(400);
  });

  afterAll(async () => {
    await app.close();
  });
});
