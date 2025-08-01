
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moviesTable, favoritesTable } from '../db/schema';
import { type AddFavoriteInput } from '../schema';
import { addFavorite } from '../handlers/add_favorite';
import { eq, and } from 'drizzle-orm';

// Test input
const testInput: AddFavoriteInput = {
  user_id: 'test-user-123',
  movie_id: 1
};

describe('addFavorite', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should add a movie to favorites', async () => {
    // Create a test movie first
    await db.insert(moviesTable)
      .values({
        title: 'Test Movie',
        description: 'A test movie',
        genre: 'Action',
        release_year: 2023,
        rating: '8.5',
        type: 'movie'
      })
      .execute();

    const result = await addFavorite(testInput);

    // Basic field validation
    expect(result.user_id).toEqual('test-user-123');
    expect(result.movie_id).toEqual(1);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save favorite to database', async () => {
    // Create a test movie first
    await db.insert(moviesTable)
      .values({
        title: 'Test Movie',
        description: 'A test movie',
        genre: 'Action',
        release_year: 2023,
        rating: '8.5',
        type: 'movie'
      })
      .execute();

    const result = await addFavorite(testInput);

    // Query database to verify favorite was saved
    const favorites = await db.select()
      .from(favoritesTable)
      .where(eq(favoritesTable.id, result.id))
      .execute();

    expect(favorites).toHaveLength(1);
    expect(favorites[0].user_id).toEqual('test-user-123');
    expect(favorites[0].movie_id).toEqual(1);
    expect(favorites[0].created_at).toBeInstanceOf(Date);
  });

  it('should throw error when movie does not exist', async () => {
    // Try to add favorite for non-existent movie
    await expect(addFavorite(testInput)).rejects.toThrow(/movie with id 1 not found/i);
  });

  it('should throw error when favorite already exists', async () => {
    // Create a test movie first
    await db.insert(moviesTable)
      .values({
        title: 'Test Movie',
        description: 'A test movie',
        genre: 'Action',
        release_year: 2023,
        rating: '8.5',
        type: 'movie'
      })
      .execute();

    // Add favorite first time
    await addFavorite(testInput);

    // Try to add same favorite again
    await expect(addFavorite(testInput)).rejects.toThrow(/movie is already in favorites/i);
  });

  it('should allow different users to favorite same movie', async () => {
    // Create a test movie first
    await db.insert(moviesTable)
      .values({
        title: 'Test Movie',
        description: 'A test movie',
        genre: 'Action',
        release_year: 2023,
        rating: '8.5',
        type: 'movie'
      })
      .execute();

    // Add favorite for first user
    const result1 = await addFavorite(testInput);

    // Add favorite for second user
    const secondUserInput: AddFavoriteInput = {
      user_id: 'test-user-456',
      movie_id: 1
    };
    const result2 = await addFavorite(secondUserInput);

    // Both should be successful with different IDs
    expect(result1.id).not.toEqual(result2.id);
    expect(result1.user_id).toEqual('test-user-123');
    expect(result2.user_id).toEqual('test-user-456');
    expect(result1.movie_id).toEqual(1);
    expect(result2.movie_id).toEqual(1);

    // Verify both exist in database
    const favorites = await db.select()
      .from(favoritesTable)
      .where(eq(favoritesTable.movie_id, 1))
      .execute();

    expect(favorites).toHaveLength(2);
  });
});
