
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { moviesTable } from '../db/schema';
import { getMovies } from '../handlers/get_movies';

describe('getMovies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no movies exist', async () => {
    const result = await getMovies();
    expect(result).toEqual([]);
  });

  it('should return all movies from database', async () => {
    // Insert test movies
    await db.insert(moviesTable).values([
      {
        title: 'The Dark Knight',
        description: 'Batman movie',
        genre: 'Action',
        release_year: 2008,
        rating: '9.0',
        poster_url: 'https://example.com/dark-knight.jpg',
        type: 'movie'
      },
      {
        title: 'Breaking Bad',
        description: 'Chemistry teacher turned drug dealer',
        genre: 'Drama',
        release_year: 2008,
        rating: '9.5',
        poster_url: 'https://example.com/breaking-bad.jpg',
        type: 'series'
      }
    ]).execute();

    const result = await getMovies();

    expect(result).toHaveLength(2);
    
    // Verify first movie
    expect(result[0].title).toEqual('The Dark Knight');
    expect(result[0].description).toEqual('Batman movie');
    expect(result[0].genre).toEqual('Action');
    expect(result[0].release_year).toEqual(2008);
    expect(result[0].rating).toEqual(9.0);
    expect(typeof result[0].rating).toEqual('number');
    expect(result[0].poster_url).toEqual('https://example.com/dark-knight.jpg');
    expect(result[0].type).toEqual('movie');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second movie
    expect(result[1].title).toEqual('Breaking Bad');
    expect(result[1].description).toEqual('Chemistry teacher turned drug dealer');
    expect(result[1].genre).toEqual('Drama');
    expect(result[1].release_year).toEqual(2008);
    expect(result[1].rating).toEqual(9.5);
    expect(typeof result[1].rating).toEqual('number');
    expect(result[1].poster_url).toEqual('https://example.com/breaking-bad.jpg');
    expect(result[1].type).toEqual('series');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
  });

  it('should handle movies with null fields correctly', async () => {
    // Insert movie with null description and poster_url
    await db.insert(moviesTable).values({
      title: 'Test Movie',
      description: null,
      genre: 'Horror',
      release_year: 2023,
      rating: '7.5',
      poster_url: null,
      type: 'movie'
    }).execute();

    const result = await getMovies();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Test Movie');
    expect(result[0].description).toBeNull();
    expect(result[0].genre).toEqual('Horror');
    expect(result[0].release_year).toEqual(2023);
    expect(result[0].rating).toEqual(7.5);
    expect(typeof result[0].rating).toEqual('number');
    expect(result[0].poster_url).toBeNull();
    expect(result[0].type).toEqual('movie');
  });
});
