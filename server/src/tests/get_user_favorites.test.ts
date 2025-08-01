
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moviesTable, favoritesTable } from '../db/schema';
import { type GetUserFavoritesInput } from '../schema';
import { getUserFavorites } from '../handlers/get_user_favorites';

const testUser = 'user123';

// Test movie data
const testMovie = {
  title: 'Test Movie',
  description: 'A test movie description',
  genre: 'Action',
  release_year: 2023,
  rating: '8.5',
  poster_url: 'https://example.com/poster.jpg',
  type: 'movie' as const
};

const testSeries = {
  title: 'Test Series',
  description: 'A test series description',
  genre: 'Drama',
  release_year: 2022,
  rating: '9.2',
  poster_url: 'https://example.com/series.jpg',
  type: 'series' as const
};

describe('getUserFavorites', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when user has no favorites', async () => {
    const input: GetUserFavoritesInput = {
      user_id: testUser
    };

    const result = await getUserFavorites(input);

    expect(result).toEqual([]);
  });

  it('should return user favorites with movie details', async () => {
    // Insert test movie
    const movieResult = await db.insert(moviesTable)
      .values(testMovie)
      .returning()
      .execute();

    const movie = movieResult[0];

    // Add favorite
    await db.insert(favoritesTable)
      .values({
        user_id: testUser,
        movie_id: movie.id
      })
      .execute();

    const input: GetUserFavoritesInput = {
      user_id: testUser
    };

    const result = await getUserFavorites(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(testUser);
    expect(result[0].movie_id).toEqual(movie.id);
    expect(result[0].movie.title).toEqual('Test Movie');
    expect(result[0].movie.description).toEqual('A test movie description');
    expect(result[0].movie.genre).toEqual('Action');
    expect(result[0].movie.release_year).toEqual(2023);
    expect(result[0].movie.rating).toEqual(8.5); // Should be converted to number
    expect(typeof result[0].movie.rating).toEqual('number');
    expect(result[0].movie.poster_url).toEqual('https://example.com/poster.jpg');
    expect(result[0].movie.type).toEqual('movie');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].movie.created_at).toBeInstanceOf(Date);
  });

  it('should return multiple favorites for the same user', async () => {
    // Insert test movies
    const movieResult = await db.insert(moviesTable)
      .values(testMovie)
      .returning()
      .execute();

    const seriesResult = await db.insert(moviesTable)
      .values(testSeries)
      .returning()
      .execute();

    const movie = movieResult[0];
    const series = seriesResult[0];

    // Add multiple favorites
    await db.insert(favoritesTable)
      .values([
        { user_id: testUser, movie_id: movie.id },
        { user_id: testUser, movie_id: series.id }
      ])
      .execute();

    const input: GetUserFavoritesInput = {
      user_id: testUser
    };

    const result = await getUserFavorites(input);

    expect(result).toHaveLength(2);
    
    // Find movie and series in results
    const movieFavorite = result.find(f => f.movie.type === 'movie');
    const seriesFavorite = result.find(f => f.movie.type === 'series');

    expect(movieFavorite).toBeDefined();
    expect(seriesFavorite).toBeDefined();
    expect(movieFavorite!.movie.title).toEqual('Test Movie');
    expect(seriesFavorite!.movie.title).toEqual('Test Series');
    expect(movieFavorite!.movie.rating).toEqual(8.5);
    expect(seriesFavorite!.movie.rating).toEqual(9.2);
  });

  it('should only return favorites for the specified user', async () => {
    const otherUser = 'user456';

    // Insert test movie
    const movieResult = await db.insert(moviesTable)
      .values(testMovie)
      .returning()
      .execute();

    const movie = movieResult[0];

    // Add favorites for different users
    await db.insert(favoritesTable)
      .values([
        { user_id: testUser, movie_id: movie.id },
        { user_id: otherUser, movie_id: movie.id }
      ])
      .execute();

    const input: GetUserFavoritesInput = {
      user_id: testUser
    };

    const result = await getUserFavorites(input);

    expect(result).toHaveLength(1);
    expect(result[0].user_id).toEqual(testUser);
  });

  it('should handle movies with null description and poster_url', async () => {
    // Insert movie with null values
    const movieWithNulls = {
      title: 'Movie with Nulls',
      description: null,
      genre: 'Comedy',
      release_year: 2021,
      rating: '7.3',
      poster_url: null,
      type: 'movie' as const
    };

    const movieResult = await db.insert(moviesTable)
      .values(movieWithNulls)
      .returning()
      .execute();

    const movie = movieResult[0];

    // Add favorite
    await db.insert(favoritesTable)
      .values({
        user_id: testUser,
        movie_id: movie.id
      })
      .execute();

    const input: GetUserFavoritesInput = {
      user_id: testUser
    };

    const result = await getUserFavorites(input);

    expect(result).toHaveLength(1);
    expect(result[0].movie.description).toBeNull();
    expect(result[0].movie.poster_url).toBeNull();
    expect(result[0].movie.title).toEqual('Movie with Nulls');
    expect(result[0].movie.rating).toEqual(7.3);
  });
});
