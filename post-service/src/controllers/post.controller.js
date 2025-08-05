import { Post } from "../models/posts.model.js";
import logger from "../utils/logger.js";
import { validateCreatePost } from "../utils/validation.js";
import redisClient from "../config/redis.js";


const invalidateCache = async (input) => {
  try {
    const keys = await redisClient.keys(input);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cache cleared for keys matching: ${input}`);
    }
  } catch (error) {
    logger.error("Error clearing Redis cache", error);
  }
}

export const createPost = async (req, res) => {
  logger.info("Create post endpoint hit");

  try {
    const { error } = validateCreatePost(req.body);

    if (error) {
      logger.warn("Validation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { content, mediaIds } = req.body;
    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds,
    });

    await newlyCreatedPost.save();
    await invalidateCache("posts:page=*");

    logger.info("Post created successfully", newlyCreatedPost);
    res.status(201).json({
      success: true,
      message: "Post created successfully",
    });
  } catch (error) {
    logger.error("Error creating post", error);
    res.status(500).json({
      success: false,
      message: "Error creating post",
    });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const cacheKey = `posts:page=${page}:limit=${limit}`;

    // 1️⃣ Check Redis first
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Serving posts from Redis cache for ${cacheKey}`);
      console.log(`Serving from cache: ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }

    // 2️⃣ Only fetch from MongoDB if not cached
    const posts = await Post.find({})
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    console.log(`Fetching from database`);

    const totalNoOfPosts = await Post.countDocuments();

    const result = {
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalNoOfPosts / limit),
      totalPosts: totalNoOfPosts,
    };

    // 3️⃣ Save to Redis for 300 seconds
    await redisClient.set(cacheKey, JSON.stringify(result), { EX: 300 });

    res.json(result);
  } catch (error) {
    logger.error("Error fetching posts", error);
    res.status(500).json({
      success: false,
      message: "Error fetching posts",
    });
  }
};

export const getPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const cacheKey = `post:${postId}`;

    // 1️⃣ Check Redis first
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      logger.info(`Serving post from Redis cache for ${cacheKey}`);
      return res.json(JSON.parse(cachedData));
    }

    const singlePostDetailsbyId = await Post.findById(postId);

    if (!singlePostDetailsbyId) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }
    // 2️⃣ Save to Redis for 300 seconds
    await redisClient.set(cacheKey, JSON.stringify(singlePostDetailsbyId), { EX: 300 });
    res.json(singlePostDetailsbyId);



  } catch (error) {
    logger.error("Error fetching post", error);
    res.status(500).json({
      success: false,
      message: "Error fetching post by ID",
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!post) {
      return res.status(404).json({
        message: "Post not found",
        success: false,
      });
    }
    // Invalidate cache for the deleted post
    await invalidateCache(`post:${req.params.id}`);

    res.json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting post", error);
    res.status(500).json({
      success: false,
      message: "Error deleting post",
    });
  }
};
