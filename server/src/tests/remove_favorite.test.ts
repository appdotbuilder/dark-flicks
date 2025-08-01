
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moviesTable, favoritesTable } from '../db/schema';
import { type RemoveFavoriteInput, type Movie, type Favorite } from '../schema';
import { removeFavorite } from '../handlers/remove_favorite';
import { eq, and } from 'drizzle-orm';

const testMovie = {
  title: 'Test Movie',
  description: 'A movie for testing',
  genre: 'Action',
  release_year: 2023,
  rating: '8.5',
  poster_url: 'https://example.com/poster.jpg',
  type: 'movie' as const
};

const testInput: RemoveFavoriteInput = {
  user_id: 'test-user-123',
  movie_id: 1 // Will be set after creating movie
};

describe('removeFavorite', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should remove favorite successfully', async () => {
    // Create test movie
    const movieResult = await db.insert(moviesTable)
      .values(testMovie)
      .returning()
      .execute();
    const movie = movieResult[0];

    // Create favorite record
    await db.insert(favoritesTable)
      .values({
        user_id: testInput.user_id,
        movie_id: movie.id
      })
      .execute();

    // Remove the favorite
    const result = await removeFavorite({
      user_id: testInput.user_id,
      movie_id: movie.id
    });

    expect(result.success).toBe(true);

    // Verify favorite was deleted from database
    const favorites = await db.select()
      .from(favoritesTable)
      .where(
        and(
          eq(favoritesTable.user_id, testInput.user_id),
          eq(favoritesTable.movie_id, movie.id)
        )
      )
      .execute();

    expect(favorites).toHaveLength(0);
  });

  it('should return false when favorite does not exist', async () => {
    // Create test movie but no favorite
    const movieResult = await db.insert(moviesTable)
      .values(testMovie)
      .returning()
      .execute();
    const movie = movieResult[0];

    // Try to remove non-existent favorite
    const result = await removeFavorite({
      user_id: testInput.user_id,
      movie_id: movie.id
    });

    expect(result.success).toBe(false);
  });

  it('should only remove favorite for specific user and movie combination', async () => {
    // Create test movie
    const movieResult = await db.insert(moviesTable)
      .values(testMovie)
      .returning()
      .execute();
    const movie = movieResult[0];

    // Create favorites for two different users
    await db.insert(favoritesTable)
      .values([
        { user_id: 'user1', movie_id: movie.id },
        { user_id: 'user2', movie_id: movie.id }
      ])
      .execute();

    // Remove favorite for user1 only
    const result = await removeFavorite({
      user_id: 'user1',
      movie_id: movie.id
    });

    expect(result.success).toBe(true);

    // Verify user1's favorite is gone
    const user1Favorites = await db.select()
      .from(favoritesTable)
      .where(
        and(
          eq(favoritesTable.user_id, 'user1'),
          eq(favoritesTable.movie_id, movie.id)
        )
      )
      .execute();

    expect(user1Favorites).toHaveLength(0);

    // Verify user2's favorite still exists
    const user2Favorites = await db.select()
      .from(favoritesTable)
      .where(
        and(
          eq(favoritesTable.user_id, 'user2'),
          eq(favoritesTable.movie_id, movie.id)
        )
      )
      .execute();

    expect(user2Favorites).toHaveLength(1);
  });

  it('should return false when movie does not exist', async () => {
    // Try to remove favorite for non-existent movie
    const result = await removeFavorite({
      user_id: testInput.user_id,
      movie_id: 99999 // Non-existent movie ID
    });

    expect(result.success).toBe(false);
  });
});
