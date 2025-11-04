declare module '@stripe/stripe-js' {
  export interface Stripe {
    confirmPayment(options: {
      elements: any;
      confirmParams: {
        return_url: string;
      };
      redirect?: string;
    }): Promise<{
      error?: any;
      paymentIntent?: {
        id: string;
        status: string;
      };
    }>;
  }

  export interface StripeElementsOptions {
    mode: 'payment' | 'subscription' | 'setup';
    amount?: number;
    currency?: string;
    locale?: string;
    appearance?: {
      theme?: 'stripe' | 'night' | 'flat';
    };
  }

  export function loadStripe(publicKey: string): Promise<Stripe | null>;
}

declare module '@stripe/react-stripe-js' {
  import { Stripe, StripeElementsOptions } from '@stripe/stripe-js';
  import { ComponentType, ReactNode } from 'react';

  export interface ElementsProps {
    stripe: Promise<Stripe | null> | null;
    options?: StripeElementsOptions;
    children: ReactNode;
  }

  export const Elements: ComponentType<ElementsProps>;

  export function useStripe(): Stripe | null;
  export function useElements(): any;
  export const PaymentElement: ComponentType<any>;
  export const LinkAuthenticationElement: ComponentType<any>;
  // CardElement está deprecado, usar PaymentElement en su lugar
}

