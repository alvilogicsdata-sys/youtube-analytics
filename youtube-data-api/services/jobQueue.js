const Queue = require('bull');
const { Redis } = require('ioredis');
require('dotenv').config();

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || null,
  retryDelayOnFailover: 1000,
  maxRetriesPerRequest: 3,
};

// Create Redis instances
const redisClient = new Redis(redisConfig);
const pubClient = new Redis(redisConfig);
const subClient = new Redis(redisConfig);

// Create Bull queues
const channelFetchQueue = new Queue('channel fetch', {
  createClient: function(type) {
    switch (type) {
      case 'client':
        return redisClient;
      case 'subscriber':
        return subClient;
      case 'bclient':
        return pubClient;
      default:
        throw new Error('Invalid client type');
    }
  },
});

const videoFetchQueue = new Queue('video fetch', {
  createClient: function(type) {
    switch (type) {
      case 'client':
        return redisClient;
      case 'subscriber':
        return subClient;
      case 'bclient':
        return pubClient;
      default:
        throw new Error('Invalid client type');
    }
  },
});

// Process channel fetch jobs
channelFetchQueue.process('fetchChannel', async (job) => {
  const { channelId, apiKey } = job.data;
  console.log(`Processing channel fetch job for: ${channelId}`);

  // Update job status in database
  await updateJobStatus(job.id, 'started');

  try {
    // Dynamically import YouTube services to avoid circular dependencies
    const { default: YouTubeChannelService } = await import('./youtubeChannelService.js');
    const service = new YouTubeChannelService(apiKey);

    // Fetch and store channel data
    const channelData = await service.fetchAndStoreChannel(channelId);

    // Update job progress
    await updateJobProgress(job.id, 50);

    // Fetch and store videos
    const videos = await service.fetchChannelVideosPaginated(channelId);
    await updateJobProgress(job.id, 100);

    // Update job status in database
    await updateJobStatus(job.id, 'completed');

    console.log(`Successfully processed channel fetch job for: ${channelId}`);

    return { success: true, channelData, videoCount: videos.length };
  } catch (error) {
    console.error(`Error processing channel fetch job for ${channelId}:`, error);

    // Update job status in database
    await updateJobStatus(job.id, 'failed', error.message);

    throw error;
  }
});

// Process video fetch jobs
videoFetchQueue.process('fetchVideos', async (job) => {
  const { channelId, maxPages, apiKey } = job.data;
  console.log(`Processing video fetch job for channel: ${channelId}`);

  // Update job status in database
  await updateJobStatus(job.id, 'started');

  try {
    // Dynamically import YouTube services to avoid circular dependencies
    const { default: YouTubeVideoService } = await import('./youtubeVideoService.js');
    const service = new YouTubeVideoService(apiKey);

    // Fetch and store videos
    const videos = await service.fetchAndStoreChannelVideos(channelId, maxPages || 5);

    // Update job progress
    await updateJobProgress(job.id, 100);

    // Update job status in database
    await updateJobStatus(job.id, 'completed');

    console.log(`Successfully processed video fetch job for: ${channelId}, ${videos.length} videos`);

    return { success: true, videoCount: videos.length };
  } catch (error) {
    console.error(`Error processing video fetch job for ${channelId}:`, error);

    // Update job status in database
    await updateJobStatus(job.id, 'failed', error.message);

    throw error;
  }
});

// Function to add a channel fetch job to the queue
async function addChannelFetchJob(channelId, priority = 1, apiKey) {
  const job = await channelFetchQueue.add('fetchChannel',
    { channelId, apiKey },
    {
      priority: priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );

  console.log(`Added channel fetch job for: ${channelId}, job ID: ${job.id}`);

  // Store job in database
  await storeJobInDatabase('channel_fetch', channelId, job.id);

  return job;
}

// Function to add a video fetch job to the queue
async function addVideoFetchJob(channelId, maxPages = 5, priority = 1, apiKey) {
  const job = await videoFetchQueue.add('fetchVideos',
    { channelId, maxPages, apiKey },
    {
      priority: priority,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    }
  );

  console.log(`Added video fetch job for: ${channelId}, job ID: ${job.id}`);

  // Store job in database
  await storeJobInDatabase('video_fetch', channelId, job.id);

  return job;
}

// Helper function to store job information in database
async function storeJobInDatabase(jobType, channelId, jobId) {
  const db = require('../database/connection');

  const query = `
    INSERT INTO job_queue (job_type, channel_id, status, priority)
    VALUES ($1, $2, 'pending', 1)
    RETURNING *`;

  try {
    await db.query(query, [jobType, channelId]);
  } catch (error) {
    console.error('Error storing job in database:', error);
  }
}

// Helper function to update job status in database
async function updateJobStatus(jobId, status, errorMessage = null) {
  const db = require('../database/connection');

  let query;
  let params;

  if (status === 'started') {
    query = 'UPDATE job_queue SET status = $1, started_at = CURRENT_TIMESTAMP WHERE id = $2';
    params = [status, jobId];
  } else if (status === 'completed') {
    query = 'UPDATE job_queue SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2';
    params = [status, jobId];
  } else if (status === 'failed') {
    query = 'UPDATE job_queue SET status = $1, error_message = $2, completed_at = CURRENT_TIMESTAMP WHERE id = $3';
    params = [status, errorMessage, jobId];
  }

  try {
    await db.query(query, params);
  } catch (error) {
    console.error('Error updating job status in database:', error);
  }
}

// Helper function to update job progress
async function updateJobProgress(jobId, progress) {
  const db = require('../database/connection');

  const query = 'UPDATE job_queue SET progress = $1 WHERE id = $2';

  try {
    await db.query(query, [progress, jobId]);
  } catch (error) {
    console.error('Error updating job progress in database:', error);
  }
}

// Get job by ID
async function getJobById(jobId) {
  const channelJob = await channelFetchQueue.getJob(jobId);
  if (channelJob) return channelJob;

  return await videoFetchQueue.getJob(jobId);
}

// Get job status by ID
async function getJobStatus(jobId) {
  const job = await getJobById(jobId);
  if (!job) return null;

  return {
    id: job.id,
    status: await job.getState(),
    progress: job.progress,
    data: job.data,
    timestamp: job.timestamp,
    finishedOn: job.finishedOn
  };
}

// Get all active jobs
async function getActiveJobs() {
  const channelJobs = await channelFetchQueue.getActive();
  const videoJobs = await videoFetchQueue.getActive();

  return [...channelJobs, ...videoJobs];
}

// Get all completed jobs
async function getCompletedJobs() {
  const channelJobs = await channelFetchQueue.getCompleted();
  const videoJobs = await videoFetchQueue.getCompleted();

  return [...channelJobs, ...videoJobs];
}

// Get all failed jobs
async function getFailedJobs() {
  const channelJobs = await channelFetchQueue.getFailed();
  const videoJobs = await videoFetchQueue.getFailed();

  return [...channelJobs, ...videoJobs];
}

module.exports = {
  channelFetchQueue,
  videoFetchQueue,
  addChannelFetchJob,
  addVideoFetchJob,
  getJobById,
  getJobStatus,
  getActiveJobs,
  getCompletedJobs,
  getFailedJobs,
};