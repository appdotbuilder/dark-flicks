
import { db } from '../db';
import { moviesTable } from '../db/schema';
import { type SearchMoviesInput, type Movie } from '../schema';
import { ilike, and, eq } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';

export const searchMovies = async (input: SearchMoviesInput): Promise<Movie[]> => {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    // Add title search condition (case-insensitive partial match)
    conditions.push(ilike(moviesTable.title, `%${input.title}%`));

    // Add type filter if not 'all'
    if (input.type !== 'all') {
      conditions.push(eq(moviesTable.type, input.type));
    }

    // Build and execute query
    const results = await db.select()
      .from(moviesTable)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(moviesTable.title)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(movie => ({
      ...movie,
      rating: parseFloat(movie.rating) // Convert string back to number
    }));
  } catch (error) {
    console.error('Movie search failed:', error);
    throw error;
  }
};
