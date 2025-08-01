
import { z } from 'zod';

// Movie/Series schema
export const movieSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string().nullable(),
  genre: z.string(),
  release_year: z.number().int(),
  rating: z.number().min(0).max(10),
  poster_url: z.string().nullable(),
  type: z.enum(['movie', 'series']),
  created_at: z.coerce.date()
});

export type Movie = z.infer<typeof movieSchema>;

// Input schema for searching movies
export const searchMoviesInputSchema = z.object({
  title: z.string().min(1, 'Search query cannot be empty'),
  type: z.enum(['movie', 'series', 'all']).optional().default('all')
});

export type SearchMoviesInput = z.infer<typeof searchMoviesInputSchema>;

// Favorite schema
export const favoriteSchema = z.object({
  id: z.number(),
  user_id: z.string(), // Using string for session-based identification
  movie_id: z.number(),
  created_at: z.coerce.date()
});

export type Favorite = z.infer<typeof favoriteSchema>;

// Input schema for adding favorites
export const addFavoriteInputSchema = z.object({
  user_id: z.string(),
  movie_id: z.number()
});

export type AddFavoriteInput = z.infer<typeof addFavoriteInputSchema>;

// Input schema for removing favorites
export const removeFavoriteInputSchema = z.object({
  user_id: z.string(),
  movie_id: z.number()
});

export type RemoveFavoriteInput = z.infer<typeof removeFavoriteInputSchema>;

// Input schema for getting user favorites
export const getUserFavoritesInputSchema = z.object({
  user_id: z.string()
});

export type GetUserFavoritesInput = z.infer<typeof getUserFavoritesInputSchema>;

// Response schema for favorites with movie details
export const favoriteWithMovieSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  movie_id: z.number(),
  created_at: z.coerce.date(),
  movie: movieSchema
});

export type FavoriteWithMovie = z.infer<typeof favoriteWithMovieSchema>;
