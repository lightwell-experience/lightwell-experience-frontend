import axios from 'axios';

export interface TermsRequiredResponse {
  required: boolean;
  site?: string;
  events?: string[];
}

export const getTermsRequired = async (): Promise<TermsRequiredResponse> => {
  const { data } = await axios.get<TermsRequiredResponse>(
    '/api/content-sources/v1/lightwell/terms/required',
    { timeout: 10_000 },
  );
  return data;
};
