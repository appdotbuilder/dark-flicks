
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schema types
import { 
  searchMoviesInputSchema, 
  addFavoriteInputSchema, 
  removeFavoriteInputSchema, 
  getUserFavoritesInputSchema 
} from './schema';

// Import handlers
import { getMovies } from './handlers/get_movies';
import { searchMovies } from './handlers/search_movies';
import { addFavorite } from './handlers/add_favorite';
import { removeFavorite } from './handlers/remove_favorite';
import { getUserFavorites } from './handlers/get_user_favorites';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Movie/Series endpoints
  getMovies: publicProcedure
    .query(() => getMovies()),
    
  searchMovies: publicProcedure
    .input(searchMoviesInputSchema)
    .query(({ input }) => searchMovies(input)),
  
  // Favorites endpoints
  addFavorite: publicProcedure
    .input(addFavoriteInputSchema)
    .mutation(({ input }) => addFavorite(input)),
    
  removeFavorite: publicProcedure
    .input(removeFavoriteInputSchema)
    .mutation(({ input }) => removeFavorite(input)),
    
  getUserFavorites: publicProcedure
    .input(getUserFavoritesInputSchema)
    .query(({ input }) => getUserFavorites(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
