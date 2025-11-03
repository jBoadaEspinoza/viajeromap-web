export interface AppConfig {
  business: {
    name: string;
    website: string;
    phone: string;
    address: string;
    email: string;
    urlLogo: string;
  };
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  api: {
    baseUrl: string;
    timeout: number;
  };
  paypal: {
    clientId: string;
    secretKey: string;
    environment: string;
    currency: string;
    baseUrl?: string;
    redirectBaseUrl?: string;
  };
  pricing: {
    defaultCommissionPercentage: number;
  };
  loading: {
    backgroundColor: string;
    spinnerColor: string;
    textColor: string;
    backdropBlur: string;
    zIndex: number;
  };
}

export const appConfig: AppConfig = {
  business: {
    name: "viajeromap",
    website: "www.viajeromap.com",
    phone: "+51919026082",
    address: "Av Paracas Mz Lot 05 Paracas, Ica, Perú",
    email: "info@viajeromap.com",
    urlLogo: "https://firebasestorage.googleapis.com/v0/b/gestionafacil-92adb.firebasestorage.app/o/companies%2Fffb93748-8cac-4b18-affc-2923a1806eda.png?alt=media&token=78f4283b-e92c-4a8f-ac3f-9e948a299399"
  },
  colors: {
    primary: "#DC143C",
    secondary: "#2C3E50",
    accent: "#FFC107"
  },
  api: {
    baseUrl: "https://tg4jd2gc-8080.brs.devtunnels.ms",
    timeout: 10000
  },
  paypal: {
    clientId: "AasgdTxSUz2plju5i_XUtXjgF8LepczWTmvCFfLRUMiJ8pqRobCqYT9r_r2nuXX2LVSdPRfimCXVtD5T",
    secretKey: "AasgdTxSUz2plju5i_XUtXjgF8LepczWTmvCFfLRUMiJ8pqRobCqYT9r_r2nuXX2LVSdPRfimCXVtD5T",
    environment: "sandbox",
    currency: "USD",
    baseUrl: "https://sandbox.paypal.com",
    redirectBaseUrl: typeof window !== 'undefined' ? (
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? `${window.location.protocol}//${window.location.hostname}:3000`
        : window.location.origin
    ) : ''
  },
  pricing: {
    defaultCommissionPercentage: 15
  },
  loading: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    spinnerColor: "#FFFFFF",
    textColor: "#FFFFFF",
    backdropBlur: "3px",
    zIndex: 9999
  }
};

export default appConfig; 