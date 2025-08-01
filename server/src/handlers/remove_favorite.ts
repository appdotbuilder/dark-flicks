
import { db } from '../db';
import { favoritesTable } from '../db/schema';
import { type RemoveFavoriteInput } from '../schema';
import { and, eq } from 'drizzle-orm';

export const removeFavorite = async (input: RemoveFavoriteInput): Promise<{ success: boolean }> => {
  try {
    // Delete the favorite record matching both user_id and movie_id
    const result = await db.delete(favoritesTable)
      .where(
        and(
          eq(favoritesTable.user_id, input.user_id),
          eq(favoritesTable.movie_id, input.movie_id)
        )
      )
      .execute();

    // Check if any rows were affected (deleted)
    return { success: (result.rowCount ?? 0) > 0 };
  } catch (error) {
    console.error('Remove favorite failed:', error);
    throw error;
  }
};
