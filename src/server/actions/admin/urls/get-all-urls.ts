"use server";

import { ApiResponse } from "@/lib/types";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export type UrlWithUser = {
  id: number;
  originalUrl: string;
  shortCode: string;
  createdAt: Date;
  clicks: number;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  flagged: boolean;
  flagReason: string | null;
};

type GetAllUrlsOptions = {
  page?: number;
  limit?: number;
  sortBy?: "originalUrl" | "shortCode" | "createdAt" | "clicks" | "userName";
  sortOrder?: "asc" | "desc";
  search?: string;
  filter?: "all" | "flagged" | "security" | "inappropriate" | "other";
};

export async function getAllUrls(
  options: GetAllUrlsOptions = {}
): Promise<ApiResponse<{ urls: UrlWithUser[]; total: number }>> {
  try {
    const session = await auth();
    if (!session?.user) {
      return { success: false, error: "Unauthorized" };
    }

    if (session.user.role !== "admin") {
      return { success: false, error: "Unauthorized" };
    }

    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      search = "",
      filter = "all",
    } = options;

    const offset = (page - 1) * limit;

    const allUrls = await db.query.urls.findMany({
      with: { user: true },
    });

    // transoform data to include user info
    let transformedUrls: UrlWithUser[] = allUrls.map((url) => ({
      id: url.id,
      originalUrl: url.originalUrl,
      shortCode: url.shortCode,
      createdAt: url.createdAt,
      clicks: url.clicks,
      userId: url.userId,
      userName: url.user?.name || null,
      userEmail: url.user?.email || null,
      flagged: url.flagged,
      flagReason: url.flagReason,
    }));

    // apply search filter
    if (search) {
      transformedUrls = transformedUrls.filter(
        (url) =>
          url.originalUrl.toLowerCase().includes(search.toLowerCase()) ||
          url.shortCode.toLowerCase().includes(search.toLowerCase()) ||
          url.userName?.toLowerCase().includes(search.toLowerCase()) ||
          url.userEmail?.toLowerCase().includes(search.toLowerCase()) ||
          (url.flagReason?.toLowerCase().includes(search.toLowerCase()) || false)
      );
    }

    // apply filter
    if (filter !== "all") {
      transformedUrls = transformedUrls.filter((url) => {
        if (filter === "flagged") {
          return url.flagged;
        }

        if (filter === "security" && url.flagReason) {
          return (
            url.flagReason.toLowerCase().includes("security") ||
            url.flagReason.toLowerCase().includes("phishing") ||
            url.flagReason.toLowerCase().includes("malware")
          );
        }

        if (filter === "inappropriate" && url.flagReason) {
          return (
            url.flagReason.toLowerCase().includes("inappropriate") ||
            url.flagReason.toLowerCase().includes("adult") ||
            url.flagReason.toLowerCase().includes("offensive")
          );
        }

        if (filter === "other" && url.flagReason) {
          return (
            !url.flagReason.toLowerCase().includes("security") &&
            !url.flagReason.toLowerCase().includes("phishing") &&
            !url.flagReason.toLowerCase().includes("malware") &&
            !url.flagReason.toLowerCase().includes("inappropriate") &&
            !url.flagReason.toLowerCase().includes("adult") &&
            !url.flagReason.toLowerCase().includes("offensive")
          );
        }

        return false;
      });
    }

    const total = transformedUrls.length;

    // apply sorting
    if (sortBy && sortOrder) {
      transformedUrls.sort((a, b) => {
        let valueA: string | number | Date;
        let valueB: string | number | Date;

        // handle sorting by user name
        if (sortBy === "userName") {
          valueA = a.userName || a.userEmail || "";
          valueB = b.userName || b.userEmail || "";
        } else {
          // For other properties, we need to handle the type correctly
          switch (sortBy) {
            case "originalUrl":
            case "shortCode":
              valueA = a[sortBy] || "";
              valueB = b[sortBy] || "";
              break;
            case "clicks":
              valueA = a[sortBy] || 0;
              valueB = b[sortBy] || 0;
              break;
            case "createdAt":
              valueA = a[sortBy];
              valueB = b[sortBy];
              break;
            default:
              valueA = "";
              valueB = "";
          }
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

    // apply pagination
    const paginatedUrls = transformedUrls.slice(offset, offset + limit);

    return {
      success: true,
      data: {
        urls: paginatedUrls,
        total,
      },
    };
  } catch (error) {
    console.error("Error getting all URLs:", error);
    return { success: false, error: "Internal Server Error" };
  }
}