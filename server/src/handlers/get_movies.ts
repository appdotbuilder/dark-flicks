
import { db } from '../db';
import { moviesTable } from '../db/schema';
import { type Movie } from '../schema';

export const getMovies = async (): Promise<Movie[]> => {
  try {
    const results = await db.select()
      .from(moviesTable)
      .execute();

    // Convert numeric rating field back to number
    return results.map(movie => ({
      ...movie,
      rating: parseFloat(movie.rating)
    }));
  } catch (error) {
    console.error('Failed to fetch movies:', error);
    throw error;
  }
};
