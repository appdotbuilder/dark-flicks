
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { Heart, Search, Star, Calendar, Film, Tv } from 'lucide-react';
import type { Movie, SearchMoviesInput, FavoriteWithMovie } from '../../server/src/schema';

// Generate a unique user ID for local storage
const getUserId = (): string => {
  let userId = localStorage.getItem('movie_app_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('movie_app_user_id', userId);
  }
  return userId;
};

// Local storage helpers for favorites
const getFavoritesFromStorage = (): number[] => {
  const stored = localStorage.getItem('movie_favorites');
  return stored ? JSON.parse(stored) : [];
};

const saveFavoritesToStorage = (favorites: number[]): void => {
  localStorage.setItem('movie_favorites', JSON.stringify(favorites));
};

interface MovieCardProps {
  movie: Movie;
  isFavorite: boolean;
  onToggleFavorite: (movieId: number) => void;
}

function MovieCard({ movie, isFavorite, onToggleFavorite }: MovieCardProps) {
  return (
    <Card className="group bg-gray-900 border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/50 hover:-translate-y-1">
      <CardContent className="p-0">
        <div className="relative aspect-[2/3] bg-gray-800 rounded-t-lg overflow-hidden">
          {movie.poster_url ? (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling!.classList.remove('hidden');
              }}
            />
          ) : null}
          <div className="hidden absolute inset-0 flex items-center justify-center bg-gray-800">
            {movie.type === 'movie' ? (
              <Film className="w-16 h-16 text-gray-600" />
            ) : (
              <Tv className="w-16 h-16 text-gray-600" />
            )}
          </div>
          
          {/* Favorite button */}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-2 right-2 bg-black/50 hover:bg-black/70 transition-all duration-200 ${
              isFavorite ? 'text-red-500 hover:text-red-400' : 'text-white hover:text-red-300'
            }`}
            onClick={() => onToggleFavorite(movie.id)}
          >
            <Heart 
              className={`w-5 h-5 transition-all duration-200 ${
                isFavorite ? 'fill-current scale-110' : ''
              }`} 
            />
          </Button>

          {/* Type badge */}
          <Badge 
            variant="secondary" 
            className="absolute top-2 left-2 bg-black/70 text-white border-0 capitalize"
          >
            {movie.type}
          </Badge>

          {/* Rating */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 px-2 py-1 rounded-md">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-white text-sm font-medium">{movie.rating}</span>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-white font-bold text-lg line-clamp-1 group-hover:text-blue-400 transition-colors">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
              <Calendar className="w-4 h-4" />
              <span>{movie.release_year}</span>
              <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                {movie.genre}
              </Badge>
            </div>
          </div>

          {movie.description && (
            <p className="text-gray-300 text-sm line-clamp-3 leading-relaxed">
              {movie.description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function App() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [userFavorites, setUserFavorites] = useState<FavoriteWithMovie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchMoviesInput['type']>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('discover');

  const userId = getUserId();

  // Load initial data and favorites
  const loadMovies = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await trpc.getMovies.query();
      setMovies(result);
    } catch (error) {
      console.error('Failed to load movies:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadUserFavorites = useCallback(async () => {
    try {
      const result = await trpc.getUserFavorites.query({ user_id: userId });
      setUserFavorites(result);
    } catch (error) {
      console.error('Failed to load user favorites:', error);
    }
  }, [userId]);

  useEffect(() => {
    loadMovies();
    setFavorites(getFavoritesFromStorage());
    loadUserFavorites();
  }, [loadMovies, loadUserFavorites]);

  // Search functionality
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadMovies();
      return;
    }

    try {
      setIsSearching(true);
      const result = await trpc.searchMovies.query({
        title: searchQuery,
        type: searchType
      });
      setMovies(result);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchType('all');
    loadMovies();
  };

  // Favorites management
  const toggleFavorite = async (movieId: number) => {
    const isFavorite = favorites.includes(movieId);
    
    try {
      if (isFavorite) {
        await trpc.removeFavorite.mutate({ user_id: userId, movie_id: movieId });
        const newFavorites = favorites.filter(id => id !== movieId);
        setFavorites(newFavorites);
        saveFavoritesToStorage(newFavorites);
      } else {
        await trpc.addFavorite.mutate({ user_id: userId, movie_id: movieId });
        const newFavorites = [...favorites, movieId];
        setFavorites(newFavorites);
        saveFavoritesToStorage(newFavorites);
      }
      
      // Reload user favorites if we're on that tab
      if (activeTab === 'favorites') {
        loadUserFavorites();
      }
    } catch (error) {
      console.error('Failed to toggle favorite:', error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            🎬 CineDiscover
          </h1>
          <p className="text-gray-400 text-lg">Discover your next favorite movie or series</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-900 border border-gray-800">
            <TabsTrigger 
              value="discover" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              <Film className="w-4 h-4 mr-2" />
              Discover
            </TabsTrigger>
            <TabsTrigger 
              value="favorites"
              className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
            >
              <Heart className="w-4 h-4 mr-2" />
              Favorites ({favorites.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Search Section */}
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search movies and series..."
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                    />
                  </div>
                  <Select value={searchType} onValueChange={(value: SearchMoviesInput['type']) => setSearchType(value)}>
                    <SelectTrigger className="w-full sm:w-32 bg-gray-800 border-gray-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="movie">Movies</SelectItem>
                      <SelectItem value="series">Series</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-2">
                    <Button 
                      type="submit" 
                      disabled={isSearching}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSearching ? 'Searching...' : 'Search'}
                    </Button>
                    {searchQuery && (
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={clearSearch}
                        className="border-gray-600 text-gray-300 hover:bg-gray-800"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Movies Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Card key={i} className="bg-gray-900 border-gray-800 animate-pulse">
                    <CardContent className="p-0">
                      <div className="aspect-[2/3] bg-gray-800 rounded-t-lg" />
                      <div className="p-4 space-y-3">
                        <div className="h-6 bg-gray-700 rounded" />
                        <div className="h-4 bg-gray-700 rounded w-2/3" />
                        <div className="h-16 bg-gray-700 rounded" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : movies.length === 0 ? (
              <div className="text-center py-16">
                <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">
                  {searchQuery ? 'No results found' : 'No movies available'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Try adjusting your search terms' : 'Check back later for new content'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {movies.map((movie: Movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    isFavorite={favorites.includes(movie.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="favorites" className="space-y-6">
            {userFavorites.length === 0 ? (
              <div className="text-center py-16">
                <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No favorites yet</h3>
                <p className="text-gray-500 mb-6">Start adding movies and series to your favorites!</p>
                <Button 
                  onClick={() => setActiveTab('discover')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Film className="w-4 h-4 mr-2" />
                  Discover Movies
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                {userFavorites.map((favorite: FavoriteWithMovie) => (
                  <MovieCard
                    key={favorite.id}
                    movie={favorite.movie}
                    isFavorite={true}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
