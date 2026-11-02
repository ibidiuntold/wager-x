// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import pool from '@/lib/mysql';
import type { RowDataPacket } from 'mysql2';
import type { JWT } from "next-auth/jwt";
import type { Session, User as NextAuthUser } from "next-auth"; // Import `User` as `NextAuthUser` to avoid name collision
import { VerifyEmail } from '@/services/emailService';

// Import the custom SessionUser type
import type { SessionUser } from '@/types/auth'; // Adjust path if needed

export const authOptions = {

  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'user@example.com' },
        password: { label: 'Password', type: 'password' },
      },
      // Explicitly define the return type as `Promise<NextAuthUser | null>`
      // to match NextAuth's expected type.
      async authorize(credentials): Promise<NextAuthUser | null> {
        console.log('Authorize function started with credentials:', credentials);

        // Throw an error for better client-side feedback if credentials are missing
        if (!credentials?.email || !credentials?.password) {
          console.log('Missing email or password.');
          throw new Error('Invalid email or password.');
        }

        try {
          // Query the database for the user with the provided email
          const [rows] = await pool.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [credentials.email]);
          const user = rows[0];

          if (!user?.status) {
            console.log('No user found with that email.');
            throw new Error('Invalid email or password.');
          }

          // Check email verification first
          if (!user.emailVerified) {
            // Send verification email
            try {
              await VerifyEmail(credentials.email);
            } catch (emailError) {
              console.error('Failed to send verification email:', emailError);
              // Log this error but don't fail the request, as the user was created successfully.
            }
            throw new Error('Your email is not verified yet. Please check your inbox and verify your account.');
          }

          switch (user.status) {            case 'pending':
              // Send verification email
              try {
                await VerifyEmail(credentials.email);
              } catch (emailError) {
                console.error('Failed to send verification email:', emailError);
                // Log this error but don't fail the request, as the user was created successfully.
              }
              throw new Error('Your email verification is still pending. Please check your inbox and verify your account.');
            case 'suspended':
              throw new Error('Your account has been suspended. Please wait until the suspension period ends or contact support.');
            case 'banned':
              throw new Error('Your account has been permanently banned. Contact support for more information.');
            case 'inactive':
              throw new Error('Your account is inactive. Please contact support to reactivate your account.');
            case 'active':
              // allow sign in
              break;
            default:
              throw new Error('Account status is invalid. Please contact support.');
          }


          console.log('User found:', user.email);

          // Use bcrypt to compare passwords
          const isValid = await compare(credentials.password, user.password);

          // Throw an error if the password is not valid
          if (!isValid) {
            console.log('Password comparison failed. Passwords do not match.');
            throw new Error('Invalid email or password.');
          }

          console.log('✅ Password is valid. Authentication successful!');

          // Return the full SessionUser object. NextAuth will merge this with
          // its internal `User` type.
          const sessionUser: SessionUser = {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            dob: user.dob,
            nickname: user.nickname,
            phoneNumber: user.phoneNumber,
            avatarUrl: user.avatarUrl,
            referralCode: user.referralCode,
            status: user.status,
          };

          return sessionUser;
        } catch (error) {
          // Log the detailed error and throw a generic one to the client
          console.error('Authorize error: ', error);
          if (error instanceof Error) {
            throw new Error(error.message);
          }
          throw new Error('An error occurred during authentication.');
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt' as const,
  },
  callbacks: {
    // This callback is for adding user information to the JWT token.
    // The `user` object is only available on the first sign-in.
    // We check for its existence and then safely add the custom properties to the token.
    async jwt({ token, user }: { token: JWT; user?: NextAuthUser }) {
      if (user) {
        const sessionUser = user as SessionUser;
        token.id = sessionUser.id;
        token.role = sessionUser.role;
        token.firstName = sessionUser.firstName;
        token.lastName = sessionUser.lastName;
        token.dob = sessionUser.dob;
        token.nickname = sessionUser.nickname;
        token.phoneNumber = sessionUser.phoneNumber;
        token.avatarUrl = sessionUser.avatarUrl;
        token.referralCode = sessionUser.referralCode;
        token.status = sessionUser.status;
      }
      return token;
    },
    // This callback is for adding token information to the session object.
    // We check for the custom `role` property on the token before assigning properties to the session.
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.dob = token.dob;
        session.user.nickname = token.nickname;
        session.user.phoneNumber = token.phoneNumber;
        session.user.avatarUrl = token.avatarUrl;
        session.user.referralCode = token.referralCode;
        session.user.status = token.status;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
