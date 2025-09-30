'use server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

export const signIn = async (email: string, password: string) => {
  try {
    const headersList = await headers();

    const res = await auth.api.signInEmail({
      body: {
        email,
        password,
      },
      asResponse: true,
      headers: headersList,
    });

    if (res.status === 200) {
      return {
        success: true,
        message: 'Sign In Successful',
      };
    } else {
      return {
        success: false,
        message: 'Invalid email or password',
      };
    }
  } catch (error) {
    console.error('Sign in error:', error);
    const e = error as Error;
    return {
      success: false,
      message: e.message || 'An unknown error occurred.',
    };
  }
};

export const signUp = async (
  username: string,
  email: string,
  password: string,
) => {
  try {
    const headersList = await headers();

    const res = await auth.api.signUpEmail({
      body: {
        name: username,
        email,
        password,
      },
      asResponse: true,
      headers: headersList,
    });

    if (res.status === 200 || res.status === 201) {
      return {
        success: true,
        message: 'Sign Up Successful',
      };
    } else {
      const errorData = await res.json().catch(() => ({}));
      console.log('Signup response:', res.status, errorData);

      return {
        success: false,
        message: errorData.message || 'Failed to create account',
      };
    }
  } catch (error) {
    console.error('Sign up error:', error);
    const e = error as Error;
    return {
      success: false,
      message: e.message || 'An unknown error occurred.',
    };
  }
};
