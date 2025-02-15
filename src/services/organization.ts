"use server";

import { prismaDB } from "@/providers/connection";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

// Types
interface CreateOrganizationData {
  title: string;
  image: string;
}

interface OrgMemberData {
  id: string;
  organizationId: string;
  orgIds: string[];
  userIds: string[];
}

interface RemoveOrgMemberData {
  userId: string;
  organizationId: string;
}

// Error handling utility
const handlePrismaError = (error: any) => {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle known Prisma errors
    switch (error.code) {
      case 'P2002':
        return 'A unique constraint would be violated.';
      case 'P2025':
        return 'Record not found.';
      default:
        return `Database error: ${error.code}`;
    }
  }
  return 'An unexpected error occurred';
};

// Create organization
export const createOrganization = async (data: CreateOrganizationData) => {
  const { title, image } = data;

  try {
    const organization = await prismaDB.organization.create({
      data: {
        title,
        image,
        userIds: [], // Initialize with empty array
      },
    });

    revalidatePath("/");
    return { result: organization };
  } catch (error) {
    console.error("Organization creation error:", error);
    return {
      error: handlePrismaError(error)
    };
  }
};

// Get users not in organization
export const getWithoutOrgMembers = async (organizationId: string) => {
  try {
    const users = await prismaDB.user.findMany({
      where: {
        NOT: {
          organizations: {
            some: { id: organizationId }
          }
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true
      }
    });

    revalidatePath(`/organizations/${organizationId}/members`);
    return { result: users };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      error: handlePrismaError(error)
    };
  }
};

// Update organization member
export const updateOrgMember = async (data: OrgMemberData) => {
  const { id, organizationId, orgIds, userIds } = data;

  try {
    const [updateUser, updateOrg] = await prismaDB.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id },
        data: {
          orgIds: {
            set: orgIds
          }
        }
      });

      const org = await tx.organization.update({
        where: { id: organizationId },
        data: {
          userIds: {
            set: userIds
          }
        }
      });

      return [user, org];
    });

    revalidatePath(`/organizations/${organizationId}/members`);
    return { result: { updateUser, updateOrg } };
  } catch (error) {
    console.error("Failed to update organization member:", error);
    return {
      error: handlePrismaError(error)
    };
  }
};

// Remove organization member
export const removeOrgMember = async (data: RemoveOrgMemberData) => {
  const { userId, organizationId } = data;

  try {
    await prismaDB.$transaction(async (tx) => {
      // 1. Get organization and verify it exists
      const organization = await tx.organization.findUniqueOrThrow({
        where: { id: organizationId },
        select: { userIds: true }
      });

      // 2. Update organization userIds
      const updateOrgUserIds = organization.userIds.filter(id => id !== userId);
      await tx.organization.update({
        where: { id: organizationId },
        data: {
          userIds: {
            set: updateOrgUserIds
          }
        }
      });

      // 3. Update boards
      const boards = await tx.board.findMany({
        where: { orgId: organizationId },
        select: { id: true, userIds: true }
      });

      // 4. Update each board's userIds
      for (const board of boards) {
        const updateBoardUserIds = board.userIds.filter(id => id !== userId);
        await tx.board.update({
          where: { id: board.id },
          data: {
            userIds: {
              set: updateBoardUserIds
            }
          }
        });

        // 5. Update cards for each board
        const cards = await tx.card.findMany({
          where: { boardId: board.id },
          select: { id: true, userIds: true }
        });

        // 6. Update each card's userIds
        for (const card of cards) {
          const updateCardUserIds = card.userIds.filter(id => id !== userId);
          await tx.card.update({
            where: { id: card.id },
            data: {
              userIds: {
                set: updateCardUserIds
              }
            }
          });
        }
      }
    });

    revalidatePath(`/organizations/${organizationId}/members`);
    return { result: "Member removed successfully" };
  } catch (error) {
    console.error("Failed to remove organization member:", error);
    return {
      error: handlePrismaError(error)
    };
  }
};

// Connection provider
// @/providers/connection.ts
export const initPrismaClient = () => {
  const globalForPrisma = globalThis as unknown as {
    prisma: typeof prismaDB | undefined;
  };

  const prisma = globalForPrisma.prisma ?? prismaDB;

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }

  return prisma;
};