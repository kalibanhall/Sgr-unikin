import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { userRepository, activityLogRepository } from "@/lib/repositories";
import { ACTION_TYPE_LABELS, TARGET_TYPE_LABELS } from "@/lib/activity-logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const user = await userRepository.findById(session.user.id);
    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Accès refusé - Super Admin uniquement" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get("adminId") || undefined;
    const actionType = searchParams.get("actionType") || undefined;
    const targetType = searchParams.get("targetType") || undefined;
    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "30");
    const offset = (page - 1) * limit;

    const { logs, total } = await activityLogRepository.findAll({
      adminId,
      actionType,
      targetType,
      startDate,
      endDate,
      limit,
      offset,
    });

    // Get filter options
    const [actionTypes, admins] = await Promise.all([
      activityLogRepository.getActionTypes(),
      activityLogRepository.getAdmins(),
    ]);

    return NextResponse.json({
      logs: logs.map((log) => ({
        id: log.id,
        adminId: log.admin_id,
        adminName: log.admin_name,
        adminEmail: log.admin_email,
        actionType: log.action_type,
        actionLabel: ACTION_TYPE_LABELS[log.action_type] || log.action_type,
        targetType: log.target_type,
        targetLabel: log.target_type ? (TARGET_TYPE_LABELS[log.target_type] || log.target_type) : null,
        targetId: log.target_id,
        details: log.details,
        ipAddress: log.ip_address,
        createdAt: log.created_at,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
      filters: {
        actionTypes: actionTypes.map((t) => ({
          value: t,
          label: ACTION_TYPE_LABELS[t] || t,
        })),
        admins: admins.map((a) => ({
          id: a.id,
          name: a.name || a.email,
        })),
      },
    });
  } catch (error) {
    console.error("Erreur activity logs:", error);
    return NextResponse.json(
      { error: "Erreur serveur", details: String(error) },
      { status: 500 }
    );
  }
}
