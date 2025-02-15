"use server";
import { prismaDB } from "@/providers/connection";
import { createAudLog } from "./audit";
import { ACTION, TABLE_TYPE } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { Board, User } from "@/interfaces";

export const createBoard = async (data: {
  title: string;
  image: string;
  orgId: string;
}) => {
  const { title, image, orgId } = data;

  let board;
  try {
    board = await prismaDB.board.create({
      data: {
        title,
        image,
        orgId,
      },
    });
    
    // Optional: You might want to modify or remove audit logging for anonymous users
    await createAudLog({
      tableId: board.id,
      tableTitle: board.title,
      tableType: TABLE_TYPE.BOARD,
      action: ACTION.CREATE,
      orgId,
    });
  } catch (error) {
    return {
      error: "failed to create",
    };
  }
  
  revalidatePath("/");
  return { result: board };
};

// Modified delete board function to remove auth check
export const deleteBoard = async ({
  id,
  orgId,
}: {
  id: string;
  orgId: string;
}) => {
  let board;
  try {
    board = await prismaDB.board.delete({ where: { id } });

    await createAudLog({
      tableId: board.id,
      tableTitle: board.title,
      tableType: TABLE_TYPE.BOARD,
      action: ACTION.DELETE,
      orgId,
    });
  } catch (error) {
    return {
      error: "board not deleted",
    };
  }

  revalidatePath("/organizations");
  redirect("/organizations");
};

// Modified getWithoutBoardMembers to remove auth check
export const getWithoutBoardMembers = async (data: { board: any }) => {
  const { board } = data;
  let users;

  try {
    users = await prismaDB.user.findMany({
      where: {
        AND: [
          {
            organizations: {
              some: { id: board.orgId },
            },
          },
          {
            NOT: {
              boards: {
                some: { id: board.id },
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    return {
      error: "board id not exist",
    };
  }
  revalidatePath(`/board/${board.id}`);
  return { result: users };
};

// Modified addMemberInBoard to remove auth check
export const addMemberInBoard = async (data: { user: User; board: Board }) => {
  const { user, board } = data;
  let updateUser, updateBoard;
  
  try {
    [updateUser, updateBoard] = await prismaDB.$transaction([
      prismaDB.user.update({
        where: { id: user.id },
        data: {
          boardIds: user.boardIds,
        },
      }),
      prismaDB.board.update({
        where: { id: board.id },
        data: {
          userIds: board.userIds,
        },
      }),
    ]);
  } catch (error) {
    return {
      error: "user already exist",
    };
  }
  
  revalidatePath(`/board/${board.id}`);
  return { result: { updateUser, updateBoard } };
};