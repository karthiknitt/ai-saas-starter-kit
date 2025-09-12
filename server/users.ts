'use server';
import { auth } from '@/lib/auth';

export const signIn = async (email: string, password: string) => {
  try {
    await auth.api.signInEmail({
      body: {
        email,
        password,
      },
    });
    return {
      success: true,
      message: 'SignIn Successful',
    };
    //console.log('Signed in successfully');
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || 'An Unknown error occurred.',
    };
  }
};
export const signUp = async (
  username: string,
  email: string,
  password: string,
) => {
  try {
    await auth.api.signUpEmail({
      body: {
        name: username,
        email,
        password,
      },
    });
    return {
      success: true,
      message: 'SignUp Successful',
    };
  } catch (error) {
    const e = error as Error;
    return {
      success: false,
      message: e.message || 'An Unknown error occurred.',
    };
  }
};
