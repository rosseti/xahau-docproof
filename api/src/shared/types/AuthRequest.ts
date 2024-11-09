import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    iat: number;
    exp: number;
    client_id: string,
    state: string;
    scope: string;
    aud: string;
    sub: string;
    email: string;
    app_uuidv4: string;
    app_name: string;
    payload_uuidv4: string;
    usertoken_uuidv4: string;
    network_type: string;
    network_endpoint: string;
    network_id: string;
    iss: string;
  };
}
