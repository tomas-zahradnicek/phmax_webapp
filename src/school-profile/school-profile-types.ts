export type SchoolProfile = {
  id: string;
  name: string;
  ico: string;
  redIzo: string;
  izo: string;
  schoolType: string;
  address: string;
  municipality: string;
  region: string;
  founder: string;
  principalName: string;
  website: string;
  email: string;
  phone: string;
  dataBox: string;
  createdAt: string;
  updatedAt: string;
};

export type SchoolProfileFieldKey = keyof Omit<SchoolProfile, "id" | "createdAt" | "updatedAt">;
