export type EmailStatus = "sent" | "failed" | "draft";
export type UserPlan = "free" | "pro";

export interface Profile {
  id: string;
  plan: UserPlan;
  stripe_customer_id: string | null;
  stripe_subscription_status: string | null;
  current_period_end: string | null;
  full_name?: string | null;
  sign_off?: string | null;
  portfolio_url?: string | null;
  github_url?: string | null;
  linkedin_url?: string | null;
  phone?: string | null;
  custom_signature?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  user_id?: string;
  file_url: string;
  file_name?: string | null;
  skills_summary: string;
  created_at: string;
  updated_at: string;
}

export interface SentEmail {
  id: string;
  user_id?: string;
  jd_text: string;
  hr_email: string;
  company_name: string | null;
  role_title: string | null;
  generated_subject: string;
  generated_body: string;
  final_subject: string;
  final_body: string;
  status: EmailStatus;
  error_message: string | null;
  created_at: string;
}

export interface AnalyzeRequest {
  jdText: string;
}

export interface AnalyzeResponse {
  subject: string;
  body: string;
  companyName?: string;
  roleTitle?: string;
  skills?: string[];
  seniority?: string;
}

export interface SendEmailRequest {
  hrEmail: string;
  subject: string;
  body: string;
  jdText: string;
  companyName?: string;
  roleTitle?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface GmailConnection {
  id: string;
  user_id: string;
  gmail_address: string;
  refresh_token_encrypted: string;
  iv: string;
  tag: string;
  connected_at: string;
  revoked_at: string | null;
}

export interface GmailConnectionStatus {
  connected: boolean;
  email?: string;
  connectedAt?: string;
}
