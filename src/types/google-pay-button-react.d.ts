declare module '@google-pay/button-react' {
  import { ComponentType } from 'react';

  export interface GooglePayButtonProps {
    environment: 'TEST' | 'PRODUCTION';
    paymentRequest: {
      apiVersion: number;
      apiVersionMinor: number;
      merchantInfo: {
        merchantId: string;
        merchantName: string;
      };
      allowedPaymentMethods: Array<{
        type: string;
        parameters: {
          allowedAuthMethods: readonly string[] | string[];
          allowedCardNetworks: readonly string[] | string[];
        };
        tokenizationSpecification: {
          type: string;
          parameters: {
            gateway: string;
            gatewayMerchantId: string;
          };
        };
      }>;
      transactionInfo: {
        totalPriceStatus: string;
        totalPriceLabel: string;
        totalPrice: string;
        currencyCode: string;
        countryCode: string;
      };
      callbackIntents?: string[];
      paymentDataCallbacks?: {
        onPaymentAuthorized?: (paymentData: any) => Promise<{
          transactionState: 'SUCCESS' | 'ERROR';
          error?: {
            reason: string;
            message: string;
          };
        }>;
      };
    };
    onLoadPaymentData?: (paymentData: any) => void;
    onError?: (error: any) => void;
    buttonType?: 'pay' | 'book' | 'buy' | 'donate' | 'checkout' | 'subscribe' | 'order';
    buttonColor?: 'default' | 'black' | 'white';
    buttonLocale?: string;
  }

  const GooglePayButton: ComponentType<GooglePayButtonProps>;
  export default GooglePayButton;
}

