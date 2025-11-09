"use server";

import { ApiResponse } from "@/lib/types";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export type UserWithoutPassword = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  image: string | null;
};

type GetAllUsersOptions = {
  page?: number;
  limit?: number;
  sortBy?: "name" | "email" | "role" | "createdAt";
  sortOrder?: "asc" | "desc";
  search?: string;
};

export async function getAllUsers(
  options: GetAllUsersOptions = {}
): Promise<ApiResponse<{ users: UserWithoutPassword[]; total: number }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Not authenticated" };
    }

    if (session.user.role !== "admin") {
      return { success: false, error: "Not authorized" };
    }

    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
    } = options;

    const offset = (page - 1) * limit;

    let allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        image: true,
        // exculde password and other sensitive data
        password: false,
        emailVerified: false,
        updatedAt: false,
      },
    });

    if (search) {
      const searchLower = search.toLowerCase();
      allUsers = allUsers.filter(
        (user) =>
          user.email?.toLowerCase().includes(searchLower) ||
          (user.name?.toLowerCase().includes(searchLower) || false)
      );
    }

    const total = allUsers.length;

    if (sortBy && sortOrder) {
      allUsers.sort((a, b) => {
        // Use proper typing instead of any
        let valueA: string | Date;
        let valueB: string | Date;

        switch (sortBy) {
          case "name":
          case "email":
          case "role":
            valueA = a[sortBy] || "";
            valueB = b[sortBy] || "";
            break;
          case "createdAt":
            valueA = a[sortBy];
            valueB = b[sortBy];
            break;
          default:
            valueA = "";
            valueB = "";
        }

        // Handle comparison for different types
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortOrder === "asc" 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        }
        
        if (valueA < valueB) {
          return sortOrder === "asc" ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortOrder === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    const paginatedUsers = allUsers.slice(offset, offset + limit);

    return {
      success: true,
      data: {
        users: paginatedUsers,
        total,
      },
    };
  } catch (error) {
    console.error("Error getting all users", error);
    return { success: false, error: "Error getting all users" };
  }
}