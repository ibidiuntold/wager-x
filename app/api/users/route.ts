import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser, getUserById, updateUserProfile, getUserByNickname, getFilteredUsers } from '@/services/userService';
import { VerifyEmail } from '@/services/emailService'; 
import { v4 as uuidv4 } from 'uuid';
import { hash, genSalt } from 'bcryptjs';
import { getToken } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      dob,
      nickname,
      phoneNumber,
      avatarUrl,
      referralCode,
      role,
      status = 'pending',
    } = await req.json();

    // Basic validation
    if (!email || !password || !nickname) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check for existing user
    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Hash password and prepare user data
    const id = uuidv4();
    const salt = await genSalt(10);
    const hashedPassword = await hash(password, salt);
    const now = new Date();
    const bonus = 500;

    const userData = {
      id,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      dob: dob || null,
      nickname: nickname || null,
      phoneNumber: phoneNumber || null,
      avatarUrl: avatarUrl || null,
      referralCode: referralCode || null,
      role: role || 'user',
      status,
      createdAt: now,
      updatedAt: now,
      lastLogin: now,
      emailVerified: false,
      kycVerified: false,
      gamePoints: 0,
      balance: 0,
      walletBonus: bonus,
    };

    // Create user in the database
    await createUser(userData);

    // Send verification email
    try {
      await VerifyEmail(email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Log this error but don't fail the request, as the user was created successfully.
    }

    return NextResponse.json({ success: true, userId: id }, { status: 201 });
  } catch (error) {
    console.error('User creation failed:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during user creation.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  // ✅ New params for filtering/pagination
  const status = searchParams.get("status") || undefined;
  const searchTerm = searchParams.get("search") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;
  const pageNumber = Number(searchParams.get("pageNumber")) || 1;
  const limit = Math.max(1, Number(searchParams.get("limit")) || 10);
  const orderBy = searchParams.get("orderBy") || "createdAt";
  const order = (searchParams.get("order") as "ASC" | "DESC") || "DESC";

  // ✅ Normal users → only their own profile
  if (token.role === "user") {
    const user = await getUserById(token.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user });
  }

  // ✅ Admin → can filter all users
  if (token.role === "admin") {
    const users = await getFilteredUsers({
      status,
      searchTerm,
      startDate,
      endDate,
      pageNumber,
      limit,
      orderBy,
      order,
    });

    return NextResponse.json({
      success: true,
      users: users.rows,
      pagination: users.pagination,
    });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("Authenticated user:", token);

  let { id, ...data } = await req.json();

  // 🔑 If password provided, hash it before updating
  if (data.password) {
    const salt = await genSalt(10);
    data.password = await hash(data.password, salt);
  }

  // 🔑 If no id, ensure a new UUID is generated (for new users if needed)
  if (!id) {
    id = uuidv4();
  }

  // ✅ User role: can only update their own data
  if (token.role === "user") {
    if (id && id !== token.id) {
      return NextResponse.json({ error: "Forbidden: cannot update other users" }, { status: 403 });
    }
    const result = await updateUserProfile(token.id, data);
    return NextResponse.json({ success: true, result });
  }

  // ✅ Admin role: can update any user
  if (token.role === "admin") {
    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }
    const result = await updateUserProfile(id, data);
    return NextResponse.json({ success: true, result });
  }

  // ❌ Other roles not allowed
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

