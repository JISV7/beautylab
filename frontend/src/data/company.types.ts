/**
 * Company and Printer types for admin management.
 */

export interface CompanyInfo extends Record<string, unknown> {
  id: number;
  businessName: string;
  rif: string;
  fiscalAddress: string;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Printer extends Record<string, unknown> {
  id: number;
  businessName: string;
  rif: string;
  authorizationProvidence: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyInfoCreate {
  businessName: string;
  rif: string;
  fiscalAddress: string;
  phone?: string | null;
  email?: string | null;
  logoUrl?: string | null;
  isActive?: boolean;
}

export interface PrinterCreate {
  businessName: string;
  rif: string;
  authorizationProvidence: string;
  isActive?: boolean;
}
