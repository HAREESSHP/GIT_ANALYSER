import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Connection
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

// Define Schemas
const profileSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  name: String,
  avatar_url: String,
  bio: String,
  company: String,
  location: String,
  website: String,
  followers: { type: Number, default: 0 },
  following: { type: Number, default: 0 },
  public_repos: { type: Number, default: 0 },
  public_gists: { type: Number, default: 0 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, { collection: 'profiles' });

const repositorySchema = new mongoose.Schema({
  profile_username: { type: String, required: true },
  repo_name: { type: String, required: true },
  repo_url: String,
  description: String,
  language: String,
  stars: { type: Number, default: 0 },
  forks: { type: Number, default: 0 },
  updated_at: Date,
  created_at: { type: Date, default: Date.now },
}, { collection: 'repositories' });

repositorySchema.index({ profile_username: 1 });
repositorySchema.index({ stars: -1 });

const analyticsSchema = new mongoose.Schema({
  profile_username: { type: String, unique: true, required: true },
  total_stars: { type: Number, default: 0 },
  total_forks: { type: Number, default: 0 },
  repo_count: { type: Number, default: 0 },
  most_starred_repo: String,
  average_stars: { type: Number, default: 0 },
  top_language: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, { collection: 'analytics' });

analyticsSchema.index({ profile_username: 1 });

const bookmarkSchema = new mongoose.Schema({
  profile_username: { type: String, required: true },
  recruiter_id: { type: String, default: 'default' },
  notes: String,
  status: { type: String, default: 'interested' },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
}, { collection: 'bookmarks' });

bookmarkSchema.index({ recruiter_id: 1 });
bookmarkSchema.index({ status: 1 });

// RAG chunk schema - persists vector store data in MongoDB
const ragChunkSchema = new mongoose.Schema({
  username: { type: String, required: true },
  id: { type: String, required: true },
  text: { type: String, required: true },
  metadata: { type: Object, default: {} },
  embedding: { type: [Number], required: true },
  created_at: { type: Date, default: Date.now },
}, { collection: 'rag_chunks' });

ragChunkSchema.index({ username: 1 });
ragChunkSchema.index({ id: 1 }, { unique: true });

// Create Models
export const Profile = mongoose.model('Profile', profileSchema);
export const Repository = mongoose.model('Repository', repositorySchema);
export const Analytics = mongoose.model('Analytics', analyticsSchema);
export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);
export const RagChunk = mongoose.model('RagChunk', ragChunkSchema);
