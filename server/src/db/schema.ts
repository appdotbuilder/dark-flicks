
import { serial, text, pgTable, timestamp, integer, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define enum for movie/series type
export const movieTypeEnum = pgEnum('movie_type', ['movie', 'series']);

export const moviesTable = pgTable('movies', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'), // Nullable by default
  genre: text('genre').notNull(),
  release_year: integer('release_year').notNull(),
  rating: numeric('rating', { precision: 3, scale: 1 }).notNull(), // e.g., 8.5
  poster_url: text('poster_url'), // Nullable by default
  type: movieTypeEnum('type').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const favoritesTable = pgTable('favorites', {
  id: serial('id').primaryKey(),
  user_id: text('user_id').notNull(), // Session-based user identification
  movie_id: integer('movie_id').notNull().references(() => moviesTable.id, { onDelete: 'cascade' }),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Define relations
export const moviesRelations = relations(moviesTable, ({ many }) => ({
  favorites: many(favoritesTable),
}));

export const favoritesRelations = relations(favoritesTable, ({ one }) => ({
  movie: one(moviesTable, {
    fields: [favoritesTable.movie_id],
    references: [moviesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type Movie = typeof moviesTable.$inferSelect;
export type NewMovie = typeof moviesTable.$inferInsert;
export type Favorite = typeof favoritesTable.$inferSelect;
export type NewFavorite = typeof favoritesTable.$inferInsert;

// Export all tables for proper query building
export const tables = { 
  movies: moviesTable, 
  favorites: favoritesTable 
};
