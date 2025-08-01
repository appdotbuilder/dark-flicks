
import { db } from '../db';
import { moviesTable, favoritesTable } from '../db/schema';
import { type GetUserFavoritesInput, type FavoriteWithMovie } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUserFavorites(input: GetUserFavoritesInput): Promise<FavoriteWithMovie[]> {
  try {
    // Query favorites with movie details using inner join
    const results = await db.select()
      .from(favoritesTable)
      .innerJoin(moviesTable, eq(favoritesTable.movie_id, moviesTable.id))
      .where(eq(favoritesTable.user_id, input.user_id))
      .execute();

    // Transform joined results to expected format
    return results.map(result => ({
      id: result.favorites.id,
      user_id: result.favorites.user_id,
      movie_id: result.favorites.movie_id,
      created_at: result.favorites.created_at,
      movie: {
        id: result.movies.id,
        title: result.movies.title,
        description: result.movies.description,
        genre: result.movies.genre,
        release_year: result.movies.release_year,
        rating: parseFloat(result.movies.rating), // Convert numeric to number
        poster_url: result.movies.poster_url,
        type: result.movies.type,
        created_at: result.movies.created_at
      }
    }));
  } catch (error) {
    console.error('Getting user favorites failed:', error);
    throw error;
  }
}
