import { Logger } from '@nestjs/common';

export class SimulationApiClient {
  private readonly logger = new Logger(SimulationApiClient.name);
  private token: string | null = null;
  private readonly baseUrl: string;

  constructor(port = 8000) {
    this.baseUrl = `http://localhost:${port}`;
  }

  async login(email: string, password = 'Staff@123'): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        this.logger.error(`Login failed for ${email}: ${response.statusText}`);
        return false;
      }

      const data = await response.json();
      this.token = data.accessToken || data.token;
      return true;
    } catch (error) {
      this.logger.error(`Connection error logging in ${email}: ${error.message}`);
      return false;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async post(path: string, body: any): Promise<{ status: number; data: any }> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      return { status: response.status, data };
    } catch (error) {
      return { status: 500, data: { error: error.message } };
    }
  }

  async get(path: string): Promise<{ status: number; data: any }> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const text = await response.text();
      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      return { status: response.status, data };
    } catch (error) {
      return { status: 500, data: { error: error.message } };
    }
  }
}
