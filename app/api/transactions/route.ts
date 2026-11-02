import { NextRequest, NextResponse } from 'next/server';
import { getAllTransactions, createTransaction, updateTransaction, deleteTransaction } from '@/services/transactionService';
import { getToken } from "next-auth/jwt";

// ✅ GET all transactions (with filtering, search, and pagination)
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status") || undefined;
    const provider = searchParams.get("provider") || undefined;
    const type = searchParams.get("type") || undefined;
    const searchTerm = searchParams.get("search") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const pageNumber = Number(searchParams.get("pageNumber")) || 1;
    const limit = Math.max(1, Number(searchParams.get("limit")) || 10);
    const orderBy = searchParams.get("orderBy") || "createdAt";
    const order = (searchParams.get("order") as "ASC" | "DESC") || "DESC";

    // Normal users → only their own transactions
    if (token.role === "user") {
      const transactions = await getAllTransactions({
        status,
        provider,
        type,
        searchTerm,
        startDate,
        endDate,
        pageNumber,
        limit,
        orderBy,
        order,
      });

      const filtered = transactions.rows.filter(
        (t: any) => t.userId === token.id
      );

      return NextResponse.json({
        success: true,
        transactions: filtered,
        pagination: transactions.pagination,
      });
    }

    // Admins/Moderators → can view all transactions
    if (token.role === "admin" || token.role === "moderator") {
      const transactions = await getAllTransactions({
        status,
        provider,
        type,
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
        transactions: transactions.rows,
        pagination: transactions.pagination,
      });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error: any) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  const result = await createTransaction(data);
  return NextResponse.json({ success: true, transactionId: result.id });
}

export async function PUT(req: NextRequest) {
  const { id, ...data } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
  const result = await updateTransaction(id, data);
  return NextResponse.json({ success: true, result });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
  const result = await deleteTransaction(id);
  return NextResponse.json({ success: true, result });
} 