
import { db } from '../db';
import { favoritesTable, moviesTable } from '../db/schema';
import { type AddFavoriteInput, type Favorite } from '../schema';
import { eq, and } from 'drizzle-orm';

export const addFavorite = async (input: AddFavoriteInput): Promise<Favorite> => {
  try {
    // First verify the movie exists
    const movie = await db.select()
      .from(moviesTable)
      .where(eq(moviesTable.id, input.movie_id))
      .execute();

    if (movie.length === 0) {
      throw new Error(`Movie with id ${input.movie_id} not found`);
    }

    // Check if favorite already exists to prevent duplicates
    const existingFavorite = await db.select()
      .from(favoritesTable)
      .where(and(
        eq(favoritesTable.user_id, input.user_id),
        eq(favoritesTable.movie_id, input.movie_id)
      ))
      .execute();

    if (existingFavorite.length > 0) {
      throw new Error('Movie is already in favorites');
    }

    // Insert new favorite
    const result = await db.insert(favoritesTable)
      .values({
        user_id: input.user_id,
        movie_id: input.movie_id
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Add favorite failed:', error);
    throw error;
  }
};
