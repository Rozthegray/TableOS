import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import dbConnect from "./db"
import User from "@/models/User"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password")
        }

        await dbConnect()
// Find user and explicitly select the password field
        const user = await User.findOne({ email: credentials.email }).select('+password')
        
        // 🛡️ THE FIX: explicitly check if user OR user.password is missing
        if (!user || !user.password) {
          throw new Error("Invalid email or password")
        }

        // Now TypeScript knows user.password is a 100% guaranteed string
        const isMatch = await bcrypt.compare(credentials.password, user.password)
        if (!isMatch) throw new Error("Invalid email or password")
        // Return the user object (this gets passed to the JWT)
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role, // Pass the role!
        }
      }
    })
  ],
  callbacks: {
    // 1. Put the role into the secure JWT token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    // 2. Make the role available to the frontend session
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session
    }
  },
  pages: {
    signIn: '/login', // We will build this page next!
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
}