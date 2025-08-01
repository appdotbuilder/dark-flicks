
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moviesTable } from '../db/schema';
import { type SearchMoviesInput } from '../schema';
import { searchMovies } from '../handlers/search_movies';

// Test data
const testMovies = [
  {
    title: 'The Dark Knight',
    description: 'Batman fights the Joker',
    genre: 'Action',
    release_year: 2008,
    rating: '9.0', // String for database insertion
    poster_url: 'https://example.com/dark-knight.jpg',
    type: 'movie' as const
  },
  {
    title: 'Breaking Bad',
    description: 'A chemistry teacher turns to cooking meth',
    genre: 'Drama',
    release_year: 2008,
    rating: '9.5',
    poster_url: 'https://example.com/breaking-bad.jpg',
    type: 'series' as const
  },
  {
    title: 'Knight Rider',
    description: 'A man and his talking car fight crime',
    genre: 'Action',
    release_year: 1982,
    rating: '7.0',
    poster_url: 'https://example.com/knight-rider.jpg',
    type: 'series' as const
  }
];

describe('searchMovies', () => {
  beforeEach(async () => {
    await createDB();
    // Insert test data
    await db.insert(moviesTable).values(testMovies).execute();
  });

  afterEach(resetDB);

  it('should search movies by title case-insensitive', async () => {
    const input: SearchMoviesInput = {
      title: 'dark knight',
      type: 'all'
    };

    const results = await searchMovies(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('The Dark Knight');
    expect(results[0].type).toEqual('movie');
    expect(results[0].rating).toEqual(9.0);
    expect(typeof results[0].rating).toBe('number');
  });

  it('should search with partial matches', async () => {
    const input: SearchMoviesInput = {
      title: 'knight',
      type: 'all'
    };

    const results = await searchMovies(input);

    expect(results).toHaveLength(2);
    expect(results.map(r => r.title)).toContain('The Dark Knight');
    expect(results.map(r => r.title)).toContain('Knight Rider');
  });

  it('should filter by movie type', async () => {
    const input: SearchMoviesInput = {
      title: 'knight',
      type: 'movie'
    };

    const results = await searchMovies(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('The Dark Knight');
    expect(results[0].type).toEqual('movie');
  });

  it('should filter by series type', async () => {
    const input: SearchMoviesInput = {
      title: 'knight',
      type: 'series'
    };

    const results = await searchMovies(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Knight Rider');
    expect(results[0].type).toEqual('series');
  });

  it('should return empty array for no matches', async () => {
    const input: SearchMoviesInput = {
      title: 'nonexistent movie',
      type: 'all'
    };

    const results = await searchMovies(input);

    expect(results).toHaveLength(0);
  });

  it('should return all matching titles when type is all', async () => {
    const input: SearchMoviesInput = {
      title: 'b', // Should match "Breaking Bad"
      type: 'all'
    };

    const results = await searchMovies(input);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Breaking Bad');
    expect(results[0].type).toEqual('series');
  });

  it('should handle empty search gracefully', async () => {
    const input: SearchMoviesInput = {
      title: '',
      type: 'all'
    };

    const results = await searchMovies(input);

    // Should return all movies since empty string matches everything with LIKE %%
    expect(results.length).toBeGreaterThan(0);
  });
});
