import { Request, Response } from "express";
import { db } from "./db/supabase";
import { pollVotes, cmsContent } from "../shared/schema";
import { eq, and, sql, desc, or, isNull, lte, gte } from "drizzle-orm";

/**
 * Vote on a poll
 */
export async function votePollHandler(req: Request, res: Response) {
  try {
    const { pollId } = req.params;
    const { option_index } = req.body;
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Check if poll exists and is active
    const [poll] = await db
      .select()
      .from(cmsContent)
      .where(and(eq(cmsContent.id, pollId), eq(cmsContent.type, 'poll')));

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    if (!poll.is_active) {
      return res.status(400).json({ error: "Poll is not active" });
    }

    // Check if user already voted
    const [existingVote] = await db
      .select()
      .from(pollVotes)
      .where(and(eq(pollVotes.poll_id, pollId), eq(pollVotes.user_id, user.user_id)));

    if (existingVote) {
      return res.status(400).json({ error: "You have already voted on this poll" });
    }

    // Record vote
    const [vote] = await db
      .insert(pollVotes)
      .values({
        poll_id: pollId,
        user_id: user.user_id,
        option_index,
      })
      .returning();

    return res.status(201).json(vote);
  } catch (error) {
    console.error("Error voting on poll:", error);
    return res.status(500).json({ error: "Failed to record vote" });
  }
}

/**
 * Get poll results (Admin & User after voting)
 */
export async function getPollResultsHandler(req: Request, res: Response) {
  try {
    const { pollId } = req.params;

    // Aggregate votes by option_index
    const results = await db
      .select({
        option_index: pollVotes.option_index,
        count: sql<number>`count(*)::int`,
      })
      .from(pollVotes)
      .where(eq(pollVotes.poll_id, pollId))
      .groupBy(pollVotes.option_index);

    // Get total votes
    const totalVotes = results.reduce((sum, r) => sum + r.count, 0);

    return res.json({
      poll_id: pollId,
      total_votes: totalVotes,
      results: results.reduce((acc, r) => {
        acc[r.option_index] = r.count;
        return acc;
      }, {} as Record<number, number>),
    });
  } catch (error) {
    console.error("Error getting poll results:", error);
    return res.status(500).json({ error: "Failed to get poll results" });
  }
}

/**
 * Get active poll for widget
 */
export async function getActivePollHandler(req: Request, res: Response) {
  try {
    const user = (req as any).user;

    const now = new Date();

    // Get the most recent active poll
    const [poll] = await db
      .select()
      .from(cmsContent)
      .where(
        and(
          eq(cmsContent.type, 'poll'),
          eq(cmsContent.is_active, true),
          or(isNull(cmsContent.start_date), lte(cmsContent.start_date, now)),
          or(isNull(cmsContent.end_date), gte(cmsContent.end_date, now))
        )
      )
      .orderBy(desc(cmsContent.created_at))
      .limit(1);

    if (!poll) {
      return res.json(null);
    }

    let userVoted = false;
    let userVoteIndex = null;

    // Check if current user has voted
    if (user) {
      const [vote] = await db
        .select()
        .from(pollVotes)
        .where(and(eq(pollVotes.poll_id, poll.id), eq(pollVotes.user_id, user.user_id)));
      
      if (vote) {
        userVoted = true;
        userVoteIndex = vote.option_index;
      }
    }

    return res.json({
      ...poll,
      user_voted: userVoted,
      user_vote_index: userVoteIndex,
    });
  } catch (error) {
    console.error("Error getting active poll:", error);
    return res.status(500).json({ error: "Failed to get active poll" });
  }
}
