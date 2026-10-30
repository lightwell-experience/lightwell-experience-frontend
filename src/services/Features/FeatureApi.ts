import axios from 'axios';

export interface Feature {
  enabled: boolean;
  accessible: boolean;
}

export interface Features {
  snapshots?: Feature;
  admintasks?: Feature;
  kessel?: Feature;
  extendedreleaserepos?: Feature;
  adminpartnerrepositories?: Feature;
  lightwellnotifications?: Feature;
  lightwellbeaconandlens?: Feature;
  lightwellbeacon?: Feature;
  lightwelllens?: Feature;
  lightwellterms?: Feature;
  /** PLACEHOLDER: Hardcoded to false until backend feature flag is implemented */
  partnerrepos?: Feature;
}

export const getFeatures: () => Promise<Features> = async () => {
  const { data } = await axios.get('/api/content-sources/v1/features/');
  // TODO: Remove hardcoded partnerrepos when backend support is added
  return {
    ...data,
    partnerrepos: { enabled: false, accessible: false },
  };
};
