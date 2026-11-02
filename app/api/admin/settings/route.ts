// // app/api/admin/settings/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { getAdminSettings, saveAdminSettings } from '@/services/adminSettingsService';
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// /**
//  * GET handler to fetch admin settings.
//  */
// export async function GET(req: NextRequest) {
//   const session = await getServerSession(authOptions);

//   if (!session || !session.user?.role == "admin") {
//     return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//   }

//   try {
//     const settings = await getAdminSettings();
//     return NextResponse.json({ success: true, settings });
//   } catch (error) {
//     console.error('API Error fetching settings:', error);
//     return NextResponse.json(
//       { success: false, message: 'Internal server error.', error: (error as Error).message },
//       { status: 500 }
//     );
//   }
// }

// /**
//  * POST handler to save admin settings.
//  */
// export async function POST(req: NextRequest) {
//   const session = await getServerSession(authOptions);

//   if (!session || !session.user?.role == "admin") {
//     return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
//   }

//   try {
//     const formData = await req.json();
//     const updatedSettings = await saveAdminSettings(formData);
//     return NextResponse.json({ success: true, settings: updatedSettings });
//   } catch (error) {
//     console.error('API Error saving settings:', error);
//     return NextResponse.json(
//       { success: false, message: 'Internal server error.', error: (error as Error).message },
//       { status: 500 }
//     );
//   }
// }