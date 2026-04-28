import type { CollectionAfterChangeHook } from "payload";
import {
  roleToAuthority,
  type Role
} from "@/payload/plugins/locker/fields/authority/utils";

type PlanLike = {
  id: string;
  tier?: "member" | "patron" | null;
};

const isStaffRole = (role: Role): boolean =>
  role === "editor" || role === "admin";

export const syncRoleAfterSubscriptionChange: CollectionAfterChangeHook =
  async ({ doc, previousDoc, req, operation }) => {
    try {
      const userRel = doc.user;
      const userId =
        typeof userRel === "string"
          ? userRel
          : userRel && typeof userRel === "object"
            ? (userRel as { id: string }).id
            : null;
      if (!userId) return doc;

      const planRel = doc.plan;
      const planId =
        typeof planRel === "string"
          ? planRel
          : planRel && typeof planRel === "object"
            ? (planRel as PlanLike).id
            : null;
      if (!planId) return doc;

      const plan = (await req.payload.findByID({
        collection: "plans",
        id: planId,
        depth: 0,
        overrideAccess: true
      })) as PlanLike | null;

      const tier = plan?.tier;
      if (tier !== "member" && tier !== "patron") return doc;

      const status = doc.subscription_status as
        | "active"
        | "paused"
        | "canceled"
        | undefined;
      const previousStatus = previousDoc?.subscription_status;

      const becameActive = status === "active" && previousStatus !== "active";
      const becameInactive = status !== "active" && previousStatus === "active";

      if (!becameActive && !becameInactive && operation !== "create") {
        return doc;
      }

      const user = await req.payload.findByID({
        collection: "users",
        id: userId,
        depth: 0,
        overrideAccess: true
      });
      if (!user) return doc;

      const currentRole = (user.role || "user") as Role;
      if (isStaffRole(currentRole)) return doc;

      const targetTierAuthority = roleToAuthority(tier);
      let nextRole: Role = currentRole;

      if (status === "active") {
        if (roleToAuthority(currentRole) < targetTierAuthority) {
          nextRole = tier;
        }
      } else if (
        currentRole === tier ||
        currentRole === "member" ||
        currentRole === "patron"
      ) {
        // Demoting: don't blindly drop to "user". Re-derive role from
        // the user's remaining ACTIVE subscriptions, taking the
        // highest-tier one. Only fall back to "user" if none remain.
        const others = await req.payload.find({
          collection: "subscriptions",
          where: {
            and: [
              { user: { equals: userId } },
              { subscription_status: { equals: "active" } },
              { id: { not_equals: doc.id } }
            ]
          },
          depth: 1,
          limit: 50,
          overrideAccess: true
        });

        let highest: Role = "user";
        let highestAuth = roleToAuthority("user");
        for (const otherSub of others.docs) {
          const otherPlan = otherSub.plan as PlanLike | string;
          const otherTier =
            typeof otherPlan === "object" && otherPlan ? otherPlan.tier : null;
          if (otherTier === "member" || otherTier === "patron") {
            const a = roleToAuthority(otherTier);
            if (a > highestAuth) {
              highestAuth = a;
              highest = otherTier;
            }
          }
        }
        if (
          currentRole === tier ||
          roleToAuthority(currentRole) > highestAuth
        ) {
          nextRole = highest;
        }
      }

      if (nextRole !== currentRole) {
        await req.payload.update({
          collection: "users",
          id: userId,
          data: {
            role: nextRole as Exclude<Role, "guest">
          },
          overrideAccess: true
        });
        req.payload.logger.info?.(
          `[syncRole] user=${userId} ${currentRole} -> ${nextRole} (sub ${doc.id} status=${status})`
        );
      }

      return doc;
    } catch (err) {
      req.payload.logger.error?.(
        `[syncRole] error syncing role for subscription ${doc?.id}: ${(err as Error).message}`
      );
      return doc;
    }
  };
