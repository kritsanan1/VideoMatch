import { users, matches, likes, messages, type User, type InsertUser, type Match, type Like, type Message, type InsertLike, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, notInArray } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Discovery and matching
  getDiscoveryUsers(userId: number, limit?: number): Promise<User[]>;
  createLike(like: InsertLike & { fromUserId: number }): Promise<Like>;
  checkMatch(userId1: number, userId2: number): Promise<boolean>;
  createMatch(userId1: number, userId2: number): Promise<Match>;
  
  // Matches
  getUserMatches(userId: number): Promise<(Match & { user: User })[]>;
  
  // Messages
  getMatchMessages(matchId: number): Promise<(Message & { sender: User })[]>;
  createMessage(message: InsertMessage & { senderId: number }): Promise<Message>;
  
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getDiscoveryUsers(userId: number, limit = 10): Promise<User[]> {
    // Get users that haven't been liked/disliked by current user
    const likedUserIds = await db
      .select({ userId: likes.toUserId })
      .from(likes)
      .where(eq(likes.fromUserId, userId));
    
    const likedIds = likedUserIds.map(l => l.userId);
    
    if (likedIds.length === 0) {
      // No previous likes, return all users except current user
      return await db
        .select()
        .from(users)
        .where(sql`${users.id} != ${userId}`)
        .limit(limit);
    }
    
    // Use Drizzle's notInArray function for proper NOT IN clause
    return await db
      .select()
      .from(users)
      .where(
        and(
          sql`${users.id} != ${userId}`,
          notInArray(users.id, likedIds)
        )
      )
      .limit(limit);
  }

  async createLike(like: InsertLike & { fromUserId: number }): Promise<Like> {
    const [newLike] = await db
      .insert(likes)
      .values(like)
      .returning();
    return newLike;
  }

  async checkMatch(userId1: number, userId2: number): Promise<boolean> {
    const mutualLikes = await db
      .select()
      .from(likes)
      .where(
        or(
          and(
            eq(likes.fromUserId, userId1),
            eq(likes.toUserId, userId2),
            eq(likes.isLike, true)
          ),
          and(
            eq(likes.fromUserId, userId2),
            eq(likes.toUserId, userId1),
            eq(likes.isLike, true)
          )
        )
      );
    
    return mutualLikes.length === 2;
  }

  async createMatch(userId1: number, userId2: number): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values({
        userId1: Math.min(userId1, userId2),
        userId2: Math.max(userId1, userId2),
        isMatch: true
      })
      .returning();
    return match;
  }

  async getUserMatches(userId: number): Promise<(Match & { user: User })[]> {
    const userMatches = await db
      .select({
        id: matches.id,
        userId1: matches.userId1,
        userId2: matches.userId2,
        isMatch: matches.isMatch,
        createdAt: matches.createdAt,
        user: users
      })
      .from(matches)
      .innerJoin(
        users,
        or(
          and(eq(matches.userId1, userId), eq(users.id, matches.userId2)),
          and(eq(matches.userId2, userId), eq(users.id, matches.userId1))
        )
      )
      .where(
        and(
          or(eq(matches.userId1, userId), eq(matches.userId2, userId)),
          eq(matches.isMatch, true)
        )
      )
      .orderBy(desc(matches.createdAt));

    return userMatches;
  }

  async getMatchMessages(matchId: number): Promise<(Message & { sender: User })[]> {
    const matchMessages = await db
      .select({
        id: messages.id,
        matchId: messages.matchId,
        senderId: messages.senderId,
        content: messages.content,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
        sender: users
      })
      .from(messages)
      .innerJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.matchId, matchId))
      .orderBy(messages.createdAt);

    return matchMessages;
  }

  async createMessage(message: InsertMessage & { senderId: number }): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }
}

export const storage = new DatabaseStorage();
