import { fetchCompletedMovieAndSync, fetchCompletedBookAndSync, fetchCompletedTvAndSync, fetchCompletedMusicAndSync } from './neodb.js';

// sync completed
await fetchCompletedMusicAndSync();
await fetchCompletedMovieAndSync();
await fetchCompletedTvAndSync();
await fetchCompletedBookAndSync();

// update all  (if you change ratings, comments or sth)

// await fetchCompletedMusicAndSync(true);
// await fetchCompletedMovieAndSync(true);
// await fetchCompletedTvAndSync(true);
// await fetchCompletedBookAndSync(true);
